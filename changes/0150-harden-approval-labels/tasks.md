# Tasks

## Implementation

- [x] R1: approval-line parser and unit tests.
- [x] R2: abandoned `(human)`/`(review)` in `checkChangeReadiness()` and `checkStrictCompleteness()`; tests.
- [x] R3: non-blocking strict notice for Analysis/Definition without `(human)`; tests.
- [x] R4: `close` prints approvals relied on; tests.

## Documentation

- [x] R5: `docs/security-model.md`, `docs/cli.md`, `AGENTS.md` + template, governance conventions §2.

## Verification

- [x] R6: record project-wide `verify` and `verify --strict` verdicts before and after.
- [x] `npm test`, `npm run lint`, `node cli/bin/aief.js verify`, `git diff --check`.

## Evidence

- [x] Update evidence.md
- [x] (review) Independent review of the change to approval semantics (completed by Gemini).
- [x] (human) Approve the new approval semantics before close (approved by owner Andrés Vázquez).
