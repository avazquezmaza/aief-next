import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { BIN, POSIX, makeProject, aief, aiefWithInput } from "./helpers/cli-runner.js";

// --- Change 0071: `aief close --evidence-from <path>` (JUnit XML capture) ---

const JUNIT_REPORT = '<testsuites><testsuite name="unit" tests="10" failures="1" errors="0" skipped="0" time="2.5"/></testsuites>';

test("close --evidence-from: a valid JUnit report fills in evidence.md's Verification section and proceeds with the normal readiness report", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  fs.writeFileSync(path.join(dir, "report.xml"), JUNIT_REPORT, "utf8");
  const { status, out } = aief(dir, ["close", "--evidence-from", "report.xml"]);
  assert.equal(status, 0);
  assert.match(out, /Captured 10 test\(s\) \(1 failed, 0 error\(s\)\) from report\.xml into changes\/0001-thing\/evidence\.md's Verification section\./);
  assert.match(out, /unchecked task/, "the normal readiness report still runs after the capture");
  const evidence = fs.readFileSync(path.join(dir, "changes", "0001-thing", "evidence.md"), "utf8");
  assert.match(evidence, /### Captured Test Report/);
  assert.match(evidence, /Captured from `report\.xml` \(JUnit XML, 1 suite\(s\)\) — not executed by AIEF\./);
  assert.match(evidence, /- Tests: 10/);
});

test("close --evidence-from: a missing report path exits 1 with a clear message, writes nothing", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const before = fs.readFileSync(path.join(dir, "changes", "0001-thing", "evidence.md"), "utf8");
  const { status, out } = aief(dir, ["close", "--evidence-from", "does-not-exist.xml"]);
  assert.equal(status, 1);
  assert.match(out, /--evidence-from: no such file: does-not-exist\.xml/);
  assert.equal(fs.readFileSync(path.join(dir, "changes", "0001-thing", "evidence.md"), "utf8"), before);
});

test("close --evidence-from: a file with no <testsuite> element exits 1, writes nothing", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  fs.writeFileSync(path.join(dir, "not-a-report.xml"), "<html>nope</html>", "utf8");
  const before = fs.readFileSync(path.join(dir, "changes", "0001-thing", "evidence.md"), "utf8");
  const { status, out } = aief(dir, ["close", "--evidence-from", "not-a-report.xml"]);
  assert.equal(status, 1);
  assert.match(out, /no <testsuite> element found in not-a-report\.xml\. Supported format: JUnit XML\./);
  assert.equal(fs.readFileSync(path.join(dir, "changes", "0001-thing", "evidence.md"), "utf8"), before);
});

