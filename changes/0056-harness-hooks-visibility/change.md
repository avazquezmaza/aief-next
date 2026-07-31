# Change

## ID

`0056-harness-hooks-visibility`

## Type

General

## Objective

Make AIEF's existing Hook Runtime (`cli/src/hooks/`, ADR-020, Change 0048) visible and
diagnosable, and let a Change opt into disabling specific Hooks and recording a visible execution
log — without introducing a second Hook system, without letting Hooks execute shell commands, and
without giving Hooks any new authority over an exit code (ADR-020's core guarantee is preserved,
not superseded).

## Inventory of what already exists (read before designing)

- **Hook Runtime** (`cli/src/core/domain/hook.js`, `cli/src/hooks/index.js`,
  `cli/src/core/services/hook-service.js`, `hook-context.js`) — a closed, two-event catalog
  (`prompt.prepared`, `verify.completed`), statically-registered Hook modules (today:
  `prompt-skill-suggestion`, `post-verify-next-action`), evaluated by `evaluateEvent()` on every
  `aief prompt`/`aief verify --change <id>` call, already unconditional and already unconfigurable.
  A Hook never executes a command, never writes a file, never blocks, never changes an exit code —
  structurally, not by convention (`FORBIDDEN_CAPABILITIES`).
- **Rendering today**: `renderHookResults()` (prompt) and `runVerifyCompletedHooks()` (verify)
  show only `status: "matched"` results with real content — `not_applicable`/`blocked`/
  `unsupported`/`invalid`/`failed` are silently dropped, with no way to see what Hooks exist,
  whether they ran, or why they didn't.
- **`manifest.json`** (`change-manifest.js`, ADR-016) — optional, per-Change, structurally
  validated; `sdd` is the existing precedent for an optional nested object validated for shape
  only, with real availability resolved at a separate runtime layer
  (`sdd-provider-resolver.js`) — not duplicated into the manifest validator.
- **Docs**: `docs/workflow.md`/`docs/concepts.md` currently state, accurately, "no Hook is
  user-facing to configure yet."
- **No existing "Harness" concept, config surface, or execution log** — this Change introduces
  the first one, on top of the existing Hook Runtime, not beside it.

## Problem

A user cannot currently answer, without reading source: which Hooks exist, what event fires each,
whether one is silently not applicable vs. genuinely failing, or what happened the last time
Hooks ran for a Change. Nothing is opt-out per Change either.

## Scope

### In scope

- `manifest.json` optional `harness` field (`log`, `hooks.<event>.disabled`) — structurally
  validated in `change-manifest.js`, mirroring the `sdd` precedent exactly.
- `cli/src/core/services/harness-service.js` (new): resolves a Change's effective Harness config
  against the real Hook Registry, partitions an already-computed `evaluateEvent()` outcome into
  active/disabled results — reuses `hook-service.js`/`hooks/index.js` unmodified.
- `aief doctor --verbose`: new "Harness:" section — the static, project-wide Hook Registry
  (id, event, capabilities). Absent from default `doctor` output (no existing section to extend
  compatibly, same reasoning Change 0055 used for Standards).
- `aief status --change <id>`: new "Harness:" section, present only when that Change's manifest
  declares `harness` — configuration summary (log on/off, disabled Hooks per event, unknown-id
  warnings), never fabricated execution counts (status never fires Hooks).
- `aief prompt` / `aief verify --change <id>`: disabled Hooks are excluded from rendering;
  `failed`/`invalid` results become visible (id, event, short summary, pointer to detail) instead
  of silently dropped; `manifest.harness.log === true` appends a visible, append-only
  `<changeDir>/hooks.md` record of every Hook result for the fired event.
- ADR-026, docs (`workflow.md`, `architecture.md`, `concepts.md`, `configuration.md`, `cli.md`).

### Out of scope

- Retry/feedback loops (Loop) — a future Change.
- `status --graph` — a future Change.
- Isolated worktree support — not needed to fix any Harness defect here.
- Any new Hook capability, especially `writeFiles`/`executeCommands`/`network` (still forbidden,
  ADR-020 unmodified) — no shell command execution is introduced anywhere in this Change.
- Blocking/pre-phase Hooks — the catalog stays exactly `prompt.prepared`/`verify.completed`,
  both `post`.
- `bootstrap`, `analyze`, LIDR Skills/Standards (Changes 0053–0055) — untouched.

## Status

Closed (2026-07-30)
