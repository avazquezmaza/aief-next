# Tasks

## Implementation

- [x] Edit `.github/workflows/ci.yml`'s "Install SVG renderer" step to remove the Chrome apt source
      before `apt-get update`.

## Documentation

- [x] None required.

## Verification

- [x] `npm test` (cli)
- [x] `node cli/bin/aief.js verify --strict`
- [x] `git diff --check`
- [x] Confirm CI is green on the pushed branch/PR — observed directly via `gh pr checks 67`
      (`lint`, `test (18)`, `test (20)`, `test (22)` all `pass`).

## Evidence

- [x] Update evidence.md
