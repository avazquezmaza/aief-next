# Evidence

## Summary

`aief status`'s overview now reports a numeric-ID collision the same way `aief verify` already
does — reusing Change 0135's `detectDuplicateChangeIds()` as-is, following that Change's own
recommendation.

## Activities Performed

- Added the collision note to `statusOverview()`, immediately after the existing
  manifest-status-drift note it deliberately mirrors — same reused function, same non-blocking
  posture.
- Confirmed manually, before writing any test: `aief status` against this repository's own real
  `0122-*` collision reports `"Changes sharing a numeric ID: 1"` with the expected line.
- Hit the exact collision this whole line of work is about, again, live: `aief new-change`
  initially assigned this Change id `0136`, colliding with the not-yet-merged
  `0136-fix-qs-vulnerability-in-study-fixtures-and-enable-secret-scanning` branch. Renamed to
  `0137` before writing any code — documented in change.md.
- Added `status` tests mirroring the existing `verify` collision tests exactly (collision
  present / absent).

## Verification

- `npm test` (cli/): 1106/1106 passed (2 new).
- `npm run lint`: clean.
- `node cli/bin/aief.js verify --change 0137-surface-change-id-collisions-in-status-overview --strict`: PASS.
- `git diff --check`: clean.

## Findings

- None beyond what change.md already named.

## Risks

- None identified. Reuses an already-reviewed, already-tested detection function; adds no new
  logic, only a rendering call site.

## Recommendations

- None further — this was itself the recommended follow-up from Change 0135.

## Artifacts Produced

- `cli/src/commands/status.js` (extended).
- `cli/tests/cli-graph-and-verification.test.js` (2 new tests).

## Lessons Learned

- Colliding on `0136` while scaffolding this exact Change is a small, almost funny confirmation
  that the underlying gap (Change 0135/C0130-F2) is real and ongoing, not a one-off — worth
  keeping in mind that this detection-only fix does not prevent the collision from happening,
  only makes it visible once it does.

## Next Change

- None required now.
