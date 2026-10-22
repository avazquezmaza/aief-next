# Specification

## Goal

`aief new-change` (and every command that allocates a Change ID) does not reuse a number already
taken in another worktree or by an AIEF branch known to this repository.

## Requirements

- R1: A read-only helper in `cli/src/core/services/git-branch.js` returns the Change IDs known to
  git: directory names under `changes/` in every worktree other than the current one (from
  `git worktree list --porcelain`), and branch names under `refs/heads` and `refs/remotes` whose
  last two path segments are `<type>/<NNNN>-<slug>` with `<type>` in `CHANGE_TYPES` and `NNNN`
  four or more digits. Outside a git work tree, or if a git command fails, it returns no IDs.
- R2: `nextChangeId()` takes the maximum over the local `changes/` IDs and R1's IDs, plus one,
  zero-padded to four digits as today.
- R3: No git command writes, fetches or touches the network.
- R4: Tests with temporary repositories: another worktree with a higher Change; a local AIEF branch
  with a higher ID; a remote-tracking AIEF branch; a non-AIEF branch with a large number
  (`release/2026-10`) ignored; outside git unchanged.
- R5: `docs/security-model.md` (Known Gaps) and `docs/cli.md` describe what is now prevented and
  what is still only detected.

## Acceptance Criteria

- [x] R1–R5 implemented with tests.
- [ ] `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.
- [ ] (human) Owner reviews the diff before merge.
