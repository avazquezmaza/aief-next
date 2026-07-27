# Change

## ID

`0046-core3-user-workflow`

## Type

General

## Objective

Implement **Entrega 4: User Workflow** of the AIEF Core 3.0 evolution described in
[docs/aief-core-3-claude-code-prompt.md](../../docs/aief-core-3-claude-code-prompt.md), grounded in
the real, closed state left by [Entrega 1](../0043-core3-change-foundation/),
[Entrega 2](../0044-core3-workflow-engine/) and [Entrega 3](../0045-core3-sdd-provider/) — not only
in the original vision document.

Started as a planning-only Change (Type: Analysis); re-typed to General once ADR-018 §4 was resolved
(Path B) and implementation began, 2026-07-26. Full design: [design.md](design.md). Implementation
and adversarial-review evidence: [evidence.md](evidence.md).

## Scope

### In scope (this Change)

- Full SDD planning for Entrega 4: proposal, requirements, design, tasks, verification plan.
- ADR-018: whether/how a User Workflow application layer is introduced, and how its CLI exposure
  is reconciled with ADR-015.
- Inspection evidence of the real current command surface, Change resolver, and every call site of
  `loadChangeUnified()`/`resolveState()`/`evaluateGates()`/`isTransitionLegal()`/
  `resolveSddProvider()`.

- `workflow-service.js` (the single "what's next" computation), `status --change`/`--next` (Path B —
  no new command verb), `prompt`'s Workflow/SDD context extension, the adversarial review.

### Out of scope (this Change)

- Skills, Hooks, assistant execution, semantic Verification, Review-as-product-feature, Entrega 5
  and beyond.

## Success Criteria

- The plan is grounded in real inspection of the current command surface (confirmed: `help`,
  `doctor`, `status`, `adopt`, `analyze`, `init`, `new-change`, `enrich`, `propose`, `prompt`,
  `close`, `use-profile`, `verify`, `release` — no `start`/`next`/`work` exist today), the existing
  Change resolver (`resolveExplicitChange`/`resolveImplicitChange`), and the real, concrete
  inconsistency found in `status()` between its static bottom-line suggestion and its
  Workflow-Engine-derived per-Change `next` — not the vision document's sketch alone.
- The ADR-015 collision is surfaced explicitly, with at least one viable path that does not require
  a new command, and is not resolved by implication.
- `start`/`next`/`work` semantics are each justified against what the codebase can actually support
  today (no Skills/Hooks execution, no OpenSpec artifact creation), not adopted from the vision
  document's fuller future sketch.

## Status

Closed (2026-07-26)

Implemented, independently reviewed (25-point adversarial checklist; one design bug found and fixed
via live reproduction during implementation before the formal review — see "Findings" in
`evidence.md`; one low-severity discoverability gap in `help` text, also fixed; zero blocking/high
findings), and closed. Full record: [evidence.md](evidence.md), verdict `ready_to_close`.
