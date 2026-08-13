# Tasks

## Implementation

- [x] Broaden `countOpenTasks()`'s regex bullet-character class from `-` only to `[-*+]`.

## Documentation

- [x] None expected — no doc currently claims hyphen-only support as a restriction to update.

## Verification

- [x] Add regression tests to `cli/tests/change-verifier.test.js` for `*`/`+` bullets, checked
      and unchecked, plus an explicit "no change" assertion for the fenced-code-block case.
- [x] `cd cli && node --test tests/change-verifier.test.js` — new + existing cases pass.
- [x] `cd cli && npm test` — full suite still 100% passing.
- [x] `node cli/bin/aief.js verify` from repo root — confirm no unexpected new blocking across
      this repository's own real Changes.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md
