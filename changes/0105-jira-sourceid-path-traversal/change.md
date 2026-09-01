# Change

## ID

`0105-jira-sourceid-path-traversal`

## Type

General

## Objective

Fix a path traversal / arbitrary file read in the Jira Requirement Source provider: when
`aief enrich jira <sourceId>` is run without `--file`, `sourceId` is interpolated directly into a
filesystem path with no containment check, so a `sourceId` containing `../` segments can read any
file on disk reachable from the project root and have its content embedded into the new Change's
`spec.md`/`evidence.md`.

## Scope

### In scope

- `cli/src/requirement-providers/jira.js`: apply the existing `isReallyWithin()` containment check
  to the default (non-`--file`) path as well, not only to an explicit `--file`.
- A regression test proving a `sourceId` with `../` segments is rejected before any read.

### Out of scope

- Any other Requirement Source provider (`manual.js` does no filesystem I/O; `jira.js`'s `--file`
  path was already fixed by Change 0074 and is unchanged here).
- Adding network/live Jira integration — still out of scope per `docs/configuration.md`.

## Success Criteria

- `aief enrich jira "../../../etc/passwd"` (or any `sourceId` resolving outside the project root)
  is rejected before any `fs.readFileSync` call, with the same "resolves outside the project
  root" diagnostic `--file` already produces.
- A `sourceId` that stays within `requirements/jira/` (the common case, no traversal) is
  unaffected — same behavior as before this Change.

## Status

Closed (2026-09-01)
