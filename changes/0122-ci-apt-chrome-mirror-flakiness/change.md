# Change

## ID

`0122-ci-apt-chrome-mirror-flakiness`

## Type

General

## Objective

Fix the `test` job in `.github/workflows/ci.yml`, which reliably fails (observed on PR #66, twice,
including after a manual rerun) at the "Install SVG renderer" step: `apt-get update` aborts on a
`Hash Sum mismatch` from the `dl.google.com/linux/chrome-stable` apt repository preinstalled on the
GitHub Actions Ubuntu runner image — a repo this job never uses (it only needs `librsvg2-bin`).

## Scope

### In scope

- `.github/workflows/ci.yml`: before `apt-get update`, remove/disable the preinstalled Google Chrome
  apt source so its (currently broken) index cannot fail the `update` for an unrelated package.

### Out of scope

- Any change to CLI/application code, `docs/`, or other workflows (`lint` already passes and is
  untouched).
- Removing Chrome itself or any other preinstalled runner tooling.
- Retrying/backoff logic — the fix removes the failing source instead of working around its flakiness.

## Success Criteria

- The `test` job's "Install SVG renderer" step no longer depends on the Chrome apt repo's index.
- A CI run on the PR branch shows `test (18/20/22)` passing again.
- `npm test`, `node cli/bin/aief.js verify --strict`, `git diff --check` all pass locally.
