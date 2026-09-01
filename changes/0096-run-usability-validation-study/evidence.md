# Evidence

> **All five scored sessions plus the pilot are complete; consolidation is filled.** The
> assistant-doable block, the pilot (P0), P1–P5, and `consolidation.md` are all done. What
> remains — per this Change's own scope — is the `(human)` gate: the project owner reading the
> completed consolidation. This Change's own closure does not itself authorize redesign or thaw
> the remainder of ADR-015 (see change.md's "Context correction").

## P5 results (senior, Scenario C) — all five scored sessions now complete

Run 2026-09-01, restored via the canonical recipe into `/tmp/sesion-p5`. Recorded in
`consolidation.md` (§1, §1b, §5, §6 row 4, §7 incl. the H9 secondary note, §7b, §8, §9). **This is
the last scored session** — `consolidation.md` was finalized after this data landed.

**Metrics:** M-T0 00:16, M-T1 02:37, M-T2 01:00, **M-T3 06:18** (close of
`0003-expose-reporting-api` — the artifact matching `TASK.md`'s literal ask; confirmed with the
user before recording, since work continued past this point — see below), M-IDLE 00:00, M-HINT 0,
M-TSTUCK 0. Reached a correct close.

**Independently re-verified (not just transcribed):**
- Confirmed `changes/0002-analyze-current-architecture/` carries `## Type / Analysis` — consistent
  with the claimed `aief analyze` invocation (verified the artifact shape, not just the claim).
- Diffed `src/app.ts` against the pristine fixture: a **surgical, 2-line addition** —
  `GET /api/reports/summary`, delegating to the existing in-process `reporting/service.js`. The
  legacy `/reports` view was left completely untouched — the "no downtime, keep the old one
  running" requirement holds structurally, not just by claim.
- Read `src/reporting-service/` (new, not required by `TASK.md`): a standalone Express app with an
  HTTP client (`ReportingApiClient`) consuming the new seam, a `502` on upstream failure, and its
  own `/health` endpoint. Re-ran `npm test` myself: **6/6 green**, including two new tests specific
  to this service (upstream-failure handling, health check).
- Confirmed on disk: all four Changes (`0001`–`0004`) closed; `aief verify`: PASS, "no open
  Change".

**The major finding of this session — and arguably of the whole study:** `TASK.md` asked only to
*"set up the first change of this migration correctly"* (`scenarios.md`'s own framing: *"Only the
start. No participant migrates a system in 60 minutes."*). The participant satisfied that with
`0003` (the API seam) at 06:18, then **continued unprompted and fully extracted the reporting
service** (`0004`, closed ~09:24) — real, correct, well-tested work, with no hint, no gate, and
nothing in the flow signaling that the scoped task was already done. Recorded as
`consolidation.md` §6 row 4, classified "other" (none of the seven taxonomy classes fit a
scope-exceeding, non-blocking, self-initiated continuation cleanly) — **confirmed with the user**
that M-T3 stays at the 06:18 close matching the literal task, with the 0004 work recorded
separately rather than folded into the headline metric.

**Debrief, in full:**

- *Where did you feel lost/unsure what to do next?* "Never — `aief status` and the automatic
  `Next:` recommendations gave immediate clarity on which command or file to complete."
- *What did you expect that wasn't there?* "Everything needed for the lifecycle was present and
  available in the CLI (`doctor`, `status`, `analyze`, `new-change`, `verify`, `close`)."
- *Which words/labels confused you?* "None — Change/spec/evidence/seam/Strangler all align with
  standard refactoring and modular-architecture terminology."
- *What did you do without fully understanding but seemed to work?* "Nothing — every action, in
  code and in AIEF's own metadata, had explicit technical justification."
- *What did you never come to understand?* "The whole governance and service-separation cycle was
  fully understood and executed."
- *If a colleague started tomorrow, what's the one thing you'd warn them about?* "Don't skip
  workflow steps: always adapt the standards at the start, run `npm test` before verifying, and
  fill `evidence.md` with real data before invoking `aief close`."
- **Q7 (reported as a summary, not verbatim — flagged, confirmed with the user):** would keep
  exactly the same strategy and sequence — adopt/adapt, formal architectural analysis, extract the
  zero-downtime API seam, build the decoupled service with output-parity tests — calling it the
  safest, most auditable path for a Strangler Fig migration.

**H9 (secondary hypothesis) — directly relevant, not decided here:** P5's own debrief and Q7
attribute her success to **prior migration experience and domain knowledge**, never to AIEF
prompting rollback/parity/cutover concepts. With n=1 for Scenario C, this leans toward H9 *not*
holding as stated, but a single senior session can't rule out whether a less experienced
participant on the same scenario would have needed the tool to surface those concepts instead.
Recorded in `consolidation.md` §7 as inconclusive-leaning, not confirmed/refuted outright.

## P4 results (mid, Scenario B)

Run 2026-09-01, restored via the canonical recipe into `/tmp/sesion-p4`. Recorded in
`consolidation.md` (§1, §1b, §6 rows 2 and 3, §7b).

**Metrics:** M-T3 ~06:30 (6-phase breakdown reported by the moderator, not checkpoint-based — see
below). M-HINT: **1–2** (moderator confirmed at least one hint was needed, rung 1–2, "no content"
— the specific trigger wasn't detailed). M-ABANDON: 0 (rung < 3 does not count as abandonment).
Reached a correct close.

| Phase | Duration | Activity |
|---|---|---|
| Pre-check y diagnóstico | ~0:45 | Workspace inspection, `TASK.md`, baseline `npm test`, `aief status` |
| Adopción y gobernanza | ~1:00 | Closed the pre-existing `0001-adopt-aief`, created the new Change |
| Especificación (`spec.md`/`change.md`) | ~1:30 | Scope, requirements, acceptance criteria |
| Implementación (`src/app.ts`) | ~1:00 | `status` query-param handling, parameterized SQL |
| Testing y docs | ~1:30 | Exhaustive test cases incl. isolation check, curl examples updated |
| Verificación y cierre | ~1:00 | `evidence.md`, `aief verify`, close |
| **Total** | **~6:30** | |

**Independently re-verified (not just transcribed):**
- Diffed `src/app.ts` against the pristine Snapshot B: adds `status` query-param handling with a
  second parameterized branch (`WHERE tenant_id = ? AND status = ?`) — falls through to the
  existing tenant-only query when `status` is absent. Correct, complete implementation of the
  spec'd feature.
- Re-ran `npm test` myself: **3/3 green**, including the participant's own added case
  (`GET /executions?status=... filters results by status`).
- Confirmed on disk: `changes/0002-filter-executions-by-status/` created and `## Status / Closed`;
  `changes/0001-adopt-aief/` also closed. `aief verify`: PASS, "no open Change".

**`spec.md` vs. OpenSpec — direct data point** (`scenarios.md`'s named ambiguity for this
scenario): the participant used AIEF's native `spec.md` (`## Goal`/`## Requirements`/
`## Acceptance Criteria`) directly, without reaching for OpenSpec. His own observation: `aief
status` lists OpenSpec/SpecBoot as optional adapters, and for a fresh developer that phrasing
could raise the question of whether external tooling needs installing versus the local `spec.md`
being sufficient — he resolved this without a hint, but names it as a real ambiguity a newer
developer might not resolve as cleanly.

**Recurring theme, now 2 of 4 sessions (Q7, §6 row 3, both mid-level):** P2 wanted `spec.md`
inferred from a failing test; P4 wanted `evidence.md`'s test/verification output collected
automatically rather than pasted by hand. Both "missing automation," both mid — noted, not yet
attributable to experience level with n=2.

**Q7 (reported as a summary, not verbatim — flagged, confirmed with the user):** would secure
closing the pre-existing adoption Change before instantiating the new one; add strict typing and
validation for invalid `status` values (already specified in `spec.md`); automate collecting test
results into `evidence.md` to speed up the AIEF close cycle. The first point — closing the
adoption Change first — is itself a data point on the recurring `0001-adopt-aief` interaction
theme (§6 rows 1–2): P4 already did this cleanly in practice (phase 2 of his own breakdown) and
names it as something to keep doing, not something he got wrong.

## P3 results (senior, Scenario A) — Scenario A now complete

Run 2026-09-01, restored via the canonical recipe into `/tmp/sesion-p3`. Recorded in
`consolidation.md` (§1, §1b, §2, §6, §7, §7b). **With P3, all three Scenario A participants are
done** — the 15-minute criterion (H8) is confirmed 3/3, see `consolidation.md` §2.

**Metrics:** M-T3 03:33, M-HINT 0, reached a correct close.

**Independently re-verified:**
- Diffed `src/app.ts` against the pristine fixture: same `WHERE tenant_id = ?` shape as P0/P1/P2.
- Participant added her own test (`GET /executions returns only the specific tenant rows and
  empty for unknown tenant`).
- Re-ran `npm test` myself: **3/3 green**.
- Confirmed on disk: `changes/0002-filter-executions-by-tenant/` created and `## Status / Closed`.
  **`changes/0001-adopt-aief/` was left open** — a third distinct pattern (P1 hit friction closing
  it then resolved it; P2 closed it cleanly; P3 never touched it at all, since `TASK.md` never
  asked her to). `aief verify`: PASS, one Change still open (the untouched adoption Change) —
  correct, expected state, not an error.

**Debrief, in full** (richer than P1/P2's — recorded here since `consolidation.md`'s tables only
have a slot for Q7, not the narrative questions):

- *Where did you feel lost/unsure what to do next?* "Momentarily unsure whether `0001-adopt-aief`
  (already in the fixture) had to be closed first, or whether the bugfix Change could be created in
  parallel. Seeing the `--change <id>` flag made it clear they're independent." → recorded as
  `consolidation.md` §6 row 2 (self-resolved, "annoyed" not "slowed").
- *What did you expect that wasn't there?* "A direct command to auto-generate `evidence.md` from a
  test/linter run, instead of pasting the output manually." (Echoes P2's Q7 — a second,
  independent signal toward the same "missing automation" class.)
- *Which words/labels confused you?* "None in particular — `spec`/`tasks`/`evidence`/`verify`/
  `close` map naturally onto the standard spec→verify cycle."
- *What did you do without fully understanding but seemed to work?* "Passing `--yes --change <id>`
  to close — assumed by CLI convention that `--yes` skips interactive prompts, and it worked first
  try." — another explicit discoverability-by-transfer instance.
- *What did you never come to understand?* "Nothing critical for this basic flow. Didn't need to
  touch the role of profiles or secondary standards in `knowledge/` for a point bugfix."
- *If a colleague started tomorrow, what's the one thing you'd warn them about?* "Check `aief
  status` and `AGENTS.md` first before touching code — if you try to close a Change with pending
  tasks in `tasks.md` or without evidence, it'll bounce you back."
- **Q7 (reported as a summary, not verbatim — flagged, confirmed with the user):** "would create
  the Change (`aief new-change`) immediately, before writing the first line of code or test, so the
  scaffolding guides the spec and tasks from minute zero."

**Discoverability-by-transfer, confirmed explicitly** (the exact caveat `scenarios.md` §2 names for
a senior pass — "did they *know* or *guess* the path?"): the moderator's own assessment states P3
navigated via transferred conventions from git/npm-style CLIs and RFC/ADR-style artifact
structures (`status`, `verify`, `close` read as semantically familiar; `AGENTS.md` read like a
project README) — not because AIEF's flow was self-explanatory from zero. Recorded in
`consolidation.md` §1b as the explicit answer to its own "seniors who guessed" question.

## P2 results (mid, Scenario A)

Run 2026-09-01, restored via the canonical recipe into `/tmp/sesion-p2`. Recorded in
`consolidation.md` (§1 Sessions summary, §7b Q7 table).

**Metrics reported by the moderator** (phase breakdown, not checkpoint-based — see
`consolidation.md`'s note² for why M-T1/M-T2 are recorded as not-reported rather than forced):

| Phase | Duration |
|---|---|
| Diagnóstico (read `TASK.md`, ran `npm test`, found the bug) | 0:30 |
| Implementación (SQL fix + own extra test) | 1:30 |
| Verificación y AIEF (tests, `evidence.md`, `aief verify`, close) | 1:45 |
| **Total (M-T3)** | **3:45** |

M-HINT: 0. Reached a correct close.

**Independently re-verified (not just transcribed):**
- Diffed the final `src/app.ts` against the pristine fixture: same `WHERE tenant_id = ?`,
  parameterized fix shape as P0 and P1.
- The participant added his own test (`GET /executions for non-existent tenant returns empty
  array`) — self-initiated, not required by the fixture's own suite.
- Re-ran `npm test` myself: **3/3 green**. Ran `npm run build`: succeeds (participant's own
  reported check, confirmed).
- Confirmed on disk: `changes/0002-filter-executions-by-tenant/` created and `## Status / Closed`;
  `changes/0001-adopt-aief/` also closed. `aief verify`: PASS, "no open Change".

**Notable, compared to P1:** the same pre-existing `0001-adopt-aief` (2 unchecked tasks by
default, confirmed present in every fresh restore of this fixture — not something P1's session
caused) did **not** produce a reported blocked-close friction here. One data point is not enough
to call this inconsistent or resolved; it means the same starting condition doesn't guarantee the
same friction for every participant — exactly the kind of experience-level/individual variation
`consolidation.md` §1b exists to segment, once all five sessions are in.

**Q7 (verbatim, confirmed):** *"Sería genial que `aief new-change` pudiera inferir o autocompletar
parte del `spec.md` directo desde el test que está fallando para escribir aún menos boilerplate."*

## P1 results (junior, Scenario A)

Run 2026-09-01, restored via the canonical recipe into `/tmp/sesion-p1`. Consent and the
fresh-user pre-check confirmed before the session. Recorded in `consolidation.md` (§1 Sessions
summary, §6 Problem ledger, §7b Q7 table) — the first scored session, so the first data that
actually enters the study's aggregates (unlike P0).

**Metrics reported by the moderator:**

| Metric | Value |
|---|---|
| M-T1 (time to first Change) | 09:22 |
| M-T2 (time to first `verify`) | 12:00 |
| M-T3 (time to correct close) | 12:10 |
| M-IDLE | ~5:30 |
| M-HINT (rungs climbed) | 0 |
| Docs opened | `TASK.md`, `README.md`, `AGENTS.md`, `knowledge/standards/*.md`, both Changes' own files, `src/app.ts`, `test/executions.test.ts` |
| Commands discovered | `aief status`, `aief prompt`, `aief doctor`, `aief explain new-change`, `aief new-change`, `aief verify`, `aief close` — all confirmed real against this AIEF version's own `--help`/`explain` output |

**Independently re-verified (not just transcribed):**
- Diffed the final `src/app.ts` against the pristine fixture: adds `WHERE tenant_id = ?`,
  parameterized — technically correct, same fix shape as the pilot's.
- The participant added her own test (`GET /executions returns tenant-specific rows and isolates
  tenant-b`), covering tenant-b isolation and an unknown-tenant edge case (empty array) — not
  required by the fixture's own test suite, self-initiated.
- Re-ran `npm test` myself: **3/3 green**.
- Confirmed on disk: `changes/0002-fix-tenant-executions-filter/` created and `## Status / Closed`;
  `changes/0001-adopt-aief/` also closed (its own two previously-unchecked tasks — adapting the
  "(adapt)" standards lines, running verify+close — were completed first).
- `aief verify` in the session's final state: PASS, "no open Change" (both Changes closed cleanly).

**One real operational finding** (not a fixture defect — recorded as data, `consolidation.md` §6
row 1): `aief close --yes --change 0001-adopt-aief` was attempted before that Change's own
unchecked tasks were resolved, and the error message doesn't name the file to check. The
participant resolved it herself, with zero hints. Q7's answer (moderator's paraphrase, **not
verbatim** — flagged as such in `consolidation.md` rather than recorded as the participant's own
words) pointed at the same friction: the error message not naming the checklist's path.

