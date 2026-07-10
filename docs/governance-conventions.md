# Governance Conventions

> Conventions, not new CLI entities. Every pattern here is something Flux Portal dogfooding had to invent by hand; this document standardizes them as **writing conventions** compatible with the current parser. None of them adds a runtime concept, a new command, or hidden state. Where a convention *could* later become a machine-checked rule, that is called out as deferred to the closability-contract workstream ([docs/ROADMAP-TO-1.0.md](ROADMAP-TO-1.0.md)), gated on evidence per [ADR-008](../knowledge/decisions.md).
>
> Compatibility rule for everything below: a convention must never make `aief verify` or `aief close` fail on a well-formed Change. Only the classic `- [ ]` counts as an open (blocking) task; every marker introduced here was checked against that (see "Parser compatibility" at the end).

Companion reading: [docs/Workflow.md](Workflow.md) (canonical workflow), [docs/dogfooding-findings.md](dogfooding-findings.md) (the findings ledger this document acts on), [docs/domain-model.md](domain-model.md), [docs/runtime-governance-open-questions.md](runtime-governance-open-questions.md).

---

## 1. Tasks, gates and reviews

A `tasks.md` checkbox serves two different purposes; label the ones that are approval authority, not developer work.

```markdown
- [ ] Ordinary technical task
- [ ] (human) Human-only approval — an assistant must never check this
- [ ] (review) Independent review — by someone other than the original implementer, or an explicit human validation
```

Rules:

- An assistant must **not** mark a `(human)` task as complete. Only a human clears it. (The `aief prompt` output for Enrichment Changes already states this; the convention generalizes it to any Change.)
- A `(review)` task requires a review distinct from the implementation that produced the work, or an explicit human validation — the implementer checking their own `(review)` box defeats its purpose.
- Both `(human)` and `(review)` remain **blocking for `close`** while unchecked: they are still `- [ ]`, so the existing readiness gate already refuses to close over them. No new code is required for that.
- These labels are a **convention** today, not a parsed type. If CLI recognition is ever added, it must be minimal, test-backed, and must not change the meaning of existing checkboxes — it would only *extend* the closability contract (e.g. "warn if an assistant-authored diff checks a `(human)` box"), never redefine `[ ]`.

## 2. Deferred and moved work

Not every discovered item belongs to the current Change. Use a small, consistent vocabulary in `tasks.md` (and mirror the decision in `evidence.md` → Findings/Next Change) so traceability survives:

| Term | Meaning |
|---|---|
| **Out of Scope** | Never belonged to this Change. |
| **Deferred** | Discovered here, postponed deliberately. |
| **Moved To** | Relocated to another Change (name it). |
| **Blocked** | Belongs here, but a dependency stops it (name the dependency). |
| **Superseded** | Replaced by another decision or implementation. |
| **Abandoned** | Deliberately discarded, with a reason. |

None of these become CLI states. Record them as **resolved (non-blocking) checkbox lines** using the `[-]` marker, which the parser treats as "not an open task" (so it never blocks `close`):

```markdown
- [-] Moved To: changes/0041-auth-hardening — session-rotation split out.
- [-] Deferred: rate-limiting — revisit after the migration lands.
- [-] Blocked: needs backend capability BE-12 (PASS not yet recorded).
- [-] Out of Scope: analytics dashboard — belongs to a separate initiative.
```

Do **not** invent a marker the parser will miscount. A pending `- [ ]` blocks close (correct for real open work); a `[-]` line does not (correct for resolved/relocated work). Keep the reason on the same line so the diff is self-explanatory.

## 3. OpenSpec ↔ AIEF

```text
OpenSpec:  defines requirements, behavior and contracts — WHAT.
AIEF:      governs implementation, tasks, evidence and closure — HOW / PROOF.
```

Refined integration rule from Flux Portal:

