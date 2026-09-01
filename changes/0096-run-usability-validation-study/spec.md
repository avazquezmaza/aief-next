# Specification

## Goal

Turn 0042's reviewed, approved protocol into real evidence: three prepared fixture repos, a run
pilot, five run scored sessions, and a `consolidation.md` filled with facts — nothing more,
nothing redesigned.

## Requirements

- **R1** — Build the Executions Service (Node.js + TypeScript + Express + SQLite, multi-tenant
  `executions` listing), AIEF-adopted, in two snapshots:
  - **Snapshot A** — the tenant-scoping bug present (Scenario A's `TASK.md`, verbatim from
    `scenarios.md`).
  - **Snapshot B** — the bug already fixed, the `status` filter feature missing (Scenario B's
    `TASK.md`, verbatim).
- **R2** — Build the Reporting Monolith (same lightweight stack), with an obvious
  frontend/backend coupling for Scenario C's strangler-split task (`TASK.md`, verbatim).
- **R3** — Each fixture repo is AIEF-adopted (`aief bootstrap`: `AGENTS.md`, `changes/`, the CI
  gate) and contains **zero** AIEF vocabulary outside what a real adopted project carries — no
  cheat-sheet, no pinned command, no hint (`scenarios.md` §6).
- **R4** — Each fixture repo is snapshotted (git tag or archive) before any session, and restored
  byte-for-byte between sessions using the same scenario (`protocol.md` §6).
- **R5** — The pilot (P0) runs first. Its data is excluded from all aggregates
  (`consolidation.md` §1: "P0 pilot excluded from all aggregates"). Any operational issue it
  surfaces is fixed and the fix is documented with its cause, per `protocol.md` §9b rule 1 — the
  protocol's design (scenarios, metrics, hints, scoring) is never changed mid-execution.
- **R6** — The five scored sessions (P1–P5) run per `scenarios.md` §5's fixed assignment
  (experience level × scenario), following `protocol.md` §7's session procedure (pre-check, setup,
  task, debrief including the mandatory Q7, reset).
- **R7** — Every observation sheet (`observation-sheet.md`, one copy per participant) is filled
  live and completed at debrief, per real events — no field left blank without a reason.
- **R8** — `consolidation.md` is filled entirely from the real sheets: every table cell, every
  hypothesis outcome (`hypotheses.md`'s pre-stated confirm/refute conditions), the Problem ledger,
  the threats-to-validity section. No recommendation sentence appears anywhere in it (its own
  §8 rule).
- **R9** — No real participant name is written into any file this Change produces. The
  moderator's records tie pseudonym to identity outside this repository.
- **R10** — No AIEF product surface changes. ADR-015's freeze is unaffected by this Change's own
  closure — it lifts only when a human reads the completed consolidation and says so (ADR-015's
  own text).

## Acceptance Criteria

- [ ] Executions Service (both snapshots) built, AIEF-adopted, `TASK.md` verbatim, jargon-checked.
- [ ] Reporting Monolith built, AIEF-adopted, `TASK.md` verbatim, jargon-checked.
- [ ] All three repos snapshotted for restore.
- [ ] Pilot (P0) run; any operational adjustment documented with cause.
- [ ] Five scored sessions (P1–P5) run per the fixed assignment; each observation sheet complete.
- [ ] `consolidation.md` filled from real data; zero placeholder cells remain; every hypothesis
      marked confirmed/refuted/inconclusive with evidence.
- [ ] No real name in any file this Change writes.
- [ ] `git diff --stat` touches only `changes/0096-.../` and the fixture-repo artifacts this
      Change explicitly creates (outside this repository, or in a clearly separate directory if
      kept alongside it) — no AIEF command, template, doc, or Type/Track code changed.
- [ ] (human) Consent obtained and recorded (outside this repo) for every participant before
      their session.
- [ ] (human) The project owner reads the completed `consolidation.md` before any redesign work
      starts — this Change's closure does not itself authorize redesign (ADR-015).
