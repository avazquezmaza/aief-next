# Tasks

## Implementation

- [x] Add an SCC helper (Tarjan's algorithm, no new dependency) operating over the
      `remaining` node set and `dependsOnSet`/`dependentsSet` maps already built in
      `buildGraph()`.
- [x] Compute `cycleComponents` from the SCCs of size > 1 found among `remaining`, sorted per
      spec R2.
- [x] Keep `cycles` computed exactly as today (sorted union of `remaining`) — no shape change.
- [x] Replace the single `"cycle"` issue push with one push per `cycleComponents` entry (R4).
- [x] For every node in `remaining` not covered by a `cycleComponents` entry, compute its
      `blockedBy` (cyclic ids it transitively depends on within `remaining`) and push a
      `"blocked_by_cycle"` issue (R5).
- [x] `next-change-service.js`: turned out unnecessary — `blocked_by_cycle` issues already carry
      `changeId`, so the existing generic `else if (issue.changeId)` branch already routes them
      correctly (R6 satisfied without a code change; see evidence.md).

## Documentation

- [x] Update the header comment in `cli/src/core/domain/change-graph.js` describing the return
      shape (add `cycleComponents`, note `cycles`' preserved meaning, note the new issue type).

## Verification

- [x] Add tests to `cli/tests/change-graph.test.js`: downstream-of-cycle (R-AC1), two independent
      cycles (R-AC2), and a combined case (cycle + downstream + an unrelated acyclic node) in one
      graph.
- [x] Confirm all pre-existing `cycles`-asserting tests pass unmodified.
- [x] Add/update a `next-change-service` test for the downstream-of-cycle "why blocked" reason,
      if such tests exist for cycle handling; add one if not.
- [x] Run `npm test`, `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0123-fix-graph-cycle-membership --strict`.

## Evidence

- [x] Update evidence.md
