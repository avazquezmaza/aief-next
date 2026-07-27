# Change

## ID

`0048-core3-hooks-runtime`

## Type

General

## Objective

Implement **Entrega 6: Hooks Runtime** of the AIEF Core 3.0 evolution described in
[docs/aief-core-3-claude-code-prompt.md](../../docs/aief-core-3-claude-code-prompt.md) §13 ("Hooks"),
grounded in the real, closed state left by [Entrega 1](../0043-core3-change-foundation/),
[Entrega 2](../0044-core3-workflow-engine/), [Entrega 3](../0045-core3-sdd-provider/),
[Entrega 4](../0046-core3-user-workflow/) and [Entrega 5](../0047-core3-skills-runtime/) — not only in
the vision document's fuller future sketch.

Started as a planning-only Change (Type: Analysis); re-typed to General once ADR-020 was accepted
and implementation began, 2026-07-26. Full design: [design.md](design.md). Implementation and
adversarial-review evidence: [evidence.md](evidence.md).

## Scope

### In scope (this Change)

- Full SDD planning for Entrega 6: proposal, requirements, design, tasks, verification plan.
- ADR-020: what a Hook is in AIEF Core 3.0 (Model A fully; Model B's `block` capability defined but
  structurally unexercised this Entrega; Model C deferred), the closed event catalog grounded in real
  CLI emission points, the Hook contract, Hook Registry, Hook Context, capability model, normalized
  result, blocking authority policy, and the Hook→Skill Service call boundary (never Hook→Skill
  directly, never Skill Service→Hook).
- Inspection evidence of every real lifecycle point in `prompt()`/`verify()`/`close()`/`propose()`/
  `enrich()`/`analyze()`/`new-change`, their write order, and whether anything resembling a Hook
  already exists (confirmed: it does not).

- `cli/src/core/domain/hook.js` (contract + closed event catalog), `cli/src/hooks/` (registry + two
  Hooks), `cli/src/core/services/hook-context.js`/`hook-service.js`, `prompt.prepared`/
  `verify.completed` integration (no new command verb), the adversarial review.

### Out of scope (this Change)

- Asynchronous events, background jobs, a daemon, event queues/persistence, cron, webhooks, external
  integrations, network access, external command execution, writes from Hooks, remote Hooks, plugins,
  a marketplace, a sandbox, general transactional rollback, automatic assistant execution, automatic
  code generation, task modification, automatic gate approval, semantic Verification,
  Review-as-product, Entrega 7 and beyond.

## Success Criteria

- The plan is grounded in real inspection of `prompt()`/`verify()`/`close()`'s actual phase
  boundaries (precondition → preparation → execution → post-validation → confirmation), not the
  vision document's stage-based sketch (`before_work`/`after_review`, which has no CLI-observable
  emission point in this codebase today).
- The closed event catalog contains only events with a confirmed, cited emission point and a
  justified consumer among this Entrega's own initial Hooks — no speculative events.
- The Hook→Skill Service integration (allowlist, no direct Skill import, no Hook-to-Hook or
  Skill-to-Hook recursion) is exercised by at least one real, shipped Hook.
- `close()` integration is explicitly evaluated and deferred with reasoning, per the commissioning
  instruction's own caution about write-critical paths.
- ADR-015 is respected: no new public command verb; the evaluated CLI surface is additive
  integration inside `prompt`/`verify` only.

## Status

Closed (2026-07-26)

Implemented, independently reviewed (44-point adversarial checklist; two real, exploitable findings
— Skill-result forgery via a mutable map, and event-phase spoofing bypassing blocking authority —
both reproduced live and fixed with regression tests before close; zero blocking/high findings
remaining), and closed. Full record: [evidence.md](evidence.md), verdict `ready_to_close`.
