# Cheat Sheet

One page, one line per term. For the full definition, follow the link into
[Concepts](concepts.md); for the full command reference, see [CLI Reference](cli.md) and
[Workflow](workflow.md).

## Glossary

| Term | One line | Full definition |
|---|---|---|
| Change | The unit of work — a `changes/<id>-<slug>/` directory of Markdown files; the only source of truth. | [Concepts — Change](concepts.md#change) |
| Project Maturity | `aief analyze`'s deterministic, file-evidence classification — Implemented / Definition / Ambiguous — that decides whether it creates an Analysis or a Definition Change. | [Concepts — Project Maturity](concepts.md#project-maturity) |
| Definition Change | Pre-implementation Change type answering *what should be built* — Context, Open Questions, Decisions Required, human-approved `Decision (human)`; never generates application code. | [Concepts — Change](concepts.md#change) |
| Approvals | `(human)` and `(review)` lines in `tasks.md` or `spec.md`'s Acceptance Criteria; `aief close` refuses while one is unchecked. | [Concepts — Approvals](concepts.md#approvals) |
| Requirement Source | A read-only view of a requirement from Jira/manual (Notion/GitHub Issues planned), normalized into one shape. | [Concepts — Requirement Source](concepts.md#requirement-source--normalized-requirement) |
| Skill | A versioned, registered capability `aief prompt --skill <id>` can attach to a prompt; instructions-only, never executes anything on its own. | [Concepts — Skill](concepts.md#skill) |
| Hook | Observes a lifecycle event (never blocks, never writes). | [Concepts — Hook](concepts.md#hook) |
| Graph | The Change dependency model — `## Depends on` in `change.md`, derived fresh on every read, never persisted. | [Concepts — Graph](concepts.md#graph) |
| Smart next-Change selection | `aief status --next`'s deterministic pick when 2+ Changes are open. | [Concepts — Smart next-Change selection](concepts.md#smart-next-change-selection) |
| Evidence | `evidence.md` — a Change's proof of what happened; `aief close` refuses a placeholder. | [Concepts — Evidence](concepts.md#evidence) |
| AGENTS.md | The constitution every AI assistant follows; everything else layers on top of it in a fixed order. | [Concepts — AGENTS.md](concepts.md#agentsmd-and-the-instruction-hierarchy) |

## Canonical flow

1. **`aief bootstrap`** — adopt AIEF into the current project (or scaffold a new one).
2. **`aief analyze`** — capture the existing architecture, stack, and risks (Implemented projects),
   or open a Definition Change to resolve requirements/decisions first (Definition projects — see
   [Concepts — Project Maturity](concepts.md#project-maturity)).
3. **`aief new-change <name>`** or **`aief enrich <provider> <source-id>`** — start the unit of work.
4. **`aief prompt`** — generate a context-complete prompt for your assistant.
5. *(implement, with the assistant, outside AIEF)*
6. **`aief verify`** — check the Change's structure and evidence.
7. **`aief close --yes`** — mark it closed, once evidence is real.

Full picture, with dependencies and the requirement-source variant: [Workflow](workflow.md).
