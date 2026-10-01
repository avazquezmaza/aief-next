# Change

## ID

`0147-bump-version-to-3-4-0`

## Type

General

## Objective

Bump version numbers to 3.4.0 so `aief --version` reflects the 3.4 release (Changes 0105–0145,
readiness in 0146), update the `README.md` `## Status` version line handed over by Change 0146,
and write `releases/v3.4.0.md`. Precedents: Change 0103 (bump) and Change 0104 (release notes),
combined into one Change at the owner's request so the tag can point at a `main` that already
contains the notes.

## Scope

### In scope

- `package.json`, `cli/package.json`, `package-lock.json`, `cli/package-lock.json`: version 3.4.0,
  via `npm version 3.4.0 --no-git-tag-version` (root and `cli/`), which updates each lockfile's own
  version fields without touching dependencies or the network.
- `README.md` `## Status`: "AIEF 3.3" → "AIEF 3.4" (C0146-F4).
- `releases/v3.4.0.md` (scaffolded by `aief release 3.4.0`): upgrade notes, summary of 0105–0147,
  verification.
- The pre-tag check from `docs/maintainer.md` "Releasing": no remaining "AIEF 3.3"/"3.3.0" in
  `README.md`, `docs/`, `cli/README.md` outside historical notes.

### Out of scope

- Feature changes or refactoring.
- Git tag `v3.4.0` and the GitHub Release: after this Change is merged, only with explicit owner
  confirmation.

## Success Criteria

- `aief --version` prints `aief 3.4.0`.
- `npm test`, `aief verify` and `git diff --check` pass.

## Status

Closed (2026-10-01)
