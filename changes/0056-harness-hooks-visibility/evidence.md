# Evidence

## Summary

AIEF's existing Hook Runtime (ADR-020, Change 0048) is now inspectable (`aief doctor --verbose`,
`aief status --change <id>`), per-Change opt-out-able and log-able via a new, structurally
validated `manifest.json` `harness` field, without modifying `hook.js`/`hooks/index.js`/
`hook-service.js`/`hook-context.js` at all, and without introducing any command-execution surface.
A Change with no `harness` field is byte-identical to before this Change everywhere except the two
places that already had no backward-compatibility promise (`--verbose`) or are themselves
conditional on the new field (`status --change`).

## Activities Performed

- `cli/src/core/domain/change-manifest.js`: `HARNESS_EVENT_VALUES`; `harness` structural
  validation, mirroring the existing `sdd` field's precedent exactly.
- `cli/src/core/services/harness-service.js` (new): `resolveHarnessConfig()`, `partitionOutcome()`,
  `describeHarnessRegistry()`, `hookTitle()`, `formatHookLogSection()`, `formatHookResultsBlock()`,
  `describeFailingHooks()` — all pure, all independently unit-tested.
- `cli/src/cli.js`: `doctor --verbose` gains `printHarnessRegistry()`; `statusSingleChange()`
  gains conditional `printHarnessStatus()`; `prompt()`/`runVerifyCompletedHooks()` resolve Harness
  config, partition results, render via the new pure formatters, and append `<changeDir>/hooks.md`
  when `harness.log` is on; `appendHookLog()` added.
- `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/configuration.md`,
  `docs/cli.md`: updated from "no Hook is user-facing to configure yet" to the real, current
  model, with a complete, copyable `harness` manifest example.
- `knowledge/decisions.md`: ADR-026, written before implementation began.
- Tests: `cli/tests/change-manifest.test.js` (+10), `cli/tests/harness-service.test.js` (new, 22),
  `cli/tests/cli.test.js` (+12); both new files registered in `cli/package.json`'s `test` script.

No change to `cli/src/core/domain/hook.js`, `cli/src/hooks/index.js`,
`cli/src/core/services/hook-service.js`, `cli/src/core/services/hook-context.js`,
`cli/src/detect.js`, or `cli/src/core/domain/ai-specs.js`.

## Verification

- `cd cli && npm test`: **638/638 passing** (594 baseline + 44 new), 0 regressions.
- `aief verify` (whole project): **PASS**.
- `git diff --check`: clean, exit 0.
- `grep -rn "child_process|execSync|spawn(" cli/src/core/services/harness-service.js
  cli/src/hooks/`: no matches (R9 — no command-execution surface introduced anywhere).
- `aief status` (whole project) diffed before/after this Change's full code diff (via `git
  stash`): no difference.
- Manual walkthrough (`/tmp/.../harness-demo`):
  - `doctor` (default): no "Harness:" line. `doctor --verbose`: both registered Hooks listed with
    their firing event.
  - A Change with `harness.hooks."prompt.prepared".disabled: ["prompt-skill-suggestion"]`:
    `status --change` showed `prompt.prepared: 0 active, 1 disabled (prompt-skill-suggestion)`;
    `aief prompt` produced zero matches for that Hook.
  - `harness.log: true`: `aief prompt` created `hooks.md` with a header and one dated section
    (empty table — the only registered Hook for that event was disabled, itself a correct,
    honest outcome); `aief verify` appended a second section with a real `matched` row
    (`post-verify-next-action`) and `Change: ... — PASS`.
  - Unknown event key (`"some.unknown.event"`): `status --change` printed
    `Manifest: invalid` / `harness.hooks.some.unknown.event: is not a known Harness event —
    known: prompt.prepared, verify.completed`, exit 1 — the existing, unmodified manifest-error
    mechanism.
  - Unknown Hook id in a known event's `disabled` list: `status --change` printed
    `Unknown Hook id(s) in manifest.harness (never disabled anything real): - "totally-made-up-hook"
    (prompt.prepared)`, and `prompt.prepared: 1 active` confirmed the real Hook was NOT disabled.

## Findings

1. **A pre-existing Change 0055 test's slicing assumption broke, not a regression.**
   `"doctor/prompt: combining a built-in, an override and a project-only standard resolves
   deterministically..."` sliced `doctorOut` from `"Standards:"` to the end of the string, which
   silently assumed nothing would ever be printed after the Standards section. Adding the new
   Harness section after it broke that assumption (the test started matching Hook ids as if they
   were Standard ids). Fixed by bounding the slice to `"Harness:"`'s own start index — the test's
   actual intent (Standards-section ordering) is unchanged and still verified.
