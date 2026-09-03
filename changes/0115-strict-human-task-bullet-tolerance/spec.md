# Specification

## Goal

`checkStrictCompleteness()` detects an unresolved `(human)` task in `tasks.md` regardless of which
CommonMark bullet marker (`-`, `*`, `+`) it's written with.

## Requirements

- `cli/src/core/services/change-verifier.js`: change the line-match regex from
  `/^\s*-\s*\[\s\]\s*\(human\)\s*(.+)$/i` to `/^\s*[-*+]\s*\[\s\]\s*\(human\)\s*(.+)$/i`.
- No other behavior change: checked-box (`[x]`) tasks remain resolved regardless of bullet marker
  (already true — the existing regex only matches the empty-box case).

## Acceptance Criteria

- [ ] `- [ ] (human) Decide X` is flagged by `verify --strict` (already true — regression check).
- [ ] `* [ ] (human) Decide X` is flagged by `verify --strict` (currently silently missed — the bug).
- [ ] `+ [ ] (human) Decide X` is flagged by `verify --strict` (currently silently missed — the bug).
- [ ] `- [x] (human) Decide X` (checked) is not flagged, for all three markers.
- [ ] `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