**A separate, purely operational note**, unrelated to the protocol's design: this session's setup
went through a false start — duplicate/nested copies of the fixture appeared under `/tmp/` at one
point (traced to copying the working tree into a subdirectory of itself), discarded and restarted
clean via the canonical `git archive` recipe. Worth stating explicitly for P2–P5's setup: hand over
the restored directory as-is; don't copy or move it once handed over.

## Pilot (P0) results

Run 2026-09-01, Scenario A (`fixtures/executions-service/`), restored via the canonical recipe
(`git archive` + `npm install`) into `/tmp/piloto-p0`. Consent and the fresh-user pre-check were
confirmed before the session. **Per `consolidation.md` §1, this data is excluded from all
aggregates** — recorded here only, for the pilot's actual purpose (shaking out logistics).

**Metrics reported by the moderator:**

| Metric | Value |
|---|---|
| M-T1 (time to first Change) | 00:03:29 |
| M-T2 (time to first `verify`) | 00:03:56 |
| M-T3 (time to correct close) | 00:10:38 |
| M-IDLE | ~4 min 46 s (the gap between the verify pass and the close confirmation) |
| M-HINT (rungs climbed) | 0 — no intervention needed |
| Docs opened | `TASK.md`, `README.md`, `AGENTS.md`, `src/app.ts`, `test/executions.test.ts`, both Changes' own files (`0001-adopt-aief/`, `0002-fix-tenant-isolation/`) |
| Commands discovered | `aief status`, `aief explain close`, `aief verify` — all real commands, confirmed against this AIEF version's own `--help` output |

