// ChangeVerifier: every rule `aief verify` and `aief close` use to judge a
// Change, in one place. Both entry points read the same Change fields
// (missing/empty/closed/type/evidencePlaceholder/openTasksCount, computed
// once by loadChange()) so there is exactly one implementation of each rule
// — `close` does not carry a second, diverging copy of "is this ready".
import path from "node:path";
import { createVerificationReport, addLine, setNext } from "../domain/verification-report.js";

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

// The readiness rules `aief close` reports before marking a Change Closed —
// same underlying Change fields `verifyProject` uses, formatted as the
// short human-readable problem strings close() has always printed.
export function checkChangeReadiness(change) {
  return [
    ...change.missing.map((f) => `${f} is missing`),
    ...change.empty.map((f) => `${f} is empty`),
    ...(change.evidencePlaceholder ? ["evidence.md has not been completed yet"] : []),
    ...(change.openTasksCount ? [`${change.openTasksCount} unchecked task(s) in tasks.md`] : [])
  ];
}

// Full `aief verify` report: required top-level files, then every Change
// directory, then the "Next:" hint — in the same order and with the same
// text as the CLI has always produced.
export function verifyProject({ hasReadme, hasAgents, hasChangesDir, hasKnowledge, changes, cwd }) {
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
    addChangeLines(report, change, cwd);
  }

  if (!report.passed) {
    setNext(report, "fix the issues above, then run aief verify again");
  } else {
    const open = changes.filter((c) => !c.closed);
    if (!open.length) setNext(report, "no open Change — aief new-change <name> or aief analyze");
    else if (open.length === 1) {
      const activeChange = open[0];
      if (activeChange.evidencePlaceholder) setNext(report, `aief prompt (work the active Change: ${activeChange.basename}), then aief close`);
      else setNext(report, `aief close --yes (active Change ${activeChange.basename} looks ready)`);
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
function addChangeLines(report, change, cwd) {
  const name = path.relative(cwd, change.dir);
  if (!change.missing.length && !change.empty.length) {
    const enrichmentProblems = change.type === "enrichment" ? checkEnrichmentChange(change) : [];
    if (enrichmentProblems.length) {
      for (const p of enrichmentProblems) addLine(report, "error", `✗ ${name}: ${p}`);
    } else if (!change.evidencePlaceholder) {
      addLine(report, "ok", `✓ ${name}${change.closed ? " (closed)" : ""}`);
    } else if (change.closed) {
      addLine(report, "warn", `! ${name} is closed but evidence.md was never completed`);
    } else {
      addLine(report, "info", `○ ${name} — in progress (evidence not completed yet; expected until the Change is closed)`);
    }
  } else {
    for (const f of change.missing) addLine(report, "error", `✗ ${name}/${f} missing`);
    for (const f of change.empty) addLine(report, "error", `✗ ${name}/${f} empty`);
  }
}

// Single-Change verification (`aief verify --change <id>`): judges exactly one
// Change with the same rules as verifyProject and names it explicitly, so the
// output always states which Change was verified.
export function verifyChange(change, cwd) {
  const report = createVerificationReport();
  addLine(report, "info", `Verified Change: ${path.relative(cwd, change.dir)}`);
  addChangeLines(report, change, cwd);
  if (!report.passed) setNext(report, "fix the issues above, then run aief verify again");
  else if (change.closed) setNext(report, "aief status");
  else if (change.evidencePlaceholder) setNext(report, `aief prompt --change ${change.basename}, then aief close --change ${change.basename}`);
  else setNext(report, `aief close --yes --change ${change.basename}`);
  return report;
}
