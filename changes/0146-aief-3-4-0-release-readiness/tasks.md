# Tasks

## Implementation

- [x] Confirm Changes 0105–0145 reachable from `main` and closed (42 Changes, two share `0122`).
- [x] Audit docs: dangling `docs/*.md` references, version strings, Node version, Kiro, gates, branch-per-Change, `verify --json`, Skills count.
- [x] Fix `docs/workflow.md` Tracks: gates are enforced by `close` (ADR-037).
- [x] Fix `docs/getting-started.md`: Node.js >= 22.
- [x] Fix `docs/cli.md`: `new-change` branch switch and `--no-branch`; `close` gate enforcement.

## Verification

- [x] `npm test`, `node cli/bin/aief.js verify`, `git diff --check`.

## Evidence

- [x] Update evidence.md, including the hand-off to the bump Change.
