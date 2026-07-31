import test from "node:test";
import assert from "node:assert/strict";

import { selectNextChange } from "../src/core/services/next-change-service.js";
import { buildGraph } from "../src/core/domain/change-graph.js";

const emptyGraph = () => buildGraph([]);

test("selectNextChange: empty input recommends nothing, no evaluations", () => {
  const result = selectNextChange([], emptyGraph());
  assert.deepEqual(result, {
    recommended: null,
    evaluations: [],
    tieBreakRule: "lowest Change id, sorted ascending (same order used throughout AIEF: changes/, buildGraph() nodes, status overview)"
  });
});

test("selectNextChange: a single open, dependency-free, track-free Change is eligible and recommended", () => {
  const changes = [{ id: "0001-a", closed: false, manifestError: false, workflowBlockers: [] }];
  const result = selectNextChange(changes, buildGraph([{ id: "0001-a", dependsOn: [] }]));
  assert.equal(result.recommended, "0001-a");
  assert.equal(result.evaluations[0].eligible, true);
  assert.deepEqual(result.evaluations[0].reasons, ["status: open", "dependencies: none declared", "graph: valid", "workflow: no blocking gates"]);
});

test("selectNextChange: closed Changes are excluded from evaluations entirely", () => {
  const changes = [
    { id: "0001-a", closed: true, manifestError: false, workflowBlockers: [] },
    { id: "0002-b", closed: false, manifestError: false, workflowBlockers: [] }
  ];
  const graph = buildGraph([{ id: "0001-a", dependsOn: [] }, { id: "0002-b", dependsOn: [] }]);
  const result = selectNextChange(changes, graph);
  assert.equal(result.evaluations.length, 1);
  assert.equal(result.evaluations[0].id, "0002-b");
});

test("selectNextChange: a Change depending on an open Change is ineligible; the independent one is recommended", () => {
  const changes = [
    { id: "0001-a", closed: false, manifestError: false, workflowBlockers: [] },
    { id: "0002-b", closed: false, manifestError: false, workflowBlockers: [] }
  ];
  const graph = buildGraph([{ id: "0001-a", dependsOn: [] }, { id: "0002-b", dependsOn: ["0001-a"] }]);
  const result = selectNextChange(changes, graph);
  assert.equal(result.recommended, "0001-a");
  const dependent = result.evaluations.find((e) => e.id === "0002-b");
  assert.equal(dependent.eligible, false);
  assert.match(dependent.reasons[0], /dependencies not closed: 0001-a/);
});

test("selectNextChange: the same scenario with the dependency closed makes the dependent eligible", () => {
  const changes = [
    { id: "0001-a", closed: true, manifestError: false, workflowBlockers: [] },
    { id: "0002-b", closed: false, manifestError: false, workflowBlockers: [] }
  ];
  const graph = buildGraph([{ id: "0001-a", dependsOn: [] }, { id: "0002-b", dependsOn: ["0001-a"] }]);
  const result = selectNextChange(changes, graph);
  assert.equal(result.recommended, "0002-b");
  assert.equal(result.evaluations[0].eligible, true);
  assert.match(result.evaluations[0].reasons[1], /dependencies: all closed \(0001-a\)/);
});

test("selectNextChange: an invalid manifest is never eligible", () => {
  const changes = [{ id: "0001-a", closed: false, manifestError: true, workflowBlockers: [] }];
  const result = selectNextChange(changes, buildGraph([{ id: "0001-a", dependsOn: [] }]));
  assert.equal(result.recommended, null);
  assert.match(result.evaluations[0].reasons[0], /manifest is invalid/);
});

test("selectNextChange: a missing dependency makes the Change ineligible", () => {
  const changes = [{ id: "0001-a", closed: false, manifestError: false, workflowBlockers: [] }];
  const graph = buildGraph([{ id: "0001-a", dependsOn: ["0099-ghost"] }]);
  const result = selectNextChange(changes, graph);
  assert.equal(result.recommended, null);
  assert.match(result.evaluations[0].reasons[0], /graph: missing_dependency/);
});

test("selectNextChange: a self-dependency makes the Change ineligible", () => {
  const changes = [{ id: "0001-a", closed: false, manifestError: false, workflowBlockers: [] }];
  const graph = buildGraph([{ id: "0001-a", dependsOn: ["0001-a"] }]);
  const result = selectNextChange(changes, graph);
  assert.equal(result.recommended, null);
  assert.match(result.evaluations[0].reasons[0], /graph: self_dependency/);
});

