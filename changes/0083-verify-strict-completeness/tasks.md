# Tasks

## Implementation

- [x] Add `checkStrictCompleteness()` + `extractSection()`/`isPlaceholderContent()`/
      `stripInlineCode()` helpers in `change-verifier.js`.
- [x] Thread an optional `strict` parameter through `verifyProject()`/`verifyChange()`/
      `addChangeLines()`, defaulting to `false`.
- [x] Add `--strict` to `verify`'s `KNOWN_FLAGS` and wire it in `cli.js`'s `verify()`.
- [x] Document `--strict` in `aief help verify`.
- [x] Exclude inline-code-span TODO/TBD false positives (found via real-repo validation).

## Tests

- [x] `checkStrictCompleteness()` unit tests (untouched scaffold, filled-in Change, TODO/TBD ×3
      files, absent-heading never flagged, backtick-span TODO/TBD never flagged, Definition
      decision unresolved vs. approved, unchecked human task).
- [x] `aief verify` default output/exit unaffected by an objectively incomplete Change.
- [x] `aief verify --strict` fails on the same Change, with `[strict]` lines.
- [x] `aief verify --strict --change <id>` scoping.
- [x] `aief verify --strict` passes once filled in.
- [x] `aief verify --strict` on a Definition Change (Decisions Required vs. Decision (human)).
- [x] `aief verify --strict` unresolved-human-decision detection.
- [x] `--strikt` (unknown option) still rejected explicitly (Change 0077 regression).
- [x] Full existing `cli.test.js` suite passes unmodified.

## Verification

- [x] `npm test`
- [x] `node cli/bin/aief.js verify`
- [x] `node cli/bin/aief.js verify --strict` (against AIEF's own repository)
- [x] `git diff --check`

## Evidence

- [x] Update evidence.md
