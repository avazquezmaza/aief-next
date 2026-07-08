# AIEF Domain Model

> Product architecture, not implementation reference. This document describes AIEF as a **domain** — its ubiquitous language, its entities, its bounded contexts, and the boundaries between them — so that future decisions (features, refactors, new integrations) can be checked against a conceptual model instead of against whatever the code happens to do today.
>
> For the implemented architecture (files, functions, data shapes), see [docs/architecture.md](architecture.md). For the decisions that govern these boundaries, see [knowledge/decisions.md](../knowledge/decisions.md) (ADR-001 through ADR-012) — this document does not restate their reasoning, it organizes their conclusions into one map. For the canonical process model, see [docs/Workflow.md](Workflow.md).

---

## 1. Ubiquitous Language

Terms every conversation about AIEF — product, engineering, or documentation — should use consistently.

| Term | Meaning | Governing ADR/doc |
|---|---|---|
| **Change** | The unit of work. A directory (`changes/<id>-<slug>/`) holding four Artifacts (change.md, spec.md, tasks.md, evidence.md). Identity is the directory name itself — no separate ID system. | ADR-009 |
| **Specification (Spec)** | `spec.md` — the "what must be true" contract for a Change: goal, requirements, acceptance criteria. | ADR-001, ADR-002 |
| **Task** | A checklist line inside `tasks.md`. Not independently addressable — tracked as a count of unchecked items. | — |
| **Evidence** | `evidence.md` — the Change's proof of work: what happened, how it was verified, what remains. | ADR-008 |
| **VerificationReport** | The structured result of judging a Change (or a whole project) against the verification rules: errors, warnings, pass/fail, next recommended step. | — (new; formalized in the core/ extraction) |
| **Profile** | Structured knowledge about *how to reason* in a Change (goal, thinking style, priorities, expected outputs, what to avoid), selected by a human per Change. | ADR-012 |
| **Skill** | Contextual technology/domain knowledge, triggered by detected project signals, injected into a prompt as context — never executed. | ADR-007, ADR-010 |
| **Standard** | An editable, project-owned document (`knowledge/standards/*.md`) stating how *this* project must be built. | ADR-010 |
| **PromptContext** | The ephemeral, assembled text produced by the Prompt Engine for one invocation — never persisted. | ADR-012 |
| **Workflow** | The canonical three-level process model (Context → Feature → Governance) that sequences every other entity. | ADR-011 |
| **Artifact** | Any durable, plain-text file AIEF's engine writes as a record — Change files, `proposal.md`, standards, `knowledge/skills.md`, release notes. | ADR-009 |
| **Requirement Source** | A read-only view of one item in an external system (Jira, Notion, GitHub Issues, or a human, via `manual`). | docs/requirement-sources.md |
| **Normalized Requirement** | The one logical shape every Requirement Source provider maps into, regardless of origin. | docs/requirement-sources.md |
| **Active Change** | The latest Change not marked Closed. Always *derived* from the files at read time — never stored. | ADR-009 |
| **Detector** | A rule that fires on a project signal (a dependency, a file, a keyword) with a declared strong/weak confidence. | ADR-007 |
| **Provider / Adapter** | A translation layer between an external system's native shape and AIEF's own vocabulary (a Requirement Source provider, the OpenSpec adapter, the SpecBoot adapter). | ADR-002, ADR-003 |
| **Proposal** | `proposal.md` — an idea or a Requirement Source's output, expressed as "why" and "what changes," pending a Specification. | ADR-002 |
| **Human Review Gate** | The rule that a Change (today: an Enrichment Change) cannot proceed to implementation while any of its "Human Review" tasks are unchecked. Implemented as an instance of the generic Task-gate, not a separate mechanism. | docs/enrichment-workflow.md |

---

## 2. Core Entities

### Change
The aggregate root of the entire domain. Everything else in this model exists to create, enrich, verify, or close a Change.

