# Tasks

## Implementation

- [x] Add `definitionChangeFiles(id, slug, title)` producing the Definition scaffold.
- [x] Wire `createChange()` to dispatch `options.type === "definition"` to it.
- [x] Add `isDefinition` in `prompt()` and its instruction block.
- [x] Document `--type definition` in `aief help new-change`.

## Tests

- [x] `new-change --type definition` creates the expected scaffold (Type/sections present).
- [x] `prompt` on a Definition Change prints the do-not-implement / human-approval instructions.
- [x] `close --yes` is refused on a fresh Definition Change (unchecked `(human)` task blocks it).
- [x] `verify` treats a Definition Change like any other typed Change (no special-casing needed).
- [x] Existing Analysis/Enrichment/General regression tests still pass.

## Verification

- [x] `npm test`
- [x] `node cli/bin/aief.js verify`
- [x] `git diff --check`

## Evidence

- [x] Update evidence.md
