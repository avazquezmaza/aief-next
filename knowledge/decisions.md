# Architecture Decision Log

Key decisions behind AIEF Next. Each entry follows a lightweight ADR format: decision, context, consequences. Entries are accepted unless explicitly marked otherwise.

---

## ADR-012: Operational Profiles

**Status: Accepted (2026-07-05). Proposed 2026-07-04; revised twice after review (structured model; orthogonality principle). Acceptance of this ADR is the milestone — implementation (0025) is a separate decision, not yet started.**

**Milestone context.** Changes 0016–0024 completed real-project validation, standards as project context, operational and visible Skills, workflow clarity, adoption UX fixes, Gemini prompt UX and prompt lifecycle guardrails. The Workflow Engine is considered stable for the validated lane (solo developer, Node stack, any of four assistants, no OpenSpec). The one remaining promise-gap inside the generated prompt is the Profile.

**What is a Profile?** A Profile is **structured operational knowledge about how to reason** in the active Change. It is not a document: it is a model, conceptually parallel to the Skills catalog, whose fields describe a way of working:

```text
goal            what this role is trying to achieve
thinkingStyle   how it approaches problems (e.g. trade-offs first, defects first)
priorities      what it optimizes for, in order
expectedOutputs what its results look like
avoid           what is outside this role's job or judgment
```

It is selected explicitly by the human per Change (`--profile`), never detected from the project. Markdown, when it exists at all, is an optional *rendered representation* of this model — exactly as `knowledge/skills.md` is a rendered view of the Skills catalog, never the source of truth.

**The knowledge taxonomy.** Each layer answers one distinct question, which is why none can absorb another:

| Layer | Question it answers |
|---|---|
| AGENTS.md | What rules must never be violated? |
| **Profile** | **How should I reason?** |
| Standards | How should this project be built? |
| Skills | What should I know? |

**Design principle — the four dimensions are orthogonal.** These layers are not four kinds of documentation; they are four *dimensions of engineering context*, and their questions are orthogonal. One layer must never absorb another:

- **Profiles must never contain project facts** — that is Standards' dimension.
- **Skills must never define assistant behaviour** — they inform reasoning, they do not shape it; behaviour belongs to Profiles (and rules to AGENTS.md).
- **Standards must never become project detection** — they state how the project must be built; discovering what the project *is* belongs to the detectors.
- **AGENTS.md must never become a knowledge base** — it holds inviolable rules, nothing else.

Each source has a single responsibility. **The Prompt Engine is the only place where the four dimensions are composed into a single prompt** — composition is the renderer's job, never the sources'. This is a design principle of AIEF, not an implementation detail: any future capability that blurs one dimension into another is, by this ADR, architecturally wrong regardless of how convenient it looks.

**Profile vs AGENTS.md.** AGENTS.md is the constitution binding every assistant in every Change. A Profile shapes reasoning within those rules; it may narrow focus but never relaxes rules, gates or the human-approval boundary.

**Profile vs Skill.** Skills are knowledge triggered by *project* signals — identical for every role working on the codebase. A Profile is chosen by the *human* and describes the actor's reasoning, not the codebase. Orthogonal by design: architect and developer on the same project receive the same Skills and different Profiles.

**Profile vs Standard.** Standards are editable project property stating how work must be done *here*. Profiles are project-independent reasoning models. Standards constrain everyone; a Profile directs one role's thinking.

**Where does the model live?** The **canonical structured definitions belong to AIEF** (role reasoning is project-independent; copying it into every adopted project would recreate the snapshot-drift problem observed with skills.md). Projects may *specialize* a profile, but any override is expressed against the structured model — the exact override mechanism (structured fragment vs rendered file) is an implementation decision deferred to the implementation Change, with one constraint fixed here: **Markdown may be a representation or an input, never the model**. Resolution order: project specialization if present → AIEF canonical definition → honest "no profile content defined".

**Injected into prompts?** Yes. The **Prompt Engine transforms the structured model into natural-language instructions** — the same pipeline shape Skills already use (catalog fields → rendered prompt block). This is the architectural payoff of the structured model: composition, richer or assistant-specific renderings, and future evolution happen in the renderer, without touching the knowledge itself or committing it to any file format. The rendered block must stay small (a handful of lines; 0024 flagged prompt growth as a watch item) and honestly labeled, never a reference to a file that does not exist.

**What never belongs in a Profile.** Permission to bypass AGENTS.md, verify or close gates; project-specific facts (Standards' job); technology knowledge (Skills' job); executable behavior or commands; identity or seniority claims about the human; tenant or environment configuration.

