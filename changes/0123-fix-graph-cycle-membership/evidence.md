# Evidence

## Summary

Fixed `buildGraph()`'s cycle reporting (`cli/src/core/domain/change-graph.js`) to distinguish
actual dependency cycles (strongly connected components) from Changes merely blocked by one.
Before this Change, every id Kahn's algorithm left unordered — cyclic members and their
downstream dependents alike — was reported as "part of" a single, undifferentiated cycle,
which propagated into `status --next`'s "why blocked" explanation.

## Activities Performed

- Added `findStronglyConnectedComponents()` (Tarjan's algorithm) and `findBlockingCycleIds()`
  to `change-graph.js`, both operating only over the subgraph of nodes Kahn's algorithm left
  unordered (`remaining`) — the rest of the graph is already known acyclic, so no extra
  traversal cost is paid there.
- `buildGraph()`'s return now includes `cycleComponents: string[][] | null` — each entry one
  real cycle (SCC of size > 1), sorted. The pre-existing `cycles` field is unchanged in shape
  and value (still the sorted union of every unordered id) for backward compatibility.
- The single `"cycle"` issue is now one issue per `cycleComponents` entry (so two independent
  cycles produce two separate issues, each naming only its own members).
- A new `"blocked_by_cycle"` issue is emitted for every unordered id that is not itself cyclic,
  carrying `blockedBy`: the cyclic ids it transitively depends on.
- `next-change-service.js` required **no code change**: `blocked_by_cycle` issues carry
  `changeId`, so the pre-existing generic `else if (issue.changeId) addIssue(...)` branch
  already routes them to the right Change without special-casing. This was verified with a new
  test (`selectNextChange: a Change blocked by a cyclic dependency is ineligible for the
  dependency reason, not misreported as a cycle member`), not just assumed.
- Updated `change-graph.js`'s header comment to document the new field and issue type.
- Added 4 new tests to `cli/tests/change-graph.test.js` (downstream-of-cycle, two independent
  cycles, a combined cycle+blocked+unrelated case, and a `cycleComponents` assertion on the
  existing 2-node-cycle test) and 1 to `cli/tests/next-change-service.test.js`.
- Updated the one pre-existing test whose assertion was a full-object `deepEqual` (empty-graph
  case) to include the new `cycleComponents: null` field — the only pre-existing test that
  needed any change; every other pre-existing assertion on `cycles` passed unmodified.

## Verification

- `npm test` (cli/): 1057/1057 passed.
- `npm run lint` (cli/): clean.
- `node cli/bin/aief.js verify --change 0123-fix-graph-cycle-membership --strict`: PASS (only
  the expected "evidence not completed yet" note, resolved by this file).
- `git diff --check`: clean.
- Manually confirmed the two acceptance-criteria scenarios from spec.md directly via the new
  tests: `A↔B, C→B` → one `cycle` issue `[A,B]`, one `blocked_by_cycle` issue for `C`; two
  independent 2-node cycles → two separate `cycle` issues.

## Findings

- Confirmed the bug as diagnosed: `cycles = [...remaining].sort()` in the pre-existing code
  conflated true cycle membership with "downstream of a cycle", and this propagated as an
  incorrect "graph: cycle" reason in `status --next`'s explanation for a Change that was in
  fact only blocked by an unclosed dependency.
- The fix required no change to `next-change-service.js`'s logic, only to what `buildGraph()`
  reports — the consumer's existing generic issue-routing was already correct once given
  accurate input. This is preserved as a design note in tasks.md so a future reader does not
  wonder why that file appears unmodified in the diff.

## Risks

- None identified. The change is additive (`cycleComponents` is a new field; `cycles` keeps its
  exact prior meaning) and the one behavior change (fewer/more accurate issues) only affects
  Changes that are already ineligible either way (blocked, just for the correct stated reason).

## Recommendations

- `status.js`'s human-readable rendering (line ~356) still prints only `graph.cycles` as one
  flat list; it could be updated to render `cycleComponents` and `blocked_by_cycle` issues
  distinctly for a clearer "why blocked" message to a human. Left out of this Change's scope
  (change.md explicitly excludes it) — worth a small follow-up if `status --next`'s
  explanations are revisited.
- The larger Workflow-gate-authority question (`review`/`approval`/`security_review` gates
  never resolving, and `close` not consulting them or the Graph) remains open and unrelated to
  this fix — tracked separately per the audit discussion that surfaced this Graph bug.

## Artifacts Produced

- `cli/src/core/domain/change-graph.js` (SCC/blocked-by-cycle logic, updated header comment).
- `cli/tests/change-graph.test.js` (+4 tests, 1 updated assertion).
- `cli/tests/next-change-service.test.js` (+1 test).

## Lessons Learned

- A generic, changeId-keyed issue-routing design (already present in `next-change-service.js`)
  absorbed a new issue type for free — evidence that keeping consumers generic over `issues[]`
  rather than switching on specific known types pays off when the producer's classification is
  later refined.

## Next Change

- None required by this fix. Optional follow-up noted above (Recommendations) if `status.js`'s
  rendering of cycle/blocked reasons is revisited.
