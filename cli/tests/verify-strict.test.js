import test from "node:test";
import assert from "node:assert/strict";

import { checkStrictCompleteness } from "../src/core/services/change-verifier.js";

function change({ type = "", changeMd = "", specMd = "", tasksMd = "" } = {}) {
  return { type, files: { "change.md": changeMd, "spec.md": specMd, "tasks.md": tasksMd } };
}

const GENERIC_CHANGE_MD = `# Change\n\n## ID\n\n\`0001-x\`\n\n## Type\n\nGeneral\n\n## Objective\n\nx\n\n## Scope\n\n### In scope\n\n-\n\n### Out of scope\n\n-\n\n## Success Criteria\n\n-\n`;
const GENERIC_SPEC_MD = `# Specification\n\n## Goal\n\nWhat should be true after this Change?\n\n## Requirements\n\n-\n\n## Acceptance Criteria\n\n- [ ]\n`;
const GENERIC_TASKS_MD = `# Tasks\n\n## Implementation\n\n- [ ]\n\n## Documentation\n\n- [ ]\n\n## Verification\n\n- [ ]\n\n## Evidence\n\n- [ ] Update evidence.md\n`;

test("an untouched generic scaffold: every objective gap is reported", () => {
  const problems = checkStrictCompleteness(change({ changeMd: GENERIC_CHANGE_MD, specMd: GENERIC_SPEC_MD, tasksMd: GENERIC_TASKS_MD }));
  assert.ok(problems.some((p) => /Success Criteria is still the scaffold placeholder/.test(p)));
  assert.ok(problems.some((p) => /In scope is still the scaffold placeholder/.test(p)));
  assert.ok(problems.some((p) => /Out of scope is still the scaffold placeholder/.test(p)));
  assert.ok(problems.some((p) => /Requirements is empty/.test(p)));
  assert.ok(problems.some((p) => /Acceptance Criteria is empty/.test(p)));
});

test("a filled-in Change reports no objective gaps", () => {
  const changeMd = GENERIC_CHANGE_MD
    .replace("### In scope\n\n-", "### In scope\n\n- Real scope item.")
    .replace("### Out of scope\n\n-", "### Out of scope\n\n- Real exclusion.")
    .replace("## Success Criteria\n\n-", "## Success Criteria\n\n- Real, verifiable outcome.");
  const specMd = GENERIC_SPEC_MD
    .replace("## Requirements\n\n-", "## Requirements\n\n- Real requirement.")
    .replace("## Acceptance Criteria\n\n- [ ]", "## Acceptance Criteria\n\n- [ ] Real, checkable criterion.");
  const problems = checkStrictCompleteness(change({ changeMd, specMd, tasksMd: GENERIC_TASKS_MD }));
  assert.deepEqual(problems, []);
});

test("TODO/TBD anywhere in change.md/spec.md/tasks.md is flagged, one problem per file", () => {
  const problems = checkStrictCompleteness(change({
    changeMd: "# Change\n\n## Objective\n\nTODO: fill this in.\n",
    specMd: "# Spec\n\n## Goal\n\nTBD\n",
    tasksMd: "# Tasks\n\n- [ ] real task\n"
  }));
  assert.equal(problems.filter((p) => /unresolved TODO\/TBD/.test(p)).length, 2);
});

test("TODO/TBD inside a backtick code span (documenting a vocabulary token, not marking unfinished work) is not flagged", () => {
  const tasksMd = "# Tasks\n\n- [x] Vocabulary: `CLOSED` -> closed; `OPEN/PROPOSED/DRAFT/IN PROGRESS/WIP/PENDING/\n      ACTIVE/TODO` -> open; anything else -> `unknown`.\n";
  const problems = checkStrictCompleteness(change({ tasksMd }));
  assert.ok(!problems.some((p) => /unresolved TODO\/TBD/.test(p)));
});

test("a heading that does not exist in this scaffold (e.g. Enrichment's spec.md has no Requirements) is never flagged", () => {
  const specMd = "# Specification\n\n## Goal\n\nx\n\n## Normalized Requirement\n\n- real\n\n## Open Questions\n\n- real\n\n## Acceptance Criteria\n\n- [ ] real\n";
  const problems = checkStrictCompleteness(change({ specMd, tasksMd: "# Tasks\n\n- [ ] x\n" }));
  assert.ok(!problems.some((p) => /Requirements is empty/.test(p)));
});

test("a Definition Change with Decisions Required filled in but Decision (human) still pending is flagged", () => {
  const changeMd = [
    "# Change", "", "## Decisions Required", "", "- Multi-tenancy model.", "",
    "## Decision (human)", "", "Pending human approval. Do not treat any Recommendation above as final until this section records an explicit human decision.", ""
  ].join("\n");
  const problems = checkStrictCompleteness(change({ type: "definition", changeMd, tasksMd: "# Tasks\n\n- [ ] x\n" }));
  assert.ok(problems.some((p) => /Decision \(human\) records no outcome yet/.test(p)));
});

test("a Definition Change with an approved Decision (human) is not flagged", () => {
  const changeMd = [
    "# Change", "", "## Decisions Required", "", "- Multi-tenancy model.", "",
    "## Decision (human)", "", "Approved: schema-per-tenant. — approved 2026-08-14.", ""
  ].join("\n");
  const problems = checkStrictCompleteness(change({ type: "definition", changeMd, tasksMd: "# Tasks\n\n- [ ] x\n" }));
  assert.ok(!problems.some((p) => /Decision \(human\)/.test(p)));
});

test("an unchecked (human) task is reported as an unresolved required human decision", () => {
  const tasksMd = "# Tasks\n\n## Human Approval\n\n- [ ] (human) Approve the recommendation.\n- [x] (human) Already approved this one.\n";
  const problems = checkStrictCompleteness(change({ tasksMd }));
  assert.equal(problems.length, 1);
  assert.match(problems[0], /unresolved required human decision: Approve the recommendation\./);
});