> A frontend may be developed against an OpenSpec **DRAFT** contract or against **approved mocks**. Integration or closure against the **real backend**, however, requires that the corresponding backend capability has **PASS evidence recorded in AIEF**.

Practical conventions:

- Reference OpenSpec from an AIEF `spec.md` by **full path**, and record the **version or commit/ref** of the contract used — never paste the whole contract in (no duplicated source of truth; the contract stays OpenSpec-owned).
- Use full paths to disambiguate same-named files (`openspec/changes/<x>/spec.md` vs `changes/<id>/spec.md`).
- If the OpenSpec contract changes mid-implementation: note the new version in `evidence.md`, re-check acceptance criteria against it, and — if behavior shifted — record whether prior increments need revalidation.
- AIEF core does **not** parse, interpret, or execute OpenAPI/OpenSpec at this stage. It governs that a spec *exists* and that evidence *refers to* the validation the project ran.

## 4. Harness Engineering

- The validation **harness lives in the project's own repository**, not in AIEF.
- AIEF does **not** run Docker, Postgres, Jest, or any project-specific tool. It records that the project ran them.
- A Change may **declare how its implementation is validated**; `evidence.md` must record the **actual commands and results**.
- **Secrets never go in evidence** — record command names and outcomes, not tokens, connection strings, or credentials.

Optional section a Change may add (not required for every Change):

```markdown
## Validation Harness

- Bootstrap:
- Build:
- Lint:
- Test:
- Runtime validation:
- Teardown:
```

## 5. SDD (Spec-Driven Development) — target maturity now

- AIEF core does **not** generate clients or interpret contracts.
- AIEF **can** govern that a spec exists and that evidence references the validation the project executed.
- **OpenSpec** owns the contract.
- The **project** owns contract tests, mocks, validators and generated clients.
- No contract hashes and no semantic parsers in this stage — deferred as SDD experiments pending evidence.

## 6. Increments within large Changes

A temporary convention (no Parent-Child Changes):

- Break a large Implementation Change into clearly labeled sections in `tasks.md`.
- Record evidence **per increment** in `evidence.md` (an `## Increments` list or per-increment sub-entries).
- Do **not** start a dependent increment until the previous one's **PASS is recorded**.
- An increment PASS is **not** a Change closure — the Change closes only when all its criteria are met.
- **Split the Change** when it crosses deployment boundaries, needs different validation environments, or requires independent human decisions.

## 7. Architecture Checkpoints

An optional section (or a short checkpoint Change) at a phase boundary — e.g. foundation → functional migration. **Not** a CLI `Type`.

```markdown
## Architecture Checkpoint

Decision: GO / NO-GO

Readiness criteria:
- ...

Blockers:
- ...

Accepted risks:
- ...

Deferred work:
- ...

Rollback conditions:
- ...

Human approval:
- [ ] (human) Checkpoint approved by <role>
```

Keep it a convention/template. The human-approval line uses the `(human)` gate from §1, so it blocks closure until a human signs off.

## 8. Initiative — deferred finding only

> Evaluate support for long-running initiatives and a derived view of related Changes **after** the Flux Portal frontend migration completes.

Recorded in [knowledge/backlog.md](../knowledge/backlog.md). **Not** implemented in this cycle: no Initiative entity, no `Depends-On` metadata, no dependency graph.

---

## Parser compatibility

Verified against the current `aief verify` / `aief close` (which count only `^\s*- \[ \]` as open, blocking tasks):

- `- [ ] (human) …` / `- [ ] (review) …` → still `- [ ]` → **blocking while pending** (intended).
- `- [-] Moved To: …` (and every §2 deferred marker) → not `- [ ]` → **not counted, never blocks close** (intended).
- Optional `## Validation Harness`, `## Increments`, `## Architecture Checkpoint` sections → free-form Markdown, ignored by verify/close.

No convention here changes the meaning of an existing checkbox, and none requires a CLI change. If any graduates to machine enforcement later, it does so through the closability-contract workstream, backed by evidence.
