// ChangeVerifier: every rule `aief verify` and `aief close` use to judge a
// Change, in one place. Both entry points read the same Change fields
// (missing/empty/closed/type/evidencePlaceholder/openTasksCount, computed
// once by loadChange()) so there is exactly one implementation of each rule
// — `close` does not carry a second, diverging copy of "is this ready".
import path from "node:path";
import { createVerificationReport, addLine, setNext } from "../domain/verification-report.js";
import { analyzeDefinitionSections } from "../domain/definition-enrichment.js";

// Enrichment Changes are Discovery-phase: they precede a real implemented
// product, so a missing README.md must not fail verify by itself (limitation:
// this is a name/Type heuristic, not a full phase model — see
// docs/enrichment-workflow.md, "Verify limitations").
function checkEnrichmentChange(change) {
  const problems = [];
  const changeMd = change.files["change.md"];
  const specMd = change.files["spec.md"];
  if (!/^##\s*requirement\s*source/im.test(changeMd)) problems.push("change.md missing a Requirement Source section");
  if (!/read-only/i.test(changeMd)) problems.push("change.md does not mark the source as read-only");
  if (!/^##\s*open\s*questions/im.test(specMd)) problems.push("spec.md missing an Open Questions section");
  if (!/requires\s*human\s*review/im.test(changeMd)) problems.push("change.md missing the Requires Human Review status");
  return problems;
}

// Change 0083 — `aief verify --strict`: objective, deterministic completeness
// checks, opt-in only. Every check here answers a yes/no question a machine
// can actually verify from the file — never a quality judgment. Default
// `aief verify` never calls this; see verify()/verifyProject()/verifyChange()
// below, all gated on an explicit `strict` parameter that defaults to false.
const TODO_TBD = /\b(TODO|TBD)\b/;
// Strips inline code spans (`...`, including ones a Markdown line-wrap
// carries across a newline) before TODO/TBD scanning — a token like
// `ACTIVE/TODO` documented as part of a recognized-vocabulary list is not an
// unresolved marker, and treating it as one would be a false positive no
// human actually needs reported.
function stripInlineCode(text) {
  return String(text || "").replace(/`[^`]*`/gs, "");
}

// Extracts the raw content of one `## Heading` (or `### Heading`) section —
// everything up to the next heading of the same or a higher level. Returns
// null when the heading is absent (so a caller can distinguish "no such
// section in this scaffold" from "section present but empty" — Enrichment's
// spec.md has no `## Requirements` heading at all, and must never be flagged
// for lacking one).
function extractSection(md, headingText) {
  const escaped = headingText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = String(md || "").match(new RegExp(`^(#{2,3})\\s+${escaped}\\s*\\r?\\n([\\s\\S]*?)(?=\\r?\\n#{2,3}\\s|$)`, "im"));
  return match ? match[2].trim() : null;
}

function isPlaceholderContent(content) {
  return content === "" || content === "-";
}

// checkStrictCompleteness(change) -> string[] — one problem string per
// objective gap found. Never subjective: every rule below is "this exact,
// literal condition is true", never a heuristic score.
export function checkStrictCompleteness(change) {
  const problems = [];
  const changeMd = change.files?.["change.md"] || "";
  const specMd = change.files?.["spec.md"] || "";
  const tasksMd = change.files?.["tasks.md"] || "";

  for (const [label, content] of [["change.md", changeMd], ["spec.md", specMd], ["tasks.md", tasksMd]]) {
    if (TODO_TBD.test(stripInlineCode(content))) problems.push(`${label} contains an unresolved TODO/TBD`);
  }

  const successCriteria = extractSection(changeMd, "Success Criteria");
  if (successCriteria !== null && isPlaceholderContent(successCriteria)) problems.push("change.md Success Criteria is still the scaffold placeholder");

  const inScope = extractSection(changeMd, "In scope");
  if (inScope !== null && isPlaceholderContent(inScope)) problems.push("change.md Scope › In scope is still the scaffold placeholder");
  const outScope = extractSection(changeMd, "Out of scope");
  if (outScope !== null && isPlaceholderContent(outScope)) problems.push("change.md Scope › Out of scope is still the scaffold placeholder");

  const requirements = extractSection(specMd, "Requirements");
  if (requirements !== null && isPlaceholderContent(requirements)) problems.push("spec.md Requirements is empty");

  const acceptanceCriteria = extractSection(specMd, "Acceptance Criteria");
  if (acceptanceCriteria !== null && (isPlaceholderContent(acceptanceCriteria) || acceptanceCriteria === "- [ ]")) problems.push("spec.md Acceptance Criteria is empty");

  if (change.type === "definition") {
    const { missing } = analyzeDefinitionSections(changeMd);
    const decisionsRequiredIsKnown = !missing.includes("Decisions Required");
    const decisionHasNoOutcome = missing.includes("Decision (human)");
    if (decisionsRequiredIsKnown && decisionHasNoOutcome) problems.push("Decisions Required has content but Decision (human) records no outcome yet");
  }

  for (const line of tasksMd.split(/\r?\n/)) {
    const match = line.match(/^\s*-\s*\[\s\]\s*\(human\)\s*(.+)$/i);
    if (match) problems.push(`unresolved required human decision: ${match[1].trim()}`);
  }

  return problems;
}

// The one place that phrases an uninterpretable status (finding F1). A status
// that was declared but could not be read is an ERROR, never a silent "open":
// the message quotes what was found and names what is accepted, so the author
// can fix the file instead of wondering why nothing happened.
function statusProblem(change) {
  if (change.statusState !== "unknown") return null;
  const raw = String(change.statusRaw || "").trim();
  const seen = raw ? `"${raw.length > 60 ? `${raw.slice(0, 60)}…` : raw}"` : "(empty)";
  return `status is declared but not understood: ${seen} — use CLOSED (or run aief close), or one of: Open, Proposed, Draft, In Progress. Two disagreeing Status declarations are also reported here.`;
}

// The readiness rules `aief close` reports before marking a Change Closed —
// same underlying Change fields `verifyProject` uses, formatted as the
// short human-readable problem strings close() has always printed.
// Evidence blocks unless it is "complete": placeholder and partial still block
// (the safety property — nobody closes on an empty template), while residual
// "Pending." markers inside real evidence no longer do (finding F3).
export function checkChangeReadiness(change) {
  const evidenceProblem =
    change.evidenceState === "placeholder" ? "evidence.md has not been completed yet"
      : change.evidenceState === "partial" ? "evidence.md is only partially completed (placeholders still dominate)"
        : null;
  const status = statusProblem(change);
  return [
    ...change.missing.map((f) => `${f} is missing`),
    ...change.empty.map((f) => `${f} is empty`),
    ...(status ? [status] : []),
    ...(evidenceProblem ? [evidenceProblem] : []),
    ...(change.openTasksCount ? [`${change.openTasksCount} unchecked task(s) in tasks.md`] : [])
  ];
}

// Full `aief verify` report: required top-level files, then every Change
// directory, then the "Next:" hint — in the same order and with the same
// text as the CLI has always produced.
export function verifyProject({ hasReadme, hasAgents, hasChangesDir, hasKnowledge, changes, cwd, strict = false }) {
  const report = createVerificationReport();
  const discoveryOnly = changes.length > 0 && changes.every((c) => c.type === "enrichment" || c.basename.includes("adopt-aief"));

  if (hasReadme) addLine(report, "ok", "✓ README.md");
  else if (discoveryOnly) addLine(report, "info", "○ README.md: not required yet — no implemented product (Discovery/Enrichment phase)");
  else addLine(report, "error", "✗ Missing: README.md");

  if (hasAgents) addLine(report, "ok", "✓ AGENTS.md");
  else addLine(report, "error", "✗ Missing: AGENTS.md");

  if (hasChangesDir) addLine(report, "ok", "✓ changes");
  else addLine(report, "error", "✗ Missing: changes");

  if (hasKnowledge) addLine(report, "ok", "✓ knowledge/");
  else addLine(report, "warn", "! Recommended but missing: knowledge/");

  for (const change of changes) {
    addChangeLines(report, change, cwd, strict);
  }

  if (!report.passed) {
    setNext(report, "fix the issues above, then run aief verify again");
  } else {
    const open = changes.filter((c) => !c.closed);
    if (!open.length) setNext(report, "no open Change — aief new-change <name> or aief analyze");
    else if (open.length === 1) {
      const activeChange = open[0];
      // Follow the evidence classification, not a placeholder count: a Change
      // whose evidence is complete must be pointed at `close`, never back at
      // `prompt` (finding F3 — the hint used to send finished work to be redone).
      if (activeChange.evidenceState === "complete") setNext(report, `aief close --yes (active Change ${activeChange.basename} looks ready)`);
      else setNext(report, `aief prompt (work the active Change: ${activeChange.basename}), then aief close`);
    } else {
      // Multiple open Changes: never present one as "the active Change" —
      // selection must be explicit (Flux Portal dogfooding finding).
      setNext(report, `${open.length} open Changes — select explicitly: aief prompt --change <id> / aief close --yes --change <id>`);
    }
  }
  return report;
}

// One Change's report lines — shared verbatim between the whole-project mode
// and the single-Change mode (`aief verify --change <id>`), so both print the
// same judgment for the same Change.
function addChangeLines(report, change, cwd, strict = false) {
  const name = path.relative(cwd, change.dir);
  if (!change.missing.length && !change.empty.length) {
    const enrichmentProblems = change.type === "enrichment" ? checkEnrichmentChange(change) : [];
    // An uninterpretable status is reported before anything else: while it
    // stands, every other judgment about this Change rests on a guess (F1).
    const status = statusProblem(change);
    if (status) addLine(report, "error", `✗ ${name}: ${status}`);
    if (enrichmentProblems.length) {
      for (const p of enrichmentProblems) addLine(report, "error", `✗ ${name}: ${p}`);
    } else if (status) {
      // already reported
    } else if (change.evidenceState === "complete") {
      addLine(report, "ok", `✓ ${name}${change.closed ? " (closed)" : ""}`);
    } else if (change.closed) {
      addLine(report, "warn", `! ${name} is closed but evidence.md was never completed`);
    } else if (change.evidenceState === "partial") {
      addLine(report, "info", `○ ${name} — in progress (evidence partially completed; placeholders still dominate)`);
    } else {
      addLine(report, "info", `○ ${name} — in progress (evidence not completed yet; expected until the Change is closed)`);
    }
    // Change 0083: strict completeness runs in addition to the judgment
    // above, never instead of it — the informational/ok/warn line above
    // still says what it always said; --strict only adds objective-gap
    // errors on top, opt-in, defaulting to none of this ever running.
    if (strict) {
      for (const p of checkStrictCompleteness(change)) addLine(report, "error", `✗ ${name}: [strict] ${p}`);
    }
  } else {
    for (const f of change.missing) addLine(report, "error", `✗ ${name}/${f} missing`);
    for (const f of change.empty) addLine(report, "error", `✗ ${name}/${f} empty`);
  }
}

// Single-Change verification (`aief verify --change <id>`): judges exactly one
// Change with the same rules as verifyProject and names it explicitly, so the
// output always states which Change was verified.
export function verifyChange(change, cwd, strict = false) {
  const report = createVerificationReport();
  addLine(report, "info", `Verified Change: ${path.relative(cwd, change.dir)}`);
  addChangeLines(report, change, cwd, strict);
  if (!report.passed) setNext(report, "fix the issues above, then run aief verify again");
  else if (change.closed) setNext(report, "aief status");
  else if (change.evidenceState !== "complete") setNext(report, `aief prompt --change ${change.basename}, then aief close --change ${change.basename}`);
  else setNext(report, `aief close --yes --change ${change.basename}`);
  return report;
}