test("close --evidence-from: running it twice (updated report) updates the numbers without duplicating the section", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  fs.writeFileSync(path.join(dir, "report.xml"), JUNIT_REPORT, "utf8");
  aief(dir, ["close", "--evidence-from", "report.xml"]);
  const updatedReport = '<testsuites><testsuite name="unit" tests="10" failures="0" errors="0" skipped="0" time="2.1"/></testsuites>';
  fs.writeFileSync(path.join(dir, "report.xml"), updatedReport, "utf8");
  aief(dir, ["close", "--evidence-from", "report.xml"]);
  const evidence = fs.readFileSync(path.join(dir, "changes", "0001-thing", "evidence.md"), "utf8");
  assert.equal((evidence.match(/### Captured Test Report/g) || []).length, 1);
  assert.match(evidence, /- Failed: 0/);
  assert.doesNotMatch(evidence, /- Failed: 1/);
});

test("close --evidence-from: a Verification section with real human-written content is preserved, capture appended below it, idempotent on repeat", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  const humanEvidence = "# Evidence\n\n## Summary\n\nPending.\n\n## Verification\n\nI ran the tests manually and they passed.\n\n## Findings\n\nPending.\n";
  fs.writeFileSync(path.join(changeDir, "evidence.md"), humanEvidence, "utf8");
  fs.writeFileSync(path.join(dir, "report.xml"), JUNIT_REPORT, "utf8");
  aief(dir, ["close", "--evidence-from", "report.xml"]);
  aief(dir, ["close", "--evidence-from", "report.xml"]);
  const evidence = fs.readFileSync(path.join(changeDir, "evidence.md"), "utf8");
  assert.match(evidence, /I ran the tests manually and they passed\./, "human-written content must survive both captures");
  assert.equal((evidence.match(/### Captured Test Report/g) || []).length, 1, "must not duplicate on the second capture");
});

test("close --evidence-from: without --yes is a capture-only run — no ## Status is written even when the rest of the Change is otherwise ready", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n\n## Verification\n\nPending.\n", "utf8");
  fs.writeFileSync(path.join(dir, "report.xml"), JUNIT_REPORT, "utf8");
  const { status, out } = aief(dir, ["close", "--evidence-from", "report.xml"]);
  assert.equal(status, 0);
  assert.match(out, /All readiness checks passed/);
  assert.doesNotMatch(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Status/);
});

test("close --evidence-from combined with --yes captures then closes in one call, when the rest of the Change is ready", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n\n## Verification\n\nPending.\n", "utf8");
  fs.writeFileSync(path.join(dir, "report.xml"), JUNIT_REPORT, "utf8");
  const { status, out } = aief(dir, ["close", "--evidence-from", "report.xml", "--yes"]);
  assert.equal(status, 0);
  assert.match(out, /✓ Closed changes\/0001-thing/);
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Status\n\nClosed \(\d{4}-\d{2}-\d{2}\)/);
});

test("close without --evidence-from is byte-identical to before Change 0071", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const { status, out } = aief(dir, ["close"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /Captured \d+ test/);
});

test("close --yes marks a ready Change as Closed; the Change stops being active", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Everything done.\n", "utf8");
  const closed = aief(dir, ["close", "--yes"]);
  assert.equal(closed.status, 0);
  assert.match(closed.out, /✓ Closed changes\/0001-thing/);
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /## Status\n\nClosed \(\d{4}-\d{2}-\d{2}\)/);
  const verify = aief(dir, ["verify"]);
  assert.match(verify.out, /0001-thing \(closed\)/);
  const noOpen = aief(dir, ["prompt"]);
  assert.equal(noOpen.status, 1);
  assert.match(noOpen.out, /No open Change found/);
  aief(dir, ["new-change", "second"]);
  const next = aief(dir, ["prompt"]);
  assert.equal(next.status, 0);
  assert.match(next.out, /0002-second/);
});

test("propose without OpenSpec falls back loudly to a local Change", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["propose", "Add login"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /OpenSpec is not installed/);
  assert.ok(fs.existsSync(path.join(dir, "changes", "0001-add-login", "proposal.md")));
});

test("propose --change continues an existing Change instead of creating a new one", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const changeMdBefore = fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "change.md"), "utf8");
  const specMdBefore = fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "spec.md"), "utf8");
  const { status, out } = aief(dir, ["propose", "--change", "0001-manual-test-001"]);
  assert.equal(status, 0);
  assert.match(out, /Created changes\/0001-manual-test-001\/proposal\.md/);
  const changes = fs.readdirSync(path.join(dir, "changes"));
  assert.equal(changes.length, 1, "propose --change must not create a second Change directory");
  assert.ok(fs.existsSync(path.join(dir, "changes", "0001-manual-test-001", "proposal.md")));
  // Requirement Source, Normalized Requirement, [H]/[I]/[S] and Human Review must survive untouched.
  assert.equal(fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "change.md"), "utf8"), changeMdBefore);
  assert.equal(fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "spec.md"), "utf8"), specMdBefore);
});

