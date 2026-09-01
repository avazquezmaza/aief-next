# Specification

## Goal

`releases/v3.3.0.md` reads as a real release note — grounded in the closed Changes' own evidence,
not invented — matching the bar the existing `releases/*.md` files set.

## Requirements

- Every claim in the Summary traces to a closed Change (0090–0103) and its own evidence.md.
- Verification section states what was actually run and its actual result, not a generic
  boilerplate list.

## Acceptance Criteria

- [x] `releases/v3.3.0.md` has no placeholder `-` bullets remaining.
- [x] `npm test`, `node cli/bin/aief.js verify`, `git diff --check` all pass.