**Independently re-verified (not just read from the reported evidence):**
- Diego's fix (`WHERE tenant_id = ?` added, parameterized) is technically correct — diffed against
  the pristine fixture.
- Re-ran `npm test` myself in `/tmp/piloto-p0`: **2/2 green**, including the test that failed
  before the fix.
- `## Status / Closed (2026-09-01)` confirmed present in `changes/0002-fix-tenant-isolation/change.md`
  on disk; `aief verify` in that directory lists it `(closed)`.

**Outcome: reached a correct close, autonomously, no hints.** No operational issue found — the
fixture, the setup instructions, and the session logistics all worked as designed. No adjustment
needed before running P1–P5.

## Summary

Built and verified the three fixture repositories `scenarios.md` requires. They did not exist
before this Change — 0042 delivered the scenario specifications, not runnable instances. No
sessions have been run yet; no product surface was touched.

## Activities Performed

1. **Executions Service (Scenario A)** — `fixtures/executions-service/`. Node/TS/Express with
   better-sqlite3, `executions` table (`tenant_id`/`status`), `GET /executions`. Seeded the
   tenant-scoping bug: the list query ignores the tenant and returns every tenant's rows. AIEF
   adopted via `aief bootstrap --force` (the Change 0078 nesting guard fired first, as designed;
   `--force` is the deliberate exit for this legitimate case). `TASK.md` copied verbatim from
   Scenario A.
