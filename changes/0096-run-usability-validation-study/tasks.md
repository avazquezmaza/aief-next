# Tasks

## Instrument prep (assistant-doable — no participant involved)

- [x] Build the Executions Service base (Node/TS/Express/better-sqlite3, `executions` table with
      `tenant_id`/`status`, `GET /executions`). `fixtures/executions-service/`.
- [x] Snapshot A: seeded the tenant-scoping bug (the query ignores the `X-Tenant-Id` header
      entirely); a red test (`test/executions.test.ts`) demonstrates it — confirmed failing
      (`row 4 belongs to tenant-b, not tenant-a`); AIEF-adopted (`aief bootstrap --force`:
      `AGENTS.md`, `changes/0001-adopt-aief`, CI gate); `TASK.md` verbatim from `scenarios.md`'s
      Scenario A; jargon-checked (`grep -i aief README.md TASK.md` → empty).
- [x] Snapshot B: `fixtures/executions-service-b/` — same service, starting from Snapshot A's
      post-fix state (tenant filter applied, both tests green); the `status` filter feature is
      genuinely absent (confirmed: `status` appears only as a returned column, never as a query
      filter). AIEF-adopted (`aief bootstrap --force`); `TASK.md` verbatim from Scenario B;
      jargon-checked, and confirmed it names no implementation detail (no "SQL"/"WHERE"/
      "middleware"/"prepare(" anywhere in it) — the participant discovers the mechanism, not the
      task description.