test("propose --change never overwrites an existing proposal.md", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  aief(dir, ["propose", "--change", "0001-manual-test-001"]);
  fs.writeFileSync(path.join(dir, "changes", "0001-manual-test-001", "proposal.md"), "# Proposal\n\nHand-edited content.\n", "utf8");
  const { out } = aief(dir, ["propose", "--change", "0001-manual-test-001"]);
  assert.match(out, /already exists — not overwritten/);
  assert.match(fs.readFileSync(path.join(dir, "changes", "0001-manual-test-001", "proposal.md"), "utf8"), /Hand-edited content/);
});

test("propose --change fails loudly when no Change matches", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["propose", "--change", "9999-does-not-exist"]);
  assert.equal(status, 1);
  assert.match(out, /No Change found matching "9999-does-not-exist"/);
});

test("propose <idea> without --change still creates a new Change (unchanged behavior)", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const { status } = aief(dir, ["propose", "Something else entirely"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  const changes = fs.readdirSync(path.join(dir, "changes")).sort();
  assert.deepEqual(changes, ["0001-manual-test-001", "0002-something-else-entirely"]);
});

test("propose warns when OpenSpec lacks a propose command", { skip: !POSIX }, () => {
  const dir = makeProject();
  const fakeBin = path.join(dir, "fakebin");
  fs.mkdirSync(fakeBin);
  fs.writeFileSync(path.join(fakeBin, "openspec"), "#!/bin/sh\ncase \"$1\" in\n--version) echo 1.2.3 ;;\n--help) echo 'usage: openspec [validate]' ;;\n*) exit 1 ;;\nesac\n", { mode: 0o755 });
  const { out } = aief(dir, ["propose", "Add login"], { PATH: `${fakeBin}:${process.env.PATH}` });
  assert.match(out, /does not expose a "propose" command/);
  assert.match(out, /Falling back to local Change generation/);
});

test("propose reports delegation failure and falls back", { skip: !POSIX }, () => {
  const dir = makeProject();
  const fakeBin = path.join(dir, "fakebin");
  fs.mkdirSync(fakeBin);
  fs.writeFileSync(path.join(fakeBin, "openspec"), "#!/bin/sh\ncase \"$1\" in\n--version) echo 9.9.9 ;;\n--help) echo 'commands: propose validate' ;;\npropose) exit 7 ;;\n*) exit 1 ;;\nesac\n", { mode: 0o755 });
  const { out } = aief(dir, ["propose", "Add login"], { PATH: `${fakeBin}:${process.env.PATH}` });
  assert.match(out, /OpenSpec delegation failed \(exit code 7\)\. Falling back to local Change generation\./);
  assert.ok(fs.existsSync(path.join(dir, "changes", "0001-add-login", "proposal.md")));
});

test("close works when change.md prose merely mentions \"## Status\"", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  fs.appendFileSync(path.join(changeDir, "change.md"), "\nThis Change adds a `## Status` section to templates.\n");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nDone.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Done.\n", "utf8");
  const closed = aief(dir, ["close", "--yes"]);
  assert.equal(closed.status, 0);
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /\n## Status\n\nClosed \(\d{4}-\d{2}-\d{2}\)/);
  const verify = aief(dir, ["verify"]);
  assert.match(verify.out, /0001-thing \(closed\)/);
});

test("help covers every documented command with six fields", () => {
  const dir = makeProject();
  for (const command of ["doctor", "status", "bootstrap", "analyze", "new-change", "enrich", "propose", "prompt", "verify", "close", "release", "use-profile", "help", "explain"]) {
    const { status, out } = aief(dir, ["help", command]);
    assert.equal(status, 0, `help ${command} must exit 0`);
    for (const field of ["Purpose", "When to use it", "Reads", "Writes", "Example", "Next step"]) {
      assert.match(out, new RegExp(field), `help ${command} must include ${field}`);
    }
  }
});

test("--help and -h show usage and exit 0", () => {
  const dir = makeProject();
  for (const flag of ["--help", "-h"]) {
    const { status, out } = aief(dir, [flag]);
    assert.equal(status, 0, `${flag} must exit 0`);
    assert.match(out, /AIEF CLI/);
    assert.match(out, /Usage:/);
    assert.match(out, /aief doctor/);
    assert.match(out, /aief bootstrap/);
  }
});

