# Specification

## Goal

The existing Hook Runtime becomes inspectable (`doctor --verbose`, `status --change <id>`),
per-Change opt-out-able (`manifest.harness.hooks.<event>.disabled`), and its execution becomes
visibly logged when a Change opts in (`manifest.harness.log`) — with zero behavior change for
every project/Change that declares no `harness` field.

## Non-goals

- Retry/feedback (Loop), `status --graph`, isolated worktree, blocking Hooks, shell command
  execution, new Hook capabilities. See `change.md` "Out of scope".
- `status --change`'s Harness section reports **configuration**, never fabricated **execution**
  counts (e.g. "2 passed, 1 not run") — `status` never fires Hooks, so it cannot honestly report
  a last-run outcome without either lying or parsing `hooks.md` as a second source of truth for
  the same fact two different ways. Per the commissioning brief's own escape hatch ("no agregues
  esta salida si... el estado de ejecución no puede representarse de manera honesta"), execution
  history is reported only via `hooks.md` (a pointer, not a re-derived count) and via `doctor`/
  `prompt`/`verify`'s own real-time output at the moment Hooks actually ran.

## Configuration model

```json
{
  "harness": {
    "log": true,
    "hooks": {
      "prompt.prepared": { "disabled": ["prompt-skill-suggestion"] },
      "verify.completed": { "disabled": [] }
    }
  }
}
```

- `harness` — optional object. Absent (the default for every existing Change) → `configured:
  false`, zero behavior change anywhere.
- `harness.log` — optional boolean, default `false`. `true` opts this Change into the visible
  `hooks.md` execution log (R8).
- `harness.hooks` — optional object keyed by **event id** (not Hook id) — mirrors the closed,
  two-event catalog directly (`prompt.prepared`, `verify.completed`) rather than inventing new
  lifecycle names, since `hook.js`'s `EVENT_CATALOG` is the one already-real, already-wired
  catalog (ADR-020) — adapting the commissioning brief's `beforePrompt`/`afterPrompt`/
  `beforeVerify`/`afterVerify` sketch to what actually exists rather than the other way around.
- `harness.hooks.<event>.disabled` — optional array of Hook id strings. A listed id that is not a
  real, registered Hook is reported as an "unknown Hook id" configuration warning (R4) — never
  silently ignored, never a crash.

## Requirements

- **R1 — Structural validation lives in `change-manifest.js`, mirroring the `sdd` precedent.**
  `validateManifest()` gains `harness`/`harness.log`/`harness.hooks`/`harness.hooks.<event>`/
  `harness.hooks.<event>.disabled` shape checks. Event ids are checked against a small, duplicated
  `HARNESS_EVENT_VALUES` constant (same reasoning as the existing `SDD_PROVIDER_VALUES`
  duplication: `hook.js`'s `EVENT_CATALOG` is documented as closed-by-design, so duplicating it is
  a deliberate, small, rarely-changing decision, not registry coupling). Hook id **existence** is
  never checked here — `change-manifest.js` stays free of any dependency on the Hook Registry,
  exactly as it already stays free of the SDD provider registry.
- **R2 — Runtime resolution lives in a new `harness-service.js`, mirroring
  `sdd-provider-resolver.js`.** `resolveHarnessConfig(manifest)` reads `manifest.harness` (already
  structurally valid by the time any caller has a loaded Change) and cross-references
  `harness.hooks.<event>.disabled`'s ids against the real Hook Registry (`hooks/index.js`) —
  unknown ids are reported, never silently dropped or silently kept.
- **R3 — `hook-service.js`/`hooks/index.js`/`hook.js` are untouched.** Every registered Hook is
  still evaluated for every fired event, unconditionally, exactly as today (ADR-020 unmodified,
  zero diff). Disabling is a post-evaluation filter (`partitionOutcome()`), not a change to what
  gets evaluated — Hooks are pure and side-effect-free, so evaluating a "disabled" one and then
  excluding its result from rendering/logging is harmless and avoids touching the tested,
  ADR-020-governed core.
- **R4 — Unknown Hook ids and unknown events are configuration diagnostics, not crashes.** An
  unknown event key in `harness.hooks` is a structural `validateManifest()` error (R1, same
  treatment as an unknown `sdd.provider`). An unknown Hook id inside a known event's `disabled`
  list is a runtime diagnostic from `resolveHarnessConfig()` (R2) — visible in `status --change`
  output, never thrown.
- **R5 — `aief doctor --verbose` shows the static Hook Registry.** A new "Harness:" section lists
  every registered Hook (id, the event(s) it fires on, title/description, and, in `--verbose`,
  its capability summary) — this section only exists behind `--verbose` (no non-verbose Harness
  content in `doctor` at all this Change), so `aief doctor`'s **default** output is byte-identical
  to before this Change, for every project, regardless of any manifest.
- **R6 — `aief status --change <id>`'s Harness section is conditional.** Present only when that
  Change's `manifest.harness` is declared — absent otherwise, so every existing Change (none of
  which declares `harness`) sees byte-identical `status --change` output. When present: `log`
  on/off, each event's registered/disabled Hook ids, and any unknown-id warnings from R4. A
  structurally invalid `harness` field is caught by the manifest's existing `manifestError` path
  (unchanged mechanism, already exit-1 for any invalid manifest — R1 just adds one more field it
  can flag).
