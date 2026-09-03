# Tasks

## Implementation

- [x] Add `cli/src/core/services/git-branch.js` (`currentBranch`, `changeBranchName`,
      `ensureChangeBranch`).
- [x] Forward `cwd` through `process-utils.js`'s `run()`.
- [x] Wire `ensureChangeBranch()` into `createChange()` in `commands/shared.js`, before any file
      write.
- [x] Add `--no-branch` to `new-change`'s `KNOWN_FLAGS` and thread it through `new-change.js`.

## Documentation

- [x] `AGENTS.md` — "Working with Changes" note.
- [x] `docs/maintainer.md` — "Contributing a Change" note, including the `enrich` gap.
- [x] `.kiro/skills/aief-change/SKILL.md` — note under "When something doesn't fit".

## Verification

- [x] `cli/tests/git-branch.test.js`: main→branch, dev→branch, existing branch untouched,
      `--no-branch`, no-git no-op, `analyze` shares the behavior.
- [x] `npm test` (full suite).
- [x] `node cli/bin/aief.js verify`.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md.
