# 10 · Examples

> Two examples, deliberately at opposite extremes: the smallest thing AIEF should govern, and the largest thing it has actually governed. If both feel right, the progressive-complexity design holds.

---

## Example 1 — The smallest possible change

**A tenant filter is missing from an executions list. One-line fix.**

Under AIEF 1.x this work is *not governed at all* — not because governance was refused, but because four files for a one-line fix is a trade nobody makes. Ungoverned small work is where Flux Portal's status drift started.

### The whole thing

```console
$ aief
  What are you about to do?
> add the missing tenant filter to the executions query

  Bug fix, new capability, or system migration?
> bug fix

✓ changes/0014-tenant-filter-executions/change.md   (basic — 1 file)
```

```markdown
# Change 0014 — Tenant filter on executions

Track: basic
ADR: none
OpenSpec: none

## Goal
The executions list must only return rows for the caller's tenant.

## Evidence
Pending.
```

```console
$ aief prompt | pbcopy         # → assistant → fix + test
$ aief
  Change 0014 (basic) — evidence is empty.
```

```markdown
## Evidence
Added `WHERE tenant_id = $1` to `listExecutions()` (src/db/executions.ts:42).
Test `executions.spec.ts` covers cross-tenant denial: 3 passed.
Verified manually with two tenants: tenant B no longer sees tenant A's rows.
```

```console
$ aief
  Change 0014 (basic) — ready.
Next:
  aief close --change 0014-tenant-filter-executions
```

### What did not happen

No `spec.md`. No `tasks.md`. No `evidence.md`. No ADR. No OpenSpec. No profile choice. No assistant question. No documentation. **Three commands, one file, two questions, four lines of evidence.**

That evidence is worth more than the four scaffolds 1.x would have created, because someone actually wrote it.

---

## Example 2 — Flux Portal, in full

**A real Next.js/TypeScript/Postgres/Cognito multitenant frontend migration.** 13 Changes, two weeks, cutover executed, rollback rehearsed, verdict READY. It succeeded — and AIEF's CLI ran on day 0 and never again.

### How it went

```text
Day 0    aief adopt          ✓ structure, standards, skills, AGENTS.md stub
         aief analyze        ✓ Change 0002, correct detection
         ─────────────────────────────────────────────────────────
Day 1-14 (the CLI is never invoked again)
         13 Changes, hand-written                  9,011 lines
         7 ADRs, invented                          AIEF offered none
         knowledge/product/, invented              AIEF offered none
         rollback / parity / cutover, invented     AIEF offered none
         spec.md abandoned at Change 0008          6 Changes without one
         3 incompatible status formats             aief close never ran
         ─────────────────────────────────────────────────────────
Day 14   Cutover: READY ✓
Later    Reconciliation: 11/13 statuses contradicted their own evidence
```

### How it would go

```console
$ npx aief
  Next.js · TypeScript · Postgres · Cognito · n8n — detected
  What are you about to do?
> separate the frontend from the monolith, strangler, with cutover

  Bug fix, new capability, or system migration?
> migration

  Two systems will run at once. This Track carries parity, rollback and cutover.

✓ changes/0003-frontend-backend-separation/          (migration)
✓ .github/workflows/aief-verify.yml                  ← the gate F2 says was missing
```

```markdown
# Change 0003 — Frontend / backend separation

Track: migration
ADR: ADR-001-frontend-backend-separation
OpenSpec: frontend-backend-separation

## Parity      Old and new must be provably equivalent — per page.
## Rollback    Rehearsed, not written.
## Checkpoint  Foundation → functional.
```

The differences that matter:

| | What happened | What 2.0 changes |
|---|---|---|
| **ADR-007 (n8n tenancy)** | Shipped with no ADR. Lost. Reconstructed retroactively, days later | `ADR:` is a mandatory line. A migration Change with `ADR: none` must justify it ([F4](../dogfooding-findings.md)) |
| **spec.md at 0008** | Abandoned. `verify` would have FAILED forever | 0008 is `standard`; OpenSpec owns the contract; the gate asks for what exists ([08 §4](08-openspec.md#4-what-this-resolves)) |
| **`verify`** | Never ran. No `.github/` | Installed on day 0. Runs on every push (Law 3) |
| **13 statuses, 3 formats** | Hand-written prose. Reconciled months later | Readers accept human formats; ambiguity errors loudly (Laws 2 + 5) |
| **11/13 stale statuses** | Undetected until reconciliation | F1 is the prerequisite; F6 stays deferred (n=1) |
| **Rollback, parity, cutover** | Invented under deadline | Named by the Track ([06](06-profiles.md)) |
| **7 ADRs, knowledge/product/** | Invented, hand-maintained | Still the team's. AIEF names the slot; it does not fill it |
| **9,011 lines of governance** | All by hand | **Still by hand — and that's correct** |

### The point of that last row

**2.0 does not make Flux Portal cheaper.** A migration of that risk *should* cost 9,011 lines of governance, and the humans should write them. AIEF 2.0 would not have written one line of it.

What it changes is that **the tool would still have been running on day 14** — so the six missing specs would have been visible on day 2, the n8n decision would have been asked about at the moment it was made, and the statuses would have been true when they were written instead of reconciled months later.

That is the entire difference between the two versions, and it is not a feature.

---

## What the two examples prove together

| | Basic | Migration |
|---|---|---|
| Files | 1 | 4 + parity + rollback + cutover |
| Questions | 2 | 2 + escalation |
| Governance lines | ~6 | ~9,000 |
| Same tool | ✓ | ✓ |
| Same 6 steps | ✓ | ✓ |
| Same day-0 experience | ✓ | ✓ |

**Same entry, same flow, 1000× the artifacts.** If a redesign can't hold both ends without a fork in the tool or a fork in the docs, progressive complexity is a slogan rather than a design.
