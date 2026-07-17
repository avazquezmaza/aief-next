# Proposal — Mandatory `ADR:` / `OpenSpec:` declaration on a Change (F4)

> **Status: PROPOSED — design only. Not implemented.**
> Deliberately excluded from [Change 0036](../../changes/0036-governance-signal-integrity/),
> which repairs F1–F3. This document exists so the obligation is **designed and
> evidence-backed before it ships**, per [ADR-008](../../knowledge/decisions.md).
>
> Nothing here changes behaviour today. It asks for a decision, not code.

## The evidence

From the Flux Portal migration ([findings ledger](../dogfooding-findings.md#f4--an-architectural-decision-shipped-with-no-adr--p1--proposed)):

- **Change `0012-n8n-tenancy-mode`** introduced `N8N_TENANCY_MODE` — an **isolation
  posture** with fail-closed semantics, where the shipped mode (`shared_legacy`) provides
  **no n8n-level tenant isolation at all**. It referenced **no ADR**. The gap surfaced
  only during the closure reconciliation days later, and had to be repaired
  retroactively: an ADR was reconstructed from the Change and then human-ratified.
- **Five mutation domains** (users, roles, tenants, credentials, audit) reached
  production with **no contract**, by the same mechanism — nothing asked.

Neither was negligence. Both were *invisible*: **a blank field is indistinguishable from
a considered "none"**, and nothing ever posed the question.

## The problem, stated precisely

A Change declares `## Type`, and an Enrichment Change declares `## Requirement Source`.
Nothing declares whether the Change:

- **decided something architectural** → needs an ADR;
- **changed a contract** → needs an OpenSpec change.

The cost of the omission is asymmetric: the decisions most expensive to lose (an
isolation posture; a DELETE-capable endpoint's contract) are exactly the ones no
artifact forces you to name.

## What is proposed

Two fields in `change.md`, machine-checked by `aief verify`:

```markdown
## ADR

none — materializes ADR-001; no new architectural decision.

## OpenSpec

openspec/changes/frontend-parity-completion/ @ 1.0.0
```

Rules:

1. The field **must exist**.
2. It may carry a **reference** (an ADR id, a path, a contract id + version).
3. It may declare **`none`** — but `none` **must be written**, and should carry a reason.
4. **Empty or absent → `aief verify` fails.**
5. **Not every Change needs an ADR or a contract.** `none` is a first-class, correct,
   common answer — the rule targets *silence*, not *absence*.

> **The entire value is in rule 3.** The rule does not make anyone write an ADR; it makes
> them **answer the question**. Flux Portal's 0012 would have been caught not by a
> validator that understands architecture, but by a blank field someone had to fill.

## Why this is not in Change 0036

Mandatory fields are cheap to add and expensive to get wrong:

- **The `N/A` failure mode.** A rule that fires on Changes which genuinely need neither
  ADR nor contract trains everyone to type `none` without thinking. **A field filled
  reflexively is worse than no field**: it manufactures the appearance of a decision.
  AIEF's own history shows this exact decay — `aief adopt` emits templates whose
  placeholders sit unfilled for weeks (Flux's `0001` scope and `spec.md` are *still*
  empty; 14 `(adapt)` lines were never adapted).
- **It changes what a Change *is*.** F1–F3 repair behaviour that already exists and
  answers wrongly. This **adds an obligation** to the domain model — a different class of
  change, and one that touches every future Change and every existing one.
- **The evidence supports the problem, not yet the solution.** n=1 for the *solution
  shape*: we know silence lost a decision; we do not yet know that these two fields, in
  this form, are what catches it without becoming noise.

## Open design questions (to answer before implementing)

1. **Which Change types?** Implementation Changes plausibly; does an Analysis or
   Enrichment Change need `OpenSpec:`? Probably not — but "probably" is why this is a
   proposal.
2. **Retroactivity.** AIEF has 36 Changes and Flux has 13, none with these fields.
   Enforcing on existing Changes breaks both repositories at once. Options: enforce only
   on Changes created after adoption; warn (not fail) for a period; or enforce only when
   the field is present but malformed. **A rule that fails a healthy repository on day
   one will simply be turned off.**
3. **Is `none` enough, or must it carry a reason?** `none — materializes ADR-001` is
   informative; a bare `none` is a shrug. Requiring prose raises the cost of the reflex —
   and the cost of honesty.
4. **Verification depth.** Does `verify` check the reference *resolves* (the ADR/path
   exists)? That is a link checker, and adjacent to the traceability parser that ADR-008
   already defers for want of evidence.
5. **Who decides "architectural"?** No validator can. The field records a **human
   judgement**; the tool can only insist that one was made. That boundary must be
   explicit or the field becomes a false guarantee.

## Evidence that would promote this

- A **second** project where a decision or contract was lost to silence — confirming the
  mechanism generalises beyond Flux Portal.
- A trial on **one** repository showing the `none` answers are *specific* (carrying real
  reasons) rather than reflexive — i.e. the field measured something.
- An agreed retroactivity path that does not break AIEF's own 36 Changes.

## Recommendation

**Do not implement yet.** Adopt the *problem* into the ledger (done), keep the design
here, and revisit when the second data point exists — or when a Change is about to make
an architectural decision and a human wants the field to stop them. That is the honest
reading of ADR-008: AIEF grows from what real projects reveal, and one project revealed
the **problem**, not the **rule**.
