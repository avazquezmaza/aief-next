# Specification

## Goal

Turn the project owner's explicit "I read the consolidation, thaw the remainder" decision into a
governed, traceable ADR — the exact mechanism ADR-015 itself required — without overstating what
Change 0096's consolidation actually established about the two frozen items specifically.

## Requirements

- **R1** — ADR-032 records: what is thawed (Candidate DELETE/ARCHIVE, Type↔Track), by whom (the
  project owner), the precondition it satisfies (ADR-015's own "run and consolidated"), and which
  Changes resume (0037, 0038, 0039, 0041).
- **R2** — ADR-032 states plainly what the consolidation did and did not test: it validated the
  main flow (H4/H5/H6/H8), never ran a Type/Track- or DELETE-candidate-specific hypothesis. The one
  relevant incidental signal (no participant needed Type/Track/ADR/OpenSpec/SpecBoot/profile/skill
  to succeed) is named as supporting context, not proof of any specific artifact's verdict.
- **R3** — ADR-032 reaffirms ADR-014 (DELETE remains a consensus state) and ADR-013 (each resuming
  Change still owes its own removal accounting) are unmodified.
- **R4** — ADR-015's own entry gets a short pointer to both ADR-022 and ADR-032, without altering
  its original decision/consequences text.
- **R5** — Change 0038's `FROZEN` language is updated to reflect the thaw, pointing at ADR-032,
  without altering the rest of its own map content.
- **R6** — No DELETE/ARCHIVE verdict is executed; no Type/Track implementation happens. This Change
  only removes the block.

## Acceptance Criteria

- [x] ADR-032 added to `knowledge/decisions.md`, dated 2026-09-01, attributed to the project owner.
- [x] ADR-015's entry updated with a thaw pointer, original text otherwise unchanged.
- [x] Change 0038's change.md `FROZEN` paragraph replaced with a `THAWED` one, pointing at ADR-032.
      (Note: the freeze was always documentary, never a mechanical CLI gate — confirmed by
      grepping `cli/src` for "ADR-015"/"FROZEN": no code enforced it. This Change updates the
      record, not a check `aief status` ever printed.)
- [ ] `aief verify` PASS.
- [ ] `git diff --stat` touches only `knowledge/decisions.md`, `changes/0038-.../change.md`, and
      this Change's own directory.
