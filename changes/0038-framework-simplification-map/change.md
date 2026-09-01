# Change

## ID

`0038-framework-simplification-map`

## Type

Analysis

## Objective

Produce the **complete classification map** of every existing AIEF document, command and concept as **KEEP / MERGE / ARCHIVE / DELETE**, with the replacement, the destination of the information, and the capability check for every item that is not KEEP.

**Nothing is removed by this Change.** The map is the prerequisite for removal, not the removal.

## Governing rule (new)

> **No new capability enters AIEF's core unless it first removes, merges or replaces an equivalent capability.**

Adopted as a design rule by the project owner (2026-07-17). Recorded as **ADR-013** in [knowledge/decisions.md](../../knowledge/decisions.md).

Corollaries, from the same instruction:

- AIEF 2.0 is a **redesign, not an expansion**.
- **Backward compatibility is not a goal in itself.** Experience of use outranks it.
- The objective is to reorganize, simplify and make evident **what already exists** — not to add.
- Success is measured by a newcomer starting correctly in **under 15 minutes following only the main flow**, never by feature count.

## Terminology (settled)

Two separate concepts, never merged:

| | Meaning | Source |
|---|---|---|
| **Role** (existing Profiles) | *How should I reason?* — architect, developer, reviewer | [ADR-012](../../knowledge/decisions.md), `profiles/` |
| **Track** | *What kind of work is this?* — Basic, Standard, Migration | Approved conceptually, 2026-07-17 |

Tracks are **not** called Profiles. `profiles/` keeps its meaning and its files.

## Scope

### In scope

- Classification of every document, command and concept: KEEP / MERGE / ARCHIVE / DELETE.
- For each non-KEEP item: what replaces it, where the information lands, and the capability check.
- Definition of what ARCHIVE and DELETE mean operationally.
- Inbound-reference analysis for every removal candidate, so nothing is archived out from under a live citation.
- Recording ADR-013.

### Out of scope

- **Executing any removal, merge, archive or deletion.** This Change classifies only.
- Any implementation: no commands, verifiers, automations or parsers.
- Adding documents. The map lives in this Change, not as a twelfth file in `docs/aief-2.0/`.
- Changes 0036 and 0037.
- Modifying OpenSpec or SpecBoot.
- Rewriting closed Changes.

## Success Criteria

- Every artifact in the repository is classified exactly once, or is explicitly listed as out of the inventory.
- Every MERGE names a destination that exists or is created by the merge.
- Every ARCHIVE and DELETE demonstrates: what replaces it, where the information lives, and why no capability is lost.
- Every removal candidate lists the active files that reference it and must be re-pointed first.
- Items whose removal requires a code change are flagged as such.
- The map states the collisions the design rule forces into the open, rather than resolving them silently.

## Status

Closed (2026-09-01)

**THAWED 2026-09-01 — see [ADR-032](../../knowledge/decisions.md).** Frozen 2026-07-17 by project-owner decision until the usability study concluded; new commands/onboarding/documentation simplification were thawed early for AIEF 3.1 by [ADR-022](../../knowledge/decisions.md), leaving this map's own remainder (Candidate DELETEs, the ARCHIVE, MERGEs, the Type/Track conclusions) frozen. Change 0096 ran the study and consolidated its evidence; the project owner read it and thawed this remainder by ADR-032. **The map is still a classification, not a work order** — ADR-014 is unchanged: nothing on this map is executed by this thaw. Resuming means resuming the classification/design work, not any deletion.

**Reason the freeze existed (recorded, historical):** an apparently-dead artifact could have been evidence of a discoverability problem if a fresh participant reached for it during the study. Removing it first would have destroyed that evidence — no longer a live concern now that the study is complete.
