# Specification

## Goal

Ensure all active repository README files accurately reflect the current project prerequisites (Node >= 22) and CLI command surface (`aief bootstrap` instead of obsolete `aief adopt`).

## Requirements

- Root `README.md` must state Node.js >= 22 under Quick start.
- `cli/README.md` must document `aief bootstrap` instead of `aief adopt` in the workflow walkthrough, command groups, and explanatory prose.

## Acceptance Criteria

- [ ] `README.md` specifies Node.js >= 22.
- [ ] `cli/README.md` specifies `aief bootstrap` and contains no references to `aief adopt`.
- [ ] Verification suite and lint pass with zero errors.
- [ ] Evidence updated.
