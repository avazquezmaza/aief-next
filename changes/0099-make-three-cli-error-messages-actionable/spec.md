# Specification

## Goal

The three identified error messages tell the user what to run next, the same way every other
error in `cli/src/commands/*.js` already does.

## Requirements

- `resolveImplicitChange()` (`shared.js`): keep the exact prefix `"No open Change found."` (tests
  regex-match on it) and append a next step naming both `aief new-change <name>` and
  `aief status`.
- `createChange()` (`shared.js`): keep the exact prefix `"Change name is required."` and append
  an `Example: aief new-change "..."` line, mirroring `propose.js`'s existing example format.
- `initProject()` (`bootstrap.js`): keep the exact prefix `"Project already exists: <path>"` and
  append guidance to pick a different name or `cd` in and bootstrap there.
- No other `console.error()` call site changes.

## Acceptance Criteria

- [ ] All three messages updated with a next step, same tone as neighboring errors in the same
      file.
- [ ] `npm test` passes with zero existing tests modified.
- [ ] `node cli/bin/aief.js verify` passes.
- [ ] `git diff --check` passes.
- [ ] `git diff` touches only `shared.js`, `bootstrap.js`, and this Change's own files.