2. **Executions Service — Snapshot B (Scenario B)** — `fixtures/executions-service-b/`. Same
   service starting from A's post-fix state (tenant filter applied, tests green); the `status`
   filter feature is genuinely absent. `TASK.md` verbatim from Scenario B.
3. **Reporting Monolith (Scenario C)** — `fixtures/reporting-monolith/`. A reporting module the
   frontend view imports directly in-process (no HTTP boundary) — the seam the strangler-split
   task targets. `TASK.md` verbatim from Scenario C.
4. Documented the canonical restore recipe (`git archive` + `npm install`, never `cp -r`) in
   `tasks.md`, so every between-session reset is byte-for-byte identical.

## Verification

- **Scenario A red test:** confirmed failing — `row 4 belongs to tenant-b, not tenant-a`.
- **Scenario B feature absence:** confirmed `status` appears only as a returned column, never as a
  query filter; both inherited tenant tests green.
- **Scenario C seam:** direct in-process coupling present; smoke tests green (2/2).
- **Jargon check (guard F2):** each `TASK.md` and `README.md` checked — no AIEF vocabulary, and
  no implementation mechanism named in any `TASK.md` (the participant must discover it).
- **Outer-repo gates:** `npm test` 997/997; `aief verify --change 0096-run-usability-validation-study`
  PASS (in progress — evidence completes at close); `git diff --check` clean.
