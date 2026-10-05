# Specification

## Goal

`## Type` means one of a known set of values in any language the owner writes, and CodeQL reports
only real findings.

## Requirements

- R1: `normalizeChangeType()` and `CHANGE_TYPES` in `change.js`; `changeTypeFromContent()` returns
  the normalized type; `loadChange()` carries `typeInfo` (raw, type, recognized).
- R2: `verify --strict` adds a notice for an unrecognized Type.
- R3: Alerts 5 and 6 fixed in the tests; alerts 2 and 3 excluded through
  `.github/codeql/codeql-config.yml`, referenced from the CodeQL workflow.
- R4: Docs list the accepted values.

## Acceptance Criteria

- [x] R1–R4 implemented with tests.
- [x] `npm test`, `npm run lint`, `aief verify --strict` pass.
- [x] (human) Owner reviews the diff before merge.
