# Change

## ID

`0045-core3-sdd-provider`

## Type

General

## Objective

Implement **Entrega 3: SDD Provider** of the AIEF Core 3.0 evolution described in
[docs/aief-core-3-claude-code-prompt.md](../../docs/aief-core-3-claude-code-prompt.md), grounded in
the real, closed state left by [Entrega 1](../0043-core3-change-foundation/) and
[Entrega 2](../0044-core3-workflow-engine/) — not only in the original vision document.

Started as a planning-only Change (Type: Analysis); re-typed to General once the plan was approved
and implementation began, 2026-07-25. Full design: [design.md](design.md). Implementation and
independent-review evidence: [evidence.md](evidence.md).

## Scope

### In scope (this Change)

- Full SDD planning for Entrega 3: proposal, requirements, design, tasks, verification plan.
- ADR-017: the provider boundary, its interface shape, and its relationship to ADR-002/ADR-013.
- Inspection evidence of the real, current OpenSpec integration and Local Change model.

### Out of scope (this Change)

- Any implementation. No code changes in this Change.
- Entrega 4 and beyond.

## Success Criteria

- The plan is grounded in real inspection of `cli.js`'s current OpenSpec detection/delegation,
  `adapters/openspec/*.md`'s documented (but uncoded) conventions, the `requirement-providers/`
  pattern, and Entregas 1–2's actual shipped code — not the vision document alone.
- The provider interface is justified method-by-method against real, cited behavior — not adopted
  literally from the vision document's class sketch.
- Every question resolvable by inspection is resolved and cited; only genuinely undecidable
  questions are left for the human.

## Status

Closed (2026-07-25).

Implemented, independently reviewed (3 findings — R1 blocking/security, R2 high, R3 high — found
and fixed within the review, re-verified: 251/251 tests, `aief status` byte-identical, `aief verify`
PASS, `git status` clean), and closed. Full record: [evidence.md](evidence.md), verdict
`ready_to_close`.
