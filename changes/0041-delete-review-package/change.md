# Change

## ID

`0041-delete-review-package`

## Type

Analysis

## Objective

Prepare the **independent-review package** for every item Change 0038 marked DELETE. One record per item: path, artifact type, reason, references found, replacement, unique information, deletion risk, recommendation.

**Nothing is deleted, approved or executed.** The author of the map is not an approver.

## Result

The first review **overturned 11 of 16 DELETE verdicts**. An **independent second reader** (no access to this package or the map) then reviewed R1–R6 and reached **0 of 6 deletable** — more conservative than the first, and it found a coupling the first missed (`aief doctor` depends on the navigator, not only `status`). Combined matrix and reconciliation in [evidence.md](evidence.md).

After both reviews, the only files that remain candidate-DELETE are **R10–R14 (7 dead templates)** — and those have **not** had a second reader yet, so **no DELETE is executable**.

The most serious correction: **`aief propose` must be KEEP.** It is mandated by an accepted ADR (ADR-002), was extended by Change 0030 as the documented continuation path for an **enriched Change after Human Review**, and is covered by 8 tests. Deleting it would have broken the Enrichment workflow and the human gate the approved direction explicitly protects.

## Review rules applied

- The map's author is **not** the approver — every record below carries a recommendation, not a decision.
- **Any doubt turns DELETE into ARCHIVE.**
- Zero references must be proven **recursively**.
- References searched in: code · tests · documentation · templates · CLI · examples · workflows · ADRs · Changes.
- **No non-recursive globs** — the rule exists because a non-recursive glob is exactly what made the map undercount `docs/navigator/` by 3×.
- Commands used are recorded ([evidence.md](evidence.md)).
- Onboarding is reviewed last and by hand.

## Scope

### In scope

- One review record per DELETE item ([spec.md](spec.md)).
- Recursive reference analysis across all nine surfaces.
- Unique-information analysis — what would be lost.
- Per-item recommendation with its reasoning.

### Out of scope

- **Deleting, renaming, archiving or moving anything.**
- Approving the map.
- Link validation on a temporary copy — **belongs to the execution Change**, since there is nothing to validate until something moves.
- The onboarding cluster's content merge (reviewed last, by hand).

## Success Criteria

- Every DELETE item has a complete record.
- Every "zero references" claim is proven by a recorded recursive command.
- Every item with unique information is downgraded from DELETE.
- Overturned verdicts state what the map got wrong and why.

## Status

Open.
