// Command handler: close (modularization, sixth slice). Self-contained —
// confirmed independent of verify.js. Readiness is checkChangeReadiness()
// for every Change (ADR-038).
import fs from "node:fs";
import path from "node:path";
import { loadChange, isClosedContent, parseApprovalLines, parseSpecApprovalLines } from "../core/domain/change.js";
import { checkChangeReadiness } from "../core/services/change-verifier.js";
import { parseJUnitReport, renderCapturedVerification } from "../core/domain/junit-report.js";
import { buildProvenance } from "../core/domain/evidence-provenance.js";
import { replaceOrAppendEvidenceSection } from "../core/domain/evidence-sections.js";
import { read, writeFile, section, parseArgs, resolveExplicitChange, resolveImplicitChange, printNext, buildProjectGraph, isClosed, getChangeDirs } from "./shared.js";

// ADR-038 (Q2 in Change 0156): an open dependency is a notice, never a
// block — the human decides whether closing out of order is fine.
function printOpenDependencies(changeId) {
  const graph = buildProjectGraph();
  const dirs = new Map(getChangeDirs().map((dir) => [path.basename(dir), dir]));
  for (const edge of graph.edges.filter((e) => e.from === changeId)) {
    const dir = dirs.get(edge.to);
    if (dir && !isClosed(dir)) console.log(`! depends on ${edge.to}, which is still open`);
  }
}

// Change 0150 (Analysis 0149): AIEF cannot verify who checked an approval,
// so it shows the human exactly which checked approvals a close relies on.
// Change 0155: spec.md Acceptance Criteria approvals are listed too, marked
// with their file so the human sees where each one was checked.
function printApprovalsReliedOn(tasksMd, specMd) {
  const approvals = [
    ...parseApprovalLines(tasksMd).filter((line) => line.state === "checked").map((line) => `(${line.label}) ${line.text}`),
    ...parseSpecApprovalLines(specMd).filter((line) => line.state === "checked").map((line) => `(${line.label}) ${line.text} [spec.md]`)
  ];
  if (!approvals.length) { console.log("Approvals relied on: none"); return; }
  console.log("Approvals relied on:");
  for (const line of approvals) console.log(`  - ${line}`);
}

function markClosed(changeDir) {
  const file = path.join(changeDir, "change.md");
  const stamp = `Closed (${new Date().toISOString().slice(0, 10)})`;
  let content = read(file);
  if (/^##\s*status\s*$/im.test(content)) content = content.replace(/(^##\s*Status\s*(?:\r?\n)+)[^\r\n]*/im, `$1${stamp}`);
  else content = `${content.replace(/\s*$/, "")}\n\n## Status\n\n${stamp}\n`;
  writeFile(file, content, true);
  // Checked against change.md directly, not isClosed() — see the comment on
  // isClosed() in commands/shared.js (Change 0043 review finding B1).
  // close() only ever writes change.md; verifying success must read the
  // same file it wrote.
  return isClosedContent(read(file));
}
export function close(args) {
  const parsed = parseArgs("close", args);
  if (!parsed) return;
  section("AIEF Close");
  console.log("Purpose: check that the active Change is ready and, with --yes, mark it Closed in change.md.\n");
  // Closing is the most destructive workflow command: with multiple open
  // Changes it never picks one implicitly — selection must be explicit.
  const changeDir = typeof parsed.change === "string"
    ? resolveExplicitChange(parsed.change)
    : resolveImplicitChange("aief close --yes");
  if (!changeDir) { printNext("aief status (list open Changes)", "aief new-change <name>"); return; }
  const name = path.relative(process.cwd(), changeDir);
  let change = loadChange(changeDir);
  if (change.closed) { console.log(`${name} is already closed.`); return; }
  // --evidence-from <path> (Change 0071): AIEF never executes a test, a
  // command, or reaches the network (ADR-021) — this only reads a report
  // file the user's own test runner/CI already produced, and fills in
  // evidence.md's ## Verification section with it. Runs before the
  // readiness check below, so a freshly-captured report is reflected in it.
  if (typeof parsed["evidence-from"] === "string") {
    const reportPath = parsed["evidence-from"];
    const resolvedPath = path.resolve(process.cwd(), reportPath);
    if (!fs.existsSync(resolvedPath)) { console.error(`--evidence-from: no such file: ${reportPath}`); process.exitCode = 1; return; }
    let reportContent;
    try { reportContent = fs.readFileSync(resolvedPath, "utf8"); } catch (err) { console.error(`--evidence-from: could not read ${reportPath}: ${err.message}`); process.exitCode = 1; return; }
    const report = parseJUnitReport(reportContent);
    if (!report) { console.error(`--evidence-from: no <testsuite> element found in ${reportPath}. Supported format: JUnit XML.`); process.exitCode = 1; return; }
    // Change 0129: provenance is computed from the exact bytes just read
    // above (reportContent), never a re-read — avoids a TOCTOU gap between
    // what AIEF hashed and what it actually parsed.
    const provenance = buildProvenance(reportPath, reportContent, "aief close --evidence-from", "junit-xml", process.cwd());
    const verificationBody = renderCapturedVerification(reportPath, report, provenance);
    const evidencePath = path.join(changeDir, "evidence.md");
    const currentEvidence = read(evidencePath);
    const updatedEvidence = replaceOrAppendEvidenceSection(currentEvidence, "Verification", "Captured from `", verificationBody);
    if (updatedEvidence !== currentEvidence) {
      writeFile(evidencePath, updatedEvidence, true);
      console.log(`Captured ${report.tests} test(s) (${report.failures} failed, ${report.errors} error(s)) from ${reportPath} into ${name}/evidence.md's Verification section.\n`);
      change = loadChange(changeDir); // re-read: evidenceState may have changed
    }
  }
  // Same rules aief verify uses (core/services/change-verifier.js), never a
  // second, diverging implementation of "is this Change ready".
  const problems = checkChangeReadiness(change);
  const blocked = problems.length > 0;
  console.log(`Change: ${name}\n`);
  if (!blocked) {
    console.log("✓ All readiness checks passed.");
    printApprovalsReliedOn(change.files["tasks.md"], change.files["spec.md"]);
  }
  else for (const problem of problems) console.log(`○ ${problem}`);
  printOpenDependencies(change.basename);
  if (!parsed.yes) { printNext(blocked ? "resolve the items above, then: aief close --yes" : "aief close --yes"); return; }
  if (blocked) { console.error("\nNot closed: resolve the items above first."); process.exitCode = 1; return; }
  if (!markClosed(changeDir)) { console.error(`\nCould not mark ${name} as Closed — check the Status section in change.md.`); process.exitCode = 1; return; }
  console.log(`\n✓ Closed ${name}.`);
  printNext("git status", "aief status");
}