test("--version prints the CLI version", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["--version"]);
  assert.equal(status, 0);
  assert.match(out, /^aief \d+\.\d+\.\d+/);
});

test("doctor groups tools by level and never fails because of optional tools", () => {
  const dir = makeProject();
  const { out } = aief(dir, ["doctor"], { PATH: path.dirname(process.execPath) });
  assert.match(out, /Core \(required\):/);
  assert.match(out, /SDD \(recommended\):/);
  assert.match(out, /Build tools \(optional\):/);
  assert.match(out, /Assistants \(optional\):/);
  assert.match(out, /Summary:/);
  // With a stripped PATH the optional tools are absent — reported, not fatal.
  assert.match(out, /○ (java|docker|claude): not detected \(optional\)/);
});

test("doctor reports missing required tools in the summary", { skip: !POSIX }, () => {
  const dir = makeProject();
  const emptyBin = path.join(dir, "emptybin");
  fs.mkdirSync(emptyBin);
  const { status, out } = aief(dir, ["doctor"], { PATH: emptyBin });
  assert.equal(status, 1);
  assert.match(out, /✗ git: not found \(required\)/);
  assert.match(out, /Missing required tools: .*git/);
});

test("bootstrap without arguments initializes the current directory with visible structure only", () => {
  const dir = makeProject({ "src/app.js": "console.log('app');" });
  const { status, out } = aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /AIEF Bootstrap/);
  assert.match(out, /never modifies application code/);
  assert.match(out, /Next steps:/);
  assert.match(out, /Install OpenSpec if missing: npm install -g @fission-ai\/openspec@latest/);
  assert.ok(fs.existsSync(path.join(dir, "AGENTS.md")));
  assert.ok(fs.existsSync(path.join(dir, "changes")));
  assert.ok(fs.existsSync(path.join(dir, "knowledge")));
  // ADR-009: no hidden state — bootstrap must never create a .aief/ directory.
  assert.ok(!fs.existsSync(path.join(dir, ".aief")));
  assert.equal(fs.readFileSync(path.join(dir, "src", "app.js"), "utf8"), "console.log('app');");
});

test("bootstrap without arguments is idempotent and reports what already exists", () => {
  const dir = makeProject();
  aief(dir, ["bootstrap"]);
  const { status, out } = aief(dir, ["bootstrap"]);
  assert.equal(status, 0);
  assert.match(out, /✓ AGENTS\.md/);
  assert.match(out, /✓ changes\//);
  assert.match(out, /Adoption Change already exists/);
});

test("bootstrap with a name still creates a new project skeleton", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["bootstrap", "my-project"]);
  assert.equal(status, 0);
  assert.match(out, /Created AIEF project/);
  for (const entry of ["README.md", "AGENTS.md", "changes", "knowledge", "src", "tests"]) {
    assert.ok(fs.existsSync(path.join(dir, "my-project", entry)), `my-project/${entry} expected`);
  }
});

test("init has been replaced by bootstrap: prints a redirect and exits 1, no writes", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["init"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 1);
  assert.match(out, /aief init has been replaced by aief bootstrap\. Run: aief bootstrap/);
  assert.ok(!fs.existsSync(path.join(dir, "AGENTS.md")));
  assert.ok(!fs.existsSync(path.join(dir, "changes")));
});

test("adopt has been replaced by bootstrap: prints a redirect and exits 1, no writes", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["adopt"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 1);
  assert.match(out, /aief adopt has been replaced by aief bootstrap\. Run: aief bootstrap/);
  assert.ok(!fs.existsSync(path.join(dir, "AGENTS.md")));
  assert.ok(!fs.existsSync(path.join(dir, "changes")));
});

test("bootstrap in a non-interactive shell never blocks on the SDD Provider prompt and reports the deterministic default", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /SDD Provider:/);
  assert.match(out, /local \(default\)/);
  assert.ok(!fs.existsSync(path.join(dir, "knowledge", "sdd-provider.json")));
});

