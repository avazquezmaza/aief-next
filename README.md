# AIEF 2.0 — Assistant-Agnostic AI Engineering Workflow Engine

[![CI](https://github.com/avazquezmaza/aief-next/actions/workflows/ci.yml/badge.svg)](https://github.com/avazquezmaza/aief-next/actions/workflows/ci.yml)

> **AIEF coordinates humans, AI assistants, specifications, implementation and evidence in one visible workflow. It orchestrates the tools you already use — it does not replace any of them.**

## Current Status

**AIEF 2.0 baseline — frozen.** The `aief-2.0-baseline` tag marks the end of the stabilization stage. AIEF now enters its **first official 2.0 dogfooding** on a new project: the framework is not modified during that run, and any change after this baseline must be justified with evidence obtained from real use.

This is still **guided internal use**: validated on **one greenfield** (Spring Boot + Camel + Java 21) and **one brownfield** (Next.js / Postgres / Cognito / multitenant) project, and not yet approved for unsupervised delegated implementation or external stable publication.

Start here: [docs/TEAM-USAGE-GUIDE.md](docs/TEAM-USAGE-GUIDE.md) · Release readiness: [docs/AIEF-1.0-READINESS.md](docs/AIEF-1.0-READINESS.md)

## What is AIEF?

AIEF is a **workflow engine** for AI-assisted software engineering. It is a dependency-free Node.js CLI (`aief`) plus a set of visible conventions (`AGENTS.md`, `changes/`, `knowledge/`) that keep work consistent no matter which AI assistant does the implementation.

One rule drives everything — **think in Changes**:

- every meaningful unit of work is a **Change**,
- every Change has a **specification** and **tasks**,
- every completed Change has **evidence**,
- every AI assistant follows the same project rules (`AGENTS.md`).

## Why does it exist?

AI-assisted development gets messy fast: every developer prompts differently, requirements live in chat histories, decisions go untracked, "done" has no evidence, and documentation drifts. Assistants are excellent at implementing and terrible at remembering how your team works.

AIEF fixes the process, not the assistant: it prepares the context, composes the prompt, and governs the evidence — so the same engineering discipline survives across assistants, sessions and teammates. Full rationale: [docs/VISION.md](docs/VISION.md).

## What does AIEF NOT do?

AIEF has a deliberately narrow job. It does **not**:

- generate proposals, specs or task content — **OpenSpec** (or you) does;
- define your identity as spec tooling — **SpecBoot**'s concepts are integrated, never absorbed;
- implement, refactor, test or review code — your **AI assistant** does;
- depend on any specific assistant — Claude, Gemini, Codex, Cursor, Copilot and future assistants are all equal;
- keep hidden state — the Change files are the only source of truth ([ADR-009](knowledge/decisions.md));
- create commits, publish PRs or approve releases — **humans** decide.

The complete boundary map: [docs/ecosystem.md](docs/ecosystem.md) · [What AIEF does not do](docs/Workflow.md#what-aief-does-not-do).

## How it works

The workflow has three levels ([canonical description](docs/Workflow.md)):

```text
1 · Context     (AIEF)                 doctor -> init/adopt -> verify -> analyze -> prompt
2 · Feature     (assistant + OpenSpec) Explore -> Propose -> Apply -> Archive
3 · Governance  (AIEF)                 verify -> close
```

AIEF prepares context and governs outcomes (levels 1 and 3). The engineering itself — level 2 — happens in your assistant, optionally powered by OpenSpec. Stage-by-stage detail with inputs and outputs: [docs/lifecycle.md](docs/lifecycle.md).

Every Change gets this skeleton:

```text
changes/0001-add-login/
├── change.md      # why and what
├── spec.md        # requirements and acceptance criteria
├── tasks.md       # implementation checklist
└── evidence.md    # what actually happened, verified
```

## Install

Requires Node >= 18. No dependencies.

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
npm install     # no dependencies to download; validates the package
npm link        # installs a global `aief` command
aief --help
```

Prefer not to link? Run it directly: `node cli/bin/aief.js <command>`. Full install options and validation: [docs/bootstrap.md](docs/bootstrap.md).

## Bootstrap a project

**Existing project (primary use case)** — from your project's root:

```bash
aief doctor      # environment + project readiness (required/recommended/optional tools) — writes nothing
aief init        # initialize the current directory — visible structure only, never touches application code
aief verify      # check the AIEF structure
aief analyze     # create an Analysis Change seeded with everything doctor detected
```

`aief init` (like `aief adopt`, whose logic it reuses) creates `AGENTS.md` if missing, `changes/`, `knowledge/` with starter standards matched to your stack, and an adoption Change. It is idempotent, never overwrites, and tells you where OpenSpec and SpecBoot fit if they are missing.

**New project:**

```bash
aief init my-project
cd my-project
```

## Execute a Change

```bash
aief new-change add-login                # 1. create the Change skeleton
# edit change.md and spec.md             # 2. define the work (or delegate to OpenSpec)
aief prompt claude --profile architect   # 3. generate the context-complete prompt
                                         #    (or: gemini, codex, cursor)
# paste into your assistant              # 4. the assistant implements inside the Change
aief verify                              # 5. check structures and evidence
aief close --yes                         # 6. readiness checks pass -> Change marked Closed
```

The generated prompt carries `AGENTS.md`, the assistant file, the profile, your project standards and the recommended Skills — the assistant starts with the full context, not a blank chat. After adoption you will typically have two open Changes (`adopt-aief` and the Analysis); that is normal — with more than one Change open, `prompt`/`close` ask you to name the target with `--change <id>` instead of guessing (with exactly one open, `--change` is optional).

## Start from a Requirement Source (Jira, Notion, GitHub Issues, manual)

Real work usually starts in a ticket, not in `aief new-change`. `aief enrich <provider> <source-id>` reads a requirement **read-only** (AIEF never writes back to Jira, Notion or any other tool) and creates a Change seeded with it — classified as Fact `[H]` / Inference `[I]` / Assumption `[S]`, with Open Questions and a `Requires Human Review` status:

```bash
aief enrich manual TEST-001                                          # human-provided
aief enrich jira ISSUE-123 --file requirements/jira/ISSUE-123.json   # Jira, local export, no network
```

Every provider produces the same Normalized Requirement, so the workflow does not change as sources change. Only `manual` and `jira` (local-export placeholder) are implemented today; Notion, GitHub Issues and Azure DevOps are planned. `aief close --yes` refuses this Change until its Human Review tasks are checked off. After Human Review, `aief propose --change <the-change-id>` continues the **same** Change (adds `proposal.md`, never forks a new one) — plain `aief propose "<idea>"` still creates a new Change as before. Full model: [docs/requirement-sources.md](docs/requirement-sources.md) · full workflow: [docs/enrichment-workflow.md](docs/enrichment-workflow.md).

## How AIEF relates to OpenSpec, SpecBoot and assistants

All integrations are optional. AIEF works standalone and announces every fallback explicitly — never silently.

| Component | Responsibility |
|---|---|
| **AIEF** | Workflow, context, prompt composition, evidence, verification, Change lifecycle, adoption, bootstrap |
| **OpenSpec** *(optional)* | Proposal / Specification / Tasks |
| **SpecBoot** *(conceptual source)* | Inspiration for standards, instruction hierarchy and skills — integrated as concepts, never copied ([ADR-003](knowledge/decisions.md)) |
| **AI assistant** *(any)* | Implementation, refactoring, code generation, tests, local reasoning |
| **Humans** | Scope, trade-offs, architecture decisions, release readiness |

- **OpenSpec** — `aief propose "Add login"` validates the OpenSpec contract at runtime and delegates when possible; otherwise it creates a local Change and says so. AIEF never duplicates Proposal/Spec/Tasks ([ADR-002](knowledge/decisions.md), [adapters/openspec/](adapters/openspec/README.md)).
- **SpecBoot** — its ideas (modular standards, instruction hierarchy, skills) live on as AIEF concepts: editable standards under `knowledge/standards/`, Skills as prompt context ([ADR-010](knowledge/decisions.md), [adapters/specboot/](adapters/specboot/README.md)).
- **Assistants** — `aief prompt claude|gemini|codex|cursor` selects the instruction file; unknown values fail with guidance. No assistant is required, none is special.

Instruction hierarchy — `AGENTS.md` is always the source of truth:

```text
AGENTS.md -> assistant file (CLAUDE.md, GEMINI.md, ...) -> profile -> standards -> skills -> active Change
```

Full ecosystem picture and integration contracts: [docs/ecosystem.md](docs/ecosystem.md).

## Guarantees

- `doctor`, `status`, `prompt` and `verify` **never write files**. `close` writes one thing only — a `Status` section in `change.md` — and only with `--yes` after all readiness checks pass.
- `init`, `adopt` and `analyze` **never modify application code** and never overwrite existing files.
- **No hidden state**: the active Change is derived from the files themselves ([ADR-009](knowledge/decisions.md)).
- Skill recommendations always **explain why** they fired.
- Every command explains itself: `aief help <command>` shows purpose, when to use it, what it reads, what it writes, an example and the next step.

## Commands

```bash
aief help [command]   # self-documenting help for every command
aief doctor           # environment (required/recommended/optional) + project readiness
aief status           # adoption status and recent Changes
aief init [name]      # initialize current directory, or create a new project skeleton
aief adopt            # adopt AIEF in an existing project
aief analyze          # create an Analysis Change
aief new-change <name>
aief enrich manual|jira <source-id> [--file path]  # requirement source -> Change, read-only
aief propose "<idea>" [--change id] # delegates to OpenSpec, or continues an existing Change
aief prompt [claude|gemini|codex|cursor] [--profile architect] [--change id]
aief verify           # check AIEF structures
aief close [--yes]    # readiness checks; --yes marks the Change Closed
aief release <version>
```

Full reference: [docs/cli.md](docs/cli.md).

## Tests and validation

```bash
npm test                         # CLI test suite from the repo root (node --test, no dependencies)
cd examples/todo-app && npm test # executable example
node cli/bin/aief.js verify      # validate this repository's own AIEF structure
```

CI runs all three on every push and pull request ([.github/workflows/ci.yml](.github/workflows/ci.yml)).

## Learn more

| I want to... | Go to |
|---|---|
| Understand the product vision and non-goals | [docs/VISION.md](docs/VISION.md) |
| Understand the architecture | [docs/architecture.md](docs/architecture.md) |
| See the whole ecosystem and responsibilities | [docs/ecosystem.md](docs/ecosystem.md) |
| Read the architectural principles | [docs/principles.md](docs/principles.md) |
| Follow the project lifecycle stage by stage | [docs/lifecycle.md](docs/lifecycle.md) |
| Install and bootstrap | [docs/bootstrap.md](docs/bootstrap.md) |
| See the canonical workflow | [docs/Workflow.md](docs/Workflow.md) |
| Read the architecture decisions (ADRs) | [knowledge/decisions.md](knowledge/decisions.md) |
| Learn by example | [Todo App Example](examples/todo-app/README.md) |
| See how AI assistants must behave | [AGENTS.md](AGENTS.md) |
| Navigate step by step | [Navigator](NAVIGATOR.md) |

## Status and roadmap

The framework, CLI, tests and bootstrap experience exist and are validated on real projects; progress is tracked as Changes in [changes/](changes/) — the repository uses its own workflow. Roadmap: [docs/roadmap.md](docs/roadmap.md).

## License

MIT — see [LICENSE](LICENSE).
