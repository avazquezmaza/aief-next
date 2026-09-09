# Tasks

## Implementation

- [x] Edit `.github/workflows/ci.yml`'s "Install SVG renderer" step to remove the Chrome apt source
      before `apt-get update`.

## Documentation

- [ ] None required.

## Verification

- [x] `npm test` (cli)
- [x] `node cli/bin/aief.js verify --strict`
- [x] `git diff --check`
- [ ] (human) Confirm CI is green on the pushed branch/PR — cannot be observed from this session
      until GitHub Actions actually runs it.

## Evidence

- [x] Update evidence.md
