# Specification

## Goal

Detection describes the project itself, not repositories nested inside it. An approval written in
`spec.md` is enforced the same way as one written in `tasks.md`.

## Requirements

### R1: Nested repositories are not walked (B3)

- A subdirectory containing `.git` (directory or file) is skipped by `walkProject()`, along with
  everything below it.
- The root directory is walked even though it contains `.git`.

### R2: Approval lines in spec.md are enforced at close (B4)

- Lines labeled `(human)` or `(review)` under `## Acceptance Criteria` in `spec.md` are parsed with
  the same rules as `tasks.md` approval lines (bullets `-`, `*`, `+`; marks `[ ]`, `[x]`, `[-]`).
- `checkChangeReadiness()` reports each unchecked one and each `[-]` one, naming `spec.md`.
- `close` lists checked ones under "Approvals relied on".

### R3: verify --strict (B4)

- On an open Change, each unchecked or `[-]` approval in `spec.md` is a `[strict]` error.
- On a closed Change, the same condition is a `[strict]` notice, not an error.

### R4: Unlabeled criteria unchanged

- Unchecked Acceptance Criteria without a label do not block `close` or fail `--strict`.

### R5: Documentation

- Docs that say approval labels live in `tasks.md` also mention `spec.md` Acceptance Criteria.

## Acceptance Criteria

- [x] R1: Nested repositories skipped, root still walked (tests).
- [x] R2: close refuses on unchecked or `[-]` spec approvals and lists checked ones (tests).
- [x] R3: strict errors on open Changes, notices on closed (tests).
- [x] R4: Unlabeled criteria unchanged (test).
- [x] R5: Docs updated.
- [x] (review) Independent review of the fix.
