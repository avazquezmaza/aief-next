# Evidence

## Summary

`aief status --next` now gives a real, deterministic answer when more than one Change is open —
recommending the next eligible Change (or honestly explaining why none is eligible) — instead of
today's "select one explicitly" error, which is preserved unchanged for the 0- and 1-open-Change
cases it was always meant for. Eligibility and the tie-break are both built entirely on Change
0058's `buildGraph()` and the existing Workflow Engine's gate blockers; Loop and Harness are
deliberately never consulted, per their own non-blocking design (ADR-026/027).

## Activities Performed

- `cli/src/core/services/next-change-service.js` (new): `selectNextChange(changes, graph)` — pure,
  independently unit-tested, no filesystem access.
- `cli/src/cli.js`: `gatherOpenChangeFacts()` (the sole real-fact-gathering point, reusing
  `loadChangeUnified()`/`resolveWorkflowFor()`); `statusNextSmart()` (new); `statusSingleChange()`
  now branches to it only when `--next` is set, no `--change`, and 2+ Changes are open.
- `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/cli.md`: the eligibility
  rule, the tie-break rule, and the deliberate behavior-change scope documented with a worked
  example.
- `knowledge/decisions.md`: ADR-029, written before implementation began.
- Tests: `cli/tests/next-change-service.test.js` (new, 16), `cli/tests/cli.test.js` (1 test
  deliberately superseded/renamed, +6 new); new test file registered in `cli/package.json`'s
  `test` script.

No change to `cli/src/core/domain/change-graph.js`, `cli/src/core/services/harness-service.js`,
`cli/src/core/services/loop-service.js`, `cli/src/core/domain/ai-specs.js`, `cli/src/detect.js`,
`resolveWorkflowFor()`, `nextAction()`/`deriveNextAction()`, or `aief status --change <id> --next`/
`--graph`.

## Verification

- `cd cli && npm test`: **728/728 passing** (706 baseline, net +22), 0 unintended regressions.
- `aief verify` (whole project): **PASS**.
- `git diff --check`: clean, exit 0.
- No NUL-byte corruption in any new/modified file (checked directly after the incident found and
  fixed during Change 0058 — verified proactively this time before staging).
- `aief status` (whole-project overview, no flags) diffed before/after this Change's full code
  diff (via `git stash`): no difference — `statusOverview()` is a fully separate code path,
  confirmed untouched.
- Manual walkthrough (`/tmp/.../next-demo`):
  - 3 open, dependency-free Changes: recommended the lowest id, listed the other two as eligible.
  - A Change depending on an open one: excluded from "Other eligible" until the dependency closed,
    at which point it appeared (and, once it became the only remaining open Change, correctly fell
    through to the *unchanged* single-open-Change compact view instead of the smart path —
    confirming the branch condition is exactly "2+ open", not "any Change has dependencies").
  - A `governed`-track Change with an unsatisfied approval gate, alongside a Change with a missing
    dependency: both open, both listed under "No eligible Change found", each with its own precise
    reason (`workflow: approval: pending — ...` / `graph: missing_dependency — ...`).
  - Ran `aief status --next` against **this repository's own** 20+ real open Changes: completed
    without error, recommended the lowest-id eligible one, listed the rest.

## Findings

1. **Deliberate behavior change, tracked explicitly (expected, not a defect).** The pre-existing
   test `"status --next with multiple open Changes produces an actionable ambiguity error, exit 1,
   no guess"` was renamed and its assertions replaced to match the new, commissioned behavior. This
   is recorded in `change.md`/ADR-029 as an intentional supersession of one narrow path
   (ADR-018's own "never guess" stance, which existed only because no eligibility model existed
   yet — Change 0058 built that model specifically so this decision could be principled).
2. **A test-design mistake, not an implementation bug.** The first version of "closing the
   dependency makes the dependent Change the recommendation" closed the *only other* open Change,
   which correctly dropped the project to exactly one open Change — legitimately routing to the
   unchanged single-open-Change compact view (a different, older output format) rather than the
   new smart-selection path being tested. Fixed by adding a third, unrelated open (and
   intentionally still-blocked) Change so the scenario stays on the 2+-open path the test actually
   intends to exercise.

## Risks

- `gatherOpenChangeFacts()` calls `resolveWorkflowFor()` for every Change with a track on every
  `status --next` with 2+ open Changes (no caching, consistent with `workflowChanges()`'s own
  existing behavior) — negligible cost at any realistic project size.
- The eligibility rule intentionally excludes Loop/Harness state and SDD readiness — a future
  Change wanting either as a blocking condition must amend the relevant ADR first (ADR-026/027 for
  Loop/Harness; no ADR yet treats SDD readiness as blocking anything), not extend
  `selectNextChange()` informally.

## Recommendations

Next candidate Changes (not started here, and explicitly out of this Entrega's scope): automatic
multi-step planning or Change navigation beyond a single recommendation; surfacing the same
eligibility explanation inside `aief status --change <id>`'s own deep-inspection view (today it's
only in the 2+-open-Changes smart path) if real demand for that is ever evidenced.

## Artifacts Produced

- `cli/src/core/services/next-change-service.js` (new).
- `cli/src/cli.js` (modified).
- `cli/tests/next-change-service.test.js` (new).
- `cli/tests/cli.test.js` (modified).
- `cli/package.json` (test script entry).
- `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/cli.md` (modified).
- `knowledge/decisions.md` (ADR-029 added).
- `changes/0059-smart-workflow-next-change-selection/` (this Change).

## Lessons Learned

- Explicitly naming and justifying a deliberate behavior change — in `change.md`, in the ADR, and
  in the updated test's own new name — turned what could have looked like an unexplained regression
  into a traceable, intentional decision a future reader can follow back to its reasoning without
  guessing.
- Testing the "closing a dependency changes the outcome" scenario required noticing that closing a
  Change also changes the *open-Change count* the branch condition itself depends on — a reminder
  that a test's setup can accidentally exercise a different code path than intended when two
  conditions (open-Change count, dependency state) move together.

## Next Change

Not started here, and not requested — see `change.md` "Out of scope" (multi-step planning, Change
navigation beyond one recommendation).