**What real validation revealed.** Friction #8 (0020 product validation) and question 3 of the Claude Code validation on trk-orchestrator-portal: the prompt says "Act as the architect profile" but nothing defines what that means — adopted projects get only a `profiles/README.md` pointing vaguely at "the source AIEF repository". The assistant fell back to its own interpretation of "architect": it worked, but it is undefined behavior. The same validation showed standards + Skills compensate for most of the gap — so the fix is a small knowledge model plus rendering, not a new system.

**Consequences if accepted.** The instruction hierarchy (`AGENTS.md → assistant file → profile → standards → skills → active Change`) becomes fully backed by content at every level; prompts stop referencing an empty concept; the detector/recommendation/content separation established for Skills (ADR-010) gains its reasoning-side counterpart; no new commands, no hidden state, no changes to Skills or Standards.

**Next implementation Change (proposal).** `0025-operational-profiles`: define the structured model (goal, thinkingStyle, priorities, expectedOutputs, avoid) for the existing profile set as catalog-style data owned by AIEF; render it into `aief prompt` through the existing pipeline with the resolution order and honest fallback above; decide the project-specialization mechanism there; and — same area, pending backlog item #5 — default Analysis Changes to the architect profile. Acceptance must include re-validation on a real project, per ADR-008.

---

## ADR-001: AIEF is a Workflow Engine, not a specification generator

**Decision.** AIEF orchestrates the engineering workflow (Change → Spec → Tasks → Build → Verify → Evidence). It does not generate specifications itself.

**Context.** The original AI Engineering Framework (v4) accumulated a lot of documentation but few operational capabilities. Specification generation is already solved well by dedicated tools.

**Consequences.** AIEF stays small. Specification quality is delegated to OpenSpec or to the humans and assistants writing `spec.md`.

---

## ADR-002: OpenSpec is integrated, not replaced

**Decision.** OpenSpec is the preferred generator for Proposal / Spec / Tasks. AIEF delegates to it when available (`aief propose`) and falls back to local Change skeletons when it is not.

**Context.** Rebuilding structured proposal generation inside AIEF would duplicate OpenSpec and couple the workflow engine to a spec format.

**Consequences.** OpenSpec remains optional. The CLI validates the OpenSpec command contract at runtime and falls back loudly, never silently (see `adapters/openspec/README.md`).

---

## ADR-003: Specboot is integrated conceptually, not copied

**Decision.** AIEF adopts Specboot's ideas — assistant bootstrap, instruction hierarchy, profiles — through adapters and templates, without vendoring its code or structure.

**Context.** LIDR Specboot solves assistant instruction organization well; copying it would create a fork to maintain.

**Consequences.** `adapters/specboot/` and `templates/specboot/` describe the mapping. Specboot remains optional.

---

## ADR-004: AGENTS.md is the primary source of rules