2. **`renderHookResults()` was relocated, not kept in `cli.js`, per the commissioning instruction's
   own separation requirement.** The original plan (see `spec.md` R7's inline refinement note)
   sketched extending `cli.js`'s existing `renderHookResults()` in place. Doing so would have left
   the new failed/invalid-rendering logic untestable except by spawning the CLI — and neither
   shipped Hook can be forced to fail through project fixture data alone. Extracting it to
   `harness-service.js` as `formatHookResultsBlock()`/`describeFailingHooks()` (pure functions)
   let `harness-service.test.js` prove the failed/invalid rendering directly with a synthetic
   fixture result, the same precedent `hook-service.test.js` already established for testing Hook
   behavior without a real failing Hook.
3. **My own test-count comments were initially wrong** (14 vs. the actual 12 new `cli.test.js`
   tests, 12 vs. the actual 10 new `change-manifest.test.js` tests) — corrected in `tasks.md`
   against `git diff --stat`'s actual count before closing, rather than left as an approximate,
   unverified claim.

## Risks

- `hooks.md` accumulates without bound across many `prompt`/`verify` invocations on a long-lived
  Change with `harness.log: true` — no rotation/truncation is implemented (out of scope; the same
  unbounded-append discipline `evidence.md` already uses, and a real concern only for a Change left
  open unusually long).
- `describeHarnessRegistry()` is called freshly on every `doctor --verbose`/`status --change`
  invocation (no caching) — negligible cost at today's two-Hook registry size; would need revisiting
  only if the registry grew by orders of magnitude, with no evidence that will happen (ADR-008).

## Recommendations

Next candidate Change (not started here): wire the SDD Provider/Skills/Standards resolvers'
existing `--verbose` precedent for consistency into a `--json` mode if a real machine-readable
consumer for `doctor`/`status` output is ever evidenced — no such consumer exists today, so this
remains explicitly deferred (per this Change's own "Out of scope" and ADR-026's alternatives).

## Artifacts Produced

- `cli/src/core/domain/change-manifest.js`, `cli/src/cli.js` (modified).
- `cli/src/core/services/harness-service.js` (new).
- `cli/tests/change-manifest.test.js`, `cli/tests/cli.test.js` (modified).
- `cli/tests/harness-service.test.js` (new).
- `cli/package.json` (test script entry).
- `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`, `docs/configuration.md`,
  `docs/cli.md` (modified).
- `knowledge/decisions.md` (ADR-026 added).
- `changes/0056-harness-hooks-visibility/` (this Change).

## Lessons Learned

- Reading the *actual* Hook Runtime (ADR-020) in full before designing anything caught, early,
  that the commissioning brief's illustrative examples (four `before*`/`after*` lifecycle names, a
  `Hooks: N configured, M passed` status line, "qué comando... dispara cada Hook") described a
  system that doesn't exist and, per ADR-020, was deliberately not built that way. Adapting intent
  to reality — rather than building the illustrative example literally — avoided creating the
  "segundo sistema paralelo" the instructions explicitly warned against.
- Extracting rendering logic into pure, service-layer functions specifically to make a
  hard-to-reach case (a failing Hook) unit-testable turned out to matter in practice, not just in
  principle: it was the only way to actually deliver the "failed Hook is visible, no stack trace"
  acceptance criterion with real proof rather than an assumption.

## Next Change

Not started here, and not requested — see change.md "Out of scope" (Loop, `status --graph`,
isolated worktree) for what AIEF 3.1's Harness work still has ahead of it.
