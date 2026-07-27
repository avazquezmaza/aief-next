# Change

## ID

`0049-core3-verification-engine`

## Type

General

## Objective

Implement **Entrega 7: Verification Engine** of the AIEF Core 3.0 evolution described in
[docs/aief-core-3-claude-code-prompt.md](../../docs/aief-core-3-claude-code-prompt.md) §14
("Verificación en tres niveles"), grounded in the real, closed state left by
[Entrega 1](../0043-core3-change-foundation/) through [Entrega 6](../0048-core3-hooks-runtime/) — not
only in the vision document's fuller future sketch.

Started as a planning-only Change (Type: Analysis); re-typed to General once ADR-021 was accepted
and implementation began, 2026-07-26. Full design: [design.md](design.md). Implementation and
adversarial-review evidence: [evidence.md](evidence.md).

## Scope

### In scope (this Change)

- Full SDD planning for Entrega 7: proposal, requirements, design, tasks, verification plan.
- ADR-021: what "Verification" means in AIEF Core 3.0 — the explicit boundary between Structural
  Verification (existing, `change-verifier.js`, untouched) and Requirement Verification (new,
  evidence-based, deterministic, no AI); the Evidence Model (which types are supported, deferred, or
  rejected, and why); the Verification Rule contract, Registry, Context, Result Model and aggregation
  policy; the decision to keep `aief verify` legacy-only by default with a single opt-in flag; the
  decision to defer Workflow-gate and `close()` integration.
- Inspection evidence of `change-verifier.js`'s real structural rules, the real (non-)existence of a
  requirement↔task↔test↔evidence linking convention anywhere in this repository, and every consumer
  `verify()`'s output already has (CLI render, exit code, `verify.completed` Hook).

- `cli/src/core/domain/verification-rule.js` (contract), `cli/src/verification-rules/` (registry +
  two rules), `cli/src/core/services/verification-context.js`/`verification-evidence.js`/
  `verification-service.js`, `verify --requirements` (no new command verb), the adversarial review.

### Out of scope (this Change)

- AI/semantic analysis, automatic test execution, shell/external process execution, network access,
  automatic remediation, automatic evidence generation, gate approval, automatic Change closing,
  blocking integration with `close()`, Review-as-product, Entrega 8 and beyond, plugins, remote
  rules, a marketplace, global persistence, a database, a daemon, background jobs.

## Success Criteria

- The plan is grounded in real inspection of `change-verifier.js` (the entirety of today's
  "verification"), `sdd-model.js`'s `parseRequirements()`/`parseTasks()` (confirming: no
  machine-checkable requirement↔task link exists today — SDD-R21, unchanged), and `evidence.md`'s
  real, narrative, heuristic-classified (not structured, not per-requirement) nature — not the vision
  document's fuller sketch alone.
- Requirement Verification never invents a linking or evidence convention this repository doesn't
  already, verifiably, use — every proposed rule is grounded in something real (an existing
  `verification.md` scenario-table citation pattern, or the SDD Provider's already-normalized
  artifact states), not a new authoring requirement imposed on prior Changes retroactively.
- The Evidence Model explicitly separates deterministically-verifiable types from
  unsupported/insufficient-alone ones — no type is silently treated as sufficient without evidence.
- `aief verify`'s default (legacy) behavior and exit code are unchanged; the new layer is reachable
  only through a single, justified, opt-in flag.
- Workflow-gate and `close()` integration are explicitly evaluated and deferred with reasoning.
- ADR-015 is respected: no new public command verb.

## Status

Closed (2026-07-27)

Implemented, independently reviewed (57-point adversarial checklist; one real correctness bug — a
duplicate `explain()` call within one `verify --requirements` invocation — found and fixed, plus one
`manual_attestation` enforcement gap closed proactively, both with regression tests before close;
zero blocking/high findings remaining), and closed. Full record: [evidence.md](evidence.md), verdict
`ready_to_close`.