- [x] Build the Reporting Monolith: `fixtures/reporting-monolith/` — a billing module (unrelated
      concern, for realism) plus a reporting module the frontend view imports **directly, in
      process** (no HTTP boundary) — the obvious seam Scenario C's strangler-split task targets.
      Smoke tests green (2/2). AIEF-adopted; `TASK.md` verbatim from Scenario C; jargon-checked,
      confirmed it names no mechanism (no "SQL"/"middleware"/"import"/"module"/"strangler"/"API
      boundary" anywhere in it).
- [x] Snapshot all three: each fixture's pristine state is the commit that introduces it in this
      repo — no separate git tag was added; the commit itself is the snapshot.

**Canonical restore recipe (one form, always identical — fixed after a review finding: a naive
`cp -r` would drag along `node_modules` that already exists on disk from testing these fixtures,
breaking the byte-for-byte guarantee across sessions since native builds like `better-sqlite3`
would stay pinned to whatever machine built them first):**

```bash
git archive HEAD -- changes/0096-run-usability-validation-study/fixtures/<fixture>/ \
  | tar -x -C /tmp/<destination>
cd /tmp/<destination>/changes/0096-run-usability-validation-study/fixtures/<fixture>
npm install
```

`git archive` exports only tracked files — `node_modules` (gitignored) never comes along regardless
of disk state. `npm install` runs fresh every time. Never `cp -r` the working tree directly.

## Pilot — P0

- [x] (human) Consent obtained and recorded (outside this repo). Confirmed 2026-09-01.
- [x] (human) Pre-check: confirm fresh-user status in the moment, not just from prior claim.
      Confirmed 2026-09-01.
- [x] (human) Run the pilot session per `protocol.md` §7 (pre-check → setup → task → debrief incl.
      Q7 → reset). Mandi moderates; no one else present. Run 2026-09-01 on Scenario A
      (`fixtures/executions-service/`), restored via the canonical recipe into `/tmp/piloto-p0`.
      Reached a correct close (independently re-verified — see evidence.md's "Pilot (P0)
      results": tests re-run 2/2 green, `## Status / Closed` confirmed on disk).
- [x] Record any **operational** issue found (recording, timing, repo prep) — cause named,
      fix applied. The protocol's design itself is not changed (§9b rule 1). **None found** — the
      session ran clean end to end; no adjustment to logistics or setup is needed before P1–P5.
- [x] Pilot data excluded from all aggregates, per `consolidation.md` §1. Recorded in this
      Change's own `evidence.md` only — `consolidation.md` (P1–P5's aggregates) is untouched by P0.
- [x] Restore the fixture to its pristine snapshot before P1, using the canonical restore recipe
      above (`git archive` + `npm install` — never `cp -r` the working tree).

## Scored sessions — P1–P5

- [x] (human) Consent obtained and recorded for each, before their session.
- [x] (human) P1 — junior, Scenario A. Run 2026-09-01. Reached a correct close (independently
      re-verified — see evidence.md's "P1 results"). One operational finding recorded (not a
      logistics defect requiring a fixture change): the pre-existing `0001-adopt-aief`'s own
      unchecked tasks blocked `aief close --yes` mid-session; resolved by the participant without
      a hint. Data recorded in `consolidation.md` (§1, §6, §7b).
      **Separate operational lesson (session-setup discipline, not the protocol's design):** an
      earlier attempt at this session produced duplicate/nested copies of the fixture in `/tmp/`
      (someone or something copying the working tree into a subdirectory of itself); restarted
      clean via the canonical `git archive` recipe. Worth stating explicitly to whoever sets up
      P2–P5: hand over the restored fixture directory as-is, and don't copy/move it once handed
      over.
- [x] (human) P2 — mid, Scenario A. Run 2026-09-01. Reached a correct close in ~3:45, 0 hints
      (independently re-verified — see evidence.md's "P2 results"). Unlike P1, this session
      closed `0001-adopt-aief` without reported friction — the same pre-existing 2-unchecked-task
      condition does not always produce a blocked-close finding. Data recorded in
      `consolidation.md` (§1, §7b).
- [x] (human) P3 — senior, Scenario A. Run 2026-09-01. Reached a correct close in 03:33, 0 hints
      (independently re-verified — see evidence.md's "P3 results"). Confirmed discoverability-by-
      transfer (navigated via CLI/git/npm conventions, not because AIEF was self-explanatory from
      zero) — the exact caveat `scenarios.md` §2 names for a senior pass. **Scenario A is now
      complete (P1/P2/P3)** — the 15-minute criterion (H8) is confirmed 3/3; see
      `consolidation.md` §2. Data recorded in `consolidation.md` (§1, §1b, §2, §6, §7, §7b).
- [x] (human) P4 — mid, Scenario B. Run 2026-09-01. Reached a correct close in ~6:30, 1 low-rung
      (1–2) hint — not an abandonment (independently re-verified — see evidence.md's "P4 results").
      Used AIEF's native `spec.md` for the feature spec without reaching for OpenSpec — direct
      data on the `spec.md`-vs-OpenSpec ambiguity `scenarios.md` names for this scenario. Data
      recorded in `consolidation.md` (§1, §1b, §6, §7b).
- [x] (human) P5 — senior, Scenario C. Run 2026-09-01. Reached a correct close (M-T3 = close of
      `0003-expose-reporting-api`, 06:18) with 0 hints — independently re-verified (see
      evidence.md's "P5 results"). **Notable finding**: continued past the scoped task and built a
      full standalone reporting service (`0004-create-reporting-service`), correct and
      well-tested, but beyond `TASK.md`'s literal "set up the first change" ask — recorded in
      `consolidation.md` §6 row 4, not folded into M-T3. **All five scored sessions are now
      complete.** Data recorded in `consolidation.md` (§1, §1b, §5, §6, §7, §7b, §8, §9).
- [x] Restore the relevant fixture to its pristine snapshot between every session, using the same
      canonical restore recipe every time — never mixed with an ad hoc copy.
- [x] Each observation sheet completed live and at debrief; no field left blank without a reason
      (P2/P3/P4 reported some fields qualitatively rather than as clean checkpoint numbers — noted
      explicitly as such in `consolidation.md`'s notes and §9, never silently invented).

## Consolidation

- [x] Fill `consolidation.md` from the real observation sheets — every table, every hypothesis
      outcome, the Problem ledger, threats to validity. No recommendation sentence anywhere.
- [x] Update this Change's own `evidence.md` with what was done, what the numbers were, and what
      remains pending.

## Verification

- [x] `aief verify --change 0096-run-usability-validation-study` → PASS.
- [x] No real participant name in any file this Change writes.
- [x] `git diff --stat` touches only this Change's own directory and the fixture-repo artifacts —
      no AIEF command/template/doc/Type/Track code.

## Human gates

- [x] (human) The project owner reads the completed `consolidation.md`. Confirmed 2026-09-01. This
      Change's own closure does not itself authorize redesign or thaw ADR-015 — that remains a
      separate, explicit decision (ADR-015's own text: "The thaw is a separate, later, explicit
      decision — it does not happen automatically when the study ends; it happens when a human
      reads the consolidation and says so"), not yet made.
