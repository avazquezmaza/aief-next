# Evidence

## Summary

PR #66's `test` job (Node 18/20/22) failed at "Install SVG renderer" — `apt-get update` aborted with
a `Hash Sum mismatch` on the GitHub Actions runner's preinstalled Google Chrome apt repository, unused
by this job (which only needs `librsvg2-bin`). A manual rerun (`gh run rerun --failed`) reproduced the
identical failure, ruling out a one-off transient blip. Fixed by removing the Chrome apt source before
`apt-get update` in `.github/workflows/ci.yml`.

## Activities Performed

- Reproduced the failure via `gh pr checks 66` and `gh run view --log` on the failing jobs — all three
  matrix jobs failed identically at the same step; `lint` passed.
- Confirmed a rerun (`gh run rerun 34384654977 --failed`) failed with the exact same hash mismatch,
  ruling out a single transient mirror blip.
- Created this Change on a fresh branch off `main` (unrelated to Change 0122's docs-only PR #66).
- Edited `.github/workflows/ci.yml`: `sudo rm -f /etc/apt/sources.list.d/google-chrome.list` before
  `apt-get update` in the `test` job's "Install SVG renderer" step.

## Verification

- `npm test` (cli, run from `cli/`): 1053/1053 pass.
- `node cli/bin/aief.js verify --change 0122-ci-apt-chrome-mirror-flakiness --strict`: FAIL, expected
  — blocked only on the `(human)` task "Confirm CI is green on the pushed branch/PR", which this
  session cannot check itself; will be confirmed once GitHub Actions runs the pushed branch.
- `git diff --check`: clean.

## Findings

- The Chrome apt source is preinstalled on GitHub's `ubuntu-latest` runner image, not added by this
  repository — the fix removes it defensively for this job only, it does not touch the runner image
  itself or any other job.
- First fix attempt (`rm -f /etc/apt/sources.list.d/google-chrome.list`) was wrong: PR #67's own CI
  run (`test (20)`) still showed the Chrome repo being fetched and failing — the file is not named
  `google-chrome.list` on this runner image. Replaced with a content-based lookup
  (`grep -rl 'dl\.google\.com' /etc/apt/sources.list.d/ | xargs -r sudo rm -f`) that does not depend
  on the exact filename. Re-pushed; awaiting confirmation this actually removes the repo.

## Risks

- If a future step in this job actually needs the Chrome apt repo, removing it here would silently
  make that unavailable. Not currently the case — `test` only installs `librsvg2-bin`.

## Recommendations

- None beyond this fix.

## Artifacts Produced

- `.github/workflows/ci.yml` (one step edited)

## Next Change

None. Once CI is confirmed green, this Change can close and the fix can be pushed/merged (directly to
`main`, since it only touches CI plumbing, or via a PR — human to decide) ahead of or alongside PR #66.
