# Tasks

## Manual end-to-end validation

- [x] Build a disposable PRD-only fixture (Fleet Maintenance Portal: multi-tenancy,
      authentication, RBAC, data storage, deployment, external integrations, audit requirements,
      availability, expected scale — all unresolved).
- [x] Run `bootstrap` → `analyze` — confirm Definition Change created, not Analysis.
- [x] Fill in Definition sections with all four markers; confirm `status --change` reflects them.
- [x] Run `verify --strict` before approval — confirm it fails with the right reasons.
- [x] Approve, record in `Decision (human)` and `knowledge/decisions.md`, fill Requirements, check
      off tasks.
- [x] Run `verify --strict` after — confirm it passes; `close --yes` — confirm it succeeds.
- [x] Run `bootstrap` + `analyze` on a real implemented Node app (`examples/todo-app` copy) —
      confirm Analysis routing, unaffected.

## Automated regression

- [x] Add the end-to-end PRD-only test to `cli.test.js`.
- [x] Add the implemented-project regression test to `cli.test.js`.

## Documentation

- [x] `docs/concepts.md`: Definition Change type, Project Maturity section.
- [x] `docs/cli.md`: `analyze --maturity`, `new-change --type definition`, `status`'s Definition
      readiness block, `verify --strict`.
- [x] `docs/getting-started.md`: "Starting from a PRD (no code yet)" walkthrough.

## Verification

- [x] `npm test`
- [x] `node cli/bin/aief.js verify`
- [x] `git diff --check`

## Evidence

- [x] Update evidence.md
