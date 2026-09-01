// Command handler: verify (modularization, fifth slice). Self-contained
// relative to every other command group — confirmed by grep: close() does
// NOT call renderReport()/runVerifyCompletedHooks() (an assumption from
// earlier in this modularization effort, corrected after re-reading the
// real code) — only verify() itself uses them.
import fs from "node:fs";
import path from "node:path";
import { loadChange } from "../core/domain/change.js";
import { verifyProject, verifyChange } from "../core/services/change-verifier.js";
import { explain as explainWorkflow } from "../core/services/workflow-service.js";
import { detectProject } from "../detect.js";
import { buildEvent, buildHookContext } from "../core/services/hook-context.js";
import { evaluateEvent } from "../core/services/hook-service.js";
import { resolveHarnessConfig, partitionOutcome, describeFailingHooks } from "../core/services/harness-service.js";
import { resolveLoopConfig, countPreviousAttempts, decideLoopOutcome, formatLoopSummary, formatLoopLogEntry } from "../core/services/loop-service.js";
import { buildVerificationContext } from "../core/services/verification-context.js";
import { evaluateRequirements, aggregateVerificationResult } from "../core/services/verification-service.js";
import {
  cwd, exists, read, writeFile, getChangeDirs, buildProjectGraph,
  resolveExplicitChange, printNext, parseArgs, section, appendHookLog
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
// renderReport() has already printed PASS/FAIL and set the exit code
// (HK-R48: a Hook result can never influence either, so it never runs
// before both are already decided). `changeDir` is null for the
// whole-project verify — the Post-Verify Next Action Hook has no single
// Change to recommend a next action for and reports `not_applicable`, so no
// Workflow/SDD lookup is performed for that path at all (no explain() call
// unless a Change was actually targeted). Strictly additive; silent when no
// Hook matches with real content.
export function runVerifyCompletedHooks(changeDir, report, inspection) {
  const event = buildEvent("verify.completed", "verify");
  const { change, workflow, sdd } = inspection;
  const context = buildHookContext(event, {
    project: detectProject(), change, workflow, sdd,
    operation: { input: { changeId: changeDir ? path.basename(changeDir) : null }, result: report }
  });
  const outcome = evaluateEvent(event, context);
  // Change 0056/ADR-026: same disabled-filtering/logging treatment prompt()
  // gives prompt.prepared — a whole-project verify (changeDir null) has no
  // Change to read manifest.harness from, so this resolves to configured:
  // false and behaves exactly as before (no filtering, no log).
  const harnessConfig = resolveHarnessConfig(change?.manifest);
  const { active } = partitionOutcome(outcome, harnessConfig);
  const lines = active.filter((r) => r.status === "matched" && r.instructions.length).flatMap((r) => r.instructions);
  if (lines.length) {
    console.log("\nHook recommendation:");
    for (const l of lines) console.log(`- ${l}`);
  }
  // Previously silently dropped (spec.md R7) — a failed/invalid Hook is now
  // visible here too, same framing renderHookResults() uses for prompt.
  const failing = describeFailingHooks(active);
  if (failing.length) {
    console.log("\nHook issues (non-blocking — verify's own PASS/FAIL is unaffected):");
    for (const line of failing) console.log(`- ${line}`);
  }
  if (harnessConfig.log && changeDir) appendHookLog(changeDir, { operation: "verify", event: outcome.event, entries: active, passed: report.passed });
}
// Loop (Change 0057/ADR-027) — Verify -> Feedback -> Retry (if applicable)
// -> Final result. Only ever called for a single targeted Change
// (`aief verify --change <id>`); whole-project verify has no manifest to
// read Loop config from, so it is never touched. `report.errors` (already
// computed, already printed by renderReport()) is reused as Feedback —
// nothing new is derived. Never re-invokes verify, a Hook, or anything else
// — "retry" is reported as available, never performed.
function runLoop(changeDir, change, report) {
  const loopConfig = resolveLoopConfig(change?.manifest);
  if (!loopConfig.configured) return;
  const logPath = path.join(changeDir, "loop.md");
  const already = fs.existsSync(logPath);
  const attempt = countPreviousAttempts(already ? read(logPath) : "") + 1;
  const outcome = decideLoopOutcome({ attempt, maxRetries: loopConfig.maxRetries, passed: report.passed });
  const changeId = path.basename(changeDir);
  console.log(formatLoopSummary(outcome, changeId));
  const header = "# Loop Log\n\nVisible, append-only record of `aief verify` attempts for this Change (Change 0057, ADR-027). Feedback lines are Structural Verification's own error messages, reused as-is — nothing else is recorded, and nothing here ever re-runs verify automatically.\n";
  const entry = formatLoopLogEntry({ timestamp: new Date().toISOString(), outcome, feedback: report.errors });
  writeFile(logPath, `${already ? read(logPath) : header}\n${entry}`, true);
}
// Change 0058/ADR-028 — a small, non-blocking dependency-issue note for the
// Change `aief verify --change <id>` targeted: printed only when the Graph
// has an issue naming this Change (as source, or as a cycle member) — never
// touches report.passed or the exit code (both already decided before this
// runs). Silent for every Change today (none declares dependsOn).
function runGraphCheck(changeDir) {
  const changeId = path.basename(changeDir);
  const graph = buildProjectGraph();
  const relevant = graph.issues.filter((issue) => issue.changeId === changeId || (issue.members && issue.members.includes(changeId)));
  if (!relevant.length) return;
  console.log("\nDependency Graph issues for this Change (non-blocking):");
  for (const issue of relevant) console.log(`- ${issue.type}: ${issue.detail}`);
}
// Entrega 7 (Change 0049, ADR-021) — `--requirements` is the one new,
// opt-in flag: Structural Verification (renderReport, above) always runs
// first, unchanged; this function only ever ADDS a section after it, never
// replacing or reordering anything legacy (VR-R43). `inspection` is the
// SAME `explainWorkflow()` result the caller already computed once (and
// already handed to runVerifyCompletedHooks) — buildVerificationContext()
// never calls explain() itself, so a `--change ... --requirements`
// invocation performs exactly one explain() call total, not two
// (VR-R21/R24/R45).
function runRequirementVerification(changeDir, report, inspection) {
  const context = buildVerificationContext(inspection, changeDir, cwd(), { input: { changeId: path.basename(changeDir) }, result: report });
  const { requirementResults } = evaluateRequirements(context);
  const overall = aggregateVerificationResult(report.passed, requirementResults);
  console.log(`\nRequirement Verification: ${overall}`);
  if (!requirementResults.length) {
    console.log("  No requirements declared for this Change (no sdd.requirements).");
  }
  for (const { requirement, ruleResults } of requirementResults) {
    for (const rr of ruleResults) {
      if (rr.status === "not_applicable") continue; // quiet — never render arrays/rows with nothing to say
      console.log(`  ${requirement.id} — ${rr.rule}: ${rr.status} — ${rr.summary}`);
    }
  }
  // Exit code derives exclusively from the aggregated status (VR-R44) — no
  // individual rule result can set it directly; PASS/INCOMPLETE are exit 0
  // (an honest, actionable answer, mirroring Normalized Action's own
  // blocked/pending precedent, ADR-018 §3), FAIL/INVALID/ERROR are exit 1.
  if (overall === "FAIL" || overall === "INVALID" || overall === "ERROR") process.exitCode = 1;
}
export function verify(args = []) {
  const parsed = parseArgs("verify", args);
  if (!parsed) return;
  section("AIEF Verify");
  console.log("Purpose: verify required AIEF files and Change structures. Writes nothing.\n");
  // `--change <id>` verifies exactly one Change (and says which); the default
  // remains the whole project — both share the same rules in change-verifier.
  if (typeof parsed.change === "string") {
    const changeDir = resolveExplicitChange(parsed.change);
    if (!changeDir) { printNext("aief status (list open Changes)"); return; }
    const report = verifyChange(loadChange(changeDir), process.cwd(), Boolean(parsed.strict));
    renderReport(report);
    // Computed exactly once per invocation, shared by the Hook and (if
    // requested) Requirement Verification — never a second explain() call
    // (VR-R21/R24/R45).
    const inspection = explainWorkflow(changeDir, cwd());
    runVerifyCompletedHooks(changeDir, report, inspection);
    if (parsed.requirements) runRequirementVerification(changeDir, report, inspection);
    runLoop(changeDir, inspection.change, report);
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
  renderReport(report);
  runVerifyCompletedHooks(null, report, { change: null, workflow: null, sdd: null });
  // Requirement Verification is Change-scoped (requirements come from one
  // Change's own SDD provider) — whole-project `aief verify --requirements`
  // (no `--change`) cannot silently redefine which structural check ran
  // (verifyProject() above is untouched either way), so it names the gap
  // instead of guessing a Change to target.
  if (parsed.requirements) console.log("\nRequirement Verification: skipped — pass --change <id> to select one Change.");
}