test("bootstrap reports OpenSpec detection without prompting when SpecBoot is not also present", () => {
  const dir = makeProject();
  fs.mkdirSync(path.join(dir, "openspec"));
  const { status, out } = aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /openspec \(OpenSpec detected\)/);
  assert.ok(!fs.existsSync(path.join(dir, "knowledge", "sdd-provider.json")));
});

test("bootstrap never overwrites an existing knowledge/sdd-provider.json", () => {
  const dir = makeProject();
  aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  fs.mkdirSync(path.join(dir, "knowledge"), { recursive: true });
  fs.writeFileSync(path.join(dir, "knowledge", "sdd-provider.json"), JSON.stringify({ provider: "local", setBy: "manual-test", date: "2000-01-01" }), "utf8");
  const { status, out } = aief(dir, ["bootstrap"], { PATH: path.dirname(process.execPath) });
  assert.equal(status, 0);
  assert.match(out, /from knowledge\/sdd-provider\.json, already configured — never overwritten/);
  const raw = JSON.parse(fs.readFileSync(path.join(dir, "knowledge", "sdd-provider.json"), "utf8"));
  assert.equal(raw.setBy, "manual-test");
});

test("release reports honestly when notes already exist", () => {
  const dir = makeProject();
  const first = aief(dir, ["release", "0.9.0"]);
  assert.match(first.out, /Created release notes/);
  const second = aief(dir, ["release", "0.9.0"]);
  assert.match(second.out, /already exist/);
});

test("enrich manual creates a Change with source metadata, read-only marker and Human Review", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["enrich", "manual", "TEST-001"]);
  assert.equal(status, 0);
  assert.match(out, /Created Change: changes\/0001-manual-test-001/);
  assert.match(out, /read-only; nothing was written back to manual/);
  assert.match(out, /requires human review before any implementation/);
  const changeDir = path.join(dir, "changes", "0001-manual-test-001");
  const changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  assert.match(changeMd, /## Type\n\nEnrichment/);
  assert.match(changeMd, /## Requirement Source/);
  assert.match(changeMd, /\*\*Provider:\*\* manual/);
  assert.match(changeMd, /\*\*Source ID:\*\* TEST-001/);
  assert.match(changeMd, /Read-only:\*\* yes/);
  assert.match(changeMd, /## Review Status\n\nRequires Human Review/);
  const specMd = fs.readFileSync(path.join(changeDir, "spec.md"), "utf8");
  assert.match(specMd, /\[H\] Facts/);
  assert.match(specMd, /\[I\] Inferences/);
  assert.match(specMd, /\[S\] Assumptions/);
  assert.match(specMd, /## Open Questions/);
  const evidenceMd = fs.readFileSync(path.join(changeDir, "evidence.md"), "utf8");
  assert.match(evidenceMd, /Generated by AIEF during enrichment/);
});

test("enrich requires a source id and a known, implemented provider", () => {
  const dir = makeProject();
  const missingId = aief(dir, ["enrich", "manual"]);
  assert.equal(missingId.status, 1);
  assert.match(missingId.out, /Source ID is required/);
  const unknown = aief(dir, ["enrich", "trello", "X-1"]);
  assert.equal(unknown.status, 1);
  assert.match(unknown.out, /Unknown or missing provider "trello"/);
  const notImplemented = aief(dir, ["enrich", "notion", "X-1"]);
  assert.equal(notImplemented.status, 1);
  assert.match(notImplemented.out, /not implemented yet/);
});

test("enrich never creates a duplicate Change for the same provider/source-id", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const { status, out } = aief(dir, ["enrich", "manual", "TEST-001"]);
  assert.equal(status, 0);
  assert.match(out, /already exists/);
  assert.match(out, /Not creating a duplicate/);
  const changes = fs.readdirSync(path.join(dir, "changes"));
  assert.equal(changes.filter((c) => c.includes("manual-test-001")).length, 1);
});

test("enrich jira without a local export creates an honest placeholder Change (no network, no credentials)", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["enrich", "jira", "ISSUE-999"]);
  assert.equal(status, 0);
  assert.match(out, /No local Jira export found/);
  const changeDir = path.join(dir, "changes", "0001-jira-issue-999");
  const specMd = fs.readFileSync(path.join(changeDir, "spec.md"), "utf8");
  assert.match(specMd, /No local Jira export found/);
});

