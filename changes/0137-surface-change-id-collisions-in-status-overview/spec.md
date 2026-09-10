# Specification

## Goal

`aief status`'s overview reports a numeric-ID collision the same way `aief verify` already
does — reusing the same detector, same non-blocking posture.

## Requirements

- R1: `statusOverview()` calls `detectDuplicateChangeIds()` (Change 0135) against
  `getChangeDirs()`'s basenames and, when non-empty, prints `"Changes sharing a numeric ID:
  <n>"` followed by one line per collision, matching `verify.js`'s message text exactly except
  for the omitted `"(non-blocking)"` qualifier already implicit in `status`'s own informational
  framing (matching how the manifest-drift note's header text also differs slightly between the
  two commands).
- R2: Never changes `aief status`'s exit code or any other section's output.

## Acceptance Criteria

- [ ] A project with two Changes sharing a numeric id shows the collision in `aief status`'s
      output.
- [ ] A project with no such collision shows no such line.
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0137-surface-change-id-collisions-in-status-overview --strict`
      all pass.
