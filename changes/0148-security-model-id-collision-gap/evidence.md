# Evidence

## Summary

`docs/security-model.md` Known Gaps now says Change-ID collisions are detected (non-blocking), not
undetected. The stale text predated Changes 0135/0137.

## Activities Performed

1. Found during a review of open items after the 3.4.0 release: the bullet contradicted 0135/0137
   and C0130-F2's own status ("Resolved (detection); allocation-side prevention deliberately not
   pursued").
2. Checked live behavior before writing:
   - `aief verify` prints "Changes sharing a numeric ID (non-blocking)" with the `0122` pair.
   - `aief status --change 0122` prints `Ambiguous --change "0122" — 2 Changes match` and exits 1.
3. Rewrote the bullet.

## Verification

```bash
npm test                      # 1126/1126 pass
node cli/bin/aief.js verify   # PASS
git diff --check              # clean
```

## Findings

- The 0146 audit checked release themes against `docs/workflow.md`, `docs/cli.md` and
  `docs/getting-started.md`, but not `docs/security-model.md`'s Known Gaps.

## Risks

None; documentation only.

## Recommendations

- Future readiness audits: include "Known Gaps" and "Limitations" sections, which go stale when a
  later Change closes a gap.

## Artifacts Produced

- `docs/security-model.md`

## Lessons Learned

- Sections that list what is *missing* go stale silently when the gap is closed elsewhere.

## Next Change

Proposed: an Analysis Change on identity verification for `(human)`/`(review)`/`(gate:<id>)` tasks
(the next Known Gap in the same section).
