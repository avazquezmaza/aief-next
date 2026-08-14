import test from "node:test";
import assert from "node:assert/strict";

import { checkChangeReadiness, definitionDecisionOutcomeProblem } from "../src/core/services/change-verifier.js";

// The exact four-state matrix a focused pre-merge review (Change 0086) used
// to find and confirm this governance bypass: checking a `(human)` approval
// *task* is not the same fact as `## Decision (human)` actually recording an
// outcome — close must track both, independently.
const DECISIONS_REQUIRED_FILLED = "## Decisions Required\n\n- Multi-tenancy isolation model. (decision required)\n";
const DECISION_PENDING = "## Decision (human)\n\nPending human approval. Do not treat any Recommendation above as final until this section records an explicit human decision.\n";
const DECISION_APPROVED = "## Decision (human)\n\nApproved: shared schema with row-level security.\n";

function definitionChange({ decisionSection, humanTaskChecked, otherProblems = {} }) {
  const changeMd = `# Change\n\n${DECISIONS_REQUIRED_FILLED}\n${decisionSection}`;
  const tasksMd = `# Tasks\n\n- [${humanTaskChecked ? "x" : " "}] (human) Approve the recommendation.\n`;
  return {
    type: "definition",
    files: { "change.md": changeMd, "tasks.md": tasksMd },
    missing: [],
    empty: [],
    statusState: "open",
    statusRaw: "",
    evidenceState: "complete",
    openTasksCount: humanTaskChecked ? 0 : 1,
    ...otherProblems
  };
}

test("Case 1 — decision missing, approval unchecked: readiness blocks on the unchecked task", () => {
  const change = definitionChange({ decisionSection: DECISION_PENDING, humanTaskChecked: false });
  const problems = checkChangeReadiness(change);
  assert.ok(problems.some((p) => /unchecked task/.test(p)));
  assert.ok(problems.some((p) => /Decision \(human\) records no outcome yet/.test(p)));
});

test("Case 2 — decision missing, approval CHECKED: readiness must still block (the governance bypass this Change fixes)", () => {
  const change = definitionChange({ decisionSection: DECISION_PENDING, humanTaskChecked: true });
  const problems = checkChangeReadiness(change);
  assert.equal(problems.length, 1);
  assert.match(problems[0], /Decisions Required has content but Decision \(human\) records no outcome yet/);
});

test("Case 3 — decision present, approval unchecked: readiness blocks on the unchecked task", () => {
  const change = definitionChange({ decisionSection: DECISION_APPROVED, humanTaskChecked: false });
  const problems = checkChangeReadiness(change);
  assert.ok(problems.some((p) => /unchecked task/.test(p)));
  assert.ok(!problems.some((p) => /Decision \(human\) records no outcome yet/.test(p)));
});

test("Case 4 — decision present, approval checked: readiness has no problems", () => {
  const change = definitionChange({ decisionSection: DECISION_APPROVED, humanTaskChecked: true });
  const problems = checkChangeReadiness(change);
  assert.deepEqual(problems, []);
});

test("definitionDecisionOutcomeProblem is a no-op for non-Definition Changes", () => {
  const change = { type: "analysis", files: { "change.md": `# Change\n\n${DECISIONS_REQUIRED_FILLED}\n${DECISION_PENDING}` } };
  assert.equal(definitionDecisionOutcomeProblem(change), null);
});

test("definitionDecisionOutcomeProblem is a no-op when Decisions Required itself is still empty (nothing to resolve yet)", () => {
  const change = { type: "definition", files: { "change.md": `# Change\n\n## Decisions Required\n\n-\n\n${DECISION_PENDING}` } };
  assert.equal(definitionDecisionOutcomeProblem(change), null);
});

test("checkChangeReadiness is unaffected for non-Definition Changes with the same shape (regression guard)", () => {
  const change = {
    type: "general",
    files: { "change.md": `# Change\n\n${DECISIONS_REQUIRED_FILLED}\n${DECISION_PENDING}`, "tasks.md": "# Tasks\n\n- [x] (human) Approve.\n" },
    missing: [], empty: [], statusState: "open", statusRaw: "", evidenceState: "complete", openTasksCount: 0
  };
  assert.deepEqual(checkChangeReadiness(change), []);
});