test("selectNextChange: a duplicate dependency makes the Change ineligible even though the underlying dependency is closed", () => {
  const changes = [
    { id: "0001-a", closed: true, manifestError: false, workflowBlockers: [] },
    { id: "0002-b", closed: false, manifestError: false, workflowBlockers: [] }
  ];
  const graph = buildGraph([{ id: "0001-a", dependsOn: [] }, { id: "0002-b", dependsOn: ["0001-a", "0001-a"] }]);
  const result = selectNextChange(changes, graph);
  const evaluated = result.evaluations.find((e) => e.id === "0002-b");
  assert.equal(evaluated.eligible, false);
  assert.match(evaluated.reasons[0], /graph: duplicate_dependency/);
});

test("selectNextChange: a cycle member is never eligible, even with an individually plausible dependsOn", () => {
  const changes = [
    { id: "0001-a", closed: false, manifestError: false, workflowBlockers: [] },
    { id: "0002-b", closed: false, manifestError: false, workflowBlockers: [] }
  ];
  const graph = buildGraph([{ id: "0001-a", dependsOn: ["0002-b"] }, { id: "0002-b", dependsOn: ["0001-a"] }]);
  const result = selectNextChange(changes, graph);
  assert.equal(result.recommended, null);
  for (const e of result.evaluations) {
    assert.equal(e.eligible, false);
    assert.ok(e.reasons.some((r) => r.includes("graph: cycle")));
  }
});

test("selectNextChange: an unsatisfied Workflow gate blocker makes the Change ineligible", () => {
  const changes = [{ id: "0001-a", closed: false, manifestError: false, workflowBlockers: ["approval: pending — needs human sign-off"] }];
  const result = selectNextChange(changes, buildGraph([{ id: "0001-a", dependsOn: [] }]));
  assert.equal(result.recommended, null);
  assert.match(result.evaluations[0].reasons[0], /workflow: approval: pending/);
});

test("selectNextChange: a Change with no track (empty workflowBlockers) is unaffected by the workflow condition", () => {
  const changes = [{ id: "0001-a", closed: false, manifestError: false, workflowBlockers: [] }];
  const result = selectNextChange(changes, buildGraph([{ id: "0001-a", dependsOn: [] }]));
  assert.equal(result.evaluations[0].eligible, true);
});

test("selectNextChange: with multiple eligible Changes, the lowest id wins and others are still listed as eligible", () => {
  const changes = [
    { id: "0003-c", closed: false, manifestError: false, workflowBlockers: [] },
    { id: "0001-a", closed: false, manifestError: false, workflowBlockers: [] },
    { id: "0002-b", closed: false, manifestError: false, workflowBlockers: [] }
  ];
  const graph = buildGraph(changes.map((c) => ({ id: c.id, dependsOn: [] })));
  const result = selectNextChange(changes, graph);
  assert.equal(result.recommended, "0001-a");
  const eligibleIds = result.evaluations.filter((e) => e.eligible).map((e) => e.id);
  assert.deepEqual(eligibleIds, ["0001-a", "0002-b", "0003-c"]);
});

test("selectNextChange: zero eligible among several open Changes explains every one individually", () => {
  const changes = [
    { id: "0001-a", closed: false, manifestError: true, workflowBlockers: [] },
    { id: "0002-b", closed: false, manifestError: false, workflowBlockers: ["approval: pending"] }
  ];
  const graph = buildGraph([{ id: "0001-a", dependsOn: [] }, { id: "0002-b", dependsOn: [] }]);
  const result = selectNextChange(changes, graph);
  assert.equal(result.recommended, null);
  assert.equal(result.evaluations.length, 2);
  assert.ok(result.evaluations.every((e) => !e.eligible && e.reasons.length > 0));
});

test("selectNextChange: is deterministic across repeated calls", () => {
  const changes = [
    { id: "0002-b", closed: false, manifestError: false, workflowBlockers: [] },
    { id: "0001-a", closed: true, manifestError: false, workflowBlockers: [] }
  ];
  const graph = buildGraph([{ id: "0001-a", dependsOn: [] }, { id: "0002-b", dependsOn: ["0001-a"] }]);
  const first = selectNextChange(changes, graph);
  const second = selectNextChange(changes, graph);
  assert.deepEqual(first, second);
});

test("selectNextChange: reordering the input changes array produces the same result", () => {
  const graph = buildGraph([{ id: "0001-a", dependsOn: [] }, { id: "0002-b", dependsOn: [] }, { id: "0003-c", dependsOn: [] }]);
  const a = selectNextChange(
    [
      { id: "0001-a", closed: false, manifestError: false, workflowBlockers: [] },
      { id: "0002-b", closed: false, manifestError: false, workflowBlockers: [] },
      { id: "0003-c", closed: false, manifestError: false, workflowBlockers: [] }
    ],
    graph
  );
  const b = selectNextChange(
    [
      { id: "0003-c", closed: false, manifestError: false, workflowBlockers: [] },
      { id: "0001-a", closed: false, manifestError: false, workflowBlockers: [] },
      { id: "0002-b", closed: false, manifestError: false, workflowBlockers: [] }
    ],
    graph
  );
  assert.deepEqual(a, b);
});
