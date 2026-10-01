# Tasks

## Implementation

- [x] R1: confirm 0148–0152 closed and reachable from `main`.
- [x] R2: documentation audit; fix verified gaps.
- [x] R3: `npm version 3.5.0 --no-git-tag-version` at the root and in `cli/`.
- [x] R3: `README.md` `## Status`: AIEF 3.4 → AIEF 3.5.
- [x] R4: `aief release 3.5.0`; write `releases/v3.5.0.md`.
- [x] R5: update `changes/README.md`.
- [x] Regenerate diagrams (`scripts/diagrams/generate_all.py`) and confirm no drift.

## Verification

- [x] `node cli/bin/aief.js --version` prints `aief 3.5.0`.
- [x] Pre-tag grep for the previous version (`docs/maintainer.md` "Releasing").
- [x] `npm test`, `npm run lint`, `node cli/bin/aief.js verify`, `git diff --check`.

## Evidence

- [x] Update evidence.md
- [x] (human) Approve 3.5.0 release readiness before close.
