# Evidence

## Summary

`nextChangeId()` now also counts Change IDs taken in other worktrees and by AIEF branches, so two
parallel Changes in one clone no longer get the same number (the 0122 collision). Read-only git;
outside git, unchanged.

## Activities Performed

1. **Helper (R1, R3).** `gitKnownChangeIds(projectDir)` in `cli/src/core/services/git-branch.js`:
   - other worktrees from `git worktree list --porcelain`, reading `changes/` at the same path
     relative to the repository root as the project (an AIEF project in a subdirectory works);
   - `git for-each-ref refs/heads refs/remotes`, keeping names whose last two segments are
     `<type>/<NNNN>-<slug>` with `<type>` in `CHANGE_TYPES` — what `ensureChangeBranch()` creates.
   Only `rev-parse`, `worktree list` and `for-each-ref`: no fetch, no writes. `[]` outside a work
   tree or when a command fails.
2. **Allocation (R2).** `nextChangeId()` (`cli/src/commands/shared.js`) takes the max over local
   `changes/` and the helper, +1, padded as before. All callers (`new-change`, `analyze`,
   `propose`, `enrich`, `bootstrap`) inherit it.
3. **Tests (R4).** New `cli/tests/change-id-allocation.test.js` (7): outside git unchanged; plain
   repo unchanged; another worktree's Change not reused; local AIEF branch for a higher ID; an
   already-fetched remote-tracking AIEF branch (`refs/remotes/origin/fix/0011-teammate`); non-AIEF
   branches ignored (`release/2026-10`, `feat/0090-manual`, `bogus/0050-x`, `0040-no-type`);
   project in a subdirectory.
4. **Adjusted existing tests.** Two `git-branch.test.js` tests forced a checkout failure by
   pre-creating `general/0001-add-login` / `enrichment/0001-manual-test-001`. With this Change the
   allocator skips 0001 because that branch holds it, so the checkout no longer failed. They now
   block the checkout with a branch named `general` / `enrichment` (git cannot create `general/...`
   then), which the allocator ignores; their assertions are unchanged.
5. **Docs (R5).** `docs/security-model.md` Known Gap now says collisions are prevented within one
   clone and still only detected across clones that never fetched each other; `docs/cli.md`
   `new-change` row notes the allocation rule.

## Verification

- `node --test tests/change-id-allocation.test.js` → 7 pass; `tests/git-branch.test.js` → 12 pass.
- `npm test` → `tests 788, pass 788, fail 0`. `npm run lint` → clean. `git diff --check` → clean.
  `aief verify` → PASS. `aief verify --change 0169 --strict` → failed only on the open `(human)`
  review; after the owner checked it (PR #122 merged as `ed21870`), on `main`: `--strict` → PASS,
  `npm test` → 788 pass, lint and `git diff --check` clean.
- This repository, on `feature/0169-worktree-aware-change-id-allocation`:
  `gitKnownChangeIds(repo)` → `[169]` (its own branch; merged branches were deleted), so the next
  `new-change` would allocate 0170 either way.

## Findings

- The old checkout-failure tests relied on the very collision this Change prevents.

## Risks

- A stale remote-tracking AIEF branch (deleted on the remote but not pruned locally) can make the
  allocator skip a number. Gaps are harmless; `git fetch --prune` clears them.
- Branches named by hand with legacy prefixes (`feat/`, `refactor/`) are not counted.

## Recommendations

- None.

## Artifacts Produced

- `cli/src/core/services/git-branch.js`, `cli/src/commands/shared.js`
- `cli/tests/change-id-allocation.test.js`, `cli/tests/git-branch.test.js`
- `docs/security-model.md`, `docs/cli.md`

## Lessons Learned

Detecting a problem first (0135) and preventing it later kept both small; the detector stays as the
cross-clone safety net.

## Next Change

None queued; Codex/Cursor guards wait on a real installation (ADR-042).
