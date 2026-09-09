# Tasks

## Implementation

- [x] Bump `engines.node` to `>=22` in `package.json` and `cli/package.json` (R1).
- [x] Update `.github/workflows/ci.yml`'s test matrix to `[22, 24]` (R2).
- [x] Update `cli/templates/ci/aief-verify.yml`'s `node-version` to `22` (R3).

## Documentation

- [x] Fix `docs/architecture.md`'s layer table paths (R4).
- [x] Update `docs/maintainer.md`'s CI matrix description (R5).
- [x] Update `cli/README.md` and `examples/todo-app/README.md`'s Node version mentions (R6).

## Verification

- [x] Run `npm test` (1070/1070), `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0126-node-22-ci-and-docs-drift-housekeeping --strict`.
- [x] Grep the repo for any remaining `18`/`20` Node references outside lock files — none found.

## Evidence

- [x] Update evidence.md
