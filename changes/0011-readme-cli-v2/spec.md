# Specification

## Goal

Make AIEF easier to understand and easier to operate from the command line.

## Requirements

- README must clearly explain AIEF as orchestration for AI-assisted engineering.
- README must link to Navigator, CLI, examples, OpenSpec and Specboot.
- CLI must include `doctor`.
- CLI must include `status`.
- CLI must include `propose`.
- `propose` must attempt OpenSpec delegation when available.
- `propose` must fall back to local AIEF Change creation.
- `verify` must inspect Change folders.
- CLI docs must be updated.

## Acceptance Criteria

- [ ] README is replaced.
- [ ] `aief doctor` works.
- [ ] `aief status` works.
- [ ] `aief propose "..."` works with fallback.
- [ ] `aief verify` checks Changes.
- [ ] CLI documentation is updated.
