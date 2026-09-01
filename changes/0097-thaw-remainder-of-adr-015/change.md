# Change

## ID

`0097-thaw-remainder-of-adr-015`

## Type

General

## Objective

Record the project owner's explicit decision — the one mechanism [ADR-015](../../knowledge/decisions.md)
itself named as sufficient to lift its freeze — to thaw the remainder ADR-022 left frozen
(Candidate DELETE/ARCHIVE from [Change 0038](../0038-framework-simplification-map/)'s map, and
Type↔Track from [Change 0039](../0039-type-track-derivation-design/)), now that
[Change 0096](../0096-run-usability-validation-study/) has run the usability study and consolidated
its evidence. This Change is the governance record of that decision — it does not itself perform
any classification, design, or deletion work; it only unblocks Changes 0037/0038/0039/0041 to
resume theirs.

## Scope

### In scope

- A new ADR (**ADR-032**) in `knowledge/decisions.md`, honest about what Change 0096's
  consolidation did and did not establish (it validated the main flow broadly; it never ran a
  dedicated Type/Track or DELETE-candidate hypothesis).
- A pointer update in ADR-015 itself, noting it is now fully thawed (by ADR-022 for three items,
  by this ADR for the remaining two) — its reasoning stays on record, not retracted.
- Updating Change 0038's own change.md, which carried explicit `FROZEN` language naming ADR-015,
  to reflect the thaw.

### Out of scope

- **Any classification, design, or deletion work itself.** Changes 0037/0038/0039/0041 resume
  their own work in their own right, separately — this Change only removes the block.
- **Executing any DELETE/ARCHIVE verdict.** ADR-014 (DELETE is a consensus state, never a single
  reviewer's call) is unmodified — nothing is deleted by this Change or by ADR-032.
- Re-litigating ADR-015's or ADR-022's original reasoning — both stay on record as accepted,
  unretracted decisions.

## Success Criteria

- ADR-032 exists, accurately scoped, honest about the consolidation's actual relevance to
  DELETE/ARCHIVE and Type↔Track specifically (incidental, not a dedicated finding).
- ADR-015's own entry points to both thaws (ADR-022, ADR-032) without rewriting its original text.
- Change 0038's `FROZEN` language updated to `THAWED`, pointing at ADR-032. (The freeze was always
  documentary — no code in `cli/src` enforced it — so there is no CLI check to update; the
  documentary record is the whole mechanism.)
- `aief verify` PASS; no unrelated file touched.

## Status

Closed (2026-09-01)
