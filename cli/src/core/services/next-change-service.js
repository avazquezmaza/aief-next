// Next Change Selection (AIEF 3.1, Change 0059, ADR-029; ADR-038 removed
// the workflow-gate input).
//
// A pure, deterministic function over already-computed facts — no
// filesystem access of its own. Builds directly on Change 0058's
// buildGraph() (dependency structure).
//
// selectNextChange(changes, graph) -> { recommended, evaluations, tieBreakRule }
//
// changes: [{ id, closed }] — see status.js's gatherOpenChangeFacts().
// graph: a buildGraph() result (Change 0058) — edges/issues reused as-is.
//
// Eligibility is evaluated for every OPEN Change, never stopping at the
// first one — evaluations always has one entry per open Change, so a "no
// eligible Change" result is still fully explained.
export function selectNextChange(changes, graph) {
  const closedIds = new Set(changes.filter((c) => c.closed).map((c) => c.id));

  const issuesByChange = new Map();
  const addIssue = (id, issue) => {
    if (!issuesByChange.has(id)) issuesByChange.set(id, []);
    issuesByChange.get(id).push(issue);
  };
  for (const issue of graph.issues) {
    if (issue.type === "cycle") {
      for (const member of issue.members) addIssue(member, issue);
    } else if (issue.changeId) {
      addIssue(issue.changeId, issue);
    }
  }

  const evaluations = changes
    .filter((c) => !c.closed)
    .map((c) => {
      const blockers = [];
      for (const issue of issuesByChange.get(c.id) || []) blockers.push(`graph: ${issue.type} — ${issue.detail}`);

      const dependencies = graph.edges.filter((e) => e.from === c.id).map((e) => e.to).sort();
      const openDependencies = dependencies.filter((id) => !closedIds.has(id));
      if (openDependencies.length) blockers.push(`dependencies not closed: ${openDependencies.join(", ")}`);


      const eligible = blockers.length === 0;
      const reasons = eligible
        ? [
            "status: open",
            dependencies.length ? `dependencies: all closed (${dependencies.join(", ")})` : "dependencies: none declared",
            "graph: valid"
          ]
        : blockers;

      return { id: c.id, eligible, reasons, dependencies };
    })
    .sort((a, b) => a.id.localeCompare(b.id));

  const eligibleIds = evaluations.filter((e) => e.eligible).map((e) => e.id);
  const recommended = eligibleIds.length ? eligibleIds[0] : null;

  return {
    recommended,
    evaluations,
    tieBreakRule: "lowest Change id, sorted ascending (same order used throughout AIEF: changes/, buildGraph() nodes, status overview)"
  };
}
