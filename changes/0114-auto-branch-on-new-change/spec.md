# Specification

## Goal

`createChange()` (the shared scaffolding function behind `new-change`/`analyze`/`propose`) never
writes a Change's files while the working tree is still on a protected branch.

## Requirements

- New module `cli/src/core/services/git-branch.js`:
  - `currentBranch(cwd)` — `git rev-parse --abbrev-ref HEAD`, `null` if not a git repo.
  - `changeBranchName(type, id, slug)` — `<type>/<id>-<slug>`, sanitized to a git-safe branch
    segment.
  - `ensureChangeBranch(id, slug, type, options)` — no-op outside a git repo, no-op when the
    current branch isn't `main`/`dev`, no-op when `options.skip` is set; otherwise
    `git checkout -b <name>` and log it.
- `process-utils.js`'s `run()` forwards `options.cwd` to `spawnSync` (needed so tests can target a
  temp repo without `process.chdir()`); every existing caller keeps working unchanged since none of
  them pass `cwd` today.
- `createChange()` calls `ensureChangeBranch()` before writing any file, so a failed checkout never
  leaves scaffolding on the protected branch.
- `new-change`'s `KNOWN_FLAGS` gains `--no-branch` (boolean), threaded through to
  `createChange({ noBranch })`.
- `AGENTS.md`, `docs/maintainer.md`, and `.kiro/skills/aief-change/SKILL.md` document the behavior
  once, at the point every assistant already reads.

## Acceptance Criteria

- [ ] `new-change` on `main` creates and switches to `<type>/<id>-<slug>`.
- [ ] `new-change` on `dev` does the same (protected isn't just `main`).
- [ ] `new-change` on an existing feature branch is a no-op.
- [ ] `new-change --no-branch` is a no-op even on `main`.
- [ ] `new-change` outside a git repo does not crash and still scaffolds the Change.
- [ ] `analyze` also switches branch (proves the behavior is shared via `createChange()`, not
      duplicated per command).
- [ ] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
- [ ] Evidence updated with what was actually run and verified.
