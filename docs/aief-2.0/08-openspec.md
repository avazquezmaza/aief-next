# 8 · Relationship with OpenSpec

> Deliverable 9. **OpenSpec is not modified.** Not its code, not its format, not its workflow. This document only says *when* AIEF invokes it and *how* AIEF refers to what it produces.

## 1. The rule

> **AIEF never holds a contract. It holds a reference to one.**

Everything below follows from that sentence.

## 2. The decision

One question, asked once per Change, with only two answers:

```text
                  Does something outside this Change
                depend on the SHAPE of what you produce?
                (an API, an event, a schema, a payload
                 someone else's code must match)
                              │
              ┌───── NO ──────┴────── YES ─────┐
              ▼                                ▼
      OpenSpec: none                    Invoke OpenSpec
      (recorded, not blank)                    │
                                               ▼
                                          Validate
                                               │
                                               ▼
                                    OpenSpec: <change-id>
                                    (referenced in change.md)
                                               │
                                               ▼
                                      Never copied into AIEF
```

**`none` is an answer, not an absence.** A blank field means nobody asked; `OpenSpec: none` means someone asked and decided. This is [F4](../dogfooding-findings.md)'s whole insight, and it is why the field is mandatory while the contract is not.

### Reading the question correctly

"Observable contract" is the trap — it sounds like it means "public API". It means: **if you changed the shape of this, would something you don't control break?**

| Work | Contract? | Why |
|---|---|---|
| Fix a tenant filter bug | **No** | Behavior changes; shape doesn't |
| Add a field to an API response | **Yes** | Consumers match on shape |
| Rename an internal function | **No** | Nothing outside depends on it |
| Change an n8n webhook payload | **Yes** | n8n is outside |
| Add a Postgres column | **It depends** | Yes if another service reads it; no if it's private to this service |
| Write documentation | **No** | — |

Flux Portal's answer: **5 OpenSpec changes across 13 AIEF Changes.** Roughly a third. That ratio is what a healthy relationship looks like — most work has no contract.

## 3. Never 1:1

**AIEF Changes and OpenSpec changes are different units and must never be forced to align.** A Change is *a unit of governed work*; an OpenSpec change is *a contract under revision*. One Change may touch two contracts, or none; one contract may span three Changes.

Flux's 5:13 ratio is the evidence. Any design that generates an OpenSpec change per AIEF Change — or an AIEF Change per OpenSpec change — would have produced 8 empty contracts or 8 ungoverned Changes.

The reference is **one line in `change.md`**, and it points one way: AIEF → OpenSpec. Never a mirror, never a sync, never a copy.

## 4. What this resolves

**`spec.md` was the duplicate all along.** The audit's sharpest unexplained fact — [`spec.md` abandoned at Change 0008 and never resumed](02-current-map.md#2-what-flux-portal-actually-used) — has a candidate explanation here: when OpenSpec owns the contract, AIEF's `spec.md` is either a copy of it or a stub. The team kept writing OpenSpec changes while `spec.md` died. They were maintaining one artifact and had stopped believing in the other.

Under this rule:

| Situation | `spec.md` |
|---|---|
| Contract exists, OpenSpec owns it | **Does not exist.** `change.md` references the OpenSpec change |
| No contract, but acceptance criteria matter | Exists — acceptance criteria only, never a contract |
| Basic Track | Does not exist |

*This is a hypothesis with a clean test: ask the Flux authors why `spec.md` stopped. One conversation settles what this study can only infer from file timestamps.*

## 5. What AIEF must never do

- **Duplicate a contract.** Not "for convenience", not "as a summary", not "so it's all in one place".
- **Wrap OpenSpec's CLI as if it were AIEF's.** `aief propose` had 0 observed uses; the team drove OpenSpec through their assistant's slash commands, which is [ADR-011 Level 2](../../knowledge/decisions.md) working exactly as designed. AIEF adding a wrapper nobody uses is surface, not integration.
- **Require OpenSpec.** The no-OpenSpec path is the normal path (ADR-002), not a degradation.
- **Modify OpenSpec.** Out of scope, permanently.
- **Silently succeed when OpenSpec is ambiguous.** OpenSpec's own `validate --all` bug — `4 passed` while skipping a change — is the same failure as F1. AIEF must not inherit it: if AIEF cannot confirm a referenced contract validated, it says so ([Law 5](01-vision.md#law-5--when-the-truth-cannot-be-determined-fail-loudly)).

## 6. The division

| | OpenSpec | AIEF |
|---|---|---|
| Owns | The contract | The work |
| Answers | *Is this shape correct and agreed?* | *Is this work done and evidenced?* |
| Artifact | `openspec/changes/<id>/` | `changes/<id>/` |
| Closure | `/archive` | `aief close` |
| Neither replaces the other | ✓ | ✓ |

Unchanged from ADR-002 and ADR-011. **The relationship was never wrong — it was just optional in a way that made it invisible.** The declaration line is what makes it visible.
