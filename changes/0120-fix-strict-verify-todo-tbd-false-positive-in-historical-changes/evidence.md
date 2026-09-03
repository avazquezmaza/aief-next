# Evidence

## Summary

`aief verify --strict`, run repo-wide, now passes with zero problems. It previously failed on three
already-closed historical Changes (0083, 0086, 0087) whose own prose discusses
`checkStrictCompleteness()`'s `TODO`/`TBD` detection rule using the bare words `TODO`/`TBD` — a
false positive, not a real unresolved marker, found while auditing the repo after the Changes
0114–0119 backlog.

## Activities Performed

- Backtick-quoted every bare `TODO`/`TBD` occurrence in:
  - `changes/0083-verify-strict-completeness/change.md`, `spec.md`, `tasks.md` (7 occurrences).
  - `changes/0086-close-must-not-bypass-an-unresolved-definition-decision/change.md` (1).
  - `changes/0087-aief-3-2-0-release-readiness-and-documentation/change.md` (1).
- No other text in any of these five files changed — pure quoting, meaning unchanged.

## Verification

- `node cli/bin/aief.js verify --strict` (repo-wide, no `--change` filter): `Result: PASS`, 0
  `[strict]` lines (previously 5, across changes/0083 x3, 0086 x1, 0087 x1).
- `npm test`: 1043/1043 pass — unaffected, as expected (no code touched).
- `git diff --check`: no whitespace errors.

## Findings

None beyond the pre-existing false positive this Change fixes.

## Risks

None — text-only edits to historical, already-closed Changes' documentation of their own past
work; no application code, no currently-open Change's content, touched.

## Recommendations

None.

## Artifacts Produced

- Diff to `changes/0083-verify-strict-completeness/{change,spec,tasks}.md`.
- Diff to `changes/0086-close-must-not-bypass-an-unresolved-definition-decision/change.md`.
- Diff to `changes/0087-aief-3-2-0-release-readiness-and-documentation/change.md`.

## Lessons Learned

A detection rule that excludes backtick-quoted instances of the word it looks for is only as good
as the discipline of quoting every mention — including in the rule's own retrospective
documentation. `stripInlineCode()`'s exclusion worked exactly as designed; the gap was in the prose,
not the checker.

## Next Change

None queued.
