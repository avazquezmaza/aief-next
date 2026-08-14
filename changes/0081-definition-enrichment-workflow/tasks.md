# Tasks

## Implementation

- [x] Add `cli/src/core/domain/definition-enrichment.js` — `analyzeDefinitionSections()`,
      `DEFINITION_SECTIONS`.
- [x] Add `printDefinitionReadiness()` in `cli.js`, called from `statusSingleChange()`, active
      only for `type === "definition"`.
- [x] Extend the Definition `prompt()` instruction block with the marker convention.

## Tests

- [x] `analyzeDefinitionSections()` unit tests: fresh scaffold all-missing, filled section is
      known, real Decision (human) entry is known, each of the four markers in isolation, unmarked
      line classified into nothing, CRLF tolerance.
- [x] `status --change` on a fresh Definition Change reports 0/18 and lists Missing.
- [x] `status --change` on a partially-filled Definition Change reports correct known count and
      every marker bucket.
- [x] `status --change` on a non-Definition Change never prints the block (regression guard).
- [x] `prompt` on a Definition Change explains the marker convention.
- [x] Full existing `cli.test.js` suite (including `aief enrich` tests) passes unmodified.

## Verification

- [x] `npm test`
- [x] `node cli/bin/aief.js verify`
- [x] `git diff --check`

## Evidence

- [x] Update evidence.md
