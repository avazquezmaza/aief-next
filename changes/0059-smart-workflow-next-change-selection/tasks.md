# Tasks

## Design (this Change)

- [x] Confirmed `aief status --next`'s existing three paths (0/1/2+ open Changes) via
      `resolveImplicitChange()` and the exact existing tests for each — including the one test
      that locks in the *old* 2+-open-Changes ambiguity error, which this Change deliberately
      supersedes.
- [x] Confirmed `buildGraph()` (Change 0058) already provides every dependency/cycle fact needed;
      confirmed `resolveWorkflowFor()`/`workflow.state.blockers` (Change 0044/0046) is the one
      existing official blocking condition to reuse.
- [x] Decided Loop/Harness are explicitly excluded from eligibility — both are non-blocking by
      design (ADR-026/027); using them here would silently change their authority.
- [x] Decided the tie-break (lowest Change id, ascending) reuses `getChangeDirs()`'s existing sort
      convention — applied strictly after eligibility, never to infer eligibility itself.
- [x] Wrote ADR-029, `change.md`, `spec.md`, `tasks.md`.

## Implementation

- [x] `cli/src/core/services/next-change-service.js` (new): `selectNextChange(changes, graph)` —
      pure eligibility evaluation (all 6 conditions) + deterministic tie-break + per-Change
      explanation.
- [x] `cli/src/cli.js`:
  - `gatherOpenChangeFacts()` — the one place real Changes' `{id, closed, manifestError,
    workflowBlockers}` are computed, reusing `loadChangeUnified()`/`resolveWorkflowFor()`.
  - `statusNextSmart()` — renders the recommendation or the "no eligible Change" report.
  - `statusSingleChange()`: branch to `statusNextSmart()` only when `parsed.next === true`, no
    `--change`, and more than one Change is open — the 0/1-open-Change paths are untouched.
- [x] `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/cli.md`: documented the
      eligibility rule, the tie-break rule, and the deliberate behavior-change scope.
- [x] `knowledge/decisions.md`: ADR-029.

## Tests

- [x] `cli/tests/next-change-service.test.js` (new, 16 tests): empty input, one open eligible
      Change, closed Changes excluded from evaluations, a dependent Change with an open dependency
      (ineligible) vs. closed dependency (eligible), invalid manifest (ineligible), missing/self/
      duplicate dependency issues (ineligible), cycle membership (ineligible even with an
      individually-fine `dependsOn`), Workflow gate blocker (ineligible) vs. no-track (unaffected),
      multi-candidate tie-break (lowest id wins, others reported eligible), zero-eligible-among-
      several (every Change explained), deterministic repeated calls, reordered-but-equivalent
      input.
- [x] `cli/tests/cli.test.js`: updated the one existing test that asserted the old ambiguity-error
      behavior to assert the new, documented recommendation behavior instead (renamed, documented
      as deliberate — see `change.md`/`evidence.md`, not a silent edit). Added 6 more: a
      dependency-blocked vs. independent recommendation; closing the dependency flips the
      recommendation (kept on the 2+-open path via a third, unrelated open Change — see Findings
      in `evidence.md`); a Workflow-gate-blocked + Graph-issue-blocked combination producing "no
      eligible Change" with both reasons explained; a no-track Change unaffected by the Workflow
      condition; zero-file-writes; confirmation that `status --change <id> --next` and `status
      --graph` are unaffected.
- [x] Ran `cd cli && npm test`: **728/728 passing** (706 baseline − 1 superseded assertion + 1
      replacement + 6 + 16 new = 728), 0 unintended regressions.
- [x] `aief verify` (whole project): PASS.
- [x] `git diff --check`: clean.
- [x] Manually ran `aief status --next` against this repository's own 20+ real open Changes —
      completed correctly, recommended the lowest-id eligible Change, listed the rest as eligible,
      no crash.

## Close

- [x] `evidence.md`: test transcript, manual walkthrough (dependency-blocked, workflow-blocked,
      tie-break, no-eligible-Change), the deliberate-behavior-change record, byte-identical proof
      for the 0/1-open-Change paths, the one test-design finding.
- [x] Verified every acceptance criterion in `spec.md`.
- [x] Marked `change.md` Closed.
- [x] Created the local commit (this session's explicit instruction) — no push.
