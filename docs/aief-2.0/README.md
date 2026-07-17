# AIEF 2.0 — Experience Redesign

> **Design study. No implementation.** Nothing here changes AIEF, OpenSpec or SpecBoot. Governed by [Change 0037](../../changes/0037-aief-2-0-experience-redesign/).
>
> **Guiding principle.** A complex system must feel simple. Complexity appears only when it is needed.
>
> **Success criterion.** Someone who never touched Flux Portal starts a project correctly in **under 15 minutes**.

AIEF 1.x asked *"what capability is missing?"*. The Flux Portal evidence says that was the wrong question. AIEF 2.0 asks:

> **Given that AIEF had what the migration needed — why did nobody use it?**

---

## The finding that reframes everything

Flux Portal (`trk-orchestrator-portal`) was a real Next.js/TypeScript/Postgres/Cognito multitenant migration, governed with AIEF, and it **succeeded**: 13 Changes, cutover executed, rollback rehearsed, verdict READY.

It produced **9,011 lines of governance Markdown across 70 files**. Exactly **one** of those files carries a fingerprint of the AIEF CLI: `changes/0001-adopt-aief/`, which AIEF generated about itself.

**The CLI ran once — at adoption — and never again.** Every subsequent Change, every status, every piece of evidence was written by hand. `aief close` never wrote a single status line; the 13 statuses were hand-written prose in three mutually incompatible formats, reconciled manually months later.

AIEF was adopted as a **folder convention**, not used as a **tool**. Every P0 in the [closure findings](../dogfooding-findings.md) is a consequence of that one fact, not an independent bug:

- **F1** (the status parser only recognizes the string `aief close` writes) is unavoidable when `aief close` never runs — the parser was a round-trip check on output that was never produced.
- **F2** (`verify` never ran) is the same fact, restated.
- **F6** (11/13 stale statuses) is what happens when the only writer is a human under deadline.

The capabilities were not missing. **The tool was not on the path.**

---

## Deliverables

| # | Deliverable | Document |
|---|---|---|
| 1 | Vision for AIEF 2.0 | [01-vision.md](01-vision.md) |
| 2 | Map of the current framework | [02-current-map.md](02-current-map.md) |
| 3 | Map of the proposed framework | [03-proposed-map.md](03-proposed-map.md) |
| 4 | Current vs 2.0 comparison | [04-comparison.md](04-comparison.md) |
| 5 | Conceptual architecture | [03-proposed-map.md §3](03-proposed-map.md#3-conceptual-architecture) |
| 6 | User flow | [05-user-flow.md](05-user-flow.md) |
| 7 | Basic / Standard / Migration profiles | [06-profiles.md](06-profiles.md) |
| 8 | Modular harness design | [07-harness.md](07-harness.md) |
| 9 | Relationship with OpenSpec | [08-openspec.md](08-openspec.md) |
| 10 | Relationship with SpecBoot | [09-specboot.md](09-specboot.md) |
| 11 | Incremental roadmap | [11-roadmap.md](11-roadmap.md) |
| — | Examples (smallest + Flux Portal) | [10-examples.md](10-examples.md) |
| — | Usability validation | [05-user-flow.md §4](05-user-flow.md#4-usability-validation) |

**On the irony of eleven documents.** The brief says *"we don't want more documents, we want less friction"* — and answers it with eleven deliverables. That tension is real and worth naming: these eleven are a **design study**, read once by the people deciding AIEF's direction, and they are **not** artifacts AIEF asks its users to produce. The measure of this work is not this folder; it is how much smaller [02-current-map.md](02-current-map.md)'s inventory gets. If AIEF 2.0 ships and the user-facing surface has not shrunk, this study failed regardless of how good these documents are.

## Reading order

- **Deciding direction?** [01-vision.md](01-vision.md) → [04-comparison.md](04-comparison.md) → [11-roadmap.md](11-roadmap.md).
- **Challenging the evidence?** [02-current-map.md](02-current-map.md) — every claim carries a reproducible command.
- **Designing the build?** [05-user-flow.md](05-user-flow.md) → [06-profiles.md](06-profiles.md) → [07-harness.md](07-harness.md).

## Status

**Proposal. Not accepted, not authorized.** Per [ADR-008](../../knowledge/decisions.md), nothing here ships until its evidence gate is met; every proposal below names its gate. Per [ADR-precedence](../../AGENTS.md), an accepted ADR outranks this study — where this study contradicts one ([ADR-012](../../knowledge/decisions.md) most visibly), the conflict is flagged explicitly rather than resolved by fiat: see [03-proposed-map.md §5](03-proposed-map.md#5-conflicts-with-accepted-adrs).
