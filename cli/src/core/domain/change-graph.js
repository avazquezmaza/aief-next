// Change Dependency Graph (AIEF 3.1, Change 0058, ADR-028).
//
// A pure, deterministic domain module — no filesystem access, no CLI
// dependency, no persisted state. This is the foundation `status --next`,
// automatic planning and Change navigation will read later; none of those
// are implemented here.
//
// buildGraph(nodes) -> {
//   nodes: string[],              // sorted Change ids
//   edges: [{from, to}],          // from depends on to — sorted (from, to)
//   order: string[] | null,       // topological order (dependencies first), null if a cycle exists
//   cycles: string[] | null,      // ids left over after topological sort, null if none
//   issues: [{type, changeId, detail}]
// }
//
// nodes: [{ id: string, dependsOn: string[] }] — dependsOn defaults to [].
//
// Construction and validation are one pass (ADR-028): an edge is only ever
// created once it has already been checked against self/duplicate/missing —
// there is no second, separate validation traversal that could disagree
// with what was actually built.
export function buildGraph(inputNodes) {
  const ids = [...new Set(inputNodes.map((n) => n.id))].sort();
  const idSet = new Set(ids);
  const issues = [];
  const edgeKeys = new Set();
  const edges = [];
  // dependsOnSet: id -> Set(ids it depends on). dependentsSet: id -> Set(ids that depend on it) — the reverse, needed to propagate Kahn's algorithm.
  const dependsOnSet = new Map(ids.map((id) => [id, new Set()]));
  const dependentsSet = new Map(ids.map((id) => [id, new Set()]));

  for (const node of inputNodes) {
    const seenTargets = new Set();
    for (const target of node.dependsOn || []) {
      if (target === node.id) {
        issues.push({ type: "self_dependency", changeId: node.id, detail: `"${node.id}" depends on itself` });
        continue;
      }
      if (seenTargets.has(target)) {
        issues.push({ type: "duplicate_dependency", changeId: node.id, detail: `"${node.id}" lists dependency "${target}" more than once` });
        continue;
      }
      seenTargets.add(target);
      if (!idSet.has(target)) {
        issues.push({ type: "missing_dependency", changeId: node.id, detail: `"${node.id}" depends on "${target}", which does not exist` });
        continue;
      }
      const key = `${node.id}->${target}`;
      if (edgeKeys.has(key)) continue; // same target declared identically twice via distinct input entries — already handled by seenTargets, kept as a defensive no-op
      edgeKeys.add(key);
      edges.push({ from: node.id, to: target });
      dependsOnSet.get(node.id).add(target);
      dependentsSet.get(target).add(node.id);
    }
  }
  edges.sort((a, b) => (a.from === b.from ? a.to.localeCompare(b.to) : a.from.localeCompare(b.from)));

  // Kahn's algorithm: a node is ready once every Change it depends on has
  // already been placed in the order. Ties broken by sorted id, always —
  // the sole source of determinism beyond the input itself.
  const remainingDeps = new Map(ids.map((id) => [id, dependsOnSet.get(id).size]));
  const order = [];
  const remaining = new Set(ids);
  let queue = ids.filter((id) => remainingDeps.get(id) === 0);
  while (queue.length) {
    queue.sort();
    const id = queue.shift();
    remaining.delete(id);
    order.push(id);
    const nextReady = [];
    for (const dependent of dependentsSet.get(id)) {
      const updated = remainingDeps.get(dependent) - 1;
      remainingDeps.set(dependent, updated);
      if (updated === 0 && remaining.has(dependent)) nextReady.push(dependent);
    }
    queue.push(...nextReady);
  }

  let cycles = null;
  if (order.length !== ids.length) {
    cycles = [...remaining].sort();
    issues.push({ type: "cycle", changeId: null, detail: `dependency cycle among: ${cycles.join(", ")}`, members: cycles });
  }

  return { nodes: ids, edges, order: cycles ? null : order, cycles, issues };
}
