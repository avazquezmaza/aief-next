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
- `git diff --check`: clean.
- PR #67 (`https://github.com/avazquezmaza/aief-next/pull/67`) CI, first push (naive
  `google-chrome.list` filename): `lint` pass, `test (20)` fail — same `dl.google.com` hash mismatch,
  proving the guessed filename was wrong on this runner image; `test (18)`/`test (22)` cancelled.
- PR #67 CI, second push (content-based `grep -rl 'dl\.google\.com'` removal): `gh pr checks 67` —
  `lint` pass, `test (18)` pass, `test (20)` pass, `test (22)` pass. Confirms the fix.
- `node cli/bin/aief.js verify --change 0122-ci-apt-chrome-mirror-flakiness --strict`: PASS.

## Findings

- The Chrome apt source is preinstalled on GitHub's `ubuntu-latest` runner image, not added by this
  repository — the fix removes it defensively for this job only, it does not touch the runner image
  itself or any other job.
- First fix attempt (`rm -f /etc/apt/sources.list.d/google-chrome.list`) was wrong: PR #67's own CI
  run (`test (20)`) still showed the Chrome repo being fetched and failing — the file is not named
  `google-chrome.list` on this runner image. Replaced with a content-based lookup
  (`grep -rl 'dl\.google\.com' /etc/apt/sources.list.d/ | xargs -r sudo rm -f`) that does not depend
  on the exact filename. Re-pushed; PR #67's subsequent CI run confirmed green (lint + all Node
  matrix test jobs), confirming the content-based lookup does remove the repo. **(Correction,
  external audit finding C0130-F4):** this line originally still read "awaiting confirmation" after
  that confirmation had already happened — stale text, not a real open question. Corrected here.

## Risks

- If a future step in this job actually needs the Chrome apt repo, removing it here would silently
  make that unavailable. Not currently the case — `test` only installs `librsvg2-bin`.

## Recommendations

- None beyond this fix.

## Artifacts Produced

- `.github/workflows/ci.yml` (one step edited)

## Next Change

None. CI confirmed green on PR #67, which merged; this Change is closed. **(Correction, external
audit finding C0130-F4):** this section originally still read "once CI is confirmed green, this
Change can close" — stale text left over from before that had happened. Corrected here.
