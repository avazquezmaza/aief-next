# Change

## ID

`0044-core3-workflow-engine`

## Type

General

## Objective

Implement **Entrega 2: Workflow Engine** of the AIEF Core 3.0 evolution described in
[docs/aief-core-3-claude-code-prompt.md](../../docs/aief-core-3-claude-code-prompt.md), grounded in
the real, closed state [Entrega 1](../0043-core3-change-foundation/) left behind — not only in the
original vision document.

Started as a planning-only Change (Type: Analysis); re-typed to General once the plan was approved
and implementation began, 2026-07-25. Full design: [design.md](design.md). Implementation and
independent-review evidence: [evidence.md](evidence.md).

## Scope

### In scope (this Change)

- Full SDD planning for Entrega 2: proposal, requirements, design, tasks, and a verification plan.
- ADR-016: whether the Workflow Engine requires new architectural governance beyond ADR-013.
- H2 hardening (Change 0043's deferred finding) planned as a prerequisite *inside* Entrega 2's own
  scope, per explicit instruction — not implemented here, but fully specified.
- M1 (manifest identity policy) planned as a non-blocking, warning-level policy.

### Out of scope (this Change)

- Any implementation. No code changes in this Change.
- Entregas 3–8.

## Success Criteria

- The plan is grounded in Entrega 1's actual, closed implementation (manifest schema as shipped,
  the `status`-only integration boundary, `loadChangeUnified()` as it exists today, the B1/H1
  fixes, and the H2/M1/L1–L3 technical debt still open) — not a restatement of the original vision
  document's Entrega 2 section alone.
- ADR-013's applicability is explicitly analyzed and resolved (ADR-016), not assumed.
- H2 is included as an in-scope prerequisite task, correctly specified (distinguishes absent vs.
  invalid manifest; no silent fallback; no destructive auto-fix).
- M1 is included as a non-blocking, warning-level identity policy, not a blocker and not a
  destructive validation.
- Every question that cannot be resolved by inspecting the repository is listed explicitly, not
  assumed — and every question that *can* be resolved has been, with the resolution recorded.

## Status

Closed (2026-07-25).

Implemented, independently reviewed (2 findings — R1 high, R2 medium — found and fixed within the
review, re-verified: 195/195 tests, `aief status` byte-identical, `aief verify` PASS, `git status`
clean), and closed. Full record: [evidence.md](evidence.md), verdict `ready_to_close`.
