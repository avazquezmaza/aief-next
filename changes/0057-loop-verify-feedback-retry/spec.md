# Specification

## Goal

`aief verify --change <id>` becomes attempt-aware, opt-in per Change: each invocation is Feedback
(the same Structural Verification `errors` already computed), each FAIL is either a Retry
opportunity or a Retry-limit-reached final state, and every attempt is recorded in a visible,
append-only `loop.md`. A Change with no `loop` field behaves exactly as before.

## Configuration model

```json
{
  "loop": {
    "verify": {
      "maxRetries": 3
    }
  }
}
```

- `loop` — optional object. Absent (every existing Change) → `configured: false`, zero behavior
  change.
- `loop.verify` — optional object. Its mere presence opts the Change into Loop tracking for
  `aief verify --change <id>`.
- `loop.verify.maxRetries` — optional positive integer, default `3` when `loop.verify` is present
  without it. Any other value (`0`, negative, non-integer, string) is a structural manifest error.

## Non-goals

- **No automatic retry.** "Retry" is reported as *available*; nothing in this Change re-invokes
  `verify`, a Skill, a Hook, or any command. A retry is always the next manual `aief verify`
  invocation by a human or assistant.
- **No automatic code correction.** Loop never edits, generates, or suggests specific code changes
  — Feedback is exactly `report.errors`, the same structural checks `aief verify` already prints.
- **No `aief status --change <id>` section, no `aief close` gating.** Considered and rejected for
  this Entrega: `aief verify`'s own "Loop:" summary and `loop.md` already give complete visibility
  (attempt count, last result, feedback, decision) without a third place to read the same fact —
  adding one would either duplicate it or (if `status` tried to summarize execution the way it
  deliberately avoids for Harness, ADR-026) misrepresent something `status` itself never computed.
  `close()`'s own readiness check is unchanged — Loop tracks attempts, it does not gate anything.
- **No new Hook event, no change to `hook.js`'s closed catalog.** Loop is verify-command
  bookkeeping around the existing `verify.completed` Hook output, not a new lifecycle moment.
- Graph, `status --graph`, `status --next`, profiles, worktrees — untouched.

## Requirements

- **R1 — Structural validation lives in `change-manifest.js`, mirroring `harness`.**
  `validateManifest()` gains `loop`/`loop.verify`/`loop.verify.maxRetries` shape checks —
  `maxRetries` must be a positive integer when present. No dependency on any runtime module.
- **R2 — `loop-service.js` is pure.** `resolveLoopConfig(manifest)`,
  `countPreviousAttempts(logContent)`, `decideLoopOutcome({attempt, maxRetries, passed})`,
  `formatLoopSummary(outcome, changeId)`, `formatLoopLogEntry({timestamp, outcome, feedback})` —
  none read the filesystem; `cli.js` reads `loop.md` (if present) and passes its content in,
  mirroring how `harness-service.js` never touches the filesystem either.
- **R3 — Attempt counting is derived from `loop.md` itself, never from a hidden counter.** The
  current attempt number is `(number of "## Attempt" sections already in loop.md) + 1` — the
  visible file is the only source of truth (no manifest mutation, no `.aief/` state, per ADR-009).
  Deleting or editing `loop.md` changes future attempt numbering accordingly, honestly.
- **R4 — Outcome is a pure decision over three facts.** `passed` → `status: "passed"`. `!passed &&
  attempt < maxRetries` → `"retry_available"`. `!passed && attempt >= maxRetries` →
  `"exhausted"`. Never a fourth state, never inferred from anything but these three inputs.
- **R5 — `aief verify --change <id>` renders the Loop summary and appends to `loop.md` only when
  `loop.verify` is configured.** Printed after the existing report and Hook output (strictly
  additive, same ordering discipline every prior Entrega used) — the report's own `passed`/exit
  code (already decided by `renderReport()`, unmodified) is never touched by Loop.
- **R6 — Whole-project `aief verify` (no `--change`) is unaffected.** Loop is inherently
  Change-scoped (one manifest, one `loop.md`); the whole-project path continues to behave exactly
  as before this Change — no Loop config exists to resolve without a specific Change.
- **R7 — `loop.md` is visible, append-only, and contains only reused structural feedback.** Each
  entry: attempt number, timestamp, PASS/FAIL, `report.errors` (already-computed, already-safe
  strings — same content `aief verify` already prints to the terminal, nothing new derived or
  fetched), and the decision. Never overwritten.
- **R8 — `aief doctor --verbose` shows a conditional, project-wide Loop registry.** Lists every
  open Change whose manifest declares `loop.verify`, with its current attempt/status (derived the
  same way `aief verify` would, read-only — `doctor` never writes `loop.md`). Absent entirely when
  no open Change configures Loop — `doctor`'s default (non-`--verbose`) output is never touched by
  this Change at all.
- **R9 — Determinism.** Same `loop.md` content + same manifest + same report, same outcome, every
  call. No timing dependency beyond the timestamp string itself (informational only, like
  `hooks.md`'s own timestamp).

## Compatibility

- No `loop` field anywhere → `aief verify` (whole-project and `--change`), `aief doctor` (default
  and `--verbose`) are byte-identical to before this Change.
- Harness (Change 0056), LIDR Skills/Standards (0054/0055), Bootstrap (0052): zero diff, zero
  behavior change — none of this Change's files import or are imported by
  `harness-service.js`/`ai-specs.js`/`detect.js`.

## Acceptance Criteria

- [x] A Change with no `loop` field: `aief verify --change <id>` and `aief doctor --verbose`
      byte-identical to the pre-Change baseline; no `loop.md` is ever created.
- [x] A Change with `loop.verify: { maxRetries: 2 }`, failing verification: first `aief verify`
      call reports "attempt 1 of 2", retry available; `loop.md` created with one entry.
- [x] A second `aief verify` call on the same still-failing Change reports "attempt 2 of 2", retry
      limit reached; `loop.md` has two entries, never overwriting the first.
- [x] A Change that starts failing then passes: the passing attempt reports "Loop complete",
      `retryAvailable: false`, `exhausted: false`.
- [x] `loop.verify` present with no `maxRetries` defaults to 3.
- [x] An invalid `maxRetries` (`0`, `-1`, `"three"`, `1.5`) is a structural manifest error, named
      by field.
- [x] `aief doctor --verbose` lists every open Change with `loop.verify` configured and its
      current attempt state; absent entirely when none do; `aief doctor` (default) never shows it.
- [x] Whole-project `aief verify` (no `--change`) is unaffected regardless of any Change's `loop`
      config.
- [x] `loop.md` never contains anything beyond attempt/timestamp/result/`report.errors`/decision —
      no raw command output, no credential-shaped string (there is none to leak — `report.errors`
      is already-printed, already-safe terminal text).
- [x] Full CLI test suite (638 baseline) passes with only additive new tests; `aief verify`
      passes; `git diff --check` is clean.
