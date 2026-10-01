# Change

## ID

`0152-repo-cleanup-and-history-index`

## Type

General

## Objective

Make the repository easier to navigate without moving, deleting or rewriting any Change: add an
era index to `changes/`, fix the history docs that drifted after ADR-032, and record known
history gaps instead of papering over them. Remove local, gitignored build artifacts that bloat
the working copy.

## Scope

### In scope

- `changes/README.md`: an index of all Changes grouped by era, pointing to what is current.
- `docs/history/README.md`: correct the AIEF 2.0 study status (thawed by ADR-032, Change 0037
  closed 2026-09-01) and link the new index.
- `CHANGELOG.md`: replace the stale closing note ("roadmap Phase 2") with a pointer to
  `releases/` and `changes/`.
- `evidence.md`: record known gaps (missing release notes v1.0.0→v3.3.0, Change ID 0122 shared
  by two Changes, 41 broken links inside Changes < 0100 kept as unedited history).
- Local only (owner-authorized 2026-10-01): delete gitignored `node_modules/` under
  `changes/0096-*/fixtures/`, `changes/0121-*/__pycache__/`, and the empty `.codex/` directory.

### Out of scope

- Moving, renaming or deleting any Change directory (ADR-014/ADR-032 consensus process; ~400
  cross-references; `docs/history/README.md` promises an unedited `changes/`).
- Editing the content of any closed Change, including its broken historical links.
- Merging or removing the root assistant adapters (`CLAUDE.md`, `CODEX.md`, `GEMINI.md`,
  `CURSOR.md`): each assistant loads its own file name; they do not duplicate `AGENTS.md`.
- Writing missing release notes (content would be invented, not recovered).
- Any CLI behavior, test, template or example change.

## Success Criteria

- A reader can find the current Changes and the era boundaries from `changes/README.md`.
- No canonical doc states that the AIEF 2.0 study is still frozen.
- `npm test`, `aief verify` and `git diff --check` pass; no tracked file outside this Change,
  `changes/README.md`, `docs/history/README.md` and `CHANGELOG.md` is modified.

## Status

Closed (2026-10-01)
