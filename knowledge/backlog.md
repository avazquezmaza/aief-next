# Backlog

Candidate work, not commitments. Every entry is evidence-gated (ADR-008): it graduates to a Change or ADR only when its evidence exists, and it records where that evidence should come from. Entries are removed when they become a Change (link it) or are explicitly discarded (say why).

| # | Entry | Source / evidence trail | Added |
|---|---|---|---|
| 1 | Evaluar soporte para **iniciativas de larga duración** y una vista derivada de Changes relacionados, después de completar la migración del frontend de Flux Portal. | Deferred finding from Change 0035 (Governance Conventions). n=1 — reassess after the migration. The *conventions* (Architecture Checkpoint, increments, gates, deferred-work markers) already landed as [docs/governance-conventions.md](../docs/governance-conventions.md); only the Initiative *entity* and a related-Changes view remain deferred. Full ledger: [docs/dogfooding-findings.md](../docs/dogfooding-findings.md). Related open questions: [docs/runtime-governance-open-questions.md](../docs/runtime-governance-open-questions.md) (Tasks vs Gates), [docs/external-harness-patterns.md](../docs/external-harness-patterns.md) (requirement→task→evidence). Do **not** implement Initiative, Parent-Child Changes, or `Depends-On` metadata in this cycle. | 2026-07-09 |
