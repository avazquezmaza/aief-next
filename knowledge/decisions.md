# Architecture Decision Log

Key decisions behind AIEF Next. Each entry follows a lightweight ADR format: decision, context, consequences.

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
