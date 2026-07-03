# Change

## ID

`0017-close-cycle-and-guided-ux`

## Type

General

## Objective

Evaluate a third independent review (Gemini) critically and implement only the recommendations that keep AIEF simple, guided and functional: a real close cycle, calmer verify output, README reorganization and unified next-step hints. Explicitly reject the proposed state file.

## Scope

### In scope

- Critical analysis of 5 recommendations (accept 4, reject 1, all with reasons).
- `aief close`: real readiness checks (files, unchecked tasks, placeholder evidence); `--yes` marks the Change Closed via a `## Status` section in `change.md`.
- Active Change derived from files: latest Change not marked Closed (no state file; ADR-009).
- `verify`: in-progress Changes reported calmly (`○ in progress`); warning reserved for closed Changes with incomplete evidence.
- Unified `printNext()` helper replacing all ad-hoc next-step messages.
- README reorganized: OpenSpec/Specboot moved after the core flow.
- Docs, CHANGELOG, tests updated; completed Changes 0013–0016 closed with the new command.

### Out of scope

- `.aief/state.json` or any state outside the Change files (rejected — see ADR-009).
- Interactive prompts (readline); confirmation is the `--yes` flag.
- Renaming Change folders.

## Success Criteria

- `close` refuses to close an incomplete Change and explains what is pending.
- A closed Change stops being the active one; `prompt` moves to the next open Change.
- A fresh `new-change` no longer produces alarming verify output.
- All next-step hints share one function and one format.
- Full test suite passes; `aief verify` passes.

## Status

Closed (2026-07-03)
