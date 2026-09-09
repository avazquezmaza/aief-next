import test from "node:test";
import assert from "node:assert/strict";

import { buildGraph } from "../src/core/domain/change-graph.js";

test("buildGraph: empty input is an empty, issue-free graph", () => {
  const graph = buildGraph([]);
  assert.deepEqual(graph, { nodes: [], edges: [], order: [], cycles: null, cycleComponents: null, issues: [] });
});

test("buildGraph: one Change with no dependencies", () => {
  const graph = buildGraph([{ id: "0001-a", dependsOn: [] }]);
  assert.deepEqual(graph.nodes, ["0001-a"]);
  assert.deepEqual(graph.edges, []);
  assert.deepEqual(graph.order, ["0001-a"]);
  assert.equal(graph.cycles, null);
  assert.deepEqual(graph.issues, []);
});

test("buildGraph: dependsOn defaults to [] when omitted", () => {
  const graph = buildGraph([{ id: "0001-a" }]);
  assert.deepEqual(graph.edges, []);
  assert.deepEqual(graph.issues, []);
});

test("buildGraph: multiple Changes with a valid dependency chain resolve in dependency-first order", () => {
  const graph = buildGraph([
    { id: "0001-a", dependsOn: [] },
    { id: "0002-b", dependsOn: ["0001-a"] },
    { id: "0003-c", dependsOn: ["0002-b"] }
  ]);
  assert.deepEqual(graph.edges, [{ from: "0002-b", to: "0001-a" }, { from: "0003-c", to: "0002-b" }]);
  assert.deepEqual(graph.order, ["0001-a", "0002-b", "0003-c"]);
  assert.deepEqual(graph.issues, []);
});

test("buildGraph: a Change with multiple dependencies resolves all of them, after every dependency", () => {
  const graph = buildGraph([
    { id: "0001-a", dependsOn: [] },
    { id: "0002-b", dependsOn: [] },
    { id: "0003-c", dependsOn: ["0001-a", "0002-b"] }
  ]);
  assert.deepEqual(graph.edges, [{ from: "0003-c", to: "0001-a" }, { from: "0003-c", to: "0002-b" }]);
  assert.equal(graph.order.indexOf("0003-c"), 2, "0003-c must come after both its dependencies");
});

test("buildGraph: a missing dependency is reported, never a dangling edge", () => {
  const graph = buildGraph([{ id: "0001-a", dependsOn: ["0099-ghost"] }]);
  assert.deepEqual(graph.edges, []);
  assert.equal(graph.issues.length, 1);
  assert.equal(graph.issues[0].type, "missing_dependency");
  assert.equal(graph.issues[0].changeId, "0001-a");
  assert.match(graph.issues[0].detail, /"0001-a" depends on "0099-ghost", which does not exist/);
  assert.deepEqual(graph.order, ["0001-a"], "the node itself is still ordered — only the bad edge is excluded");
});

test("buildGraph: self-dependency is reported, never a self-loop edge", () => {
  const graph = buildGraph([{ id: "0001-a", dependsOn: ["0001-a"] }]);
  assert.deepEqual(graph.edges, []);
  assert.equal(graph.issues.length, 1);
  assert.equal(graph.issues[0].type, "self_dependency");
  assert.equal(graph.issues[0].changeId, "0001-a");
  assert.deepEqual(graph.order, ["0001-a"]);
});

test("buildGraph: a duplicate dependency is reported once and creates exactly one edge", () => {
  const graph = buildGraph([{ id: "0001-a", dependsOn: [] }, { id: "0002-b", dependsOn: ["0001-a", "0001-a", "0001-a"] }]);
  assert.deepEqual(graph.edges, [{ from: "0002-b", to: "0001-a" }]);
  const dupIssues = graph.issues.filter((i) => i.type === "duplicate_dependency");
  assert.equal(dupIssues.length, 2, "two extra occurrences beyond the first");
});

test("buildGraph: a 2-node cycle is detected, order is null", () => {
  const graph = buildGraph([{ id: "0001-a", dependsOn: ["0002-b"] }, { id: "0002-b", dependsOn: ["0001-a"] }]);
  assert.equal(graph.order, null);
  assert.deepEqual(graph.cycles, ["0001-a", "0002-b"]);
  assert.deepEqual(graph.cycleComponents, [["0001-a", "0002-b"]]);
  const cycleIssue = graph.issues.find((i) => i.type === "cycle");
  assert.ok(cycleIssue);
  assert.deepEqual(cycleIssue.members, ["0001-a", "0002-b"]);
});

// Change 0123: a Change depending on a cyclic Change is blocked by that
// cycle, but is not itself a member of it — the two must be distinguished.
test("buildGraph: a Change depending on a cyclic Change is reported as blocked, not as a cycle member", () => {
  const graph = buildGraph([
    { id: "0001-a", dependsOn: ["0002-b"] },
    { id: "0002-b", dependsOn: ["0001-a"] },
    { id: "0003-c", dependsOn: ["0002-b"] }
  ]);
  assert.equal(graph.order, null);
  assert.deepEqual(graph.cycles, ["0001-a", "0002-b", "0003-c"], "cycles keeps its pre-0123 shape: every unordered id");
  assert.deepEqual(graph.cycleComponents, [["0001-a", "0002-b"]], "0003-c is not part of the actual cycle");

  const cycleIssues = graph.issues.filter((i) => i.type === "cycle");
  assert.equal(cycleIssues.length, 1);
  assert.deepEqual(cycleIssues[0].members, ["0001-a", "0002-b"]);

  const blockedIssue = graph.issues.find((i) => i.type === "blocked_by_cycle");
  assert.ok(blockedIssue, "0003-c gets its own blocked_by_cycle issue");
  assert.equal(blockedIssue.changeId, "0003-c");
  assert.deepEqual(blockedIssue.blockedBy, ["0001-a", "0002-b"]);
});

