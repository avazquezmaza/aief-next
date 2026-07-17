// The Change domain model. A Change is fully derived from its four files
// (change.md, spec.md, tasks.md, evidence.md) — no hidden state, matching
// ADR-009. loadChange() is a minimal loader, not a repository: it reads one
// Change directory and returns a plain object with its raw file contents plus
// the small set of derived flags every verification rule actually needs
// (missing/empty files, closed, type, evidence-placeholder, open task count).
// It does not abstract the filesystem in general — cli.js still owns
// cwd()/exists()/getChangeDirs()/nextChangeId() for everything else.
import fs from "node:fs";
import path from "node:path";

export const CHANGE_FILES = ["change.md", "spec.md", "tasks.md", "evidence.md"];

// ---------------------------------------------------------------------------
// Status parsing (Flux Portal dogfooding finding F1).
//
// The previous rule (`/^##\s*status\s*\n+\s*closed/im`) recognised only the
// exact string `aief close` itself writes, so it was a round-trip check on our
// own output rather than a reader of Markdown. Against a real repository whose
// 13 Changes were all explicitly closed, it returned false for 13 of 13 — and
// said nothing. A wrong answer given confidently is worse than no answer.
//
// The model is therefore: find a *declaration* (a label that means "here is the
// status"), read its value tolerantly, and — when a status is declared but not
// interpretable — return "unknown" so the caller can fail loudly. `unknown` is
// a parse outcome, never a Change state: it never appears in a change.md.
// ---------------------------------------------------------------------------

// Tokens whose meaning we are willing to assert. Deliberately small.
// "COMPLETE" and "PASS" are absent on purpose: Flux Portal wrote both meaning
// "done", and guessing that intent is how a parser starts lying. They land in
// `unknown`, which asks the author to say CLOSED (or run `aief close`).
const CLOSED_TOKENS = new Set(["CLOSED"]);
const OPEN_TOKENS = new Set([
  "OPEN", "PROPOSED", "DRAFT", "IN PROGRESS", "IN-PROGRESS", "WIP", "PENDING", "ACTIVE", "TODO"
]);

// A declaration is `## Status` (value = next non-empty line) or an *unqualified*
// `Status:` label, optionally wrapped in emphasis/blockquote. The colon must
// follow `Status` immediately: that single rule rejects every real decoy Flux
// contained — `Status (orig): PASS` (a preserved historical status),
// `Status confirmed by ...`, `*Status field added ...* ` — without a denylist.
const STATUS_HEADING = /^[ \t]*#{2,3}[ \t]*status[ \t]*$/i;
const STATUS_INLINE = /^[ \t]*>?[ \t]*(?:\*\*|__|\*|_)?status(?:\*\*|__|\*|_)?[ \t]*:[ \t]*(.+)$/i;

