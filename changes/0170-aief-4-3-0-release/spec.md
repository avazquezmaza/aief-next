# Specification

## Goal

`main` contains everything AIEF 4.3.0 ships, with its version and release notes, ready to tag.

## Requirements

- R1: Changes 0161–0169 are closed (`## Status` Closed) and their commits are reachable from `main`.
- R2: `package.json` and `cli/package.json` are at 4.3.0; `aief --version` prints `aief 4.3.0`.
- R3: `releases/v4.3.0.md` has upgrade notes (new commands/flags, the `--type` behavior change, how
  to pick up the Gemini skill and guard in an existing project), a summary per Change, and
  verification evidence with real counts.
- R4: `changes/README.md` lists 0161–0170 under 4.3.0 and opens an empty Unreleased section.
- R5: No doc still names 4.2.0 as current (pre-tag grep, `docs/maintainer.md` "Releasing");
  diagrams regenerate without drift.

## Acceptance Criteria

- [x] R1–R5 done.
- [x] `npm test`, `npm run lint`, `aief verify`, `git diff --check` pass.
- [x] (human) Approve 4.3.0 release readiness before close.
