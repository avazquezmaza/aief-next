# Specification

## Goal

`aief verify --strict`, run repo-wide with no `--change` filter, reports zero problems on
already-closed historical Changes whose prose merely discusses the `TODO`/`TBD` detection rule
rather than containing an actual unresolved marker.

## Requirements

- `changes/0083-verify-strict-completeness/change.md`, `spec.md`, `tasks.md`: backtick-quote every
  bare `TODO`/`TBD` occurrence.
- `changes/0086-close-must-not-bypass-an-unresolved-definition-decision/change.md`: same.
- `changes/0087-aief-3-2-0-release-readiness-and-documentation/change.md`: same.
- No other text in these files changes.

## Acceptance Criteria

- [ ] `aief verify --strict` (repo-wide) reports 0 `[strict]` lines for changes/0083, 0086, 0087.
- [ ] `aief verify --strict` (repo-wide) exits with `Result: PASS`.
- [ ] The five edited files' meaning is unchanged — a diff review shows only backticks added around
      `TODO`/`TBD`, nothing else.
- [ ] `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
