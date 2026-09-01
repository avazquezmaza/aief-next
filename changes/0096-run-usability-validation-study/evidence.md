# Evidence

> **Partial evidence — pilot + P1 + P2 complete, P3–P5 and consolidation pending.** The
> assistant-doable block, the pilot (P0), P1, and P2 are done. P3–P5 and the consolidation remain
> `(human)` work not yet done.

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
