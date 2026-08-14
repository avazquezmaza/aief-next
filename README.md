# AIEF — Assistant-Agnostic AI Engineering Workflow Engine

[![CI](https://github.com/avazquezmaza/aief-next/actions/workflows/ci.yml/badge.svg)](https://github.com/avazquezmaza/aief-next/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**AIEF is a repository-native governance framework for humans and AI assistants across software
definition, implementation, verification, and change lifecycle management — the same discipline
whether application code already exists or a project is still a PRD.**

## Why AIEF exists

AI-assisted development gets messy fast: every developer prompts differently, requirements live in
chat histories, decisions go untracked, "done" has no proof, and documentation drifts the moment a
session ends. Assistants are excellent at implementing and remember nothing between sessions. That
same discipline gap starts even earlier for a project that has no code yet — architecture and
product decisions get made in chat and never survive the conversation that made them.

AIEF is a **workflow engine**, not an assistant. It doesn't write code — it composes context, keeps
the record, and checks the evidence. It is a dependency-free Node.js CLI (`aief`) plus a set of
visible conventions (`AGENTS.md`, `changes/`, `knowledge/`) that make that discipline survive
across assistants, sessions, and teammates. The repository is always the source of truth — no
daemon, no database, no hidden state.

## The core workflow

Every meaningful unit of work is a **Change**: a plain directory of Markdown files with a
specification, a task checklist, and evidence of what actually happened.

![AIEF product workflow: a requirement becomes an AIEF Change, AIEF composes a context-complete prompt, an AI assistant implements it, evidence and verification follow, the Change is closed, and status --next recommends the following Change without executing it](docs/images/product-workflow.svg)

AIEF composes the prompt, your assistant implements, and humans decide what's next. The opt-in band
above — LIDR project intelligence, Skills, Standards, staged Workflow tracks, Harness/Hooks
visibility, Loop retry tracking, and the Change dependency Graph — layers onto this same loop
without changing its shape; none of it blocks `verify` or `close`, and `status --next` only ever
prints a recommendation. Full detail: [docs/workflow.md](docs/workflow.md) and
[docs/architecture.md](docs/architecture.md).

## Definition and Analysis: two starting points

`aief analyze` classifies a repository from file evidence alone (never semantic guessing) before
deciding what kind of Change to create:

| Maturity | Evidence | Routes to | Answers |
|---|---|---|---|
| **Implemented** | real application source under a recognized source directory | Analysis Change | What exists today, and what should change? |
| **Definition** | no application source, but a README/PRD/requirements document with real content | Definition Change | What should be built, and what must be decided first? |
| **Ambiguous** | neither signal clears its bar (near-empty repository) | Analysis Change (explicit, backward-compatible fallback) | — override with `aief analyze --maturity definition` if it's actually pre-implementation work |

A Definition Change is not a smaller Analysis Change — it never generates application code, and it
gates on human governance: every architecture or product decision needs an explicit human-approved
`Decision (human)`, never one an assistant fills in itself. Full model:
[Concepts — Project Maturity](docs/concepts.md#project-maturity) and
[Getting Started — Starting from a PRD](docs/getting-started.md#starting-from-a-prd-no-code-yet).

## Adopt AIEF in an existing project

Existing projects are AIEF's primary use case — not a special case of "new project." `aief doctor`
inspects your environment and this repository and writes nothing. `aief bootstrap` then adds
AIEF's visible governance structure (`AGENTS.md` if missing, `changes/`, `knowledge/`) — it never
touches application code and never overwrites a file that's already there. It doesn't alter Git,
CI, or any tool your project already uses. `aief verify` validates the resulting structure, and
`aief analyze` records what AIEF detected about the existing repository as a seeded Analysis
Change.

```bash
aief doctor
aief bootstrap
aief verify
aief analyze
```

Full walkthrough — what each command reads/writes, what happens if `AGENTS.md` or `changes/`
already exist, and how this coexists with OpenSpec/SpecBoot:
[docs/getting-started.md — Adopting an existing project](docs/getting-started.md#adopting-an-existing-project).

## Start a software initiative before code exists

A repository can be legitimately pre-implementation — a README, a PRD, business/stakeholder
constraints, and nothing under `src/` yet. The same two commands apply; `analyze` detects the
difference and creates a Definition Change instead of an Analysis Change:

```bash
aief bootstrap
aief analyze     # detects no application source + real PRD/README content
                  # -> creates a Definition Change, not an Analysis one
```

The Definition Change captures Context, Known Requirements, Open Questions and Decisions Required;
approved decisions are recorded durably in `knowledge/decisions.md`; `aief verify --strict`
objectively checks completeness (every decision resolved, no unresolved human-approval task) before
the Change can close. Full walkthrough:
[docs/getting-started.md — Starting from a PRD](docs/getting-started.md#starting-from-a-prd-no-code-yet).

## Quick start

Requires Node.js >= 18. No runtime dependencies.

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next && npm install && npm link   # installs the global `aief` command

aief doctor                              # environment + project readiness
aief bootstrap                           # adopt AIEF in the current project
aief new-change add-login                # create a Change
aief prompt claude --profile developer   # generate a context-complete prompt
aief verify                              # check structure and evidence
aief close --yes                         # mark the Change Closed
aief status --next                       # what to do next
```

Full install steps and a first-Change walkthrough: [docs/getting-started.md](docs/getting-started.md).

## What AIEF adds

- **Context** — `aief prompt` composes `AGENTS.md`, an optional assistant adapter, project
  Standards and Skills, and the active Change into one portable, ready-to-paste prompt.
- **Pre-implementation governance** — `aief analyze` detects when a project is still Definition
  (no application source yet) and routes it to a Definition Change instead of an Analysis one, with
  human-approved decisions gating close.
- **Change management** — every unit of work is a Change directory; optional `manifest.json` opts
  it into staged tracks and gates.
- **Evidence and verification** — `aief verify` checks structure unconditionally, and can
  additionally verify declared requirements against recorded evidence.
- **Dependency visibility** — declare `dependsOn` between Changes and inspect the resulting graph
  with `aief status --graph`.
- **Next-work recommendation** — `aief status --next` recommends one eligible Change when several
  are open; it never executes anything.

## How AIEF fits into your engineering workflow

AIEF sits between the people who decide what to build and the tools that build and ship it. It
doesn't replace any of them.

| Layer | Role |
|---|---|
| **Humans** | Scope, trade-offs, architecture decisions, release readiness |
| **AIEF** | Context, Change lifecycle, prompt composition, evidence, verification |
| **Specification sources** | OpenSpec, Jira, or plain Markdown — optional, feed the Change |
| **AI assistants** | Implementation, refactoring, tests, review — any assistant, equally |
| **CI / test tools** | Produce the evidence AIEF's verification reads |
| **Git / release tools** | Commits, PRs, tags, releases — always a human decision |

OpenSpec is optional. CI and Git remain external systems AIEF never touches directly. Details:
[docs/architecture.md](docs/architecture.md#system-context).

## Assistant compatibility

`AGENTS.md` is the one universal instruction file every `aief prompt` output tells the assistant to
read first, generated identically regardless of which assistant (if any) you name.

| Assistant | Mode | Command |
|---|---|---|
| Claude Code | Native target | `aief prompt claude` |
| Gemini CLI | Native target | `aief prompt gemini` |
| Codex CLI | Native target | `aief prompt codex` |
| Cursor | Native target | `aief prompt cursor` |
| OpenCode | Generic prompt compatible | `aief prompt` |
| Other prompt-driven assistants | Generic prompt compatible | `aief prompt` |

Adapter files, fallback behavior, and how compatibility was verified: [docs/cli.md](docs/cli.md#assistants).

## Documentation

| I want to... | Go to |
|---|---|
| Get from zero to a verified Change | [Getting Started](docs/getting-started.md) |
| Start a project from a PRD, no code yet | [Getting Started — Starting from a PRD](docs/getting-started.md#starting-from-a-prd-no-code-yet) |
| Learn the vocabulary (Change, Track, Gate, SDD Provider, Skill, Hook, Verification Rule, Project Maturity) | [Concepts](docs/concepts.md) ([Cheat Sheet](docs/cheat-sheet.md) for a one-page lookup) |
| Understand the full lifecycle, tracks, and verification model | [Workflow](docs/workflow.md) |
| Understand the implemented architecture | [Architecture](docs/architecture.md) |
| Look up a CLI command or flag | [CLI Reference](docs/cli.md) |
| Find every configuration file AIEF reads | [Configuration](docs/configuration.md) |
| See worked examples | [Examples](docs/examples.md) |
| Extend AIEF or contribute a Change | [Maintainer Guide](docs/maintainer.md) |
| Read the architecture decision log (ADRs) | [knowledge/decisions.md](knowledge/decisions.md) |
| Browse engineering history and superseded proposals | [docs/history/](docs/history/README.md) |

Recommended reading order: this README → [Getting Started](docs/getting-started.md) →
[Concepts](docs/concepts.md) → [Workflow](docs/workflow.md) → [Architecture](docs/architecture.md) →
[CLI Reference](docs/cli.md) → [Examples](docs/examples.md). Everything else is optional.

## Contributing

Every unit of work in this repository is itself an AIEF Change — see
[docs/maintainer.md](docs/maintainer.md) for the contribution workflow, how to add a Skill, Hook,
Verification Rule, or provider, and the documentation rules that keep this set small. Please open
an issue before major changes ([CONTRIBUTING.md](CONTRIBUTING.md)).

## Status

AIEF 3.2 is implemented and validated on real projects: Change management, prompt composition,
structural and requirement verification, staged Workflow tracks, opt-in Harness/Hooks visibility,
Loop retry tracking, the Change dependency Graph, Smart Workflow's `status --next`, and
pre-implementation Definition governance (project maturity detection, Definition Changes, human
decision gating, `verify --strict`) all work together as one coherent release. Progress is tracked
as Changes in [changes/](changes/) — that history **is** the project's roadmap; each closed Change
records what it delivered.

## License

MIT — see [LICENSE](LICENSE).
