// Evidence resolution (AIEF Core 3.0, Entrega 7, Change 0049, ADR-021).
//
// Grounded in the one real, existing convention found by inspection: every
// verification.md this project's own Entregas 2-6 produced cites requirement
// ids in a scenario table AND frequently names real repository paths in
// backtick-quoted code spans (e.g. `cli/src/hooks/hook-service.js`). This
// module extracts exactly that — nothing invented, nothing heuristically
// guessed beyond a fixed regular expression, the same "deterministic
// extraction only" discipline sdd-model.js's parseRequirements()/parseTasks()
// already established for SDD artifacts (Entrega 3).
//
// Only file_assertion evidence is produced here — artifact_state evidence
// is read directly from context.sdd.readiness.artifacts by any rule that
// needs it (already resolved by the SDD Provider, Entrega 3; nothing here
// re-derives it).
import fs from "node:fs";
import path from "node:path";

// True when `child` is `parent` itself or genuinely nested inside it — never
// escaped via "../" segments or an absolute path swap. Mirrors
// cli/src/sdd-providers/openspec.js's own isPathWithin() (Change 0045)
// exactly — duplicated, not imported, because SDD Provider files are
// explicitly required to stay byte-unchanged this Entrega (VR-R56); this is
// the same 4-line security check, not a second, diverging implementation of
// a different idea.
function isPathWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

// A backtick-quoted, path-shaped token: contains at least one path separator
// or a dotted extension, no whitespace. Matches this project's own actual
// verification.md prose style (e.g. `cli/src/core/services/hook-service.js`)
// — not a general Markdown-intent parser.
const PATH_TOKEN_RE = /`([A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)+|[A-Za-z0-9_.-]+\.[A-Za-z0-9]+)`/g;

// A requirement id cited as a table cell or inline token: word-boundary
// matched so "VR-R1" never matches inside "VR-R10" (design.md §6.1's own
// "avoid partial matches" requirement).
function citationLinesFor(verificationDoc, requirementId) {
  if (!verificationDoc) return [];
  const escaped = requirementId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`(^|[^A-Za-z0-9_-])${escaped}($|[^A-Za-z0-9_-])`);
  return verificationDoc.split(/\r?\n/).filter((line) => re.test(line));
}

export function isRequirementCited(verificationDoc, requirementId) {
  return citationLinesFor(verificationDoc, requirementId).length > 0;
}

function invalid(ref, diagnostic) {
  return { type: "file_assertion", ref, source: "verification.md", confidence: "deterministic", state: "invalid", diagnostic };
}

// Real-path containment (VR-R53, the commissioning instruction's own
// explicit requirement: "comprueba containment usando la ruta real
// resuelta; rechaza symlinks que escapen del project root"). Textual
// containment alone (isPathWithin on the un-dereferenced path) is not
// enough: a symlink physically inside the project root can still point
// outside it, and fs.readFileSync/existsSync follow symlinks transparently.
// This is a NEW read path this Entrega introduces (unlike Skills/Hooks,
// which read no new files at all) — the SDD Provider's own existing reads
// (Entrega 3) are not symlink-aware either, but this rule does not inherit
// that gap silently: it resolves the real path first and only trusts a
// real-path-contained result, never a textually-contained one.
function realPathIfWithin(projectRoot, resolved) {
  if (!isPathWithin(projectRoot, resolved)) return { ok: false };
  let real;
  try {
    real = fs.realpathSync(resolved);
  } catch {
    // Does not exist (or a broken symlink) — not a containment failure,
    // handled by the missing-file path below via a plain existsSync check
    // on the un-resolved (but textually-contained) path.
    return { ok: true, real: null };
  }
  if (!isPathWithin(fs.realpathSync(projectRoot), real)) return { ok: false };
  return { ok: true, real };
}

function assertFileState(projectRoot, ref) {
  const resolved = path.resolve(projectRoot, ref);
  const containment = realPathIfWithin(projectRoot, resolved);
  if (!containment.ok) {
    return invalid(ref, `${JSON.stringify(ref)} is not a valid project-relative path, or resolves (directly or via a symlink) outside the project root`);
  }
  if (!fs.existsSync(resolved)) return { type: "file_assertion", ref, source: "verification.md", confidence: "deterministic", state: "missing" };
  let content;
  try {
    content = fs.readFileSync(resolved, "utf8");
  } catch (err) {
    return invalid(ref, `could not read ${ref}: ${err.message}`);
  }
  return { type: "file_assertion", ref, source: "verification.md", confidence: "deterministic", state: content.trim() ? "present" : "empty" };
}

// resolveEvidenceForRequirement(context, requirement) -> Evidence[]
// (file_assertion only, deterministic, order-preserving). Scans only the
// verification.md lines that cite this requirement's own id (never the
// whole document indiscriminately) for backtick-quoted path tokens, resolves
// each against the PROJECT root (not just the Change directory — this
// session's own verification.md files routinely cite source paths outside
// the Change directory, e.g. cli/src/...), containment-checked.
export function resolveEvidenceForRequirement(context, requirement) {
  const lines = citationLinesFor(context.verificationDoc, requirement.id);
  const evidence = [];
  const seen = new Set();
  for (const line of lines) {
    for (const match of line.matchAll(PATH_TOKEN_RE)) {
      const ref = match[1];
      if (seen.has(ref)) continue;
      seen.add(ref);
      evidence.push(assertFileState(context.projectRoot, ref));
    }
  }
  return evidence;
}
