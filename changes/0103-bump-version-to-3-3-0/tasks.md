# Tasks

## Implementation

- [x] Bump `package.json` version to 3.3.0.
- [x] Bump `cli/package.json` version to 3.3.0.
- [x] Run `npm install` at the repo root so `package-lock.json` reflects 3.3.0 for both packages.

## Verification

- [x] `node cli/bin/aief.js --version` prints `aief 3.3.0`.
- [x] `npm test` — full suite passes.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.

## Evidence

- [x] Update evidence.md