- **Identity**: the directory itself (`changes/0002-manual-test-001/`) — sequential numeric prefix + slug. No hidden ID, no database key (ADR-009).
- **Composition**: exactly four required Artifacts (change.md, spec.md, tasks.md, evidence.md); a Change missing or emptying any of them is invalid.
- **Type**: an open, convention-based tag (`## Type` in change.md) — `General`, `Analysis`, or `Enrichment` today. Each type may carry extra sections and extra verification rules (an Enrichment Change requires a Requirement Source section and a Human Review status; an Analysis Change requires a Detected Context section). This is deliberately a soft polymorphism — a string convention, not a formal type system — so new types can appear without a schema migration.
- **Lifecycle**: Open → Closed. Closed is marked by a single, literal `## Status / Closed` section written by one command (`aief close --yes`) — the only mutation Governance is allowed to make to a Change's own files.
- **Active Change**: not a property of any single Change — a *query* over all Changes (the latest one not Closed). This is a foundational domain rule: there is no "current Change" state anywhere in the system to fall out of sync.

### Specification
`spec.md` — declares what must be true for the Change to be considered correct: goal, requirements, acceptance criteria. For an Enrichment Change, the Specification additionally carries the Normalized Requirement and its epistemic classification: **Fact** `[H]` (stated by the source), **Inference** `[I]` (derived, not stated), **Assumption** `[S]` (missing, treated as unknown until a human confirms it). This classification is a domain concept in its own right — it is how AIEF represents *confidence* about a requirement, not just its content.

AIEF does not consider itself the owner of Specification quality — that responsibility belongs to OpenSpec when present, or to the humans/assistants who write it directly (ADR-001, ADR-002). AIEF's own generated spec.md is an honest fallback, not a competing spec engine.

### Task
A single checklist line inside `tasks.md`. Tasks are not first-class addressable objects — they are counted (open task count) and inspected in aggregate. The domain rule that gives Task its significance: **an unchecked task blocks Close.** This single generic mechanism is what implements the Human Review Gate for Enrichment Changes — there is no bespoke "review gate" system, just a Human Review section whose tasks start unchecked.

### Evidence
`evidence.md` — the Change's proof of work, and the most load-bearing Artifact in the model: adoption generates it automatically (never a placeholder), the Prompt Engine guards existing real evidence against blind overwrites, Verification reports placeholder evidence calmly for open Changes but warns for closed ones, and Governance refuses to close a Change whose evidence is incomplete.

Evidence has a **placeholder state** (the unedited template) distinguishable from a **completed state** by a structural heuristic, not a formal schema — a practical approximation of "has this actually been done," not a guarantee of quality.

### VerificationReport
A Value Object aggregating the result of judging a Change or a whole project: `errors`, `warnings`, `passed`, a leveled, renderable line list, and the recommended next command(s). Two producers read the same underlying Change facts at different scopes — one judging an entire project (used by `aief verify`), one judging a single Change's readiness (used by `aief close`) — deliberately sharing one rule set so "is this ready" never has two competing answers.

### Profile
Conceptually: structured knowledge about **how to reason** in a Change — a goal, a thinking style, an ordered set of priorities, what the output should look like, and what is explicitly out of this role's judgment. Selected by a human per Change (`--profile`), never detected from the project.

**Current status:** this is an accepted model (ADR-012), not yet a built one. Today `profiles/*.md` are free-form prose files (Mission/Responsibilities/Inputs/Outputs/Checklist), and prompt generation injects only a bare role name ("Act as the architect profile") — it does not read the structured fields ADR-012 defines. A domain model must represent both: the *target* concept (structured reasoning knowledge) and the *current* gap (an undefined string an assistant must interpret for itself). This gap is the single largest distance between AIEF's documented architecture and its running code today.

The orthogonality rule that defines Profile by exclusion is the sharpest boundary in the whole system: a Profile must never contain project facts (that's a Standard's job), must never encode technology knowledge (that's a Skill's job), and must never relax a rule, a gate, or the human-approval boundary (that belongs to AGENTS.md, which Profile can narrow but never override).

### Skill
Contextual, project-triggered knowledge — never executed, always injected as prompt context. A Skill exists at the intersection of three distinct concepts that must stay distinct (ADR-007, ADR-010):

1. a **Detector** (a rule that fires on a project signal, with a declared strong/weak confidence),
2. a **recommendation** (which Skills a fired Detector maps to),
3. **Skill content** (the actual knowledge: when to use it, which Standards to read, the prompt-context text, common risks, evidence expectations).

Skill differs from Profile along exactly one axis: a Skill is about the *codebase* (identical for every human working on it); a Profile is about the *actor* (chosen per human, per Change). Two people working the same Change with different Profiles receive the same Skills.

