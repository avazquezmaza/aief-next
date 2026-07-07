# AIEF Vision

> Canonical vision document. `docs/Vision-and-Principles.md` is superseded by this file and [principles.md](principles.md).

## Product vision

**AIEF is the assistant-agnostic workflow engine for AI-assisted software engineering.**

When humans and AI assistants build software together, the assistant is interchangeable — the engineering discipline must not be. AIEF makes that discipline explicit, visible and portable: the same Changes, the same rules, the same evidence, whichever assistant is doing the work.

## Why AIEF exists

Three observations drove the product:

1. **Assistants forget; repositories remember.** Chat context evaporates. AIEF puts everything that matters — rules, scope, standards, evidence — into visible files the assistant reads at the start of every session.
2. **The bottleneck is not code generation — it is coordination.** Modern assistants implement well. What fails in practice is untracked scope, prompts that omit project rules, and "done" without proof. That is a workflow problem, and workflow is AIEF's single responsibility.
3. **Good tools already exist for the neighboring problems.** OpenSpec generates specifications. SpecBoot organizes assistant instructions. Assistants implement. Rebuilding any of these would produce a worse copy; coordinating them produces something none of them do alone.

## Long-term goals

- Remain the **reference workflow** for multi-assistant engineering: one project, many assistants, one discipline.
- Lower distribution friction: npm package (`npx` without cloning), CI integration (GitHub Action), possibly an MCP server — evolving from a linked CLI toward an **AI engineering runtime** that other tools can call. The identity stays the same: coordination, not implementation.
- Keep improving **only from validated adoption evidence** ([ADR-008](../knowledge/decisions.md)) — every feature must trace to an observed failure or friction on a real project.
- Complete the knowledge model: operational Profiles ([ADR-012](../knowledge/decisions.md)) so every layer of the instruction hierarchy has real content.

## Non-goals

AIEF will never:

- **Generate specifications** — Proposal/Spec/Tasks belong to OpenSpec or to humans ([ADR-001](../knowledge/decisions.md), [ADR-002](../knowledge/decisions.md)).
- **Absorb SpecBoot** — conventions, instruction bootstrapping and skills concepts are integrated conceptually, never copied or owned ([ADR-003](../knowledge/decisions.md)).
- **Implement application code** — implementation, refactoring and tests belong to the assistant and the humans directing it.
- **Prefer an assistant** — no claude-mode, no gemini-mode; assistant support is an adapter concern, never core logic.
- **Automate the human away** — AI assists, humans decide. AIEF does not approve scope, commit code or publish releases.
- **Accumulate hidden state** — everything AIEF knows lives in files you can read and diff ([ADR-009](../knowledge/decisions.md)).

## Design philosophy

- **Workflow over automation.** AIEF coordinates engineering; it does not try to replace it. A guided step the human understands beats an automated step nobody can inspect.
- **Visible over clever.** Plain Markdown files, a dependency-free CLI, no daemon, no database. If you can't `cat` it, AIEF doesn't store it.
- **Honest by construction.** Commands report what they actually did ("already existed", "falling back — OpenSpec not installed"), never what they intended to do.
- **Small surface, sharp boundaries.** Every component owns exactly one responsibility; the [ecosystem map](ecosystem.md) says who owns what, and the [principles](principles.md) say why.
- **Evidence closes the loop.** A Change without evidence is not done. This is the framework's one non-negotiable output.

## Where it stands

Foundation and validation are complete: adoption engine, prompt composition, governance cycle, bootstrap experience, real-project validations. Current status and next steps: [roadmap.md](roadmap.md).
