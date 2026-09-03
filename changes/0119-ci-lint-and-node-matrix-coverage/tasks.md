# Tasks

## Implementation

- [x] Add `eslint` + `@eslint/js` as `cli/` `devDependencies`.
- [x] `cli/eslint.config.js`: flat config, `eslint:recommended`, Node globals, ESM.
- [x] `cli/package.json` gains a `lint` script; root `package.json` gains a delegating `lint`
      script.
- [x] `.github/workflows/ci.yml`: new `Lint` step before the test steps; matrix widened to
      `[18, 20, 22]`.
- [x] Fixed all 21 pre-existing `eslint:recommended` violations found on the current tree (unused
      imports/vars, dead initial assignments, duplicate object keys, unnecessary regex escapes) so
      CI starts from a clean baseline.

## Documentation

- [x] None needed — no doc claimed CI ran lint.

## Verification

- [x] `npm run lint` (root) exits 0 on the current tree.
- [x] Manually confirmed a deliberately introduced unused variable makes `npm run lint` fail (not
      committed — verification only).
- [x] `npm test` (full suite) after every lint fix, confirming no behavior change.
- [x] `node cli/bin/aief.js verify --strict`.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md.
