# Change

## ID

`0169-worktree-aware-change-id-allocation`

## Type

Feature

## Objective

Prevent, locally, two Changes from getting the same numeric ID. `nextChangeId()` reads only the
current checkout's `changes/`, so a Change scaffolded in another worktree, or on another branch not
yet merged, can take the same number (0122 collided twice; Change 0135 only detects it). Feasibility
assessment initiative I4: the one item with an observed failure behind it.

## Scope

### In scope

- `nextChangeId()` returns one more than the highest ID found in: this checkout's `changes/`, the
  `changes/` of every other worktree of the same repository, and local or already-fetched
  remote-tracking branch names that AIEF itself creates (`<type>/<NNNN>-<slug>`, `<type>` in the
  closed Change-type list).
- Read-only git commands (`git worktree list --porcelain`, `git for-each-ref`); no network, no
  fetch; outside a git repository, behavior unchanged.
- Applies to every caller (`new-change`, `analyze`, `propose`, `enrich`, `bootstrap`).
- Tests; `docs/security-model.md` Known Gap updated; `docs/cli.md` note.

### Out of scope

- Collisions between separate clones whose branches were never fetched (still detected by
  Changes 0135/0137, not prevented).
- Creating or managing worktrees (assessment: harnesses do that).
- Branch names not created by AIEF (e.g. `feat/0170-x`, `release/2026-10`) — ignored on purpose.
- Renumbering existing Changes.

## Success Criteria

- With a Change in another worktree, or an AIEF branch for a higher ID, `new-change` picks the next
  free number.
- Outside git, and in a repo with no other worktrees or branches, IDs are as before.
- `npm test`, `npm run lint`, `git diff --check`, `aief verify --strict` pass.
