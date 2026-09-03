# Tasks

## Implementation

- [x] Backtick-quote bare `TODO`/`TBD` mentions in `changes/0083-verify-strict-completeness/`
      (`change.md`, `spec.md`, `tasks.md`).
- [x] Same in `changes/0086-close-must-not-bypass-an-unresolved-definition-decision/change.md`.
- [x] Same in `changes/0087-aief-3-2-0-release-readiness-and-documentation/change.md`.

## Documentation

- [x] None needed — this fixes the historical Changes' own text, not any current documentation.

## Verification

- [x] `node cli/bin/aief.js verify --strict` (repo-wide, no filter): PASS, 0 `[strict]` lines.
- [x] `npm test` (full suite) — confirms the wording edits didn't touch anything code-adjacent.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md.
