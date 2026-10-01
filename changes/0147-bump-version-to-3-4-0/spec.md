# Specification

## Goal

`aief --version` reports `aief 3.4.0`; all package manifests and lockfiles agree; the README status
line names 3.4. No behavior change beyond the version string.

## Requirements

- `package.json` and `cli/package.json` version `3.4.0`.
- `package-lock.json` and `cli/package-lock.json` root package version `3.4.0`; dependencies unchanged.
- `README.md` `## Status` says "AIEF 3.4".
- `releases/v3.4.0.md` lists upgrade notes (Node >= 22, auto-branch, gate enforcement, removed
  generated workflow), the summary of 0105–0147, and verification.
- No other file changes.

## Acceptance Criteria

- [x] `node -p "require('./package.json').version"` prints `3.4.0`.
- [x] `node -p "require('./cli/package.json').version"` prints `3.4.0`.
- [x] `node cli/bin/aief.js --version` prints `aief 3.4.0`.
- [x] No "AIEF 3.3"/"3.3.0" left in `README.md`, `docs/`, `cli/README.md` except the historical note in `docs/maintainer.md`.
- [x] `releases/v3.4.0.md` written with upgrade notes, summary and verification.
- [x] `npm test`, `node cli/bin/aief.js verify` and `git diff --check` pass.
