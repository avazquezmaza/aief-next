# Tasks

## Implementation

- [x] Widen the `(human)` task regex in `checkStrictCompleteness()`
      (`cli/src/core/services/change-verifier.js`) from `-` only to `[-*+]`.

## Documentation

- [x] None needed — internal verifier behavior, no public-facing doc claimed the old restriction.

## Verification

- [x] `cli/tests/verify-strict.test.js`: `* [ ]`/`+ [ ]` (human) tasks are flagged; `* [x]`/`+ [x]`
      are not.
- [x] `npm test` (full suite).
- [x] `node cli/bin/aief.js verify --strict`.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md.
