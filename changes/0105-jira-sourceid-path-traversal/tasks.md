# Tasks

## Implementation

- [x] Apply `isReallyWithin()` containment check to the default (no `--file`) Jira export path,
      not only the explicit `--file` path (`cli/src/requirement-providers/jira.js`).
- [x] Update the rejected/openQuestions/riskNotes/consoleNotes diagnostic to name whichever of
      `--file` or the source id caused the rejection.

## Documentation

- [x] Update the inline comment above the containment check — it previously asserted the default
      path "can never resolve outside the project root", which was the incorrect assumption
      behind this bug.

## Verification

- [x] Added two regression tests in `cli/tests/requirement-providers.test.js`: a `sourceId` with
      `../` segments escaping the project root is rejected before any read; a normal in-bounds
      `sourceId` is unaffected.
- [x] `npm test` (from repo root) — 1011/1011 passing.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] Manual reproduction before/after: `aief enrich jira "../../../../../../tmp/<outside>/pwn"`
      leaked the outside file's content into the new Change's `spec.md`/`evidence.md` before this
      fix; after the fix it is rejected with the same "resolves outside the project root"
      diagnostic `--file` already used.

## Evidence

- [x] Update evidence.md
