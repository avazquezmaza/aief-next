# Specification

## Goal

No file in the repository declares, tests, or ships an EOL Node version (18/20), and
`docs/architecture.md`'s layer table names the paths the code actually lives at.

## Requirements

- R1: `package.json` and `cli/package.json`'s `engines.node` become `">=22"`.
- R2: `.github/workflows/ci.yml`'s `test` job matrix becomes `[22, 24]` (drop 18/20). The
  `lint` job's `node-version: 22` is unchanged (already current).
- R3: `cli/templates/ci/aief-verify.yml`'s `node-version` becomes `22`.
- R4: `docs/architecture.md`'s layer table row for Application Services and Domain Models names
  `cli/src/core/services/*.js` and `cli/src/core/domain/change.js` (plus the other domain
  files already listed, unchanged) instead of the pre-refactor `cli/src/*-service.js` /
  `cli/src/change.js` paths.
- R5: `docs/maintainer.md`'s CI description matches the new matrix.
- R6: `cli/README.md` and `examples/todo-app/README.md`'s "Node >= 18" mentions become
  "Node >= 22".

## Acceptance Criteria

- [ ] `grep -rn "\"node\": \">=18\"" .` (excluding lock files, which npm regenerates on its own)
      finds nothing.
- [ ] `grep -n "node-version" .github/workflows/ci.yml` shows only `22` and `24`.
- [ ] `cli/templates/ci/aief-verify.yml` shows `node-version: 22`.
- [ ] `docs/architecture.md` names no path that does not exist under `cli/src/` today.
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0126-node-22-ci-and-docs-drift-housekeeping --strict`
      all pass.
