# Change

## ID

`0126-node-22-ci-and-docs-drift-housekeeping`

## Type

Fix

## Objective

Two trivial, unrelated-in-design housekeeping items surfaced by the same external audit that
motivated Changes 0123–0125:

1. **Node EOL**: `package.json`/`cli/package.json` declare `"node": ">=18"` and CI
   (`.github/workflows/ci.yml`) tests against `[18, 20, 22]`. As of this Change, Node 18 and 20
   are both End-of-Life; only 22 and 24 are current LTS/Active lines. `cli/templates/ci/aief-verify.yml`
   (the CI gate `aief adopt` writes into adopted projects) also pins Node 20.
2. **Documentation drift**: `docs/architecture.md`'s layer table still names pre-refactor paths
   — `cli/src/*-service.js` and `cli/src/change.js` — that no longer exist. The real code lives
   under `cli/src/core/services/` and `cli/src/core/domain/` (confirmed against the actual
   directory structure).

## Scope

### In scope

- `package.json`, `cli/package.json`: `engines.node` raised to `>=22`.
- `.github/workflows/ci.yml`: test matrix becomes `[22, 24]`; lint job stays on 22 (unchanged,
  already current).
- `cli/templates/ci/aief-verify.yml`: `node-version` raised from `20` to `22` (this file ships
  to every project `aief adopt` touches — an adopter should not inherit an EOL pin).
- `docs/architecture.md`: layer table's `cli/src/*-service.js` / `cli/src/change.js` entries
  corrected to the real paths (`cli/src/core/services/*.js`, `cli/src/core/domain/change.js`).
- `docs/maintainer.md`: its one-line description of the CI matrix updated to match.
- `cli/README.md`, `examples/todo-app/README.md`: "Node >= 18" mentions updated to `>= 22`.

### Out of scope

- Any other documentation drift not already confirmed against the code (this Change fixes
  exactly the one table cited by the audit, not a general documentation sweep).
- Node 26 ("Current", not yet LTS) — not added to the matrix; only the two current LTS/Active
  lines (22, 24) are added, per the audit's own recommendation.
- Any application-code change — this Change touches only manifests, CI config, and docs.

## Success Criteria

- No file in the repository declares or tests against Node 18 or 20.
- `docs/architecture.md`'s layer table names only paths that exist in `cli/src/` today.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0126-node-22-ci-and-docs-drift-housekeeping --strict`, and `git diff --check` all pass.

## Status

Closed (2026-09-09)
