# Dogfooding Findings

> A concise historical ledger of what AIEF learned by governing real migrations — not an operational state file. Each row records a finding, its evidence, the decision, the action taken, and the horizon (now vs later). New evidence appends rows; decisions change only with new evidence (ADR-008).
>
> Case study: **Flux Portal** (`trk-orchestrator-portal`) — a real Next.js / TypeScript / Postgres / Cognito / multitenant frontend migration governed with AIEF. Cited as empirical source only; no secrets or unnecessary content from that repository are reproduced here.

## Findings ledger

| Finding | Evidence | Decision | Action | Horizon |
|---|---|---|---|---|
| Workflow Cohesion — commands could implicitly select the wrong open Change | Flux Portal (multiple open Changes during migration) | Accepted | Change 0034 — explicit `--change` selection across status/prompt/verify/close | Now |
| Human gates distinct from developer tasks | Flux Portal | Accepted as convention | Change 0035 — `(human)`/`(review)` task labels ([governance-conventions §1](governance-conventions.md#1-tasks-gates-and-reviews)) | Now |
| OpenSpec ↔ AIEF traceability (draft/mock vs real-backend closure) | Flux Portal | Accepted as convention | Change 0035 — OpenSpec↔AIEF rule ([governance-conventions §3](governance-conventions.md#3-openspec--aief)) | Now |
| Harness declaration (project owns execution, AIEF records results) | Flux Portal | Experiment / document | Change 0035 — optional Validation Harness section ([governance-conventions §4](governance-conventions.md#4-harness-engineering)) | Now |
| Deferred / moved / blocked work needs traceable, non-blocking markers | Flux Portal | Accepted as convention | Change 0035 — `[-]` deferred-work vocabulary ([governance-conventions §2](governance-conventions.md#2-deferred-and-moved-work)) | Now |
| Increments within large Changes | Flux Portal | Accepted as convention | Change 0035 — increment convention ([governance-conventions §6](governance-conventions.md#6-increments-within-large-changes)) | Now |
| Architecture Checkpoints at phase boundaries | Flux Portal (foundation → functional) | Accepted as optional template | Change 0035 — optional checkpoint section ([governance-conventions §7](governance-conventions.md#7-architecture-checkpoints)) | Now |
| Initiative (long-running arc, derived view of related Changes) | n=1 | Deferred | Reassess after the frontend migration completes ([knowledge/backlog.md](../knowledge/backlog.md)) | Later |
| Parent-Child Changes | n=1 | Deferred | More dogfooding | Later |
| Checkpoint as a CLI Change Type | n=1 | Deferred | Template first (§7); promote only with evidence | Later |
| Contract hashes | insufficient evidence | Deferred | SDD experiment | Later |
| Evidence / requirement-traceability parser | insufficient evidence | Deferred | Traceability dogfooding | Later |

## How to read this

- **Now** = materialized in this cycle (Changes 0034/0035) as CLI behavior (Workflow Cohesion) or as conventions/templates (Governance Conventions).
- **Later** = deliberately deferred; each names what evidence would move it. Nothing here is a commitment — it is a filter, applying ADR-008 so AIEF grows from what real projects reveal rather than from speculation.