test("enrich jira normalizes a local export file into the Normalized Requirement", () => {
  const dir = makeProject({
    "requirements/jira/ISSUE-42.json": JSON.stringify({
      fields: {
        summary: "Intelligent Support Assistant",
        description: "Build an assistant for support tickets.",
        status: { name: "In Progress" },
        priority: { name: "High" },
        reporter: { displayName: "Alice" },
        labels: ["ai", "support"]
      }
    })
  });
  const { status, out } = aief(dir, ["enrich", "jira", "ISSUE-42"]);
  assert.equal(status, 0);
  assert.doesNotMatch(out, /No local Jira export found/);
  const specMd = fs.readFileSync(path.join(dir, "changes", "0001-jira-issue-42", "spec.md"), "utf8");
  assert.match(specMd, /Intelligent Support Assistant/);
  assert.match(specMd, /\*\*Title:\*\* Intelligent Support Assistant/);
  assert.match(specMd, /\*\*Status \(source\):\*\* In Progress/);
  assert.match(specMd, /\*\*Priority:\*\* High/);
});

test("verify does not require README.md while only Discovery/Enrichment Changes exist", () => {
  const dir = makeProject({ "AGENTS.md": "x" });
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const { status, out } = aief(dir, ["verify"]);
  assert.equal(status, 0);
  assert.match(out, /README\.md: not required yet/);
  assert.match(out, /Result: PASS/);
});

test("verify still requires README.md once a non-Enrichment Change exists", () => {
  const dir = makeProject({ "AGENTS.md": "x" });
  aief(dir, ["enrich", "manual", "TEST-001"]);
  aief(dir, ["new-change", "implement-feature"]);
  const { status, out } = aief(dir, ["verify"]);
  assert.equal(status, 1);
  assert.match(out, /Missing: README\.md/);
});

test("close refuses an Enrichment Change until Human Review tasks are checked off", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const refused = aief(dir, ["close", "--yes"]);
  assert.equal(refused.status, 1);
  assert.match(refused.out, /Not closed/);
});

test("prompt on an Enrichment Change tells the assistant not to implement and to respect Human Review", () => {
  const dir = makeProject();
  aief(dir, ["enrich", "manual", "TEST-001"]);
  const { out } = aief(dir, ["prompt"]);
  assert.match(out, /This is an Enrichment Change/);
  assert.match(out, /Do not implement application code/);
  assert.match(out, /Do not modify the external requirement source/);
  assert.match(out, /never marking Human Review tasks done yourself/);
});

test("new-change --type definition creates the Definition scaffold", () => {
  const dir = makeProject();
  const { status, out } = aief(dir, ["new-change", "define project architecture", "--type", "definition"]);
  assert.equal(status, 0);
  assert.match(out, /Created Change/);
  const changeDir = path.join(dir, "changes", "0001-define-project-architecture");
  const changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  assert.match(changeMd, /## Type\n\nDefinition/);
  for (const heading of [
    "## Context", "## Business / Product Constraints", "## Known Requirements",
    "## Assumptions", "## Open Questions", "## Decisions Required", "## Options Considered",
    "## Recommendation", "## Decision (human)", "## Rationale", "## Consequences",
    "## Non-Functional Requirements", "## Security & Compliance", "## Data & Domain",
    "## Integrations", "## Deployment & Operations", "## Implementation Prerequisites",
    "## Follow-up Changes"
  ]) {
    assert.ok(changeMd.includes(heading), `change.md should include ${heading}`);
  }
  assert.match(changeMd, /Pending human approval/);
  const tasksMd = fs.readFileSync(path.join(changeDir, "tasks.md"), "utf8");
  assert.match(tasksMd, /- \[ \] \(human\)/);
});

test("prompt on a Definition Change tells the assistant not to implement and not to self-approve human decisions", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "define project architecture", "--type", "definition"]);
  const { out } = aief(dir, ["prompt"]);
  assert.match(out, /This is a Definition Change/);
  assert.match(out, /Do not implement application code/);
  assert.match(out, /requires explicit human approval/);
  assert.match(out, /never fill in the Decision \(human\) section yourself/);
});

