# Change

## ID

`0096-run-usability-validation-study`

## Type

General

## Objective

**Execute** Change 0042's usability validation protocol — the two things 0042 itself explicitly
left for "a separate, later stage": preparing the fixture repos the protocol's three scenarios
require, running the pilot (P0) and the five scored sessions (P1–P5), and consolidating the
results into `consolidation.md`. This Change produces **evidence**, not a redesign — no AIEF
product surface changes here.

**Context correction (named, not silently absorbed):** an earlier draft of this Change framed
ADR-015's freeze as still entirely gated on this study running — that is no longer accurate.
**ADR-022** (accepted 2026-07-30, by the project owner) already thawed **new commands, onboarding,
and documentation simplification** for AIEF 3.1 directly, without waiting for this study —
Changes 0043–0095 (including the 3.1 and 3.2 releases) were built under that explicit override,
not under this Change's evidence. What ADR-022 left frozen, unweakened, is narrower: **DELETE/
ARCHIVE candidates** (the Change 0038 map) and **Type↔Track** (Change 0039). This Change's
consolidation still bears on that narrower remainder, and ADR-022 itself notes running this study
later "remains available and arguably more useful once there is a redesigned onboarding flow to
test" (i.e., against AIEF 3.1's actual result) — this Change is that later run, not a prerequisite
AIEF 3.1 waited on.

Depends on [0042-usability-validation-protocol](../0042-usability-validation-protocol/change.md)
(closed) — this Change runs the instrument 0042 built; it does not redesign it. Per
[protocol.md §9b](../0042-usability-validation-protocol/protocol.md#9b-execution-discipline-authorized-2026-07-17)
rule 1, the protocol is **not modified during execution** except for documented operational
causes (a tooling failure, a scheduling change, a disqualified participant).

## Scope

### In scope

- Build the three fixture repos `scenarios.md` specifies (they don't exist yet — 0042 delivered
  the spec, not the instances): the Executions Service (two snapshots, for Scenario A's bug and
  Scenario B's feature) and the Reporting Monolith (Scenario C). AIEF-adopted, `TASK.md` per
  scenario verbatim from `scenarios.md`, each snapshotted for byte-for-byte restore between
  sessions (`protocol.md` §6).
- Run the pilot (P0) to shake out logistics; adjust setup only for **operational**
  issues (recording, timing, repo prep) — never the protocol's design (§9b rule 1).
- Run the five scored sessions (P1–P5) per `scenarios.md` §5's fixed assignment.
- Fill `consolidation.md` from the real observation sheets — facts only, no recommendations
  (`consolidation.md` §8's own rule: "the sentence 'therefore we should…' does not appear").
- Record hypothesis outcomes (H1–H8, H-DISC, H9–H12) per `hypotheses.md`'s pre-stated
  confirm/refute conditions.

### Out of scope

- **Any redesign.** No fix for any problem this study finds — that is explicitly the next,
  separate stage. What this Change's consolidation actually gates (per the "Context correction"
  above): the DELETE/ARCHIVE candidates and Type↔Track, ADR-022's narrower remainder of ADR-015 —
  not new commands, onboarding, or documentation simplification, already thawed for AIEF 3.1.
- **Modifying the protocol's design** — scenarios, metrics, hint ladder, scoring — during
  execution (`protocol.md` §9b rule 1). Only documented operational adjustments.
- **Naming real participants anywhere in this Change's files.** Data is pseudonymous
  (`protocol.md`: "Data is pseudonymous... No participant is named in the consolidation") — this
  Change's own files carry the same guarantee. The real-name↔pseudonym mapping stays outside this
  repository entirely (consent/privacy — `protocol.md` §9).
- Recruiting more than the five scored + one pilot this cohort already has assigned.

## Success Criteria

- The three fixture repos exist, match `scenarios.md`'s repo-state requirements, and are
  snapshotted for reuse.
- The pilot session (P0) ran; any operational adjustment it produced is documented, with its
  cause named (§9b rule 1).
- All five scored sessions (P1–P5) ran, each observation sheet completed live and at debrief,
  each session's final repo state captured as an artifact.
- `consolidation.md` is filled from real data — no placeholder cells remain — with every
  hypothesis in `hypotheses.md` marked confirmed / refuted / inconclusive, evidence-backed.
- No real participant name appears in any file this Change writes.
- No AIEF product surface (commands, templates, docs, Type/Track) is touched.

## Status

Closed (2026-09-01)
