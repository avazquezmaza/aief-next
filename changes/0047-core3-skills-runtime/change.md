# Change

## ID

`0047-core3-skills-runtime`

## Type

General

## Objective

Implement **Entrega 5: Skills Runtime** of the AIEF Core 3.0 evolution described in
[docs/aief-core-3-claude-code-prompt.md](../../docs/aief-core-3-claude-code-prompt.md) §12
("Skills ejecutables y verificables"), grounded in the real, closed state left by
[Entrega 1](../0043-core3-change-foundation/), [Entrega 2](../0044-core3-workflow-engine/),
[Entrega 3](../0045-core3-sdd-provider/) and [Entrega 4](../0046-core3-user-workflow/) — not only in
the vision document's fuller future sketch.

Started as a planning-only Change (Type: Analysis); re-typed to General once ADR-019 was accepted
and implementation began, 2026-07-26. Full design: [design.md](design.md). Implementation and
adversarial-review evidence: [evidence.md](evidence.md).

## Scope

### In scope (this Change)

- Full SDD planning for Entrega 5: proposal, requirements, design, tasks, verification plan.
- ADR-019: what a Skill is in AIEF Core 3.0 (Model A + a safe subset of Model B; Model C deferred),
  the Skill contract, Skill Registry, Skill Context, capability model, normalized result, and how
  this reconciles with ADR-010's existing "Skill = contextual knowledge" concept
  (`cli/src/skills-catalog.json`, `recommendSkills()`, `knowledge/skills.md`).
- Inspection evidence of every current implementation that already behaves like a Skill, how
  `prompt()` builds context today, and every registry precedent (`requirement-providers/`,
  `sdd-providers/`) this Entrega's Skill Registry must mirror.

- `cli/src/core/domain/skill.js` (contract), `cli/src/skills/` (registry + two Skills),
  `cli/src/core/services/skill-context.js`/`skill-service.js`, `prompt --skill`/`--list-skills`
  (Path B — no new command verb), the adversarial review.

### Out of scope (this Change)

- Hooks, automatic execution on events, autonomous agents, model calls, AI-driven Skill selection,
  a Skill marketplace, remote Skills, Skill installation, npm plugins, untrusted code execution, a
  full sandbox, network access, arbitrary command execution, automatic repository modification,
  automatic gate approval, semantic Verification, Review-as-product, advanced Skill profiles, a
  conversational interface, Entrega 6 and beyond.

## Success Criteria

- The plan is grounded in real inspection of `cli/src/skills-catalog.json`/`detect.js`'s
  `recommendSkills()` (the existing, unexecuted "Skill" concept, ADR-010), `requirement-providers/`
  and `sdd-providers/`'s registry pattern (Changes prior to Core 3.0 and Change 0045), `prompt()`'s
  current context-block construction (Change 0046), and `enrich`'s/`verify`'s already-deterministic
  logic — not the vision document's fuller sketch alone.
- The ADR-010 naming collision ("Skill" already means something in this codebase) is surfaced
  explicitly and resolved as an evolution, not silently reused or silently renamed.
- The Skill contract, capability model and normalized result are each justified against a concrete,
  cited use case — not adopted literally from the vision document's YAML sketch.
- Model C (effects: file writes, command execution) is explicitly evaluated and deferred with
  reasoning, per the commissioning instruction's stated preference.
- ADR-015 is respected: no new public command verb is proposed without explicit approval; the
  evaluated CLI surface (`prompt --skill`/`--list-skills`) is additive flags only.

## Status

Closed (2026-07-26)

Implemented, independently reviewed (34-point adversarial checklist; two findings — an
applicability-status spoofing gap and a zero-classes convention violation, both fixed with
regression tests before close; one informational item deferred, symlink-escape handling inherited
from Entrega 3 and out of this Change's scope; zero blocking/high findings remaining), and closed.
Full record: [evidence.md](evidence.md), verdict `ready_to_close`.
