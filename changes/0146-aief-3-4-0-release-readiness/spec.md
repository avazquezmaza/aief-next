# Specification

## Goal

`main` at 3.4.0-readiness accurately documents what shipped since 3.3.0, matching the bar Changes
0087 and 0102 set.

## Requirements

- `docs/workflow.md` "Tracks": state that `aief close` enforces the track's
  `review`/`approval`/`security_review` gates through human-checked `(gate:<id>)` lines (ADR-037),
  replacing the stale "gates are read-only narration" sentence.
- `docs/getting-started.md`: Node.js requirement `>= 22` (matches `engines.node`).
- `docs/cli.md`: the `new-change` row documents the automatic branch switch on `main`/`dev` and
  `--no-branch`; the `close` row documents gate enforcement for tracked Changes.
- No other documentation edit unless the audit finds another verified gap.
- The `README.md` "AIEF 3.3" status line is recorded as a bump-Change item, not edited here.

## Acceptance Criteria

- [x] Integration check recorded: 42 Changes closed and reachable from `main`.
- [x] The three documentation gaps fixed.
- [x] Version-string item handed to the bump Change in `evidence.md`.
- [x] `npm test`, `node cli/bin/aief.js verify` and `git diff --check` pass.
