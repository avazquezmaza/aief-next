# Tasks

## Implementation

- [x] Remove `createCiGate()`, `CI_TEMPLATE` and the CI-gate console output from `bootstrap.js`
- [x] Delete `cli/templates/ci/aief-verify.yml`
- [x] Add a bootstrap test asserting no `.github/` is created

## Documentation

- [x] Rewrite `docs/configuration.md` "CI gate"
- [x] Update `docs/getting-started.md`, `docs/cli.md`, `docs/examples.md`
- [x] Update `aief help bootstrap` text in `cli/src/commands/misc.js`
- [x] Update diagram generator text and regenerate `docs/images/adoption-workflow.svg`

## Verification

- [x] `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0139 --strict`, `git diff --check`

## Evidence

- [x] Update evidence.md

## Review

- [x] (review) Independent review of the diff
