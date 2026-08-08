# Tasks

## Implementation

- [x] List `docs/concepts.md`'s actual `##` headings (source of truth for anchors — do not guess
      GitHub's slug algorithm from memory, confirm against the file).
- [x] Draft `docs/cheat-sheet.md`: glossary table (term / one-line meaning / link) + "Canonical
      flow" block.
- [x] Add one pointer sentence to `docs/concepts.md`'s opening paragraph — no other edit to that
      file.
- [x] Add the cheat sheet to `README.md`'s documentation table.

## Documentation

- [x] Cross-check every link in `docs/cheat-sheet.md` resolves (anchors match real headings in
      `concepts.md` and `workflow.md`).

## Verification

- [x] `npm test` (root) passes.
- [x] `node cli/bin/aief.js verify` at repo root passes.
- [x] `git diff --check` passes.
- [x] `git diff --stat docs/concepts.md` shows exactly one changed line (the added sentence).
- [x] Confirmed no file under `cli/src/` was touched.

## Evidence

- [x] Update evidence.md
