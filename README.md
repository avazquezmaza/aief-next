# AIEF — Assistant-Agnostic AI Engineering Workflow Engine

[![CI](https://github.com/avazquezmaza/aief-next/actions/workflows/ci.yml/badge.svg)](https://github.com/avazquezmaza/aief-next/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**AIEF turns any requirement into a context-complete prompt, then verifies the evidence your AI
assistant leaves behind — the same discipline no matter which assistant does the work.**

## Why AIEF exists

AI-assisted development gets messy fast: every developer prompts differently, requirements live in
chat histories, decisions go untracked, "done" has no proof, and documentation drifts the moment a
session ends. Assistants are excellent at implementing and remember nothing between sessions.

AIEF is a **workflow engine**, not an assistant. It doesn't write code — it composes context, keeps
the record, and checks the evidence. It is a dependency-free Node.js CLI (`aief`) plus a set of
visible conventions (`AGENTS.md`, `changes/`, `knowledge/`) that make that discipline survive
across assistants, sessions, and teammates. The repository is always the source of truth — no
daemon, no database, no hidden state.

## The core workflow

Every meaningful unit of work is a **Change**: a plain directory of Markdown files with a
specification, a task checklist, and evidence of what actually happened.

![AIEF Core 3.1 product workflow: a requirement becomes an AIEF Change, AIEF composes a context-complete prompt, an AI assistant implements it, evidence and verification follow, the Change is closed, and status --next recommends the following Change without executing it](docs/images/product-workflow.svg)

AIEF composes the prompt, your assistant implements, and humans decide what's next. The opt-in band
above — LIDR project intelligence, Skills, Standards, staged Workflow tracks, Harness/Hooks
visibility, Loop retry tracking, and the Change dependency Graph — layers onto this same loop
without changing its shape; none of it blocks `verify` or `close`, and `status --next` only ever
prints a recommendation. Full detail: [docs/workflow.md](docs/workflow.md) and
[docs/architecture.md](docs/architecture.md).

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
| Learn the vocabulary (Change, Track, Gate, SDD Provider, Skill, Hook, Verification Rule) | [Concepts](docs/concepts.md) |
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

AIEF Core 3.1 is implemented and validated on real projects: Change management, prompt composition,
structural and requirement verification, staged Workflow tracks, opt-in Harness/Hooks visibility,
Loop retry tracking, the Change dependency Graph, and Smart Workflow's `status --next` all work
together as one coherent release. Progress is tracked as Changes in [changes/](changes/) — that
history **is** the project's roadmap; each closed Change records what it delivered.

## License

MIT — see [LICENSE](LICENSE).
