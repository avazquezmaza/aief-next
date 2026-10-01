import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { parseApprovalLines } from "../src/core/domain/change.js";
import { checkChangeReadiness, checkStrictCompleteness } from "../src/core/services/change-verifier.js";
import { makeProject, aief } from "./helpers/cli-runner.js";

// Change 0150 (Analysis 0149, C0149-F1): `[-]` resolves an ordinary task but
// must not resolve a `(human)` or `(review)` approval; `close` lists the
// checked approvals it relies on; `verify --strict` notes an Analysis or
// Definition Change with no `(human)` line, without failing.

function readyChange(tasksMd, type = "general") {
  return {
    type,
    files: { "change.md": "# Change\n", "tasks.md": tasksMd },
    missing: [],
    empty: [],
    statusState: "open",
    statusRaw: "",
    evidenceState: "complete",
    openTasksCount: (tasksMd.match(/^\s*[-*+] \[ \]/gm) || []).length
  };
}

test("parseApprovalLines: labels, three states, bullet and case tolerance", () => {
  const lines = parseApprovalLines([
    "- [x] (human) Owner approves",
    "* [ ] (review) Peer review",
    "+ [-] (HUMAN) Abandoned approval",
    "- [X] (gate:security_review) Security pass",
    "- [x] Ordinary task (human) mentioned later",
    "- [ ] Ordinary open task"
  ].join("\n"));
  assert.deepEqual(lines, [
    { label: "human", state: "checked", text: "Owner approves" },
    { label: "review", state: "unchecked", text: "Peer review" },
    { label: "human", state: "abandoned", text: "Abandoned approval" },
    { label: "gate:security_review", state: "checked", text: "Security pass" }
  ]);
  assert.deepEqual(parseApprovalLines(undefined), []);
});

test("readiness: [-] on a (human) or (review) approval blocks; a checked one does not", () => {
  const problems = checkChangeReadiness(readyChange("- [-] (human) Owner approves\n- [-] (review) Peer review\n"));
  assert.equal(problems.length, 2);
  assert.match(problems[0], /\(human\) approval marked \[-\]: "Owner approves" — an approval cannot be abandoned/);
  assert.match(problems[1], /\(review\) approval marked \[-\]: "Peer review"/);
  assert.deepEqual(checkChangeReadiness(readyChange("- [x] (human) Owner approves\n- [x] (review) Peer review\n")), []);
});

test("readiness: [-] on an ordinary task or a (gate:<id>) line is not this rule's concern", () => {
  // Ordinary [-] stays resolved (governance conventions §2); gates already
  // treat [-] as missing in taskLabelGate() (ADR-037).
  assert.deepEqual(checkChangeReadiness(readyChange("- [-] Deferred: later\n- [-] (gate:approval) Arch\n")), []);
});

test("verify --strict names an abandoned approval", () => {
  const problems = checkStrictCompleteness(readyChange("- [-] (review) Peer review\n"));
  assert.ok(problems.some((p) => /\(review\) approval marked \[-\]/.test(p)));
});

function closeableProject(tasksMd) {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), tasksMd, "utf8");
  return { dir, changeDir };
}

test("close --yes refuses a Change whose (human) approval is marked [-]", () => {
  const { dir, changeDir } = closeableProject("# Tasks\n\n- [x] Work\n- [-] (human) Owner approves\n");
  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /\(human\) approval marked \[-\]/);
  assert.doesNotMatch(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /Closed \(/);
});

test("close lists the checked approvals it relies on, with and without --yes", () => {
  const { dir, changeDir } = closeableProject("# Tasks\n\n- [x] Work\n- [x] (human) Owner approves\n- [x] (review) Reviewed by a peer\n");
  const dry = aief(dir, ["close"]);
  assert.match(dry.out, /Approvals relied on:\n {2}- \(human\) Owner approves\n {2}- \(review\) Reviewed by a peer/);
  const real = aief(dir, ["close", "--yes"]);
  assert.equal(real.status, 0);
  assert.match(real.out, /Approvals relied on:/);
  assert.match(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"), /Closed \(/);
});

test("close on a tracked Change lists its gates and blocks on an abandoned (human) approval", () => {
  const gates = "- [x] (gate:approval) Arch approved\n- [x] (gate:security_review) Security pass\n- [x] (gate:review) Reviewed\n";
  const { dir, changeDir } = closeableProject(`# Tasks\n\n- [x] Work\n${gates}`);
  fs.writeFileSync(path.join(changeDir, "manifest.json"), JSON.stringify({
    schema: "aief.change/v1", id: "0001", slug: "thing", title: "x", status: "open", track: "governed"
  }), "utf8");
  assert.match(aief(dir, ["close"]).out, /Approvals relied on:\n {2}- \(gate:approval\) Arch approved/);

  fs.writeFileSync(path.join(changeDir, "tasks.md"), `# Tasks\n\n- [x] Work\n${gates}- [-] (human) Owner approves\n`, "utf8");
  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /readiness: \(human\) approval marked \[-\]/);
});

test("close says 'Approvals relied on: none' when the Change has no approval line", () => {
  const { dir } = closeableProject("# Tasks\n\n- [x] Work\n");
  assert.match(aief(dir, ["close"]).out, /Approvals relied on: none/);
});

function strictCompleteAnalysis(tasksMd) {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  const changeDir = path.join(dir, "changes", "0001-review-thing");
  fs.mkdirSync(changeDir, { recursive: true });
  fs.writeFileSync(path.join(changeDir, "change.md"), "# Change\n\n## Type\n\nAnalysis\n\n## Objective\n\nReview the thing.\n\n## Scope\n\n### In scope\n\n- The thing.\n\n### Out of scope\n\n- Other things.\n\n## Success Criteria\n\n- Findings recorded.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "spec.md"), "# Specification\n\n## Goal\n\nKnow the thing.\n\n## Requirements\n\n- Read it.\n\n## Acceptance Criteria\n\n- [x] Findings recorded.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), tasksMd, "utf8");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal analysis happened.\n", "utf8");
  return dir;
}

test("verify --strict: an Analysis Change without a (human) line gets a notice, not a failure", () => {
  const dir = strictCompleteAnalysis("# Tasks\n\n- [x] Read the thing.\n");
  const { status, out } = aief(dir, ["verify", "--strict"]);
  assert.match(out, /! changes\/0001-review-thing: \[strict\] no \(human\) approval line/);
  assert.match(out, /Result: PASS/);
  assert.equal(status, 0);
});

test("verify --strict: no notice once the Analysis Change has a checked (human) line", () => {
  const dir = strictCompleteAnalysis("# Tasks\n\n- [x] Read the thing.\n- [x] (human) Owner reviewed the findings.\n");
  const { out } = aief(dir, ["verify", "--strict"]);
  assert.doesNotMatch(out, /no \(human\) approval line/);
  assert.match(out, /Result: PASS/);
});

test("plain verify (no --strict) never shows the notice", () => {
  const dir = strictCompleteAnalysis("# Tasks\n\n- [x] Read the thing.\n");
  assert.doesNotMatch(aief(dir, ["verify"]).out, /no \(human\) approval line/);
});
