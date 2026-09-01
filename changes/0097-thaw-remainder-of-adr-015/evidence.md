# Evidence

## Summary

Recorded the project owner's explicit decision — confirmed 2026-09-01, after reading
`consolidation.md` (Change 0096) — to thaw the remainder ADR-015 left frozen after ADR-022's
earlier partial thaw: Candidate DELETE/ARCHIVE (Change 0038's map) and Type↔Track (Change 0039).
New ADR-032 in `knowledge/decisions.md`, a pointer update on ADR-015 itself, and Change 0038's own
`FROZEN` language replaced with `THAWED`. No classification, design, or deletion work performed —
this Change only removes the block; Changes 0037/0038/0039/0041 resume their own work separately.

## Activities Performed

1. Confirmed with the project owner, explicitly, which items to thaw (both — not one).
2. Wrote ADR-032, honest about scope: it names what Change 0096's consolidation actually
   established (the main flow broadly) versus what it did not (no dedicated Type/Track or
   DELETE-candidate hypothesis), and names the one incidental signal (no participant needed
   Type/Track/ADR/OpenSpec/SpecBoot/profile/skill to succeed) as supporting context, not proof of
   any specific artifact's verdict.
3. Updated ADR-015's own entry with a one-line pointer to ADR-022 and ADR-032, without altering its
   original decision/consequences text — its reasoning stays on record, not retracted.
4. Updated Change 0038's `FROZEN` paragraph to `THAWED`, pointing at ADR-032, preserving the
   historical "why the freeze existed" reasoning as a past-tense record.
5. Confirmed the freeze was always documentary — grepped `cli/src` for "ADR-015"/"FROZEN": no code
   enforced it (only two incidental matches, both unrelated comments) — so there is no CLI
   behavior to verify changing; the documentary record is the entire mechanism.

## Verification

```bash
npm test                                          # -> 997/997 pass
node cli/bin/aief.js verify --change 0097-thaw-remainder-of-adr-015   # -> PASS
git diff --check                                  # -> clean
git status --short
#  M changes/0038-framework-simplification-map/change.md
#  M knowledge/decisions.md
#  ?? changes/0097-thaw-remainder-of-adr-015/
```

Exactly the files scoped in spec.md — nothing else touched.

## Findings

- The freeze this Change lifts was never mechanically enforced by any command — `aief status`,
  `aief verify`, and `aief close` never printed anything referencing ADR-015 or "frozen." The
  entire freeze lived in the prose of `change.md` files and `knowledge/decisions.md`. This confirms
  the acceptance criterion originally drafted for this Change ("`aief status` no longer reports...
  as blocked") was based on a wrong assumption about the mechanism — corrected in spec.md/change.md
  before this evidence was written, not left as a stale claim.
- ADR-022 already established the precedent this ADR follows exactly: thaw by explicit project-
  owner decision, honest about what does and doesn't justify it, ADR-014/013 reaffirmed unmodified.
  No new architectural pattern was needed here — applying an already-accepted one.

## Risks

- **Resuming Changes 0037/0038/0039/0041 does not itself validate their draft content.** Each must
  be read fresh against its own spec.md when work resumes — this Change does not pre-approve
  anything already drafted in them.
- **The incidental Type/Track/ADR/OpenSpec/SpecBoot-not-needed signal could be over-read** as
  stronger evidence than it is — it was never a named hypothesis, and this Change's own ADR-032
  text says so explicitly to prevent that overreading.

## Recommendations

None. This Change is a governance record, not a design or implementation Change — Changes
0037/0038/0039/0041 own their own next steps, separately, on their own timelines.

## Artifacts Produced

- `knowledge/decisions.md` — new ADR-032; pointer update on ADR-015.
- `changes/0038-framework-simplification-map/change.md` — `FROZEN` → `THAWED`.
- `changes/0097-thaw-remainder-of-adr-015/` (this Change).

## Lessons Learned

- A freeze recorded only in prose is real and binding by convention, but leaves no mechanical trace
  to grep for when it's time to lift it — worth remembering if a future freeze of this shape is
  ever considered: naming which specific commands/checks (if any) should reflect it, even if none
  do today, makes the eventual thaw easier to verify exhaustively.

## Next Change

None from this Change. Changes 0037, 0038, 0039, and 0041 are unblocked and may each be resumed
independently, on their own schedule.