### Standard
An editable, project-owned convention document (`knowledge/standards/*.md`), created once by `adopt` and never overwritten afterward — meant to be edited by the team so it reflects real practice. A Standard states **how this project must be built**; it must never encode *how to detect what the project is* (that's a Detector's job) and must never encode *how an actor should reason* (that's a Profile's job). Standards constrain everyone working on the project; a Profile directs one role's thinking within those constraints.

### PromptContext
Not a file — the assembled, ephemeral text the Prompt Engine produces for a single `aief prompt` invocation, composing AGENTS.md, the assistant file, the Profile, the Standards, the Skills, and the active Change's own Artifacts into one string, plus type-specific guardrails (an Enrichment Change gets "do not implement, do not touch the source"; an Analysis Change gets "do not modify source code"; a General Change gets ordinary implementation instructions).

The domain rule that gives PromptContext its identity: **composition happens in exactly one place.** No source may pre-compose another — a Skill's content must never contain Profile-shaped instructions, a Standard must never contain Skill-shaped technology knowledge. This is stated as an architectural law (ADR-012), not a convenience: "any future capability that blurs one dimension into another is, by this ADR, architecturally wrong regardless of how convenient it looks." PromptContext is never persisted — it is printed once, pasted by a human, and gone; its statelessness is a direct expression of the no-hidden-state principle (ADR-009).

### Workflow
The canonical three-level process model — Context (prepare project + Change), Feature (the assistant implements, optionally through OpenSpec), Governance (verify + close) — that assigns responsibility and sequences every other entity. Workflow is not a runtime object; it is the meta-structure the whole product enforces, documented once (docs/Workflow.md) as the single description every other document must summarize rather than restate (ADR-011).

### Artifact
The generic term for any durable, plain-text record the engine writes: the four Change files, `proposal.md`, generated Standards, `knowledge/skills.md`, and release notes (`releases/v<version>.md`). The unifying rule: every Artifact is visible, versionable Markdown or JSON — never hidden, never binary, never requiring anything but a text editor and `git log` to inspect (ADR-009). Release notes are the one Artifact type today with comparatively little governing structure — noted as an open question below.

---

## 3. Core Domain, Supporting Domains, Infrastructure/Adapters

A strategic classification of *where product value lives*, distinct from where code lives.

### Core domain — where AIEF's actual differentiation is
**Change Management**, **Verification & Governance**, and **Prompt Composition**. This is "workflow discipline as a product": the guarantee that a Change exists before work starts, that evidence and readiness are checked before it's declared done, and that an assistant always starts from full, correctly composed context. Nothing else in the ecosystem (OpenSpec, SpecBoot, the assistants themselves) does this — it is AIEF's reason to exist (ADR-001).

### Supporting domains — necessary, but not themselves the differentiator
**Knowledge & Skills** (detection, the Skill catalog, Standards generation) and **Developer Experience** (`doctor`, `status`, guided help text, honest messaging). These make the core domain usable and trustworthy, but AIEF's identity would survive a much simpler detection engine or a plainer CLI — it would not survive losing Change/Verification/Prompt discipline.

