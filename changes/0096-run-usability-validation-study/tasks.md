# Tasks

## Instrument prep (assistant-doable — no participant involved)

- [ ] Build the Executions Service base (Node/TS/Express/SQLite, `executions` table with
      `tenant_id`/`status`, `GET /executions`).
- [ ] Snapshot A: seed the tenant-scoping bug (query missing the `tenant_id` filter); add a red
      test or a manually-reproducible repro; AIEF-adopt (`aief bootstrap`); write `TASK.md`
      verbatim from `scenarios.md`'s Scenario A; jargon-check by a fresh reader.
- [ ] Snapshot B: same service, tenant bug already fixed, `status` filter feature missing;
      AIEF-adopt; `TASK.md` verbatim from Scenario B; jargon-check.
- [ ] Build the Reporting Monolith (frontend view + embedded backend `reporting/` module, obvious
      seam); AIEF-adopt; `TASK.md` verbatim from Scenario C; jargon-check.
- [ ] Snapshot all three (git tag or archive) before any session.

## Pilot — P0

- [ ] (human) Consent obtained and recorded (outside this repo).
- [ ] (human) Pre-check: confirm fresh-user status in the moment, not just from prior claim.
- [ ] (human) Run the pilot session per `protocol.md` §7 (pre-check → setup → task → debrief incl.
      Q7 → reset). Mandi moderates; no one else present.
- [ ] Record any **operational** issue found (recording, timing, repo prep) — cause named,
      fix applied. The protocol's design itself is not changed (§9b rule 1).
- [ ] Pilot data excluded from all aggregates, per `consolidation.md` §1.
- [ ] Restore the fixture repo to its pristine snapshot before P1.

## Scored sessions — P1–P5

- [ ] (human) Consent obtained and recorded for each, before their session.
- [ ] (human) P1 — junior, Scenario A.
- [ ] (human) P2 — mid, Scenario A.
- [ ] (human) P3 — senior, Scenario A.
- [ ] (human) P4 — mid, Scenario B.
- [ ] (human) P5 — senior, Scenario C.
- [ ] Restore the relevant fixture repo to its pristine snapshot between every session.
- [ ] Each observation sheet completed live and at debrief; no field left blank without a reason.

## Consolidation

- [ ] Fill `consolidation.md` from the real observation sheets — every table, every hypothesis
      outcome, the Problem ledger, threats to validity. No recommendation sentence anywhere.
- [ ] Update this Change's own `evidence.md` with what was done, what the numbers were, and what
      remains pending.

## Verification

- [ ] `aief verify --change 0096-run-usability-validation-study` → PASS.
- [ ] No real participant name in any file this Change writes.
- [ ] `git diff --stat` touches only this Change's own directory and the fixture-repo artifacts —
      no AIEF command/template/doc/Type/Track code.

## Human gates

- [ ] (human) The project owner reads the completed `consolidation.md`. This Change's own closure
      does not itself authorize redesign or thaw ADR-015 — that is a separate, explicit decision
      (ADR-015's own text: "The thaw is a separate, later, explicit decision — it does not happen
      automatically when the study ends; it happens when a human reads the consolidation and says
      so").
