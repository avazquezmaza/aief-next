# Evidence

> **Partial evidence — instrument prep stage.** The assistant-doable block (build the three
> fixture repos) is complete and verified. Everything past it — the pilot (P0), the five scored
> sessions (P1–P5), and the consolidation — is `(human)` work not yet done. This file will be
> completed with session numbers and outcomes once the sessions run.

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
