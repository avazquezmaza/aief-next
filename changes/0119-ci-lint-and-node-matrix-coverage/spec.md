# Specification

## Goal

CI catches static issues (broken imports, unused variables, obviously-wrong code) automatically,
and exercises every LTS Node line the project claims to support, not just the two matrix endpoints.

## Requirements

- `cli/package.json`: add `eslint` as a `devDependency` (latest stable major at implementation
  time) and a `"lint": "eslint src bin"` script.
- `cli/eslint.config.js`: flat config, `js.configs.recommended` from `@eslint/js`, `sourceType:
  "module"` (this codebase is ESM throughout), Node globals.
- Root `package.json`: add `"lint": "npm --prefix cli run lint"`, mirroring the existing `"test":
  "npm --prefix cli test"` delegation.
- `.github/workflows/ci.yml`: add a `Lint` step (`run: npm run lint`) before the existing test
  steps, once per matrix entry (same job, no new job needed — lint is fast and Node-version-
  independent, but running it on every matrix entry costs nothing extra since the job already
  checks out and installs Node per entry).
- `.github/workflows/ci.yml`'s `node-version` matrix: `[18, 22]` -> `[18, 20, 22]`.
- Any `eslint:recommended` violation ESLint finds on the existing `cli/src`/`cli/bin` tree at
  implementation time is fixed (not suppressed) so CI starts from a clean baseline.

## Acceptance Criteria

- [ ] `npm run lint` from repo root exits 0 on the current tree.
- [ ] A deliberately introduced unused variable in `cli/src/` makes `npm run lint` exit non-zero.
- [ ] `.github/workflows/ci.yml`'s matrix reads `[18, 20, 22]`.
- [ ] `.github/workflows/ci.yml` runs the lint step before the test steps.
- [ ] `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
