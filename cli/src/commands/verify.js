// Command handler: verify (modularization, fifth slice). Self-contained
// relative to every other command group — confirmed by grep: close() does
// NOT call renderReport()/runVerifyCompletedHooks() (an assumption from
// earlier in this modularization effort, corrected after re-reading the
// real code) — only verify() itself uses them.
import path from "node:path";
import { loadChange } from "../core/domain/change.js";
import { detectDuplicateChangeIds } from "../core/domain/change-id-collisions.js";
import { buildResultEnvelope } from "../core/domain/result-envelope.js";
import { verifyProject, verifyChange } from "../core/services/change-verifier.js";
import { detectProject } from "../detect.js";
import { buildEvent, buildHookContext } from "../core/services/hook-context.js";
import { evaluateEvent, describeFailingHooks } from "../core/services/hook-service.js";
import {
  exists, getChangeDirs, buildProjectGraph,
  resolveExplicitChange, printNext, parseArgs, section
} from "./shared.js";

export function renderReport(report) {
  for (const line of report.lines) {
    if (line.level === "error") console.error(line.text);
    else if (line.level === "warn") console.warn(line.text);
    else console.log(line.text);
  }
  console.log(report.passed ? "\nResult: PASS" : "\nResult: FAIL");
  if (!report.passed) process.exitCode = 1;
  printNext(...report.next);
}
// Entrega 6 (Change 0048, ADR-020) — emits `verify.completed` after
// renderReport() has already printed PASS/FAIL and set the exit code, so a
// Hook result can never influence either. `change` is null for the
// whole-project verify; the Post-Verify Next Action Hook then reports
// `not_applicable`. Silent when no Hook matches with real content.
export function runVerifyCompletedHooks(changeDir, report, change) {
  const event = buildEvent("verify.completed", "verify");
  const context = buildHookContext(event, {
    project: detectProject(), change,
    operation: { input: { changeId: changeDir ? path.basename(changeDir) : null }, result: report }
  });
  const { results } = evaluateEvent(event, context);
  const lines = results.filter((r) => r.status === "matched" && r.instructions.length).flatMap((r) => r.instructions);
  if (lines.length) {
    console.log("\nHook recommendation:");
    for (const l of lines) console.log(`- ${l}`);
  }
  const failing = describeFailingHooks(results);
  if (failing.length) {
    console.log("\nHook issues (non-blocking — verify's own PASS/FAIL is unaffected):");
    for (const line of failing) console.log(`- ${line}`);
  }
}
// Change 0058/ADR-028 — a small, non-blocking dependency-issue note for the
// Change `aief verify --change <id>` targeted: printed only when the Graph
// has an issue naming this Change (as source, or as a cycle member) — never
// touches report.passed or the exit code (both already decided before this
// runs).
function runGraphCheck(changeDir) {
  const changeId = path.basename(changeDir);
  const graph = buildProjectGraph();
  const relevant = graph.issues.filter((issue) => issue.changeId === changeId || (issue.members && issue.members.includes(changeId)));
  if (!relevant.length) return;
  console.log("\nDependency Graph issues for this Change (non-blocking):");
  for (const issue of relevant) console.log(`- ${issue.type}: ${issue.detail}`);
}
// ADR-038: AIEF 4.0 no longer reads manifest.json. A leftover one is named,
// never an error, so its author knows it has no effect.
function printLegacyManifests(changes) {
  for (const change of changes.filter((c) => c.hasLegacyManifest)) {
    console.log(`! ${change.basename}: manifest.json is no longer read (AIEF 4.0, ADR-038)`);
  }
}
export function verify(args = []) {
  const parsed = parseArgs("verify", args);
  if (!parsed) return;
  // Change 0138: `--json` replaces every other line of output with exactly
  // one JSON object on stdout (a versioned envelope, result-envelope.js) —
  // for a script/CI consumer, not a human. Everything below this check
  // (section header, Hooks) is human-facing narration, deliberately not
  // folded into the envelope — no observed consumer need for it (ADR-008/013).
  const wantsJson = Boolean(parsed.json);
  if (!wantsJson) {
    section("AIEF Verify");
    console.log("Purpose: verify required AIEF files and Change structures. Writes nothing.\n");
  }
  // `--change <id>` verifies exactly one Change (and says which); the default
  // remains the whole project — both share the same rules in change-verifier.
  if (typeof parsed.change === "string") {
    const changeDir = resolveExplicitChange(parsed.change);
    if (!changeDir) {
      if (wantsJson) { console.log(JSON.stringify(buildResultEnvelope({ operation: "verify", change: parsed.change, result: "ERROR", errors: [`no Change found matching "${parsed.change}"`] }))); process.exitCode = 1; return; }
      printNext("aief status (list open Changes)"); return;
    }
    const change = loadChange(changeDir);
    const report = verifyChange(change, process.cwd(), Boolean(parsed.strict));
    if (wantsJson) {
      const changeId = path.basename(changeDir);
      const graph = buildProjectGraph();
      const graphIssues = graph.issues.filter((issue) => issue.changeId === changeId || (issue.members && issue.members.includes(changeId)));
      const envelope = buildResultEnvelope({
        operation: "verify",
        change: changeId,
        result: report.passed ? "PASS" : "FAIL",
        errors: report.errors,
        warnings: report.warnings,
        graphIssues
      });
      console.log(JSON.stringify(envelope, null, 2));
      if (!report.passed) process.exitCode = 1;
      return;
    }
    renderReport(report);
    printLegacyManifests([change]);
    runVerifyCompletedHooks(changeDir, report, change);
    runGraphCheck(changeDir);
    return;
  }
  const changes = getChangeDirs().map(loadChange);
  const report = verifyProject({
    hasReadme: exists("README.md"),
    hasAgents: exists("AGENTS.md"),
    hasChangesDir: exists("changes"),
    hasKnowledge: exists("knowledge"),
    changes,
    cwd: process.cwd(),
    strict: Boolean(parsed.strict)
  });
  if (wantsJson) {
    const idCollisions = detectDuplicateChangeIds(getChangeDirs().map((dir) => path.basename(dir)));
    const envelope = buildResultEnvelope({
      operation: "verify",
      change: null,
      result: report.passed ? "PASS" : "FAIL",
      errors: report.errors,
      warnings: report.warnings,
      duplicateChangeIds: idCollisions
    });
    console.log(JSON.stringify(envelope, null, 2));
    if (!report.passed) process.exitCode = 1;
    return;
  }
  renderReport(report);
  printLegacyManifests(changes);
  // Change 0135 (external-audit finding C0130-F2): non-blocking,
  // detection-only — a numeric-id collision is a repository fact, never a
  // reason to fail verify's exit code.
  const idCollisions = detectDuplicateChangeIds(getChangeDirs().map((dir) => path.basename(dir)));
  if (idCollisions.length) {
    console.log("\nChanges sharing a numeric ID (non-blocking):");
    for (const { id, basenames } of idCollisions) {
      console.log(`- ${id}: ${basenames.join(", ")} — a bare "--change ${id}" reference is ambiguous; use the full basename.`);
    }
  }
  runVerifyCompletedHooks(null, report, null);
}
