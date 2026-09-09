# Specification

## Goal

The CI `test` matrix (Node 18/20/22) no longer fails because of an apt index problem on a repository
(`dl.google.com/linux/chrome-stable`) unrelated to the one package the job actually installs
(`librsvg2-bin`).

## Requirements

- **File**: `.github/workflows/ci.yml`, `test` job, "Install SVG renderer" step.
- Before running `apt-get update`, remove the GitHub Actions Ubuntu runner's preinstalled Google
  Chrome apt source list (`/etc/apt/sources.list.d/google-chrome.list`), so `apt-get update` does not
  attempt to fetch its index at all.
- Use a form that does not fail the step if the file is already absent (`rm -f`), since runner images
  change over time.
- No other step, job, or file changes.

## Acceptance Criteria

- [x] `.github/workflows/ci.yml`'s "Install SVG renderer" step removes the Chrome apt source before
      `apt-get update`.
- [x] `lint` job is untouched (zero diff).
- [x] A CI run on this Change's branch (or the PR it is pushed to) shows `test (18)`, `test (20)`,
      `test (22)` passing.
- [x] `npm test` passes locally.
- [x] `node cli/bin/aief.js verify --strict` PASS.
- [x] `git diff --check` clean.