test("close refuses a fresh Definition Change until its (human) Human Approval tasks are checked off", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "define project architecture", "--type", "definition"]);
  const changeDir = path.join(dir, "changes", "0001-define-project-architecture");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\nReal evidence recorded here for this Definition Change, describing what was actually done in enough detail to count as substantive.\n");
  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /unchecked task/);
});

// Change 0086 — governance bypass found by a focused pre-merge review: checking
// the (human) approval TASK is not the same fact as `## Decision (human)`
// actually recording an outcome. close must refuse both independently.
test("close refuses a Definition Change even when every (human) task is checked, while Decision (human) still holds the untouched pending placeholder", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "define architecture", "--type", "definition"]);
  const changeDir = path.join(dir, "changes", "0001-define-architecture");
  let changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  changeMd = changeMd
    .replace("## Decisions Required\n\n-", "## Decisions Required\n\n- Multi-tenancy isolation model. (decision required)")
    .replace("## Recommendation\n\n-", "## Recommendation\n\n- Shared schema with row-level security. (human)");
  fs.writeFileSync(path.join(changeDir, "change.md"), changeMd, "utf8");
  // Simulate checking off every task WITHOUT actually editing Decision (human).
  let tasksMd = fs.readFileSync(path.join(changeDir, "tasks.md"), "utf8");
  tasksMd = tasksMd.replace(/- \[ \] /g, "- [x] ");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), tasksMd, "utf8");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nMulti-tenancy decided.\n", "utf8");

  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1, "close must refuse — Decision (human) was never actually recorded");
  assert.match(out, /Decisions Required has content but Decision \(human\) records no outcome yet/);

  // Once Decision (human) is genuinely filled in, close succeeds.
  changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  changeMd = changeMd.replace(
    "## Decision (human)\n\nPending human approval. Do not treat any Recommendation above as final until this section records an explicit human decision.",
    "## Decision (human)\n\nApproved: shared schema with row-level security."
  );
  fs.writeFileSync(path.join(changeDir, "change.md"), changeMd, "utf8");
  const retry = aief(dir, ["close", "--yes"]);
  assert.equal(retry.status, 0);
});

test("close on a Definition Change with an approved Decision (human) but an unchecked (human) task is still refused (Case 3 of the human-decision matrix)", () => {
  const dir = makeProject();
  aief(dir, ["new-change", "define architecture", "--type", "definition"]);
  const changeDir = path.join(dir, "changes", "0001-define-architecture");
  let changeMd = fs.readFileSync(path.join(changeDir, "change.md"), "utf8");
  changeMd = changeMd
    .replace("## Decisions Required\n\n-", "## Decisions Required\n\n- Multi-tenancy isolation model. (decision required)")
    .replace(
      "## Decision (human)\n\nPending human approval. Do not treat any Recommendation above as final until this section records an explicit human decision.",
      "## Decision (human)\n\nApproved: shared schema with row-level security."
    );
  fs.writeFileSync(path.join(changeDir, "change.md"), changeMd, "utf8");
  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /unchecked task/);
});

test("verify treats a Definition Change like any other typed Change (no special-casing)", () => {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "define project architecture", "--type", "definition"]);
  const { status, out } = aief(dir, ["verify"]);
  assert.equal(status, 0);
  assert.match(out, /define-project-architecture/);
});

