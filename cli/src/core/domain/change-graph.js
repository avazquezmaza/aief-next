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
//   cycles: string[] | null,      // every id left over after topological sort (cyclic members
//                                 // AND ids merely blocked by depending on one), null if none —
//                                 // kept exactly as before Change 0123 for existing callers
//   cycleComponents: string[][] | null, // Change 0123: each entry is one actual dependency
//                                 // cycle (a strongly connected component of size > 1), sorted;
//                                 // null when cycles is null. An id in `cycles` but in no
//                                 // cycleComponents entry is blocked by a cycle, not part of one
//                                 // — see the "blocked_by_cycle" issue for it.
//   issues: [{type, changeId, detail}]
// }
//
// nodes: [{ id: string, dependsOn: string[] }] — dependsOn defaults to [].
//
// Construction and validation are one pass (ADR-028): an edge is only ever
// created once it has already been checked against self/duplicate/missing —
// there is no second, separate validation traversal that could disagree
// with what was actually built.
// Tarjan's SCC algorithm (Change 0123), run only over `remainingIds` — the
// nodes Kahn's algorithm in buildGraph() could not place. Everything else is
// already known acyclic, so restricting the traversal to this subgraph keeps
// it O(V+E) over only the part that matters. Returns each strongly connected
// component as a sorted array; a component of size 1 means that id depends
// (directly or transitively, within remainingIds) on something that depends
// back on it only through nodes outside the component — i.e. it is blocked,
// not cyclic itself — so callers filter those out before treating a
// component as an actual cycle.
function findStronglyConnectedComponents(remainingIds, dependsOnSet) {
  const remainingSet = new Set(remainingIds);
  let counter = 0;
  const index = new Map();
  const lowlink = new Map();
  const onStack = new Set();
  const stack = [];
  const components = [];

  function strongconnect(id) {
    index.set(id, counter);
    lowlink.set(id, counter);
    counter += 1;
    stack.push(id);
    onStack.add(id);

    for (const target of dependsOnSet.get(id)) {
      if (!remainingSet.has(target)) continue; // already ordered by Kahn — outside this subgraph
      if (!index.has(target)) {
        strongconnect(target);
        lowlink.set(id, Math.min(lowlink.get(id), lowlink.get(target)));
      } else if (onStack.has(target)) {
        lowlink.set(id, Math.min(lowlink.get(id), index.get(target)));
      }
    }

    if (lowlink.get(id) === index.get(id)) {
      const component = [];
      let member;
      do {
        member = stack.pop();
        onStack.delete(member);
        component.push(member);
      } while (member !== id);
      components.push(component.sort());
    }
  }

  // Sorted traversal order: the only source of determinism here beyond the
  // graph itself — remainingIds' own iteration order must never leak into
  // which component gets discovered/reported first.
  for (const id of [...remainingIds].sort()) {
    if (!index.has(id)) strongconnect(id);
  }
  return components;
}

// Every cyclic id (within remaining) reachable from `id` by following
// dependsOn edges — i.e. which cycle(s) `id` is blocked by. Traversal is
// safe against the cycles themselves: `seen` guarantees each node is
// expanded at most once, so following an edge back into an already-found
// cyclic component never re-queues it.
function findBlockingCycleIds(id, dependsOnSet, cyclicIds) {
  const seen = new Set([id]);
  const found = new Set();
  const stack = [id];
  while (stack.length) {
    const current = stack.pop();
    for (const target of dependsOnSet.get(current)) {
      if (cyclicIds.has(target)) found.add(target);
      if (!seen.has(target)) {
        seen.add(target);
        stack.push(target);
      }
    }
  }
  return [...found].sort();
}

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
  let cycleComponents = null;
  if (order.length !== ids.length) {
    cycles = [...remaining].sort();

    // Change 0123: `remaining` mixes actual cycle members with ids merely
    // blocked by depending on one (e.g. C -> B where A <-> B) — SCC
    // separates them instead of reporting the whole set as "the" cycle.
    cycleComponents = findStronglyConnectedComponents(remaining, dependsOnSet)
      .filter((component) => component.length > 1)
      .sort((a, b) => a[0].localeCompare(b[0]));

    for (const component of cycleComponents) {
      issues.push({ type: "cycle", changeId: null, detail: `dependency cycle among: ${component.join(", ")}`, members: component });
    }

    const cyclicIds = new Set(cycleComponents.flat());
    for (const id of cycles) {
      if (cyclicIds.has(id)) continue;
      const blockedBy = findBlockingCycleIds(id, dependsOnSet, cyclicIds);
      issues.push({
        type: "blocked_by_cycle",
        changeId: id,
        detail: `"${id}" depends (directly or transitively) on a dependency cycle among: ${blockedBy.join(", ")}`,
        blockedBy
      });
    }
  }

  return { nodes: ids, edges, order: cycles ? null : order, cycles, cycleComponents, issues };
}