### Infrastructure / Adapters — translation layers to the outside world
The OpenSpec adapter, the SpecBoot adapter, the Requirement Source providers (`manual`, `jira`, and the planned `notion`/`github`/`azure-devops`/`markdown`), the assistant-file resolution (CLAUDE.md/GEMINI.md/CODEX.md/CURSOR.md), and the raw filesystem helpers (`cwd`/`read`/`write`/`exists`). Each translates an external system's native shape into AIEF's own vocabulary at the boundary and is explicitly designed to be swappable or extensible without touching the core (ADR-002, ADR-003; the Requirement Source provider contract is the clearest recent example — a new provider is one adapter file, never a change to `enrich`'s own logic).

---

## 4. Bounded Contexts

Six contexts, each with one responsibility and one set of entities it owns.

### Change Management
**Owns:** Change, Specification, Task, Artifact creation and identity (sequential IDs, slugging, duplicate prevention). **Responsibility:** bring a Change into existence, whether from an idea (`new-change`, `propose`), from project self-inspection (`analyze`), or from an external Requirement Source (`enrich`). **Relationships:** downstream consumer of Knowledge & Skills (seeds Analysis Changes with detected context) and of Assistant Integration (Requirement Source providers feed `enrich`); upstream of Verification & Governance (nothing to verify without a Change) and of Prompt Composition (nothing to compose a prompt about without one).

### Verification & Governance
**Owns:** VerificationReport, the verification rule set, Close's readiness gate, the generic Task-gate mechanism the Human Review Gate is built from. **Responsibility:** judge whether a Change (or the whole project) is structurally sound, and — only when everything passes — write the single Status stamp that closes a Change. **Relationships:** strictly downstream of Change Management (reads Change state, never originates it); must never write Change content beyond that one stamp, or it would start doing Change Management's job (see Risks, below).

### Prompt Composition
**Owns:** PromptContext assembly — the one legal place AGENTS.md, the assistant file, Profile, Standards, Skills, and the active Change combine into a single string. **Responsibility:** hand an assistant a complete, correctly ordered context every time, so it never has to guess. **Relationships:** downstream of nearly everything (Change Management for the active Change; Knowledge & Skills for Standards/Skills; Profile once it is built); upstream of Assistant Integration (the composed text is what gets pasted into an assistant).

### Knowledge & Skills
**Owns:** Detector, Skill (recommendation and content), Standard generation and templates. **Responsibility:** purely advisory and data-driven — knows the project's technology signals, knows nothing about Change lifecycle or governance (ADR-007). **Relationships:** feeds Change Management (seeding) and Prompt Composition (content); depends on nothing else in the model.

### Assistant Integration
**Owns:** assistant-file resolution (which instruction file to include for Claude/Gemini/Codex/Cursor), the Requirement Source provider adapters, and the OpenSpec delegation contract (runtime-validated, loud fallback). **Responsibility:** an explicit anti-corruption layer — translate an external system's native shape (a Jira issue's JSON, an OpenSpec CLI's actual command surface, an assistant's own file convention) into AIEF's vocabulary (Normalized Requirement, a local Change fallback) at the boundary, so no internal domain logic ever depends on an external format directly. **Relationships:** upstream of Change Management (enrich) and Prompt Composition (assistant file selection); depends on nothing internal.

### Developer Experience
**Owns:** `doctor`, `status`, `help`/`explain`, and the guided-messaging convention every command follows (purpose/when/reads/writes/example/next, ADR-006) — including the discipline of reporting "already exists" honestly rather than claiming an action that didn't happen. **Responsibility:** cross-cutting — every other context's output passes through these conventions, but Developer Experience owns no domain data of its own. It is closer to a generic subdomain (in DDD terms) than a true bounded context, included here because the product treats its consistency as a first-class concern.

### Context relationships, summarized

```text
Assistant Integration ──(anti-corruption layer)──► Change Management
Assistant Integration ──(anti-corruption layer)──► Prompt Composition
Knowledge & Skills ──(open host / conformist)──► Change Management
Knowledge & Skills ──(open host / conformist)──► Prompt Composition
Change Management ──(customer)──► Verification & Governance
Change Management ──(customer)──► Prompt Composition
Developer Experience : cross-cutting presentation layer over all of the above
```

---

## 5. Risks of Mixing Contexts

Concrete, not hypothetical — each grounded in how the system is built today.

1. **Profile/Standard/Skill/AGENTS.md blurring.** The orthogonality rule (ADR-012) is enforced by documentation and convention, not by types or a runtime check. Nothing today stops a future contributor from putting a project fact into a Skill's prompt-context field, or a reasoning instruction into a Standard. Left unchecked, this is silent architectural drift — the boundary erodes one convenient addition at a time.

2. **Verification & Governance leaking into Change Management.** If Close's readiness logic ever started writing directly into `spec.md` or `tasks.md` instead of only the Status stamp in `change.md`, Governance would be mutating Artifacts it does not own — breaking the "each level governs its own artifact" principle (ADR-011) that separates AIEF's Close from OpenSpec's Archive.

3. **Assistant Integration bypassing its own anti-corruption layer.** A future live Jira/MCP integration that let an external ticket's status directly drive a Change's lifecycle status would conflate two genuinely distinct concepts: a Requirement Source's own `status` field (the source's business process) and a Change's `## Status / Closed` marker (AIEF's own governance state). The documentation already had to explicitly disambiguate these two "status" words — a careless implementation could merge what the words correctly keep apart.

