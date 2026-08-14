# Tasks

## Reproduction

- [x] Reproduce the exact reported scenario against unmodified `classifyMaturity()` — confirmed
      `ambiguous`.

## Implementation

- [x] Add `DOC_DIRS`/`DOC_EXTENSIONS`, extend `findDefinitionDocuments()` to scan `docs/`/
      `documentation/` one level deep.

## Tests

- [x] Reported scenario now classifies `definition`.
- [x] `documentation/` alternate name recognized.
- [x] One-level-only (nested `docs/adr/` not scanned).
- [x] Non-document file under `docs/` excluded.
- [x] Implemented still wins over `docs/` content.
- [x] All pre-existing `project-maturity.test.js` tests still pass.

## Verification

- [x] `npm test`
- [x] `node cli/bin/aief.js verify`
- [x] `git diff --check`

## Evidence

- [x] Update evidence.md
