# Tasks

## Design (this Change)

- [x] Inspected `hook.js`/`hooks/index.js`/`hook-service.js`/`hook-context.js` (Change 0048,
      ADR-020), `change-manifest.js` (Change 0043/0045, `sdd` precedent), `cli.js`'s
      `renderHookResults()`/`runVerifyCompletedHooks()`, `status --change`'s existing SDD/Workflow
      sections, `docs/workflow.md`/`architecture.md`/`concepts.md`'s current Hook documentation,
      and every `hook-*.test.js` file.
- [x] Decided the manifest shape keyed by event id (not Hook id), mirroring `hook.js`'s own closed
      catalog rather than the commissioning brief's illustrative `beforePrompt`/`afterPrompt`
      names literally.
- [x] Decided `doctor`'s Harness section is `--verbose`-only (no non-verbose content), keeping
      default `doctor` output byte-identical.
- [x] Decided `status --change`'s Harness section reports configuration, never fabricated
      execution counts.
- [x] Wrote `change.md`, `spec.md`, `tasks.md`, ADR-026.

## Implementation

- [x] `cli/src/core/domain/change-manifest.js`: `HARNESS_EVENT_VALUES` constant;
      `harness`/`harness.log`/`harness.hooks.<event>.disabled` structural validation.
- [x] `cli/src/core/services/harness-service.js` (new): `resolveHarnessConfig()`,
      `partitionOutcome()`, `describeHarnessRegistry()`, `hookTitle()`, `formatHookLogSection()`,
      `formatHookResultsBlock()`, `describeFailingHooks()`.
- [x] `cli/src/cli.js`:
  - `doctor(args)`: `--verbose` prints a new "Harness:" section (`printHarnessRegistry()`).
  - `statusSingleChange()`: prints a new, conditional "Harness:" section (`printHarnessStatus()`).
  - `prompt()`: resolves Harness config for the targeted Change, partitions the Hook outcome,
    renders via `formatHookResultsBlock()`, appends `hooks.md` when `log` is on
    (`appendHookLog()`).
  - `runVerifyCompletedHooks()`: same treatment for `verify.completed`, plus a new "Hook issues:"
    block via `describeFailingHooks()`.
- [x] `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`: replaced "no Hook is
      user-facing to configure yet" with the real, current model. `docs/configuration.md`: new
      `harness`/`hooks.md` documentation with the copyable manifest example. `docs/cli.md`:
      `doctor --verbose`/`status --change`/`prompt`/`verify` rows updated.
- [x] `knowledge/decisions.md`: ADR-026.

## Tests

- [x] `cli/tests/change-manifest.test.js`: 10 new tests — valid minimal/full harness, non-object
      harness, non-boolean log, unknown event key, non-array/bad-entry disabled, non-object
      hooks.<event>, non-object hooks, unknown Hook id (structurally valid).
- [x] `cli/tests/harness-service.test.js` (new, 22 tests): `resolveHarnessConfig` (no manifest, no
      harness, valid config, unknown id, log default, determinism), `partitionOutcome` (splits,
      nothing-disabled), `describeHarnessRegistry`/`hookTitle` (match real registry, fallback),
      `formatHookLogSection` (no secrets, PASS/FAIL conditional, pipe/newline escaping),
      `formatHookResultsBlock`/`describeFailingHooks` (matched, silent cases, **failed/invalid
      rendering with no stack trace** — the fixture-based proof for spec.md's failed-Hook
      acceptance criterion, same precedent `hook-service.test.js` already established).
- [x] `cli/tests/cli.test.js`: 12 new end-to-end tests — no-harness byte-identical baseline
      (`doctor` default, `prompt`, `verify`, no `hooks.md`), `doctor --verbose` registry listing,
      `status --change` conditional section (absent/disabled counts/unknown-id warning/unknown
      event exit-1), `prompt` excludes a disabled Hook, `harness.log` creates and accumulates
      `hooks.md` (including non-`matched` entries, no secret-shaped content), `verify` never
      writes `hooks.md` without `log`, LIDR Skills/Standards (0054/0055) unaffected.
- [x] Ran `cd cli && npm test`: **638/638 passing** (594 baseline + 10 + 22 + 12 new = 638), 0
      regressions. One pre-existing 0055 test needed a scoping fix (see evidence.md Findings) —
      not a regression in behavior, a test-assertion boundary that had to move once new doctor
      output appeared after Standards' own section.
- [x] `aief verify` (whole project): PASS.
- [x] `git diff --check`: clean.
- [x] `grep -rn "child_process|execSync|spawn(" cli/src/core/services/harness-service.js
      cli/src/hooks/`: no matches — R9 confirmed.

## Close

- [x] `evidence.md`: test transcript, manual walkthrough (disabled Hook, log entries across two
      invocations, unknown id/event diagnostics, byte-identical compatibility proof).
- [x] Verified every acceptance criterion in `spec.md`.
- [x] Marked `change.md` Closed. **No `git commit`** (per this session's explicit instruction), no
      push.
