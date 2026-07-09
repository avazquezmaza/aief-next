# Runtime & Governance — Open Questions

> Product architecture, no implementation. This document captures the three tensions that survived the adversarial Architecture Review of AIEF's Runtime Model and Governance Model (two independent reviews — one proposing a compliance-platform redesign, one refuting it — held 2026-07-08). Everything else in that exchange was either already documented ([docs/domain-model.md](domain-model.md), [docs/ROADMAP-TO-1.0.md](ROADMAP-TO-1.0.md)) or rejected for lack of evidence.
>
> Posture: **ADR-008 applies in full.** Nothing here is a decision to build. Each tension is recorded with the hypothesis that would justify acting on it, the evidence that hypothesis still lacks, and what is deliberately deferred. None of the concepts named below (requirement, gate, execution identity) exist in the implementation, and this document does not authorize introducing them.

Companion reading: [docs/domain-model.md](domain-model.md) (the model these tensions stress), [knowledge/decisions.md](../knowledge/decisions.md) (ADR-008, ADR-009, ADR-012), [docs/enrichment-workflow.md](enrichment-workflow.md), [docs/AIEF-1.0-READINESS.md](AIEF-1.0-READINESS.md).

---

## 1. Requirement vs Change (problem space vs solution space)

### The tension

AIEF today has exactly one durable unit: the Change. When Change 0030 introduced Requirement Sources, the normalized requirement was stored *inside* a Change (an Enrichment Change) because that was the smallest honest container available. The adversarial review named the cost precisely: a **requirement is an input from the problem space** (an intent, a need, possibly never acted on), while a **Change is an action in the solution space** (scoped work that ends in evidence). Boxing the first inside the second produces objects with strained semantics — a "Change" whose whole purpose is to *not* be implemented yet (`Requires Human Review`), whose closure can mean either "done" or "rejected as not actionable," and which occupies a sequential Change ID even if the requirement dies in review.

### What the current model gets right

The conflation was a deliberate, documented scope decision (Change 0030: model and contract first, minimal container, no new top-level concepts), not an accident. It bought real things: zero new lifecycle machinery, reuse of the existing verify/close gates for human review, and one place to look for "everything in flight." The three real validations produced no observed friction from it — no user has yet been confused by an Enrichment Change, because no team has yet run enough requirements through the funnel for rejected-requirement noise to accumulate in `changes/`.

### What would falsify the current model

The design breaks down observably when either happens:

- **Rejected requirements pollute the Change ledger** — a team enriches N tickets, approves a fraction, and `changes/` fills with closed-but-never-implemented directories that verify, status and ID sequencing must keep skipping over.
- **One requirement maps to many Changes (or many requirements to one)** — the current 1:1 physical embedding cannot represent either without duplication or loss; the first real epic-sized ticket will surface this.

### Hypotheses requiring validation (not decisions)

- H1: teams will enrich significantly more requirements than they implement (making the ledger-pollution failure mode real rather than theoretical).
- H2: requirement↔Change will not stay 1:1 in real use.
- Neither has evidence yet. Until one does, splitting "Requirement" into a first-class concept (its own directory, lifecycle, or context) is speculative structure — exactly what ADR-008 prohibits.

### Deliberately not proposed here

A `requirements/` top-level concept, a Requirement lifecycle, or any change to how `aief enrich` writes today.

---

## 2. Tasks vs Gates (developer work vs approval authority)

### The tension

`tasks.md` uses one mechanism — the unchecked checkbox — for two categorically different things:

- **development/verification tasks**: self-tracked work items ("implement login", "run npm test"), where the worker checking their own box is the *correct* behavior;
- **approval gates**: authority checkpoints ("a human has reviewed spec.md", "scope approved"), where the *whole point* is that only someone other than the worker may check the box.

The mechanism cannot tell them apart. Today the distinction is held by convention alone: the Enrichment prompt explicitly instructs assistants "never marking Human Review tasks done yourself — only a human clears them," and mandatory human diff-review makes a violated convention visible. The adversarial review's "the audited agent can approve its own work" attack is only valid under autonomous operation — a mode [AIEF-1.0-READINESS.md](AIEF-1.0-READINESS.md) explicitly forbids — but the *conceptual* observation stands independent of the threat model: these are two concepts sharing one representation, and the model does not name the difference.

### What the current model gets right

One mechanism means one implementation, one verify rule ("unchecked tasks block close"), and zero new file formats. The Human Review Gate (Change 0030) was implemented in an afternoon *because* it could reuse the generic task gate. Convention-then-formalization is also this repo's proven evolution path (Skills, Standards and Profiles all started as convention).

### What would falsify the current model

- An observed instance — in any supervised, real usage — of an assistant checking an approval checkbox, surviving human review, and reaching `close`.
- The roadmap's *closability/verify contract* workstream (machine-checkable evidence and scope gates) arriving and needing to treat approval items differently from work items — at which point the unnamed distinction becomes a blocking ambiguity rather than a stylistic one.

### Hypotheses requiring validation

- H3: the checkbox convention will actually be violated in guided use (no occurrence in three validations so far).
- H4: the closability contract cannot be specified without a formal task/gate distinction. This one is likely true on paper — a machine gate needs to know *which* boxes only humans may check — but it should be confirmed when that workstream is designed, not before.

### Deliberately not proposed here

Any change to `tasks.md` format, any new marker syntax, any verify rule distinguishing task kinds. If H4 confirms, the distinction should be designed *inside* the closability-contract workstream ([ROADMAP-TO-1.0.md](ROADMAP-TO-1.0.md) workstream 4), not as a separate feature.

---

## 3. Execution Identity (what composed the work)

### The tension

