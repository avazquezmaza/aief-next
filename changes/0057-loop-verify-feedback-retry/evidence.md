# Evidence

## Summary

`aief verify --change <id>` is now opt-in attempt-aware: **Verify → Feedback → Retry (if
applicable) → Final result**, implemented as a thin, pure layer (`loop-service.js`) reusing
Structural Verification's own already-computed `report.errors` as Feedback, deriving the attempt
number from a visible, append-only `<changeDir>/loop.md`, and never re-invoking anything
automatically. `aief doctor --verbose` gains a read-only, conditional registry of every open
Change's Loop state. A Change with no `loop` field is byte-identical to before this Change
everywhere.

## Activities Performed

- `cli/src/core/domain/change-manifest.js`: `loop`/`loop.verify`/`loop.verify.maxRetries`
  structural validation, mirroring `harness`'s precedent exactly.
- `cli/src/core/services/loop-service.js` (new): `resolveLoopConfig()`, `countPreviousAttempts()`,
  `decideLoopOutcome()`, `formatLoopSummary()`, `formatLoopLogEntry()` — all pure, all
  independently unit-tested.
- `cli/src/cli.js`: `runLoop()` wired into `verify()`'s `--change` branch (after the existing
  report and Hook output); `printLoopRegistry()` wired into `doctor --verbose`.
- `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/configuration.md`,
  `docs/cli.md`: Loop documented with a complete, copyable manifest example.
- `knowledge/decisions.md`: ADR-027, written before implementation began.
- Tests: `cli/tests/change-manifest.test.js` (+6), `cli/tests/loop-service.test.js` (new, 21),
  `cli/tests/cli.test.js` (+11); new test file registered in `cli/package.json`'s `test` script.

No change to `cli/src/core/domain/hook.js`, `cli/src/hooks/index.js`,
`cli/src/core/services/hook-service.js`, `cli/src/core/services/hook-context.js`,
`cli/src/core/services/harness-service.js`, `cli/src/core/domain/ai-specs.js`,
`cli/src/detect.js`, `close()`, or `change-verifier.js`'s report computation.

## Verification

- `cd cli && npm test`: **676/676 passing** (638 baseline + 38 new), 0 regressions.
- `aief verify` (whole project): **PASS**.
- `git diff --check`: clean, exit 0.
- `grep -rn "child_process|execSync|spawn(" cli/src/core/services/loop-service.js`: no matches —
  no command-execution surface introduced anywhere.
- `aief status` (whole project) diffed before/after this Change's full code diff (via `git
  stash`): no difference.
- Manual walkthrough (`/tmp/.../loop-demo`):
  - A Change with `loop.verify.maxRetries: 2`, forced to FAIL (emptied `spec.md`): attempt 1
    reported "Retry available", `loop.md` created with one entry including the exact Structural
    Verification error line as Feedback.
  - A second call: attempt 2, "Retry limit reached (2/2)", `loop.md` gained a second entry, the
    first untouched.
  - A third call (past the limit): attempt 3 of 2, still honestly "exhausted", never silently
    capped or hidden.
  - Fixing `spec.md` and re-running: attempt 4 of 2, PASS, "Loop complete — Change verified."
  - `aief doctor --verbose`: "Loop:" section listed the Change with its real attempt count and
    limit, pointing at `aief verify --change <id>`.

## Findings

None blocking. No test failures during implementation this time — the Harness precedent
(Change 0056) was close enough in shape that the first-pass implementation and tests matched on
the first full-suite run, aside from the expected iteration of writing the tests themselves.

## Risks

- `loop.md`, like `hooks.md`, accumulates without bound across many `verify` invocations on a
  long-lived Change with `loop.verify` configured — no rotation (same accepted, documented risk
  Change 0056 already recorded for `hooks.md`; out of scope here too).
- `countPreviousAttempts()`'s regex (`^## Attempt \d+`) assumes `loop.md` is not hand-edited into
  an inconsistent shape (e.g., a manually added `## Attempt` heading without a real prior verify
  run) — accepted per ADR-027's own reasoning: the visible file is deliberately the source of
  truth, and a human editing it changes future numbering honestly, not silently.

## Recommendations

Next candidate Change (not started here, and explicitly out of this Entrega's scope): Graph
(`status --graph`), or extending Loop's Feedback to include Requirement Verification results when
`--requirements` is also passed — no evidenced need for the latter yet (ADR-008).

## Artifacts Produced

- `cli/src/core/domain/change-manifest.js`, `cli/src/cli.js` (modified).
- `cli/src/core/services/loop-service.js` (new).
- `cli/tests/change-manifest.test.js`, `cli/tests/cli.test.js` (modified).
- `cli/tests/loop-service.test.js` (new).
- `cli/package.json` (test script entry).
- `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/configuration.md`,
  `docs/cli.md` (modified).
- `knowledge/decisions.md` (ADR-027 added).
- `changes/0057-loop-verify-feedback-retry/` (this Change).

## Lessons Learned

- Reusing Change 0056's Harness pattern nearly mechanically (manifest field → structural
  validation → pure service module → append-only Markdown log → conditional doctor/verbose
  presence) turned a potentially large design task into a fast, low-risk one — the strongest
  practical argument yet, in this session, for the repeated instruction to inspect and reuse
  before building anything new.
- Deciding explicitly *not* to add a `status --change` Loop section (even though the pattern would
  have made it easy to add) was worth documenting as a reasoned Non-goal rather than a silent
  omission — the commissioning instruction's own minimalism principle ("no agregues
  funcionalidades que no sean necesarias") is easiest to honor when the reasoning is written down
  at design time, before the temptation to add "just one more section" during implementation.

## Next Change

Not started here, and not requested — Graph/`status --graph` remains the next unimplemented piece
of AIEF 3.1's stated scope (see `change.md` "Out of scope").
