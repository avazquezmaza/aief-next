# Specification

## Goal

`aief --version` reports `aief 3.2.0`, and `package.json`/`cli/package.json`/`package-lock.json`
all agree, with no behavior change beyond the version string.

## Requirements

- `package.json` version field is `3.2.0`.
- `cli/package.json` version field is `3.2.0`.
- `package-lock.json` reflects `3.2.0` for both the root and `cli` packages.
- No other file changes.

## Acceptance Criteria

- [x] `node -p "require('./package.json').version"` prints `3.2.0`.
- [x] `node -p "require('./cli/package.json').version"` prints `3.2.0`.
- [x] `node cli/bin/aief.js --version` prints `aief 3.2.0`.
- [x] `npm test` passes.
- [x] `node cli/bin/aief.js verify` passes.
