# Change

## ID

`0139-stop-bootstrap-generating-github-workflow`

## Type

General

## Objective

Stop `aief bootstrap` from writing `.github/workflows/aief-verify.yml` into adopted projects.

The generated workflow (added by Change 0036, Flux Portal finding F2) has two problems:

1. It is GitHub-only. On Bitbucket, GitLab or any other host it is a dead file nobody runs.
2. Its only step is `npx --yes aief verify`, but no `aief` package exists on the npm registry
   (`npm view aief` → 404; this package is `aief-next`, `"private": true`). On GitHub the job
   fails on every push, and anyone who later publishes an `aief` package would have it executed
   in the adopted project's CI.

The CI signal stays available: `aief verify` already exits non-zero on FAIL, and the docs show
how to wire it into any CI. This does not conflict with an accepted ADR (none governs the CI gate).

## Scope

### In scope

- Remove the CI-gate write from `bootstrap` and delete `cli/templates/ci/aief-verify.yml`.
- Update current docs and help text that list the CI gate as a bootstrap artifact.
- Replace the `npx aief verify` guidance with a command that works without an npm package.
- Update the adoption diagram generator text and regenerate the SVG.
- Add a test that `bootstrap` creates no `.github/` directory.

### Out of scope

- Removing `aief-verify.yml` from projects already adopted (it is theirs; never touched).
- `docs/history/` and past Change records (historical).
- Publishing an npm package or adding per-platform CI generation (possible follow-up).
- Usability-study fixtures under `changes/0096-*`.

## Success Criteria

- `aief bootstrap` in an empty directory creates no `.github/` entry.
- No current doc or help text claims bootstrap creates a CI gate or recommends `npx aief verify`.
- `npm test`, `npm run lint`, `aief verify` and `git diff --check` pass.

## Status

Closed (2026-09-24)
