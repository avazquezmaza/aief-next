# Change

## ID

`0062-bump-version-3-1-0`

## Type

General

## Objective

Bump version numbers in package.json, cli/package.json, and package-lock.json to 3.1.0 to reflect the released v3.1 capabilities when calling `aief --version`.

## Scope

### In scope

- Update `package.json` version to 3.1.0
- Update `cli/package.json` version to 3.1.0
- Update `package-lock.json` version to 3.1.0

### Out of scope

- Feature changes or refactoring.

## Success Criteria

- `aief --version` prints `aief 3.1.0`.
- All tests pass (`npm test`).
- `aief verify` passes.

## Status

Closed (2026-08-04)
