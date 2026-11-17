# Tasks
## Implementation

- [x] Add pure `markClosedContent(md, date)` to `cli/src/core/domain/change.js` (R1).
- [x] Rewrite inline declarations in place (R2).
- [x] Rewrite H2/H3 headings in place, with and without an existing value (R2).
- [x] Keep the append path when no declaration exists (R2).
- [x] Ensure no line outside the status value is lost (R4).
- [x] Make `markClosed()` verify the candidate with `isClosedContent()` before writing (R3).
- [x] Make `markClosed()` leave `change.md` byte-identical when verification fails (R3).
- [x] Reword `statusProblem()`, keeping the `not understood` substring (R5).

## Tests

- [x] Invariant test over every accepted format: `isClosedContent(markClosedContent(md, date))` (R6).
- [x] Content-preservation test, including headings after a valueless `## Status` (R4, R6).
- [x] Regression test for the heading-destruction case (R6).
- [x] E2E `aief close --yes` on a Change with an inline declaration: exit 0, one declaration, `aief verify` green (R6).
- [x] Update the `not understood` assertion if the wording requires it, without weakening it (R5).
## Documentation

- [x] Update `docs/cli.md` if the description of `close` changes.
## Verification

- [x] `npm test` — full suite, no new failures.
- [x] `npm run lint`
- [x] `git diff --check`
- [x] `aief verify --strict` — blocked only by the `(human)` approval below.
- [x] Update evidence.md

## Review

- [ ] (human) Owner reviews the diff before merge.
