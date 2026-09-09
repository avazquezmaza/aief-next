# Change

## ID

`0123-fix-graph-cycle-membership`

## Type

Fix

## Objective

`buildGraph()`'s cycle detection (`cli/src/core/domain/change-graph.js`) reports every node
Kahn's algorithm leaves unordered as a member of "the" cycle. When a node depends on a cyclic
node but is not itself part of any cycle (e.g. `A↔B`, `C→B`), it is misreported as a cycle
member. The same happens when the graph contains two or more independent cycles: they are
reported as one undifferentiated blob. This propagates into `status --next`'s "why blocked"
explanation (`next-change-service.js`), which then gives an incorrect reason for why a Change
cannot proceed.

Fix cycle membership to reflect strongly connected components (SCC), so a Change blocked by a
dependency on a cyclic Change is reported as "blocked by a dependency", not as "part of a
cycle" — while a Change actually inside a cycle is still reported as such.

## Scope

### In scope

- `buildGraph()`'s post-Kahn classification of unordered nodes.
- The `issues` entries derived from that classification.
- `next-change-service.js`'s consumption of those issues.
- Tests covering downstream-of-cycle and multiple independent cycles.

### Out of scope

- Any change to the acyclic (happy-path) topological order.
- Expanding the Graph beyond Changes + `dependsOn` (no new node/edge types).
- `status.js`'s human-readable rendering, beyond what's needed to stay correct (no redesign).
- Making `dependsOn` load-bearing for `aief close` (separate, larger Workflow-authority
  question, tracked separately).

## Success Criteria

- A Change blocked only by a dependency on a cyclic Change is never reported as itself being
  part of the cycle.
- Two or more independent cycles in the same graph are reported as separate cycles, each naming
  only its own members.
- The existing `cycles` field keeps returning the same value as before for every case already
  covered by the current test suite (backward compatible for existing consumers that only read
  `cycles`).
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0123-fix-graph-cycle-membership --strict`,
  and `git diff --check` all pass.

## Status

Closed (2026-09-09)