4. **Prompt Composition duplicating logic instead of composing.** If a Skill's `promptContext` began containing Profile-shaped instructions ("act as an architect and…") instead of pure technology knowledge, composition would stop happening in one place — a supporting-domain data file would start doing the core domain's job.

5. **Developer Experience accumulating business logic.** If a help string started encoding an actual verification rule instead of deriving its text from a VerificationReport, Developer Experience would become a second, undeclared source of truth alongside Verification & Governance.

6. **Small duplications compounding.** Today, "is this Change closed" is computed via two independent call paths in the CLI (a standalone helper, and the loaded-Change field) that happen to share one underlying rule. Harmless while both trace to the same predicate — but exactly the kind of duplication that turns into a real cross-context inconsistency the first time one path is updated and the other isn't.

---

## 6. What Does NOT Belong to AIEF's Core

- **Specification, proposal, or task *content* generation** — that is OpenSpec's job, or the humans/assistants writing directly; AIEF's own generated `spec.md` is a documented fallback, never a competing spec engine (ADR-001, ADR-002).
- **Code implementation, refactoring, testing, or review** — the AI assistant's job, always.
- **Assistant-specific behavior or business logic** — the engine stays assistant-agnostic; differences between Claude/Gemini/Codex/Cursor end at which instruction file gets included (ADR-004).
- **Technology-specific knowledge as code** — it lives in the Skill/Detector catalog as data; the engine itself must know nothing about any specific stack (ADR-007).
- **Any persisted or hidden state** — no `.aief/` directory, no state file, no database. The Change files are the only source of truth (ADR-009).
- **Commits, pushes, PR creation, or release approval** — humans decide, always.
- **Real, credentialed, network integrations with Jira/Notion/GitHub/etc.** — today's Requirement Source providers are read-only, local-file-based, or simply absent by design; live network adapters are future Infrastructure work and explicitly not part of the core domain today.
- **SpecBoot's own file formats or tooling** — only its *concepts* are borrowed; nothing is vendored (ADR-003).
- **A general-purpose filesystem/repository abstraction** — deliberately rejected even in the recent Verification & Governance extraction; the Change loader is a minimal reader, not an infrastructure layer of its own.

---

## 7. Open Questions to Validate Before AIEF 1.x

1. Should Profile actually be built as structured data (ADR-012's model), or has `profiles/*.md`'s free prose worked well enough for long enough to suggest the structured model isn't actually needed? Which failure mode is worse: an undefined role string, or a second knowledge format to maintain?
2. Should Prompt Composition receive the same extraction Verification & Governance just did (a dedicated, independently testable service), or is inline composition in the CLI an acceptable long-term shape for something explicitly meant to stay "the one place composition happens"?
3. Is Change `Type` meant to stay an open, convention-based string forever, or should it become a closed, validated set as more types appear (a future "Proposal" type, for instance)?
4. Should the Requirement Source `status` field be renamed before more providers and more documentation reference it, to remove the naming collision with Change `## Status` at the source rather than only in prose?
5. Is a Release Note its own small bounded context, part of Change Management, or genuinely outside a Change-centric domain model altogether?
6. Should the two independent "is this Change closed" code paths be unified into one before more logic is added that could let them diverge?
7. Where exactly does Knowledge & Skills end and Assistant Integration begin — for instance, is a future MCP-based way of serving Skills a Knowledge & Skills concern or an Assistant Integration (adapter) concern?
8. Now that an Enrichment Change structurally depends on it, should the Human Review Gate become a first-class, explicitly named domain concept with its own rules — or does reusing the generic Task-gate mechanism remain sufficient as more Change types adopt the same pattern?
9. As more Requirement Source providers arrive (Notion, GitHub Issues, Azure DevOps), should Assistant Integration formally split into a "Requirement Source Integration" context and an "AI Assistant Integration" context, since their upstream/downstream relationships already differ?
10. Does trusting AIEF for less-supervised use require Verification & Governance to gain real scope-containment checks (did the assistant only touch what the Change declared) — and if so, is *declaring* scope a Change Management responsibility while *checking* it is Verification & Governance's, or does that split itself need re-examining?
