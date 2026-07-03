# Tasks

## Implementation

- [x] Run `aief doctor` on Flux Portal (read-only) and verify detection accuracy against package.json/README/CLAUDE.md.
- [x] Run `aief adopt`; confirm via `git status` that only untracked additions appeared.
- [x] Run `aief verify` (PASS) and `aief analyze` (created 0002).
- [x] Generate the architect prompt with `--assistant claude`; confirm CLAUDE.md referenced and code modification forbidden.
- [x] Fix observed frictions in AIEF: add `drizzle-orm`/`drizzle-kit` to the postgres detector; trigger `aws-saas-platform` on `cognito`; remove duplicated "Next:" in `doctor`; add `--assistant` to the `analyze` hint.
- [x] Add regression test for the catalog fixes.

## Documentation

- [x] Complete `changes/0001-adopt-aief/{evidence.md,tasks.md}` in the target project.
- [x] Record unfixed frictions as recommendations in evidence.

## Verification

- [x] CLI suite: 22/22 pass after fixes.
- [x] Re-run `doctor` on Flux Portal: `aws-saas-platform` now recommended; single "Recommended next step".
- [x] `aief verify` passes in both repositories.

## Evidence

- [x] Update evidence.md
