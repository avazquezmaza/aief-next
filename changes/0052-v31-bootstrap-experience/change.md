# Change

## ID

`0052-v31-bootstrap-experience`

## Type

General

## Objective

First delivery of **AIEF 3.1**: a single, guided `aief bootstrap` command that replaces `init` and
`adopt` as the public onboarding entry point. It auto-detects what it can, asks only what it must,
configures the SDD Provider and the LIDR-specboot structure, and ends with a friendly, honest
summary of what was created and what to do next.

This Change is authorized to touch new-command surface, onboarding and documentation — normally
frozen by ADR-015 — under the explicit, scoped thaw recorded in
[ADR-022](../../knowledge/decisions.md#adr-022-adr-015s-freeze-is-explicitly-thawed-for-aief-31-by-the-project-owners-direct-decision--not-by-change-0042s-consolidation).

## Scope

### In scope

- New command `aief bootstrap` (auto-detect, minimal questions, SDD Provider setup, LIDR-specboot
  scaffolding, friendly closing message with next steps).
- Merge `init` and `adopt`'s logic into `bootstrap`'s internals; remove `init`/`adopt` as public
  commands (ADR-013: bootstrap replaces them, it does not sit beside them).
- Update `templates/specboot` so the structure `bootstrap` writes matches current LIDR-specboot
  conventions.
- Update `docs/getting-started.md`, `docs/cli.md`, `README.md`, and any doc that instructs
  `aief init` / `aief adopt` directly, to the new `bootstrap` flow.
- Update the CLI test suite for the removed/merged commands.

### Out of scope (later AIEF 3.1 Changes)

- Harness/Hooks visibility improvements, Loop (verify/retry/feedback) strengthening.
- `manifest.json` extension and `aief status --graph`.
- `aief doctor` improvements, isolated worktree support.
- Stack detection → profile/skill suggestion improvements.
- `aief status --next` smarter recommendations.
- `docs/workflow.md`, `docs/concepts.md`, `docs/examples.md` rewrites.

## Status

Closed (2026-07-30)