// Keep only the leading token: "CLOSED (2026-07-11; note)" -> "CLOSED",
// "CLOSED · ARCHIVED (...)" -> "CLOSED", "IN PROGRESS (2026-07-16)." ->
// "IN PROGRESS". Emphasis is stripped first so `**CLOSED**` reads as CLOSED.
function normalizeStatusValue(raw) {
  let value = String(raw || "").trim();
  value = value.replace(/^>+[ \t]*/, "");
  value = value.replace(/[*_`]+/g, " ");
  const cut = value.split(/[(·•—–;,.:]|\s-\s/)[0];
  return cut.replace(/\s+/g, " ").trim().toUpperCase();
}

function classifyStatusToken(token) {
  if (!token) return "unknown";
  if (CLOSED_TOKENS.has(token)) return "closed";
  if (OPEN_TOKENS.has(token)) return "open";
  return "unknown";
}

// Every status declaration in the file, in document order.
function statusDeclarations(changeMd) {
  const lines = String(changeMd || "").split(/\r?\n/);
  const found = [];
  for (let i = 0; i < lines.length; i++) {
    const inline = lines[i].match(STATUS_INLINE);
    if (inline) { found.push({ raw: inline[1].trim(), source: "inline" }); continue; }
    if (STATUS_HEADING.test(lines[i])) {
      const next = lines.slice(i + 1).find((l) => l.trim());
      if (next) found.push({ raw: next.trim(), source: "heading" });
    }
  }
  return found;
}

// parseChangeStatus -> { state: "closed" | "open" | "unknown", token, raw, declarations }
//   - no declaration        -> "open" (NOT an error: AIEF's own 0001-0012 have none)
//   - declared, understood  -> "closed" / "open"
//   - declared, not understood, or two declarations that disagree -> "unknown"
//     ("first wins" is exactly the confident guess this finding is about)
export function parseChangeStatus(changeMd) {
  const declarations = statusDeclarations(changeMd).map((d) => {
    const token = normalizeStatusValue(d.raw);
    return { ...d, token, state: classifyStatusToken(token) };
  });
  if (!declarations.length) return { state: "open", token: "", raw: "", declarations };
  const states = new Set(declarations.map((d) => d.state));
  const first = declarations[0];
  if (states.size > 1 || states.has("unknown")) {
    return { state: "unknown", token: first.token, raw: first.raw, declarations };
  }
  return { state: first.state, token: first.token, raw: first.raw, declarations };
}

// A Change is closed when its change.md declares a status that reads as CLOSED.
// Kept as the name every existing caller already imports; the rule now lives in
// parseChangeStatus. An `unknown` status is deliberately NOT closed — and the
// verifier reports it as an error rather than letting it pass as "open".
export function isClosedContent(changeMd) {
  return parseChangeStatus(changeMd).state === "closed";
}

// Single source of truth for a Change's declared `## Type` (Analysis,
// Enrichment, General, ...) — CRLF-tolerant.
export function changeTypeFromContent(changeMd) {
  const match = changeMd.match(/^##\s*type\s*(?:\r?\n)+\s*([^\r\n]+)/im);
  return match ? match[1].trim().toLowerCase() : "";
}

// ---------------------------------------------------------------------------
// Evidence classification (Flux Portal dogfooding finding F3).
//
// The previous rule fired at ">= 3 Pending. lines" regardless of surrounding
// content, so a 688-line evidence.md carrying three residual "Pending." markers
// was reported as an untouched template — and `close` was blocked on evidence
// that was demonstrably complete. It asked "are there placeholders?" when the
// real question is "do placeholders DOMINATE?". Any absolute count is wrong at
// some document size; a ratio scales.
// ---------------------------------------------------------------------------

// Lines that carry real evidence: not blank, not a heading, not a blockquote
// (templates and banners use those), and not the literal placeholder.
function evidenceLineCounts(evidenceMd) {
  let pending = 0;
  let substantive = 0;
  for (const line of String(evidenceMd || "").split(/\r?\n/)) {
    const text = line.trim();
    if (!text) continue;
    if (/^Pending\.$/.test(text)) { pending++; continue; }
    if (/^#{1,6}\s/.test(text)) continue;
    if (/^>/.test(text)) continue;
    substantive++;
  }
  return { pending, substantive };
}

// classifyEvidence -> "placeholder" | "partial" | "complete"
//   placeholder : the untouched template — placeholders, no real content.
//   partial     : real content exists but placeholders still dominate.
//   complete    : real evidence; residual "Pending." markers are normal and
//                 honest in a finished document (Flux 0003: 3 in 688 lines).
// The 2x margin leans toward "not done yet" on purpose: the safety property we
// must not lose is that nobody closes on an empty template.
export function classifyEvidence(evidenceMd) {
  const { pending, substantive } = evidenceLineCounts(evidenceMd);
  // No template markers left => nothing suggests an unfinished template.
  // (An absent or empty evidence.md lands here too, and that is deliberate: it
  // is reported once, as missing/empty, not a second time as a "placeholder".)
  if (pending === 0) return "complete";
  if (substantive === 0) return "placeholder";
  return substantive < pending * 2 ? "partial" : "complete";
}

// Kept for existing callers: only an untouched template is a "placeholder".
export function isEvidencePlaceholderContent(evidenceMd) {
  return classifyEvidence(evidenceMd) === "placeholder";
}

export function countOpenTasks(tasksMd) {
  return (tasksMd.match(/^\s*- \[ \]/gm) || []).length;
}

// The single shared implementation of Change selection (Flux Portal dogfooding
// finding: per-command substring matching silently picked the wrong Change).
// Deterministic tiers — first tier with matches wins:
//   1. exact basename ("0002-add-login")
//   2. exact numeric ID ("0002" or "2")
//   3. substring of the basename ("add-login")
// Returns every match in the winning tier; the caller decides how to treat
// zero (not found) or many (ambiguous — never "last one wins").
export function matchChanges(selector, dirs) {
  const value = String(selector || "").trim();
  if (!value) return [];
  const pairs = dirs.map((dir) => [dir, path.basename(dir)]);
  const exact = pairs.filter(([, base]) => base === value);
  if (exact.length) return exact.map(([dir]) => dir);
  if (/^\d+$/.test(value)) {
    const byId = pairs.filter(([, base]) => {
      const m = base.match(/^(\d+)-/);
      return m && Number(m[1]) === Number(value);
    });
    if (byId.length) return byId.map(([dir]) => dir);
  }
  return pairs.filter(([, base]) => base.includes(value)).map(([dir]) => dir);
}

// Loads a Change from its directory: raw file contents plus every flag
// verification needs, computed once so verifyProject() and
// checkChangeReadiness() (used by `verify` and `close` respectively) read
// the same derived values instead of recomputing them differently.
export function loadChange(changeDir) {
  const files = {};
  const missing = [];
  const empty = [];
  for (const file of CHANGE_FILES) {
    const full = path.join(changeDir, file);
    const fileExists = fs.existsSync(full);
    const content = fileExists ? fs.readFileSync(full, "utf8") : "";
    files[file] = content;
    if (!fileExists) missing.push(file);
    else if (!content.trim()) empty.push(file);
  }
  const status = parseChangeStatus(files["change.md"]);
  const evidenceState = classifyEvidence(files["evidence.md"]);
  return {
    dir: changeDir,
    basename: path.basename(changeDir),
    files,
    missing,
    empty,
    closed: status.state === "closed",
    // "closed" | "open" | "unknown" — `unknown` means a status was declared and
    // could not be interpreted; the verifier turns it into an explicit error
    // instead of silently treating the Change as open (finding F1).
    statusState: status.state,
    statusRaw: status.raw,
    type: changeTypeFromContent(files["change.md"]),
    // "placeholder" | "partial" | "complete" (finding F3).
    evidenceState,
    evidencePlaceholder: evidenceState === "placeholder",
    openTasksCount: countOpenTasks(files["tasks.md"])
  };
}
