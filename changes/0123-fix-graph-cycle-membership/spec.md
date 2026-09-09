# Specification

## Goal

`buildGraph(nodes)` distinguishes, among the nodes Kahn's algorithm cannot order, which ones are
actually inside a dependency cycle (a strongly connected component of size > 1) from which ones
are merely blocked because they depend — directly or transitively — on a node that is.

## Requirements

- R1: Compute strongly connected components (SCC) over the subgraph induced by the nodes Kahn's
  algorithm leaves in `remaining` (not the whole graph — those nodes are already known-acyclic).
- R2: A new field `cycleComponents: string[][]` lists each SCC of size > 1, each array sorted by
  id, and the outer array sorted by its first (smallest) id — deterministic output, matching the
  existing determinism guarantees of `buildGraph()`.
- R3: The existing `cycles: string[] | null` field is preserved unchanged in shape and value: the
  sorted union of every node left in `remaining` after Kahn's algorithm (i.e. every node in some
  `cycleComponents` entry, plus every node blocked by one). Existing callers that only read
  `cycles` see identical behavior to before this Change.
- R4: The existing single `{ type: "cycle", ... }` issue is replaced by one such issue per entry
  of `cycleComponents` (so N independent cycles produce N `"cycle"` issues, each with `members`
  set to only that component — not the whole `remaining` set).
- R5: Every node in `remaining` that is not part of any `cycleComponents` entry gets a new issue
  `{ type: "blocked_by_cycle", changeId, detail, blockedBy }`, where `blockedBy` is the sorted
  list of cyclic node ids it (transitively, within `remaining`) depends on.
- R6: `next-change-service.js` is updated so that a Change reported via `blocked_by_cycle` gets a
  "why blocked" reason naming the dependency, not "part of a dependency cycle" (which remains
  correct only for actual `cycle` issue members).
- R7: No change to `buildGraph()`'s behavior when `order.length === ids.length` (no cycle at
  all) — the acyclic path is untouched.

## Acceptance Criteria

- [ ] Given `A dependsOn B`, `B dependsOn A`, `C dependsOn B` (no cycle through `C`):
      `cycleComponents` is `[["0001-a","0002-b"]]`; `cycles` is
      `["0001-a","0002-b","0003-c"]` (unchanged shape); there is exactly one `"cycle"` issue with
      `members: ["0001-a","0002-b"]`; there is one `"blocked_by_cycle"` issue for `0003-c` with
      `blockedBy: ["0001-a","0002-b"]`.
- [ ] Given two independent 2-node cycles (`A↔B`, `C↔D`, no edges between the two pairs):
      `cycleComponents` is `[["0001-a","0002-b"],["0003-c","0004-d"]]`; there are exactly two
      `"cycle"` issues, each naming only its own pair.
- [ ] Every pre-existing test in `cli/tests/change-graph.test.js` that asserts on `cycles` still
      passes unmodified (backward compatibility for that field).
- [ ] `next-change-service.js`'s handling of `blocked_by_cycle` issues does not mark the blocked
      Change's reason as "cycle" — it names the specific blocking dependency instead.
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0123-fix-graph-cycle-membership --strict` all pass.
