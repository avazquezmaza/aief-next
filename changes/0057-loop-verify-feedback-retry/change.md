# Change

## ID

`0057-loop-verify-feedback-retry`

## Type

General

## Objective

Implement AIEF's Loop for `aief verify`: **Verify → Feedback → Retry (if applicable) → Final
result** — a simple, visible, deterministic, opt-in attempt-tracking layer over the existing,
unmodified verify pipeline. No auto-retry execution, no auto-fix, no new blocking authority.

## Inventory of what already exists (read before designing)

- **`aief verify --change <id>`** (`change-verifier.js`'s `verifyChange()`) already produces a
  `VerificationReport` (`{ lines, errors, warnings, passed, next }`) — `report.errors` is already
  exactly "what failed," ready to reuse as Loop's Feedback content without recomputing anything.
- **Harness** (Change 0056, ADR-026) already established the exact pattern this Change reuses:
  an optional `manifest.json` field, structural validation in `change-manifest.js` mirroring the
  `sdd` precedent, a pure service module (`harness-service.js`), a visible append-only per-Change
  Markdown log (`hooks.md`) written only by the calling command, and a conditional `doctor
  --verbose`/`status` presence. Loop's `loop.md` mirrors `hooks.md` directly.
- **Hook Runtime** (ADR-020) fires `verify.completed` and already renders a non-blocking
  recommendation after PASS/FAIL is decided — Loop does not add a new event; it is verify-command
  bookkeeping, not a Hook.
- **`close()`** never reads `manifest.json` for its own write-verification (Change 0043 finding
  B1) and is not touched here — Loop does not gate closing.
- No existing "Loop," "retry," or "attempt" concept anywhere in the codebase.

## Scope

### In scope

- `manifest.json` optional `loop.verify.maxRetries` field — structurally validated in
  `change-manifest.js`, mirroring `harness`.
- `cli/src/core/services/loop-service.js` (new): pure config resolution, attempt counting from
  already-read log content, retry-outcome decision, and Markdown formatting — no filesystem access
  of its own, mirroring `harness-service.js`'s split between pure logic and `cli.js`'s own I/O.
- `aief verify --change <id>`: when the Change's manifest declares `loop.verify`, prints a "Loop:"
  summary (attempt N of M, PASS/FAIL, retry availability) after the existing report and Hook
  output, and appends one dated entry to `<changeDir>/loop.md` (attempt, result, feedback — reused
  from `report.errors` — decision). Whole-project `aief verify` (no `--change`) is untouched —
  Loop is inherently Change-scoped, same split Harness already uses.
- `aief doctor --verbose`: a conditional "Loop:" section listing every open Change with
  `loop.verify` configured and its current attempt state — absent when no Change configures it.
- ADR-027, docs (`workflow.md`, `architecture.md`, `concepts.md`, `configuration.md`, `cli.md`).

### Out of scope (explicit, per commissioning instruction)

- Graph, `status --graph`, `status --next` changes, profiles, isolated worktrees.
- Automatic retry execution — "retry" always means the human/assistant runs `aief verify` again;
  nothing in this Change re-invokes verify, a Skill, an assistant, or any command automatically.
- Automatic code correction of any kind.
- `aief status --change <id>` Loop section, `aief close` gating on Loop state — not requested,
  not needed to satisfy the objective; `aief verify`'s own output and `loop.md` already provide
  full visibility (see spec.md "Non-goals" for the explicit reasoning).
- Any change to `hook.js`'s event catalog, `hook-service.js`, `harness-service.js`, or
  `change-verifier.js`'s report computation.

## Status

Closed (2026-07-30)
