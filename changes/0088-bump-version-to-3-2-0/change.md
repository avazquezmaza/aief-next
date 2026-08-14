# Change

## ID

`0088-bump-version-to-3-2-0`

## Type

General

## Objective

Bump version numbers in `package.json`, `cli/package.json`, and `package-lock.json` to 3.2.0 to
reflect the released v3.2 capabilities (Pre-Implementation Definition, Changes 0079–0086, and
release readiness/documentation, Change 0087) when calling `aief --version`.

## Scope

### In scope

- Update `package.json` version to 3.2.0.
- Update `cli/package.json` version to 3.2.0.
- Update `package-lock.json` version to 3.2.0 (via `npm install`, matching the 0062 precedent, so
  lockfile metadata stays consistent).

### Out of scope

- Feature changes or refactoring.
- Git tag, `releases/vX.Y.Z.md`, or GitHub Release — per the confirmed 3.1-matching release plan
  (see Change 0087's `evidence.md` for the precedent audit).
- `git push` — deferred to a separate, human-confirmed step.

## Success Criteria

- `aief --version` prints `aief 3.2.0`.
- All tests pass (`npm test`).
- `aief verify` passes.

## Status

Closed (2026-08-14)
