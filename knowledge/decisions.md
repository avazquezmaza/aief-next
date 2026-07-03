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

## ADR-008: Improvements come from validation with real projects, not assumptions

**Decision.** Roadmap priority goes to what real adoptions reveal (v0.2.0 = validation from real existing project adoption), not to speculative features.

**Context.** The v4 limitation was exactly this: documentation grew faster than validated capability.

**Consequences.** Every fix in this repo should trace to an observed failure (a bug reproduced, a confusing message, a broken adoption) captured as a Change with evidence. Integration contracts (e.g. the exact OpenSpec CLI surface) are marked as unvalidated until exercised against the real tool.
