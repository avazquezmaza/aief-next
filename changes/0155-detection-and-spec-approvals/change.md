# Change

## ID

`0155-detection-and-spec-approvals`

## Type

Fix

## Objective

Fix the two wave-1 bugs from Analysis 0154:

- **B3**: project detection walks into nested repositories. A project containing a cloned
  repository (for example `~/PRS/THINGS/kiro/I5` with `ECC/` inside) is detected by the clone's
  files and gets the wrong Skill.
- **B4**: `(human)` and `(review)` lines in `spec.md`'s Acceptance Criteria are not enforced.
  `close` and `verify --strict` read approval lines only from `tasks.md`, so an unchecked
  approval criterion in `spec.md` does not stop a Change from closing. Change 0154 itself closed
  that way before the owner checked it.

## Scope

### In scope

- B3: `walkProject()` in `cli/src/detect.js` skips any subdirectory that contains its own `.git`
  (a directory, or a file as in submodules and worktrees). The project root is still walked.
- B4: approval lines (`(human)`, `(review)`) under `spec.md`'s `## Acceptance Criteria` count like
  approval lines in `tasks.md`:
  - `close` refuses while one is unchecked or marked `[-]`, and lists checked ones under
    "Approvals relied on".
  - `verify --strict` reports them as errors on open Changes, and as notices on closed Changes, so
    history does not start failing (precedent: Change 0150).
- Ordinary, unlabeled Acceptance Criteria stay informational. 97 of 210 closed Changes across the
  local projects and this repository leave some unchecked, so enforcing them would contradict
  actual practice.
- Tests and the docs that describe where approval labels live.

### Out of scope

- `(gate:<id>)` lines in `spec.md` (tracks are slated for removal in 0154's wave 1).
- Other directory walks (`project-maturity.js` reads only root-level source and docs folders).
- Any wave-1 removal.

## Success Criteria

- `aief status` in `~/PRS/THINGS/kiro/I5` no longer reports `docker` from `ECC/`.
- A Change with an unchecked `(human)` Acceptance Criterion in `spec.md` cannot be closed.
- `npm test` and `npm run lint` pass in `cli/`. `verify --strict` passes on this repository.

## Status

Closed (2026-10-04)