- **R7 — `aief prompt`/`aief verify --change <id>` respect `disabled` and surface failures.** A
  disabled Hook's result is excluded from rendering and from the `hooks.md` log. A Hook whose
  status is `failed` or `invalid` (previously silently dropped) is now rendered: Hook id, event,
  one-line summary/error, and — when `harness.log` is on — a pointer to `hooks.md` for detail.
  Neither exit code nor the command's own PASS/FAIL is ever affected by any Hook result, disabled
  or not (ADR-020's exit-code guarantee is unmodified). (Refined during implementation: the
  rendering logic originally sketched as `cli.js`'s own `renderHookResults()` was instead extracted
  into `harness-service.js` as `formatHookResultsBlock()`/`describeFailingHooks()` — pure,
  independently unit-testable functions, consistent with the commissioning instruction's own
  "mantén separadas... presentación CLI" — `cli.js` now only calls them and prints the result.)
- **R8 — `hooks.md` is a visible, append-only, per-Change Markdown log.** Written only when
  `manifest.harness.log === true` for the Change targeted by `prompt`/`verify --change <id>`.
  Each invocation appends one dated section listing, per Hook evaluated for the fired event: id,
  event, status, a short summary (the Hook's own `summary` field — already capability-filtered,
  never raw command output, never a credential, since Hooks structurally cannot execute a command
  or read a secret store), and, for `verify.completed`, the report's own PASS/FAIL. A disabled
  Hook's result is omitted (R7). Never overwritten — always appended, so history accumulates
  exactly like `evidence.md`'s own append discipline.
- **R9 — No shell command execution anywhere.** No Hook, no Harness config field, and no new code
  in this Change invokes `child_process` or any command string from `manifest.json`. Verified by
  grep as part of closing evidence.
- **R10 — Determinism.** Hook evaluation order is unchanged (`hooksForEvent()`'s existing,
  already-deterministic order); `resolveHarnessConfig()`/`partitionOutcome()` are pure functions
  of their inputs — same manifest, same registry state, same result, every call.

## Compatibility

- No `harness` field anywhere → `aief doctor` (default), `aief prompt`, `aief verify` output is
  byte-identical to before this Change. `aief doctor --verbose` and `aief status --change <id>`
  gain content only because `--verbose` never had a compatibility promise (Change 0054/0055
  precedent) and `status --change`'s new section is itself conditional (R6).
- LIDR Skills/Standards (Changes 0054/0055) and every other command: zero diff, zero behavior
  change — none of this Change's files import or are imported by `ai-specs.js`/`detect.js`.

## Acceptance Criteria

- [x] A Change with no `harness` field: `aief prompt`, `aief verify --change <id>`, `aief doctor`
      (default) byte-identical to the pre-Change baseline. `aief status --change <id>` has no
      "Harness:" section.
- [x] `aief doctor --verbose` lists both registered Hooks with their event(s), regardless of any
      Change's manifest.
- [x] A Change with `harness.hooks."prompt.prepared".disabled: ["prompt-skill-suggestion"]`:
      that Hook's result never appears in `aief prompt`'s output; `aief status --change <id>`
      shows it as disabled.
- [x] A Change with `harness.log: true`: `aief prompt`/`aief verify --change <id>` create/append
      `<changeDir>/hooks.md` with one entry per (non-disabled) evaluated Hook, including
      `not_applicable`/`failed`/`invalid` ones, never just `matched`.
- [x] An unknown event key in `harness.hooks` is a structural manifest error (field-level message,
      existing `manifestError` rendering, existing exit-1 behavior at `status --change`).
- [x] An unknown Hook id inside a known event's `disabled` list is reported as a warning by
      `resolveHarnessConfig()` — visible in `status --change <id>` (`doctor --verbose`'s registry
      view is Change-agnostic and does not read any manifest, so it has no per-Change unknown-id
      warning to show — corrected from the original wording during implementation) — never thrown,
      never silently accepted as if it disabled something real.
- [x] `formatHookResultsBlock()`/`describeFailingHooks()` render a synthetic `status: "failed"`/
      `"invalid"` fixture result correctly (id, event, summary, no stack trace) — proven at the
      unit level (`harness-service.test.js`), the same fixture-based precedent
      `hook-service.test.js` already established for testing Hook behavior without needing a real
      registered Hook to actually fail. End-to-end, a real `matched` Hook's rendering through
      `prompt`/`verify` is confirmed by both the CLI test suite and manual walkthrough; neither
      shipped Hook can be forced to fail via project fixture data alone.
- [x] Multiple registered Hooks resolve and render/log in deterministic order across repeated
      invocations.
- [x] `hooks.md` never contains a raw command output, environment variable, or credential-shaped
      string (verified: only each Hook's own short `summary` field is ever written).
- [x] Full CLI test suite (594 baseline) passes with only additive new tests; `aief verify`
      passes; `git diff --check` is clean.
