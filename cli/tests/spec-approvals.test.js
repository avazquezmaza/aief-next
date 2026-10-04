import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

import { parseSpecApprovalLines } from "../src/core/domain/change.js";
import { makeProject, aief } from "./helpers/cli-runner.js";

// Change 0155 (B4 from Analysis 0154): `(human)` and `(review)` lines under
// spec.md's Acceptance Criteria hold a close like tasks.md approval lines.
// Unlabeled criteria stay informational.

function spec(criteria) {
  return `# Specification\n\n## Goal\n\nThe thing works.\n\n## Requirements\n\n- It works.\n\n## Acceptance Criteria\n\n${criteria}\n`;
}

function closeableProject(specMd) {
  const dir = makeProject({ "README.md": "# x", "AGENTS.md": "# x" });
  aief(dir, ["new-change", "thing"]);
  const changeDir = path.join(dir, "changes", "0001-thing");
  fs.writeFileSync(path.join(changeDir, "change.md"), "# Change\n\n## Type\n\nFix\n\n## Objective\n\nFix the thing.\n\n## Scope\n\n### In scope\n\n- The thing.\n\n### Out of scope\n\n- Other things.\n\n## Success Criteria\n\n- The thing works.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "evidence.md"), "# Evidence\n\n## Summary\n\nReal work happened.\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "tasks.md"), "# Tasks\n\n- [x] Work\n", "utf8");
  fs.writeFileSync(path.join(changeDir, "spec.md"), specMd, "utf8");
  return { dir, changeDir };
}

const isClosed = (changeDir) => /Closed \(/.test(fs.readFileSync(path.join(changeDir, "change.md"), "utf8"));

test("parseSpecApprovalLines reads only (human)/(review) lines under Acceptance Criteria", () => {
  const md = [
    "# Specification", "", "## Requirements", "", "- [ ] (human) Not a criterion", "",
    "## Acceptance Criteria", "", "- [x] Works", "* [ ] (human) Owner approves", "+ [-] (REVIEW) Peer review",
    "- [ ] (gate:approval) Gate line", "", "### Notes", "", "- [x] (human) Inside a subsection", "",
    "## Open Questions", "", "- [ ] (human) After the section"
  ].join("\n");
  assert.deepEqual(parseSpecApprovalLines(md), [
    { label: "human", state: "unchecked", text: "Owner approves" },
    { label: "review", state: "abandoned", text: "Peer review" },
    { label: "human", state: "checked", text: "Inside a subsection" }
  ]);
  assert.deepEqual(parseSpecApprovalLines("# Specification\n\n## Goal\n\nx\n"), []);
});

test("close --yes refuses an unchecked (human) Acceptance Criterion in spec.md", () => {
  const { dir, changeDir } = closeableProject(spec("- [x] Works\n- [ ] (human) Owner approves the plan"));
  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /unchecked \(human\) approval in spec\.md Acceptance Criteria: Owner approves the plan/);
  assert.equal(isClosed(changeDir), false);
});

test("close --yes refuses a (review) Acceptance Criterion marked [-]", () => {
  const { dir, changeDir } = closeableProject(spec("- [-] (review) Peer review"));
  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 1);
  assert.match(out, /\(review\) approval marked \[-\] in spec\.md Acceptance Criteria/);
  assert.equal(isClosed(changeDir), false);
});

test("close lists a checked spec.md approval and closes", () => {
  const { dir, changeDir } = closeableProject(spec("- [x] Works\n- [x] (human) Owner approves the plan"));
  const { status, out } = aief(dir, ["close", "--yes"]);
  assert.equal(status, 0);
  assert.match(out, /Approvals relied on:\n {2}- \(human\) Owner approves the plan \[spec\.md\]/);
  assert.equal(isClosed(changeDir), true);
});

test("unchecked unlabeled Acceptance Criteria still do not block close", () => {
  const { dir, changeDir } = closeableProject(spec("- [ ] Works on every browser"));
  assert.equal(aief(dir, ["close", "--yes"]).status, 0);
  assert.equal(isClosed(changeDir), true);
});

test("verify --strict: an unchecked spec.md approval fails an open Change", () => {
  const { dir } = closeableProject(spec("- [x] Works\n- [ ] (human) Owner approves the plan"));
  const { status, out } = aief(dir, ["verify", "--strict"]);
  assert.match(out, /✗ changes\/0001-thing: \[strict\] unchecked \(human\) approval in spec\.md Acceptance Criteria/);
  assert.match(out, /Result: FAIL/);
  assert.equal(status, 1);
});

test("verify --strict: the same gap on a closed Change is a notice, not a failure", () => {
  const { dir, changeDir } = closeableProject(spec("- [x] Works\n- [x] (human) Owner approves the plan"));
  assert.equal(aief(dir, ["close", "--yes"]).status, 0);
  fs.writeFileSync(path.join(changeDir, "spec.md"), spec("- [x] Works\n- [ ] (human) Owner approves the plan"), "utf8");
  const { status, out } = aief(dir, ["verify", "--strict"]);
  assert.match(out, /! changes\/0001-thing: \[strict\] closed with unchecked \(human\) approval in spec\.md/);
  assert.doesNotMatch(out, /✗ changes\/0001-thing/);
  assert.match(out, /Result: PASS/);
  assert.equal(status, 0);
});