AIEF's runtime is two disconnected batch operations mediated by files: composition (`aief prompt` renders and the process exits) and governance (`verify`/`close` audit what remains). Between them acts an unobserved external party. Nothing records *what was composed*: which assistant, which model, which profile, which standards/skills were present, when, from what prompt. If two prompts for the same Change (different `--profile`, different day, different detected skills) lead to different work, the evidence cannot attribute which composition shaped which outcome.

Both reviews converged on this gap from opposite directions — one demanding "Agent Execution Identity" as a compliance requirement, the other independently identifying a "post-composition governance record" as the honest core of the rejected ExecutionContext hypothesis. Convergence from adversarial positions is a signal worth recording. It is not, by itself, evidence of user need.

### Three rungs that must not be conflated

1. **Procedural evidence (exists today):** `evidence.md` records what happened, written by humans/assistants under human review. Trust model: the diff and the reviewer.
2. **Composition record (the open question):** a lightweight, visible note of what `aief prompt` assembled — assistant, model if known, profile, standards/skills lists (names, not content), timestamp, optionally a prompt hash or snapshot. Trust model: still git and human review; this is *traceability*, not proof.
3. **Strong attestation (explicitly out of scope):** independently verifiable, tamper-evident proof (signed records, isolated control plane). Belongs to a hypothetical enterprise-governance future with zero validated demand today; pursuing it now would trade AIEF's adoption model (dependency-free local CLI, ADR-005/009) for an unvalidated market.

Naming risk, recorded: "context" already means three things in this repo (Detected Context, promptContext, project context). Any future concept here must not be named *Context*.

### Constraints any future rung-2 record must respect (from accepted ADRs)

- Visible and versionable, never hidden state (ADR-009); the rejected `.aief/state.json` must not return through this door.
- References, not copies — recording *which* standards were present, never duplicating their content (no second source of truth).
- Owned by Verification & Governance, not by Prompt Composition — the Prompt Engine stays a pure renderer (ADR-012).
- A record of what was *asked* is not verification of what was *done* — it must never be sold as enforcement.

### Hypotheses requiring validation

- H5: someone, in real use, will need to answer "what composition produced this work?" retroactively and be unable to. Zero occurrences so far across three validations.
- H6: a manual convention (a "Composition" line in `evidence.md`, written by hand) is insufficient — this is the cheapest possible experiment and must fail before any structure is built.

### Deliberately not proposed here

Any file, flag, hash mechanism, or verify rule. The proven path applies: manual convention first, dogfooded on AIEF's own Changes; formalize only if the convention demonstrates value and its manual form demonstrates friction.

---

## Summary table

| Pregunta abierta | Riesgo si se ignora | Evidencia requerida | Decisión recomendada ahora | Decisión diferida para AIEF 1.x |
|---|---|---|---|---|
| **1. ¿Requirement debe ser un concepto de primera clase, separado de Change?** | El ledger de `changes/` se contamina con requerimientos rechazados o nunca implementados; el mapeo requirement↔Change queda forzado a 1:1 y se rompe con el primer epic real; "cerrar" pasa a significar dos cosas distintas (hecho vs descartado). | Una adopción real donde se enriquezcan sustancialmente más requerimientos de los que se implementan (H1), o un caso real de un requerimiento que necesite N Changes (H2). | Mantener el modelo actual (requirement embebido en Enrichment Change). Registrar H1/H2 como señales a observar en el próximo pilote con equipo. No crear estructura nueva. | Si H1 o H2 se confirman: diseñar Requirement como concepto propio (posible séptimo bounded context o extensión de Change Management), con ADR propio y migración explícita de los Enrichment Changes existentes. |
| **2. ¿Tasks de trabajo y gates de aprobación deben ser conceptos distintos?** | El mecanismo no puede distinguir quién tiene autoridad para marcar qué; el contrato de closability (roadmap workstream 4) no podrá especificarse sin esa distinción; en modo delegado futuro, auto-aprobación indetectable por máquina. | Una violación observada de la convención en uso supervisado (H3), o la confirmación durante el diseño del closability contract de que la distinción es bloqueante (H4 — probable). | Mantener el checkbox único + convención en el prompt + revisión humana de diffs. No tocar `tasks.md`. Nombrar la distinción en la documentación conceptual (hecho: este documento y domain-model §7.8) sin representarla en el formato. | Diseñar la distinción task/gate *dentro* del workstream closability/verify contract, no como feature separada. Requisito previo para habilitar cualquier modo de implementación delegada (Go/No-Go de AIEF-1.0-READINESS). |
| **3. ¿AIEF debe registrar identidad de ejecución (assistant, model, profile, standards, skills, timestamp, prompt hash)?** | Evidencia no atribuible: imposible saber retroactivamente qué composición produjo qué trabajo; imposible auditar deriva entre prompts de un mismo Change; el gap crece con cada assistant/profile adicional en uso. | Una necesidad real e insatisfecha de atribución retroactiva (H5), y el fracaso demostrado de la convención manual barata (línea "Composition" en evidence.md, H6). | Nada estructural. Opcionalmente iniciar el experimento H6 como convención manual en los Changes de este mismo repo (dogfooding), sin tooling. Rechazar explícitamente el rung 3 (attestation fuerte) por falta total de demanda validada. | Si H5+H6 se confirman: registro de composición visible y versionable, con referencias (no copias), propiedad de Verification & Governance, nunca llamado "Context", nunca vendido como enforcement. Attestation fuerte queda fuera incluso de 1.x salvo demanda enterprise validada. |

---

*Última actualización: 2026-07-08, Change [0032-runtime-governance-open-questions](../changes/0032-runtime-governance-open-questions/change.md). Este documento registra preguntas, no decisiones: cualquier respuesta definitiva debe llegar como ADR, respaldada por la evidencia que su fila exige.*
