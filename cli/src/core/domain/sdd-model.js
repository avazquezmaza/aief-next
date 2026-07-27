// Shared SDD normalization model (AIEF Core 3.0, Entrega 3 — SDD Provider,
// Change 0045). One definition of artifact states, requirement/task parsing,
// and capability-check results, used by both cli/src/sdd-providers/local.js
// and cli/src/sdd-providers/openspec.js — not two independently maintained
// implementations (Change 0043's finding M3 lesson: a shared shape needs a
// shared function).
//
// Extraction is deterministic only (design.md §9 of Change 0045): fixed
// regular expressions applied identically every time, never a heuristic
// Markdown parser and never AI. A line that doesn't match is excluded from
// the result, not treated as a parse failure — the containing file is still
// "present."

export const ARTIFACT_STATES = new Set(["present", "missing", "empty", "invalid", "not_applicable", "read_error"]);

// makeArtifact() is the single constructor for a normalized artifact result
// (spec.md SDD-R17): { provider, type, path, state, diagnostic, metadata }.
// `path` is null only for `not_applicable` results where no path concept
// exists yet (e.g. a capability that isn't resolved to a file at all).
export function makeArtifact(provider, type, path, state, diagnostic = null, metadata = {}) {
  if (!ARTIFACT_STATES.has(state)) {
    throw new Error(`makeArtifact: unknown state ${JSON.stringify(state)} for ${provider}/${type}`);
  }
  return { provider, type, path, state, diagnostic, metadata };
}

// Reads one file's raw content and classifies it into present/missing/empty/
// read_error, without inventing content on any path. Shared by both
// providers so "what does an empty vs. unreadable file look like" is
// answered identically everywhere.
export function readArtifactFile(fs, path) {
  if (!fs.existsSync(path)) return { state: "missing", content: null };
  let content;
  try {
    content = fs.readFileSync(path, "utf8");
  } catch (err) {
    return { state: "read_error", content: null, diagnostic: `could not read ${path}: ${err.message}` };
  }
  if (!content.trim()) return { state: "empty", content };
  return { state: "present", content };
}

// Requirement lines: "- **R1** — text" (verified against this repository's
// own spec.md convention — changes/0039-*/spec.md and every WF-R*/SDD-R*
// requirement in Changes 0044/0045 use this exact shape).
//
// The id must contain at least one digit (independent review finding,
// fixed before close): the original pattern accepted any bold-then-dash
// list line, and this repository's own changes/0041-delete-review-package/
// spec.md has real, pre-existing lines shaped exactly like that but not
// requirements at all — "- **LIVE** — an active file points here." /
// "- **CODE** — ..." are classification-tag definitions. Every real
// requirement id in this repository (R1, AUTH-R2, WF-R14, SDD-R21, ...)
// contains a digit; no real classification-tag/definition-list label does.
// This is a concrete, evidence-grounded distinction, not a heuristic guess.
const REQUIREMENT_LINE_RE = /^\s*-\s*\*\*((?=[A-Za-z0-9._-]*\d)[A-Za-z0-9][A-Za-z0-9._-]*)\*\*\s*[—-]\s*(.+)$/;

// Task lines: "- [ ] text" / "- [x] text", with an optional leading id token
// ("T-01 Implement ..."). Both forms are real in this repository's own
// tasks.md files (some Changes use ids, most do not).
const TASK_LINE_RE = /^\s*-\s*\[( |x|X)\]\s*(.+)$/;
// An id token must contain a hyphen ("T-01") — a bare capitalized word
// ("Do something...") is prose, not an id, and must never be mistaken for
// one (that would silently invent an id where the source text has none).
const TASK_ID_PREFIX_RE = /^([A-Za-z0-9]+-[A-Za-z0-9]+)\s+(.+)$/;

// parseRequirements(text, provider, path) -> Requirement[]
// { id, title, text, source: { provider, path, line } }. `title` mirrors the
// vision document's field name but is never separately inferred — for this
// deterministic extractor, title and text are the same captured string
// (splitting "title" from "body" would require a heuristic this Entrega
// explicitly avoids, spec.md SDD-R19/R20).
export function parseRequirements(text, provider, path) {
  if (typeof text !== "string") return [];
  const requirements = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(REQUIREMENT_LINE_RE);
    if (!match) continue;
    const [, id, body] = match;
    requirements.push({ id, title: body.trim(), text: body.trim(), source: { provider, path, line: i + 1 } });
  }
  return requirements;
}

// parseTasks(text, provider, path) -> Task[]
// { id, text, completed, requirements: [], source: { provider, path, line } }.
// `requirements` is always [] in this Entrega — SDD-R21: no Change in this
// repository links a task to a requirement id in any machine-checkable way,
// so this is marked unsupported rather than built against an invented
// convention. The field is present (not omitted) so a future Entrega that
// finds or defines a real linking convention extends this function, not the
// shape every caller already reads.
export function parseTasks(text, provider, path) {
  if (typeof text !== "string") return [];
  const tasks = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const match = lines[i].match(TASK_LINE_RE);
    if (!match) continue;
    const [, mark, rest] = match;
    const idMatch = rest.match(TASK_ID_PREFIX_RE);
    const id = idMatch ? idMatch[1] : null;
    const taskText = idMatch ? idMatch[2].trim() : rest.trim();
    tasks.push({
      id,
      text: taskText,
      completed: mark.toLowerCase() === "x",
      requirements: [],
      source: { provider, path, line: i + 1 }
    });
  }
  return tasks;
}

// Capability-check result helpers — four distinguishable outcomes
// (commissioning instruction: soportada / no soportada / fallida /
// no-implementada-todavía). `callCapability()` never throws; a caller
// reading `.ok` never needs a try/catch to tell success from every kind of
// non-success.
export function unsupportedCapability(providerId, capability) {
  return { ok: false, status: "unsupported", reason: `"${capability}" is not supported by provider "${providerId}"` };
}
export function notImplementedCapability(providerId, capability) {
  return { ok: false, status: "not_implemented", reason: `"${capability}" is declared but not implemented for provider "${providerId}" in this Entrega — no side effect was performed` };
}
export function failedCapability(providerId, capability, reason) {
  return { ok: false, status: "failed", reason: `"${capability}" failed for provider "${providerId}": ${reason}` };
}

// callCapability(provider, capabilityName, fn) -> fn()'s result | one of the
// three non-success shapes above. Never interprets an absent/unimplemented
// function as success (commissioning instruction, §2 "Contrato de
// capacidades": "no permitas que una función ausente se interprete como
// éxito").
export function callCapability(provider, capabilityName, fn) {
  if (!provider.CAPABILITIES[capabilityName]) {
    return unsupportedCapability(provider.PROVIDER_ID, capabilityName);
  }
  if (typeof fn !== "function") {
    return notImplementedCapability(provider.PROVIDER_ID, capabilityName);
  }
  return fn();
}