**Decision.** `AGENTS.md` holds the universal collaboration rules. Assistant-specific files (`CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `CURSOR.md`) only add assistant-specific guidance and must not contradict it.

**Context.** Multiple assistants working on one project drift apart without a single source of truth.

**Consequences.** The conceptual hierarchy is: `AGENTS.md` → assistant file → profile → skill → active Change. Skills add specialized knowledge but never override AGENTS.md.

---

## ADR-005: Adopting existing projects is the primary use case

**Decision.** The Adoption Engine (`doctor`, `adopt`, `analyze`, `prompt`, `verify`, `close`) is the core product of AIEF Next.

**Context.** Most real teams have existing codebases; greenfield `init` is the easy case. The v4 framework was validated mostly on paper, not on real adoptions.

**Consequences.** Adoption must be safe: it never modifies application code, never collides with existing Changes, and is idempotent. These properties are covered by the CLI test suite.

---

## ADR-006: The CLI must be guided and educational

**Decision.** Every command explains its purpose, when to use it, what it reads, what it writes, an example and the recommended next step. Messages must be honest (e.g. report when a file already existed instead of claiming it was created).

**Context.** AIEF's users include people adopting an AI-assisted workflow for the first time; a terse CLI defeats the framework's teaching goal.

**Consequences.** `aief help <command>` covers every command. Fallbacks and skipped writes are reported explicitly.

---

## ADR-007: Technology-specific knowledge lives outside the workflow engine

**Decision.** Technology detectors and Skill recommendations are data (`cli/src/skills-catalog.json`), consumed by a small engine (`cli/src/detect.js`). The workflow logic in `cli/src/cli.js` knows nothing about tenants, n8n or AWS.

**Context.** The first detectors were hardcoded keywords inherited from the multitenant SaaS project that motivated AIEF v4. Hardcoding domain knowledge in the engine made it wrong for every other project and produced false positives (substring matches like "ai" inside "maintainability").

**Consequences.** Detection uses word-boundary matching, declares signal strength (strong = dependencies/files, weak = keywords), and every recommendation states its reason. Extending detection means editing the catalog, not the engine.

---

## ADR-011: The workflow is documented as three levels — Context, Feature, Governance

**Decision.** AIEF documents one canonical workflow model ([docs/Workflow.md](../docs/Workflow.md)) with three levels: **1 · AIEF Context** (`doctor → adopt → verify → analyze → prompt`), **2 · OpenSpec / Assistant Feature Workflow** (verified official OpenSpec: `Explore → Propose → Apply → Archive`, driven by assistant slash commands; extensible with Specboot-style skills like *enrich-us* or *adversarial review*, documented as examples, never as official OpenSpec), and **3 · AIEF Governance** (`verify → close`). `aief close` is explicitly not OpenSpec `/archive`: each governs its own artifact.

**Context.** Four different workflow phrasings had accumulated across README, docs/Workflow.md and the OpenSpec adapter, none distinguishing what AIEF does from what the assistant/OpenSpec does. Specboot's operational clarity inspired the level separation; nothing was copied. The model is documentation-only: no CLI behavior changed, no commands added, no state introduced.

**Consequences.** All workflow descriptions summarize docs/Workflow.md instead of restating their own variant. The local (no-OpenSpec) path is documented as the normal path. Restrictions live in one place ("What AIEF does not do").

---

## ADR-010: Project standards and Skills are contextual knowledge; OpenSpec remains the spec workflow engine

**Decision.** AIEF adopts Specboot's *concepts* — modular project standards and role/skill knowledge — as files under `knowledge/standards/` (created by `aief adopt`, never overwritten) and as operational Skill content in `cli/src/skills-catalog.json` (purpose, whenToUse, standardsToRead, promptContext, commonRisks, evidenceExpectations). `aief prompt` injects both as *context* for the assistant. AIEF does not copy Specboot files and does not reimplement OpenSpec's Proposal → Spec → Tasks workflow.

**Context.** Validation on a real project (Change 0016/0018) showed the biggest gap was contextual: prompts referenced profiles/skills with no operational content, and `analyze` discarded everything `doctor` detected. Specboot (LIDR) solves this with standards documents and skill files; copying it would fork a project we only want to learn from. Research during this Change also found the real OpenSpec (Fission-AI/OpenSpec) exposes `propose` as an assistant slash command, not a terminal command — confirming AIEF should treat OpenSpec as the spec engine used *through the assistant*, with AIEF's local Change skeleton as the documented fallback.

**Consequences.** Three concepts stay distinct in the catalog: *detectors* (fire on project signals), *skill recommendations* (map detectors to Skills), and *skill content* (knowledge injected into prompts — included as context, never claimed to be "executed"). Standards are editable project property; AGENTS.md remains the rule hierarchy root; OpenSpec remains optional and authoritative for formal spec workflows.

---

## ADR-009: No hidden state — the Change files are the only source of truth

**Decision.** AIEF stores no state outside the Change files. A Change is closed when its own `change.md` carries a `## Status / Closed` section (written by `aief close --yes`). The "active Change" is derived: the latest Change not marked Closed, overridable with `--change`. A proposed `.aief/state.json` was evaluated and rejected.

**Context.** An external review (Gemini, 2026-07) suggested an explicit `activeChange` state file. Analysis: "active Change" is a per-person concept — committing a state file makes one developer's switch affect the whole team; gitignoring it creates invisible state. Both variants add a second source of truth that can drift from reality.

**Consequences.** `status`, `prompt` and `close` need no synchronization logic; closing a Change naturally promotes the next open one; everything is visible in diffs and reviews.

---

## ADR-008: Improvements come from validation with real projects, not assumptions

**Decision.** Roadmap priority goes to what real adoptions reveal (v0.2.0 = validation from real existing project adoption), not to speculative features.

**Context.** The v4 limitation was exactly this: documentation grew faster than validated capability.

**Consequences.** Every fix in this repo should trace to an observed failure (a bug reproduced, a confusing message, a broken adoption) captured as a Change with evidence. Integration contracts (e.g. the exact OpenSpec CLI surface) are marked as unvalidated until exercised against the real tool.
