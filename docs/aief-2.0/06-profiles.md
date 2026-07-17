# 6 · Profiles — Basic / Standard / Migration

> Deliverable 7. **Naming:** the brief calls these *profiles*; this design calls them **Tracks**, because [ADR-012](../../knowledge/decisions.md) already defines "Profile" as role reasoning (architect, developer, reviewer). The two are orthogonal — an architect can work a `basic` Track. See [03 §5.1](03-proposed-map.md#51-adr-012-operational-profiles--terminology-collision-not-a-contradiction); **the name is a human decision, not settled here.**

## 1. What a Track is

**One line in `change.md` that decides how much governance this work carries.**

```markdown
Track: basic
```

It is the progressive-complexity mechanism. Not a preference, not a permission level, not a role: a **statement about the work's risk**. `aief` infers it and proposes it; the human confirms or overrides. It is never a blank field.

Everything else in AIEF 2.0 keys off this line: which artifacts exist, what `verify` demands, which questions get asked.

## 2. The three Tracks

| | **Basic** | **Standard** | **Migration** |
|---|---|---|---|
| **For** | Bugs, docs, small changes, dependency bumps | New features, API changes, integrations | System separation, modernization, large refactors, strangler, cutover |
| **The test** | Nothing outside this change depends on the result | Someone else's code or a user will depend on this | Two systems will run at once |
| **Minimum artifacts** | **`change.md`** — goal + evidence in one file | `change.md` + `spec.md` + `evidence.md` | `change.md` + `spec.md` + `tasks.md` + `evidence.md` |
| **ADR** | **Never.** A decision worth an ADR means it wasn't basic — escalate | **When** the decision is expensive to reverse. `ADR: none` is a valid recorded answer | **Expected.** `none` requires justification |
| **OpenSpec** | **Never.** `OpenSpec: none` | **When** an observable contract exists ([08](08-openspec.md)) | **Per contract.** Flux: 5 OpenSpec changes across 13 Changes |
| **Rollback** | Never — git revert is the rollback | **When** it can break production for real users | **Always. Rehearsed, not written** |
| **Cutover** | Never | Never — if you need one, it's a Migration | **Always** |
| **Parity** | Never | Never | **Always** — old vs new must be provably equivalent |
| **Checkpoint** | Never | Never | **At phase boundaries** ([governance-conventions §7](../governance-conventions.md#7-architecture-checkpoints)) |
| **Increments** | Never | Optional | **Expected** ([§6](../governance-conventions.md#6-increments-within-large-changes)) |
| **Human gate** | Close | Close | Close + checkpoints + cutover |
| **`verify` demands** | Evidence non-empty | + spec present, acceptance criteria checked | + tasks complete, parity + rollback evidenced |
| **Flux Portal** | — | 0008, 0012 | 0003–0007, 0013 |

## 3. Escalation

**Tracks escalate; they never de-escalate.** A `basic` Change that turns out to need an ADR becomes `standard` — you change the line and the missing artifacts appear. Going the other way would delete evidence of why the work was governed.

The escalation triggers are the five questions from [01 §5](01-vision.md#5-progressive-complexity-concretely), and **the user is only ever asked the ones their Track leaves open**:

```text
basic ──"did you decide something expensive to reverse?"──────► standard (+ ADR)
basic ──"does something outside depend on this shape?"────────► standard (+ OpenSpec)
standard ──"will two systems run at once?"────────────────────► migration (+ parity, cutover, rollback)
standard ──"can this break production for real users?"────────► standard + rollback
```

A `basic` Change is asked **nothing**. That is the point: the smallest work carries no questions at all, and 90% of work is the smallest work.

## 4. Why this is the fix, and how it could be wrong

### The argument

Flux Portal wrote `spec.md` seven times and then stopped, permanently. Under 1.x's uniform rules, the only way to satisfy `verify` was to write six specs nobody wanted. They chose to stop running `verify` instead — and that decision cost them F1, F2 and F6, because a tool that isn't running can't warn you about anything.

Tracks make the gate *want what the work wants*. Changes 0008–0013 would declare `standard` or `migration` and be asked for what they actually had: evidence, parity, rollback — all of which they wrote, at length, by hand.

### How it could be wrong

**This is the study's load-bearing hypothesis, and it is not proven.** Nobody recorded why Flux stopped writing specs. The alternative explanation is simpler and less flattering to this design: **they stopped because they were rushing** (Change 0008 opened in "throughput mode" — AIEF's own dogfooding record says so), and no amount of proportionality would have helped.

If that's the true cause, then F2's fix alone is sufficient, Tracks add a concept for nothing, and this document is over-engineering dressed as user-centricity.

**The experiment that decides it** ships in [11-roadmap.md](11-roadmap.md) stage 1, before any Track code: deliver the uniform CI gate at adoption, then watch a real project. If they satisfy it → Law 4 is refuted, Tracks are unnecessary, delete this document. If they disable it, `continue-on-error` it, or ignore red builds → the gate asked for the wrong thing, and Tracks earn their place.

**Do not build Tracks before that experiment reports.** Building both at once makes the result uninterpretable — the exact ADR-008 failure mode of shipping structure that no observation demanded.

## 5. What a Track is not

- **Not a permission level.** No Track relaxes AGENTS.md, the human gate, or the Prime Directive. A `basic` Change is *smaller*, never *looser*.
- **Not a role.** That's ADR-012's Profile. Orthogonal.
- **Not detected from the codebase.** Standards must never become project detection (ADR-012's orthogonality rule); a Track is a claim about *this work*, and only the human can make it. AIEF may propose, never decide.
- **Not a size estimate.** A one-line change to an auth check is `standard` or worse. Risk, not effort.
- **Not a new state.** It lives in `change.md`, in the diff, in review. Law 6.
