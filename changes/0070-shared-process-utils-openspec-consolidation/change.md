# Change

## ID

`0070-shared-process-utils-openspec-consolidation`

## Type

General

## Objective

ADR-017 (Change 0045) recorded a deliberate, bounded duplication as a known obligation for a later
Change: `cli/src/sdd-providers/openspec.js` carries its own private `run()`/`commandExists()`
(binary-detection, shell-spawning helpers) instead of importing `cli.js`'s existing, identical
pair — the commissioning instruction for Change 0045 explicitly forbade touching `cli.js` at all in
that Entrega, so the provider got its own copy instead. This Change is the one ADR-017 named:
extract the shared, generic implementation into one module both files import, removing the literal
duplication, with zero behavior change to `propose()`, `doctor`, `bootstrap`, or any provider.

## Scope note: what this Change is *not*

ADR-017's text also anticipates a bigger step — routing `propose()`'s actual OpenSpec delegation
through the SDD Provider boundary itself (`callCapability()`), not just sharing a helper. That step
is **not done here**: `sdd-providers/openspec.js`'s own `CAPABILITIES.create` is `false` and
`createChange()` is "declared, not implemented" — the provider structurally cannot delegate a
`propose` call today. Making it able to would mean deciding what a `create` capability's contract
looks like, which is a real capability-model decision (the kind ADR-019/020/021 each gave its own
ADR for Skills/Hooks/Verification Rules) — not something to fold silently into a helper-deduplication
Change. This Change closes the small, unambiguous, zero-risk half of ADR-017's obligation; the
capability-model question is left for a separate, explicitly-scoped Change if the project wants it
(see "Next Change" in this Change's evidence once closed).

## Scope

### In scope

- New `cli/src/process-utils.js` exporting `run(command, args, options)` and `commandExists(command)`
  — the shared, generic implementation (win32 `shell`/`where` handling identical to both existing
  copies; `stdout`/`stderr` always coalesced to strings, matching `openspec.js`'s slightly more
  defensive existing shape, which every current caller already tolerates).
- `cli.js` imports these from the new module instead of defining its own; its private copies are
  removed.
- `sdd-providers/openspec.js` imports these from the new module instead of its own private copies;
  its local `run()`/`commandExists()` are removed, and the file's own comment documenting the
  duplication (quoted in this Change's Objective) is updated to record that it is now resolved.

### Out of scope

- `propose()`'s own behavior, output, or delegation logic — untouched, byte-identical.
- `sdd-providers/openspec.js`'s `CAPABILITIES.create`/`createChange()` — still `false`/unimplemented.
  No new capability is added to the provider model.
- `sdd-providers/local.js` — file-based, has no binary-detection code to consolidate.
- Any other `run()`/`commandExists()`-shaped code elsewhere in the codebase (e.g. graph-engine
  detection) — out of scope; ADR-017 named OpenSpec specifically.

## Success Criteria

- `cli/src/sdd-providers/openspec.js` no longer defines its own `run()`/`commandExists()`.
- `aief propose`, `aief doctor`, `aief bootstrap` and every OpenSpec-provider test produce
  byte-identical output to before this Change.
- No existing test breaks; the duplication the code comment names is verifiably gone (`grep` for a
  second `function run(` definition finds none).

## Status

Closed (2026-08-08)
