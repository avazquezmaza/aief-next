# Tasks

## Implementation

- [x] `cli/src/core/domain/ai-specs.js`: derive `because`'s path suffix from the resource's real
      discovered `path` (its basename), not a hardcoded `${id}.md`.
- [x] `cli/src/core/domain/definition-enrichment.js`: item-marker scan accepts `-`, `*`, `+`
      bullets (`/^[-*+]/`), matching `change.js`'s `countOpenTasks()`.
- [x] `README.md`: `## Status` now says "AIEF 3.3" (was "AIEF 3.2").

## Documentation

- [x] Inline comments at each fix site explain the gap found and why the change is correct for
      both the old and new cases.

## Verification

- [x] Added regression tests: a folder skill's `because` (`cli/tests/ai-specs.test.js`); `*`/`+`
      bullet markers for `(decision required)`/`(human)` (`cli/tests/definition-enrichment.test.js`).
- [x] `npm test` (repo root) — 1012/1012 passing.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] Confirmed the pre-existing flat-skill `because` test and `-`-bullet marker tests are
      unaffected (byte-identical output for those cases).

## Evidence

- [x] Update evidence.md