test("buildGraph: two independent cycles are reported as two separate cycles, not one blob", () => {
  const graph = buildGraph([
    { id: "0001-a", dependsOn: ["0002-b"] },
    { id: "0002-b", dependsOn: ["0001-a"] },
    { id: "0003-c", dependsOn: ["0004-d"] },
    { id: "0004-d", dependsOn: ["0003-c"] }
  ]);
  assert.equal(graph.order, null);
  assert.deepEqual(graph.cycleComponents, [["0001-a", "0002-b"], ["0003-c", "0004-d"]]);

  const cycleIssues = graph.issues.filter((i) => i.type === "cycle");
  assert.equal(cycleIssues.length, 2, "one issue per independent cycle, not one for the whole remaining set");
  assert.deepEqual(cycleIssues.map((i) => i.members).sort(), [["0001-a", "0002-b"], ["0003-c", "0004-d"]]);
});

test("buildGraph: a cycle, a Change blocked by it, and an unrelated acyclic Change coexist correctly", () => {
  const graph = buildGraph([
    { id: "0001-a", dependsOn: ["0002-b"] },
    { id: "0002-b", dependsOn: ["0001-a"] },
    { id: "0003-blocked", dependsOn: ["0002-b"] },
    { id: "0004-unrelated", dependsOn: [] }
  ]);
  assert.deepEqual(graph.nodes, ["0001-a", "0002-b", "0003-blocked", "0004-unrelated"]);
  assert.equal(graph.order, null);
  assert.deepEqual(graph.cycleComponents, [["0001-a", "0002-b"]]);
  assert.equal(
    graph.issues.some((i) => i.type === "cycle" && i.members.includes("0004-unrelated")),
    false,
    "0004-unrelated is not swept into the cycle — it never depends on anything in remaining"
  );
  assert.equal(
    graph.issues.some((i) => i.type === "blocked_by_cycle" && i.changeId === "0004-unrelated"),
    false,
    "0004-unrelated has no dependency at all, so it is not 'blocked' by anything either"
  );
  const blockedIssue = graph.issues.find((i) => i.type === "blocked_by_cycle");
  assert.equal(blockedIssue.changeId, "0003-blocked");
});

test("buildGraph: a 3-node cycle is detected and named in full", () => {
  const graph = buildGraph([
    { id: "0001-a", dependsOn: ["0002-b"] },
    { id: "0002-b", dependsOn: ["0003-c"] },
    { id: "0003-c", dependsOn: ["0001-a"] }
  ]);
  assert.equal(graph.order, null);
  assert.deepEqual(graph.cycles, ["0001-a", "0002-b", "0003-c"]);
});

test("buildGraph: a cycle among some nodes does not prevent unrelated acyclic nodes from existing in the graph", () => {
  const graph = buildGraph([
    { id: "0001-a", dependsOn: ["0002-b"] },
    { id: "0002-b", dependsOn: ["0001-a"] },
    { id: "0003-unrelated", dependsOn: [] }
  ]);
  assert.deepEqual(graph.nodes, ["0001-a", "0002-b", "0003-unrelated"]);
  assert.equal(graph.order, null, "order is null for the whole graph once any cycle exists — no partial order is fabricated");
  assert.deepEqual(graph.cycles, ["0001-a", "0002-b"], "0003-unrelated is correctly excluded from the reported cycle members");
});

test("buildGraph: mixes valid dependencies, a missing one, and a self-dependency in one graph correctly", () => {
  const graph = buildGraph([
    { id: "0001-a", dependsOn: [] },
    { id: "0002-b", dependsOn: ["0001-a", "0099-ghost"] },
    { id: "0003-c", dependsOn: ["0003-c"] }
  ]);
  assert.deepEqual(graph.edges, [{ from: "0002-b", to: "0001-a" }]);
  assert.deepEqual(
    graph.issues.map((i) => i.type).sort(),
    ["missing_dependency", "self_dependency"]
  );
  assert.deepEqual(graph.order, ["0001-a", "0002-b", "0003-c"]);
});

test("buildGraph: is deterministic across repeated calls", () => {
  const nodes = [{ id: "0002-b", dependsOn: ["0001-a"] }, { id: "0001-a", dependsOn: [] }, { id: "0003-c", dependsOn: ["0001-a", "0002-b"] }];
  const first = buildGraph(nodes);
  const second = buildGraph(nodes);
  assert.deepEqual(first, second);
});

test("buildGraph: reordering the input array (same logical graph) produces the same output", () => {
  const a = buildGraph([
    { id: "0001-a", dependsOn: [] },
    { id: "0002-b", dependsOn: ["0001-a"] },
    { id: "0003-c", dependsOn: ["0001-a", "0002-b"] }
  ]);
  const b = buildGraph([
    { id: "0003-c", dependsOn: ["0002-b", "0001-a"] },
    { id: "0001-a", dependsOn: [] },
    { id: "0002-b", dependsOn: ["0001-a"] }
  ]);
  assert.deepEqual(a, b);
});

test("buildGraph: the edges array is always sorted by (from, to)", () => {
  const graph = buildGraph([
    { id: "0003-c", dependsOn: ["0001-a"] },
    { id: "0001-a", dependsOn: [] },
    { id: "0002-b", dependsOn: ["0001-a"] }
  ]);
  const sorted = [...graph.edges].sort((x, y) => (x.from === y.from ? x.to.localeCompare(y.to) : x.from.localeCompare(y.from)));
  assert.deepEqual(graph.edges, sorted);
});
