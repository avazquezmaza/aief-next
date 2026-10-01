# Tasks

## Implementation

- [x] `npm version 3.4.0 --no-git-tag-version` at the root and in `cli/`.
- [x] `README.md` `## Status`: AIEF 3.3 → AIEF 3.4.
- [x] `aief release 3.4.0`; write `releases/v3.4.0.md`.
- [x] Regenerate diagrams (`scripts/diagrams/generate_all.py`) and confirm no drift.

## Verification

- [x] `node cli/bin/aief.js --version` prints `aief 3.4.0`.
- [x] Pre-tag grep for the previous version (`docs/maintainer.md` "Releasing").
- [x] `npm test`, `node cli/bin/aief.js verify`, `git diff --check`.

## Evidence

- [x] Update evidence.md
