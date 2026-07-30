# Tasks

## Design (this Change)

- [x] Inspected `verifyChange()`/`VerificationReport` (`report.errors` reused as Feedback,
      nothing recomputed), Harness (Change 0056/ADR-026, the exact pattern reused: manifest field,
      structural validation, pure service module, append-only per-Change Markdown log, conditional
      doctor/verbose presence), Hook Runtime/`verify.completed` (no new event needed), `close()`
      (confirmed untouched, no gating), existing ADRs.
- [x] Decided `loop.md` mirrors `hooks.md` exactly (append-only, visible, per-Change).
- [x] Decided attempt counting is derived from `loop.md`'s own content — never a hidden counter,
      never a manifest write.
- [x] Decided against a `status --change` Loop section and `close()` gating — documented as
      Non-goals with reasoning, not silently omitted.
- [x] Decided `doctor --verbose`'s Loop section is a conditional, project-wide, read-only registry
      scan across open Changes (mirrors how `doctor` already scans `changes/` for other sections).
- [x] Wrote ADR-027, `change.md`, `spec.md`, `tasks.md`.

## Implementation

- [x] `cli/src/core/domain/change-manifest.js`: `loop`/`loop.verify`/`loop.verify.maxRetries`
      structural validation (positive integer).
- [x] `cli/src/core/services/loop-service.js` (new): `DEFAULT_MAX_RETRIES`, `resolveLoopConfig()`,
      `countPreviousAttempts()`, `decideLoopOutcome()`, `formatLoopSummary()`,
      `formatLoopLogEntry()` — all pure.
- [x] `cli/src/cli.js`:
  - `verify()`'s `--change` branch: `runLoop()` resolves Loop config from
    `inspection.change.manifest`, computes attempt from `loop.md` (if present), decides outcome,
    prints the Loop summary, appends the log entry.
  - `doctor(args)`: `--verbose` prints a new, conditional "Loop:" section
    (`printLoopRegistry()`), scanning `openChangeDirs()`.
- [x] `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`: documented the Loop concept
      and its relationship to Harness/Hooks/verify. `docs/configuration.md`: `loop` manifest field
      + `loop.md` file, with a complete copyable example. `docs/cli.md`: `verify --change`/`doctor
      --verbose` rows updated.
- [x] `knowledge/decisions.md`: ADR-027.

## Tests

- [x] `cli/tests/change-manifest.test.js`: 6 new tests — no loop field, `loop.verify` present with
      no `maxRetries` (structurally valid), valid `maxRetries`, non-object `loop`, non-object
      `loop.verify`, invalid `maxRetries` (0, -1, 1.5, string, null, array — table-driven).
- [x] `cli/tests/loop-service.test.js` (new, 21 tests): `resolveLoopConfig` (no manifest, no loop,
      default maxRetries, explicit maxRetries, determinism), `countPreviousAttempts` (empty, one,
      several, malformed content never throws), `decideLoopOutcome` (passed regardless of
      attempt/maxRetries, retry_available under limit, exhausted at exactly maxRetries, exhausted
      honestly beyond maxRetries, never a fourth state), `formatLoopSummary`/`formatLoopLogEntry`
      (exact next-command wording, no secrets, decision-text consistency).
- [x] `cli/tests/cli.test.js`: 11 new end-to-end tests — no-loop byte-identical baseline (`verify
      --change`, `doctor` default/`--verbose`, no `loop.md` ever created), whole-project `verify`
      unaffected, first failing attempt (retry available, `loop.md` created), second failing
      attempt (limit reached, two entries, append-only), a passing attempt ("Loop complete"),
      default `maxRetries` = 3, invalid `maxRetries` is a manifest error (`status --change` exit
      1), `doctor --verbose` Loop registry (present with correct attempt count), `doctor --verbose`
      never writes `loop.md` (read-only), Harness/LIDR/Bootstrap tests unmodified and still
      passing.
- [x] Ran `cd cli && npm test`: **676/676 passing** (638 baseline + 6 + 21 + 11 new = 676), 0
      regressions.
- [x] `aief verify` (whole project): PASS.
- [x] `git diff --check`: clean.
- [x] `grep -rn "child_process|execSync|spawn(" cli/src/core/services/loop-service.js`: no
      matches — confirms no command-execution surface introduced.

## Close

- [x] `evidence.md`: test transcript, manual walkthrough (first attempt, retry, exhausted beyond
      limit, passed, doctor registry), byte-identical compatibility proof.
- [x] Verified every acceptance criterion in `spec.md`.
- [x] Marked `change.md` Closed.
- [x] Created the local commit (this session's explicit instruction) — no push.
