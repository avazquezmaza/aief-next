# Tasks

## Implementation

- [x] Evidence-state detection in `prompt` (empty and template both count as "no real content").
- [x] Re-run guardrail block (amend, don't overwrite; report re-verification).
- [x] "Where results belong" block (project evidence vs AIEF/tooling feedback; no automatic feedback.md).
- [x] Analysis-branch wording: "complete or amend"; tasks.md human-owned unless delegated; report tasks that appear complete.

## Documentation

- [x] docs/cli.md: one guarantee bullet on prompt re-run safety and results ownership.
- [x] CHANGELOG entry.

## Verification

- [x] 3 new tests (guardrail present with real evidence; absent with placeholder and with empty evidence; feedback/tasks-ownership blocks present).
- [x] Full suite: 43/43 pass.
- [x] `aief verify` at repo root passes.

## Evidence

- [x] Update evidence.md
