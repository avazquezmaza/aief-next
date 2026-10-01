# Specification

## Goal

`changes/` stays the complete, unedited history, but a newcomer can see in one page which Changes
are current and which are historical. History docs no longer contradict accepted ADRs.

## Requirements

### R1: Changes index

- New file `changes/README.md`. Groups every Change by the release that shipped it, using the
  version-bump Changes as boundaries:
  - 0001–0042: pre-Core 3.0 (AIEF 1.x, validation, the 2.0 redesign study).
  - 0043–0051: AIEF Core 3.0.
  - 0052–0062: 3.1.0 · 0063–0088: 3.2.0 · 0089–0103: 3.3.0 · 0104–0147: 3.4.0.
  - 0148 onward: unreleased.
- Each era lists its Changes as relative links to their directories, one line each.
- States the rules: Changes are never moved or edited after close; the index does not replace
  `aief status`; `knowledge/decisions.md` is the authoritative decision log.
- Names the one ID shared by two Changes (0122) and says to use the full basename.
- Must not change CLI output: `getChangeDirs()` and `nextChangeId()` ignore non-directory,
  non-numeric entries — verified by `aief status` / `aief verify` before and after.

### R2: History README accuracy

- `docs/history/README.md` no longer says the AIEF 2.0 study is "frozen by ADR-015" or "never
  accepted" without the ADR-032 thaw and the Change 0037 close date.
- Links `changes/README.md` from "Browsing further back".

### R3: CHANGELOG closing note

- The note no longer says the project is "currently in roadmap Phase 2".
- Points to `releases/` (per-version notes) and `changes/README.md`.
- Historical entries are untouched.

### R4: Local cleanup (untracked only)

- Delete `changes/0096-run-usability-validation-study/fixtures/*/node_modules/`,
  `changes/0121-assistant-parity-and-audit-hardening/__pycache__/`, and `.codex/` (empty).
- Precondition: each path is gitignored or untracked (`git status --ignored`); `git status`
  shows no tracked deletion afterwards.

## Acceptance Criteria

- [x] R1: `changes/README.md` lists all 152 Change directories in seven release eras;
      all links resolve.
- [x] R1: `aief status` change count and `nextChangeId` unchanged by the index file.
- [x] R2/R3: no broken relative links in the edited files.
- [x] R4: working copy of `changes/` drops from ~156 MB to < 10 MB; no tracked file deleted.
- [x] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` pass.
- [x] No tracked file modified outside the R1–R3 files and this Change.