- **Privacy (R9):** no real participant name appears in any file this Change writes (verified by
  grep across the Change directory).

## Findings

None from the instrument-prep stage beyond the two review corrections applied while opening this
Change (real names removed from `tasks.md`/`change.md`; the ADR-022 context correction naming that
the freeze is now narrower than this study). Session findings are pending and will land in
`consolidation.md`, not here.

## Risks

- **Native-build reproducibility:** better-sqlite3 is a native module; the canonical restore recipe
  (`git archive` + fresh `npm install`) avoids pinning a prebuilt binary to one machine. Mixing in
  a `cp -r` of the working tree would break the byte-for-byte guarantee — flagged in `tasks.md`.
- **Pseudonym leakage in recordings:** real names must never appear in a path, prompt, or anything
  on screen during a session. Convention adopted: `/tmp/piloto-p0`, `/tmp/sesion-p1`, etc.

## Recommendations

None. This Change proposes no solutions (ADR-015). Any redesign is a separate, later stage gated on
the completed `consolidation.md` being read by a human.

## Artifacts Produced

- `fixtures/executions-service/` — Scenario A (bug present).
- `fixtures/executions-service-b/` — Scenario B (feature absent).
- `fixtures/reporting-monolith/` — Scenario C (seam present).
- Canonical restore recipe documented in `tasks.md`.

## Lessons Learned

- `git archive` is the correct restore primitive for a fixture snapshot: it exports only tracked
  files, so a gitignored `node_modules` left on disk from testing never contaminates a fresh copy.
- Keeping the tenant mechanism (the `X-Tenant-Id` header) out of `TASK.md` but present in the code
  and README preserves the discovery measurement — the symptom is stated in business terms, the
  cause is discovered.

## Next Change

None yet. The next stage is running the sessions (P0 then P1–P5) and filling `consolidation.md` —
that is this same Change's `(human)` work, not a new Change. A redesign Change may only originate
from the completed consolidation (protocol.md §9b rule 4).
