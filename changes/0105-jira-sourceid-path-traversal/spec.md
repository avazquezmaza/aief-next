# Specification

## Goal

`aief enrich jira <sourceId>` never reads a file outside the project root, regardless of whether
the caller passes `--file` or relies on the default `requirements/jira/<sourceId>.json` path.

## Requirements

- R1: `retrieve(sourceId, options)` in `cli/src/requirement-providers/jira.js` MUST apply
  `isReallyWithin(projectRoot, filePath)` (real-path, symlink-aware containment) to `filePath`
  regardless of whether it was built from an explicit `--file` or from the default
  `requirements/jira/<sourceId>.json` template.
- R2: A `sourceId` (or `--file` value) that resolves outside the project root — directly via `../`
  segments, or via a symlink that escapes — MUST be rejected with the existing
  "resolves outside the project root" diagnostic (`openQuestions`/`riskNotes`/`consoleNotes`),
  before any `fs.existsSync`/`fs.readFileSync` call touches the resolved path.
- R3: A `sourceId` that stays within `requirements/jira/` (the existing, common case) MUST behave
  exactly as before — no new restriction on legitimate ids.

## Acceptance Criteria

- [x] `retrieve("../../../../tmp/whatever")` (no `--file`) returns `retrieved: false` and never
      calls `fs.readFileSync` on a path outside the project root.
- [x] Existing `--file` containment behavior (Change 0074) is unchanged — same tests still pass.
- [x] A normal `sourceId` like `PROJ-123` with a real
      `requirements/jira/PROJ-123.json` export still resolves and reads correctly.
