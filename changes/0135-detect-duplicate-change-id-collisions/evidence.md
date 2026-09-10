# Evidence

## Summary

Resolves external-audit finding C0130-F2's detection half: `aief verify` now names any Change
numeric-ID collision project-wide, non-blockingly — the same posture Change 0095 already
established for manifest/change.md status drift. Verified against this repository's own real,
pre-existing `0122-*` collision, not only synthetic fixtures.

## Activities Performed

- Added `detectDuplicateChangeIds(basenames)` to a new domain module, grouping basenames by
  leading numeric id, returning only real collisions (groups of size > 1).
- Wired it into whole-project `aief verify`'s existing rendering path, immediately after the
  manifest-status-drift note it deliberately mirrors — same non-blocking, informational
  posture, same code shape.
- Ran `aief verify` (no flags) against this repository's own current state before writing any
  test: it correctly reported `- 0122: 0122-ci-apt-chrome-mirror-flakiness,
  0122-multi-agent-runtime-open-questions — a bare "--change 0122" reference is ambiguous...`,
  with `Result: PASS` unaffected — confirming the feature against a real collision, not only a
  synthetic one.
- Updated Change 0130's Findings Status table: C0130-F2 marked Resolved (detection), with an
  explicit note that allocation-side prevention was considered and deliberately not pursued.

## Verification

- `npm test` (cli/): 1104/1104 passed (9 new: 7 unit tests for the pure function, 2 integration
  tests for `verify`'s rendering).
- `npm run lint`: clean — including Change 0128's architecture-fitness rules (the new module
  imports nothing from services/commands).
- `node cli/bin/aief.js verify --change 0135-detect-duplicate-change-id-collisions --strict`: PASS.
- `git diff --check`: clean.
- Manually confirmed (see Activities) that running `aief verify` against this repository's own
  real, historical `0122-*` collision produces the expected output — not assumed from the
  synthetic test fixture alone.

## Findings

- None beyond what change.md already named.

## Risks

- None identified. Purely additive detection; never changes `verify`'s exit code or blocks
  `close`.

## Recommendations

- If this note is found valuable, extend it to `aief status`'s overview (mirroring how the
  manifest-drift note appears in both `verify` and `status`) — not bundled here to keep this
  Change's diff scoped to the one location Change 0095 itself started with.
- The allocation-side alternative (make `nextChangeId()` structurally collision-proof across
  branches) remains available if detection alone proves insufficient in practice — deliberately
  not pursued now, since it would require some form of cross-branch coordination this project's
  "no hidden state" principle does not currently have a precedent for.

## Artifacts Produced

- `cli/src/core/domain/change-id-collisions.js` (new).
- `cli/src/commands/verify.js` (extended).
- `cli/tests/change-id-collisions.test.js` (new), `cli/tests/cli-graph-and-verification.test.js`
  (2 new tests).
- `changes/0130-codex-external-audit/evidence.md` (Findings Status table).

## Lessons Learned

- Mirroring an existing, already-reviewed pattern (Change 0095's drift note) end-to-end —
  same non-blocking posture, same rendering location, same "detection only" framing — made this
  Change's design decisions mostly already-made, not re-litigated from scratch.

## Next Change

- None required now. See Recommendations for the optional `status`-overview extension and the
  allocation-side alternative, both deferred until a concrete need appears.
