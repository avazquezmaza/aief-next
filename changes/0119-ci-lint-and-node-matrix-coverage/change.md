# Change

## ID

`0119-ci-lint-and-node-matrix-coverage`

## Type

General

## Objective

CI (`.github/workflows/ci.yml`) only runs `npm test` (cli), the `examples/todo-app` tests, and
`aief verify` — no lint or static analysis step exists, and neither `package.json` defines a lint
script. Import errors, unused variables, or other static issues can reach `main` undetected by CI.
Separately, `engines.node` declares `>=18` but the CI matrix only tests the two endpoints
(`[18, 22]`), leaving intermediate supported versions (19–21) unverified. Both found during an
independent audit review.

## Scope

### In scope

- Add ESLint (flat config, `eslint:recommended`) as a `devDependency`, scoped to `cli/` (the only
  JS source in this repo besides `examples/todo-app`, which has its own toolchain).
- `cli/package.json` gains a `lint` script; root `package.json` gains a `lint` script delegating to
  it (mirroring the existing `test` script's delegation pattern).
- `.github/workflows/ci.yml` runs `npm run lint` (cli) as its own step, before the test steps.
- Widen the Node matrix from `[18, 22]` to `[18, 20, 22]` — covers the two most recent LTS lines in
  the declared `>=18` range without inflating CI to every intermediate version.

### Out of scope

- TypeScript / type-checking — this is a plain-JS codebase by design (zero runtime deps); adding a
  type system is a separate, much larger decision.
- Linting `examples/todo-app` — it is a separate example project with its own `package.json` and
  test suite; not part of the CLI itself.
- Auto-fixing any lint violations `eslint:recommended` currently reports on existing code beyond
  what's needed to make the new CI step pass — pre-existing violations are fixed as part of getting
  a clean baseline, not restyled beyond that.

## Success Criteria

- `npm run lint` (from repo root) runs ESLint over `cli/src` and `cli/bin` and exits 0 on a clean
  tree.
- CI fails on a genuine lint violation (e.g. an unused variable) introduced on a branch.
- CI's Node matrix is `[18, 20, 22]`.
- `npm test`, `node cli/bin/aief.js verify --strict`, and `git diff --check` all pass.
