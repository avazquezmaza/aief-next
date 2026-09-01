# Change

## ID

`0103-bump-version-to-3-3-0`

## Type

General

## Objective

Bump version numbers in `package.json`, `cli/package.json`, and `package-lock.json` to 3.3.0 to
reflect the released v3.3 capabilities (Expert Definition Skills validation round — Changes
0090–0094; manifest-status drift detection — 0095; usability study and ADR-015 thaw — 0096–0097;
skills-catalog expansion, actionable CLI errors, Python framework detectors, and doc-reference
fixes — 0098–0101; release readiness — 0102) when calling `aief --version`. Exact precedent:
Change 0088 (3.1.0 → 3.2.0).

## Scope

### In scope

- Update `package.json` version to 3.3.0.
- Update `cli/package.json` version to 3.3.0.
- Update `package-lock.json` version to 3.3.0 (via `npm install`, matching the 0088/0062
  precedent, so lockfile metadata stays consistent).

### Out of scope

- Feature changes or refactoring.
- Git tag, `releases/v3.3.0.md`, or a GitHub Release — per Change 0102's evidence (matching the
  3.2.0 precedent: those are separate, later, human-confirmed steps).
- `git push` — deferred to a separate, human-confirmed step.

## Success Criteria

- `aief --version` prints `aief 3.3.0`.
- All tests pass (`npm test`).
- `aief verify` passes.

## Status

Closed (2026-09-01)
