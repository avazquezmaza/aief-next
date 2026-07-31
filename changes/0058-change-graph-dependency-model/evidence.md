# Evidence

## Summary

AIEF has an official Change dependency model: `manifest.json`'s optional `dependsOn` field, a
pure, deterministic `change-graph.js` domain module (construction and validation in one pass,
Kahn's-algorithm topological order, explicit cycle detection), and three read-only surfaces —
`aief status`'s conditional overview section, the new `aief status --graph` full view, and a
non-blocking per-Change note in `aief verify --change <id>`. No storage beyond `manifest.json`
itself; nothing is cached. A project with no `dependsOn` anywhere is byte-identical to before this
Change everywhere, including `aief doctor`, which this Change does not touch at all.

## Activities Performed

- `cli/src/core/domain/change-manifest.js`: `dependsOn` structural validation, mirroring
  `sdd.change_id`'s shape-only precedent.
- `cli/src/core/domain/change-graph.js` (new): `buildGraph(nodes)` — pure, independently
  unit-tested, no filesystem access.
- `cli/src/cli.js`: `buildProjectGraph()` (the sole real-Change-gathering point, guarded by
  `!manifestError`); `statusOverview()`'s new conditional "Dependency Graph:" section;
  `statusGraph()` (new, wired via `--graph`); `runGraphCheck()` wired into `verify()`'s `--change`
  branch, after Loop's own output.
- `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/configuration.md`,
  `docs/cli.md`: the Graph documented with a complete, copyable manifest example and an issue-type
  reference table.
- `knowledge/decisions.md`: ADR-028, written before implementation began.
- Tests: `cli/tests/change-manifest.test.js` (+6), `cli/tests/change-graph.test.js` (new, 15),
  `cli/tests/cli.test.js` (+9); new test file registered in `cli/package.json`'s `test` script.

No change to `cli/src/core/services/harness-service.js`, `cli/src/core/services/loop-service.js`,
`cli/src/core/domain/ai-specs.js`, `cli/src/detect.js`, `cli/src/hooks/*`, `close()`,
`change-verifier.js`'s report computation, or `aief doctor`.

## Verification

- `cd cli && npm test`: **706/706 passing** (676 baseline + 30 new), 0 regressions.
- `aief verify` (whole project): **PASS**.
- `git diff --check`: clean, exit 0.
- `aief status` (whole project) diffed before/after this Change's full code diff (via `git
  stash`): no difference.
- Manual walkthrough (`/tmp/.../graph-demo`):
  - Three Changes, `0003-add-login` depending on `0002-user-model`, `0004-add-payments` depending
    on both plus a nonexistent `0099-ghost`: `aief status` listed both dependency-declaring
    Changes and the `missing_dependency` issue; `aief status --graph` showed all 4 nodes (including
    `0001-adopt-aief`, which declares none), 3 real edges, and the correct topological order.
  - Introducing a cycle (`0002-user-model` → `0004-add-payments` → ... → `0002-user-model`):
    `status --graph` correctly reported "Topological order: unavailable — dependency cycle among:
    0002-user-model, 0003-add-login, 0004-add-payments" and listed the `cycle` issue, alongside the
    still-present, unrelated `missing_dependency` issue.
  - `aief verify --change 0004-add-payments`: Structural Verification still PASSed; one
    non-blocking "Dependency Graph issues for this Change" note appeared, naming the missing
    dependency.
  - A project with no `dependsOn` anywhere: confirmed zero occurrences of "Dependency Graph" in
    `aief status` or `aief verify --change <id>` output.

## Findings

One test assertion was wrong, not the implementation: "status overview: a Dependency Graph section
... listing dependencies and issues" originally asserted the "depends on:" line would list a
missing dependency alongside real ones (`0001-user-model, 0099-ghost`). The actual, correct
behavior (per spec.md R6: "no edge is created toward a nonexistent node") only lists resolved
edges in that line — the missing dependency is reported exclusively under "Issues:", never
fabricated into the dependency list itself. Fixed the test assertion to match the specified,
correct behavior; re-ran the full suite to confirm.

## Risks

- `buildProjectGraph()` re-reads and re-parses every Change's `manifest.json` on each call (no
  caching, consistent with `sddChanges()`/`workflowChanges()`'s own existing behavior) — negligible
  cost at any realistic project size; revisit only with cited evidence of a real problem (ADR-008).
- Cycle reporting names the whole connected remaining-node set after topological removal, not
  individual simple cycles when several overlap — a deliberate simplification (ADR-028's own
  "alternatives considered"), sufficient for a Change author to locate and fix their own
  `dependsOn` declarations.

## Recommendations

Next candidate Changes (not started here, and explicitly out of this Entrega's scope):
`status --next` (choosing the next Change to work on using `buildGraph()`'s topological order),
automatic planning, and Change navigation — all explicitly deferred to build on this Change's
`{nodes, edges, order, cycles, issues}` shape rather than a second graph representation.

## Artifacts Produced

- `cli/src/core/domain/change-manifest.js`, `cli/src/cli.js` (modified).
- `cli/src/core/domain/change-graph.js` (new).
- `cli/tests/change-manifest.test.js`, `cli/tests/cli.test.js` (modified).
- `cli/tests/change-graph.test.js` (new).
- `cli/package.json` (test script entry).
- `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/configuration.md`,
  `docs/cli.md` (modified).
- `knowledge/decisions.md` (ADR-028 added).
- `changes/0058-change-graph-dependency-model/` (this Change).

## Lessons Learned

- Writing `buildGraph()`'s one-pass construction-and-validation design before any CLI wiring, and
  smoke-testing it directly via `node -e` against hand-built cycle/missing/self/duplicate cases
  before writing formal tests, caught the algorithm's correctness early — the formal test suite
  then mostly confirmed what manual inspection had already shown, rather than discovering new
  bugs.
- The one test failure this Change hit (the "depends on:" line assertion) was a case of the test
  encoding a plausible-but-wrong mental model of the output format — a reminder, consistent with
  this session's prior Changes, that CLI-level assertions deserve the same scrutiny as the
  implementation they check, especially when a plausible-sounding alternative behavior exists.

## Next Change

Not started here, and not requested — `status --next`, automatic planning, and Change navigation
remain unimplemented, explicitly building on this Change's Graph model when undertaken (see
`change.md` "Out of scope").
