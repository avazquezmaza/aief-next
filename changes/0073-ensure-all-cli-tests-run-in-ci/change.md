# Change

## ID

`0073-ensure-all-cli-tests-run-in-ci`

## Type

General

## Objective

Fix Finding F4 from the completed technical audit: `cli/tests/assistant-resolver.test.js`
(17 tests, passes standalone) exists on disk but is omitted from `cli/package.json`'s
hardcoded `npm test` file list, and therefore never runs under `npm test` or CI.

## Scope

### In scope

- `cli/package.json`'s `test` script: replace the hardcoded 39-file list with Node-native
  directory-based test discovery (`node --test tests/`), since `cli/tests/` was confirmed to
  contain only `*.test.js` files (no fixtures, no non-test helpers) — this closes the entire
  class of "file exists but isn't listed" bug, not just this one instance.
- Regenerating `cli/README.md`'s own testing note if it references the explicit file count.

### Out of scope

- Any change to `assistant-resolver.test.js`'s own content.
- Any change to CI workflow YAML (CI already calls `npm test`, so the fix should be transparent
  to `.github/workflows/ci.yml`).
- Any other audit finding (F1, F2, F5, F7/H4, nested bootstrap, manifest docs) — each gets its
  own Change.

## Success Criteria

- `npm test` (from `cli/`) executes all `cli/tests/*.test.js` files on disk, including
  `assistant-resolver.test.js`.
- No file outside `cli/tests/*.test.js` is accidentally executed.
- `node cli/bin/aief.js verify` and `git diff --check` both pass.

## Status

Closed (2026-08-13)
