# CLI Reference

`aief --help` shows usage; `aief --version` prints the version. Every command also answers, via
`aief help <command>` (alias: `aief explain <command>`): purpose, when to use it, what it reads,
what it writes, an example, and the recommended next step — this reference does not repeat that,
it adds the flag-level detail the built-in help keeps compact.

No command below is new for AIEF Core 3.0 — Core 3.0 landed entirely as additive, opt-in flags on
existing commands (`status --change`/`--next`, `prompt --skill`/`--list-skills`,
`verify --requirements`). Every command's default (no-flag) output and exit code are unchanged.

## Discovery

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief doctor` | PATH tools, project files | Nothing | Environment (required/recommended/optional tools) + project readiness. |
| `aief status` | `changes/`, project files | Nothing | Adoption overview, recent Changes, all open Changes, Workflow/SDD summaries. |
| `aief status --change <id>` | The selected Change | Nothing | Deep inspection: track, stage, gates, SDD readiness. |
| `aief status --change <id> --next` | The selected Change | Nothing | Compact Normalized Action: the one next command to run. |
| `aief status --next` | The one open Change | Nothing | Same as above with implicit selection (fails if more than one Change is open). |

## Bootstrap and adoption

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief init` | `AGENTS.md`, `changes/`, PATH (OpenSpec/SpecBoot) | `AGENTS.md` if missing, `changes/`, `knowledge/`, `profiles/` | Initialize the current directory. Never touches application code. |
| `aief init <name>` | Nothing | `<name>/` project skeleton | Create a new project. |
| `aief adopt` | `README.md`, `AGENTS.md`, `package.json` | Same as `init` (no argument), plus an adoption Change | Prepare an existing project for AIEF. |
| `aief analyze [name]` | Detected project signals | `changes/<id>-<name>/`, seeded with signals/Skills/standards | Create an Analysis Change. |

## Work

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief new-change <name>` | `changes/` (for the next ID) | `changes/<id>-<name>/` | Create a plain Change skeleton. |
| `aief enrich <provider> <source-id> [--file path]` | The Requirement Source, read-only | A new Change (`Requires Human Review`) | Seed a Change from Jira/manual instead of an idea. See [Workflow — Requirement Sources](workflow.md#starting-from-a-requirement-source). |
| `aief propose "<idea>"` | OpenSpec availability, `changes/` | OpenSpec output, or a local Change + `proposal.md` | Turn an idea into a proposal, delegating to OpenSpec when available. |
| `aief propose --change <id>` | The existing Change | Only `proposal.md` inside it | Continue an existing Change (e.g. after `enrich` + Human Review) without forking a new one. |
| `aief prompt [assistant] [--profile role] [--change id]` | `AGENTS.md`, assistant file, profile, standards, the selected Change | Nothing | Generate a ready-to-paste, context-complete prompt. |
| `aief prompt --skill <id> [...]` | The Skill's declared context | Nothing | Attach one registered Skill's output to the prompt. Unknown id, or a `invalid`/`failed` Skill result, exits 1 before any prompt is printed. |
| `aief prompt --list-skills` | The Skill registry | Nothing | List every registered Skill (id, version, title, description). |

## Governance

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief verify` | `README.md`, `AGENTS.md`, `changes/`, `knowledge/` | Nothing | Structural Verification for the whole project. |
| `aief verify --change <id>` | The selected Change | Nothing | Structural Verification for one Change; says exactly which one. |
| `aief verify --change <id> --requirements` | The Change's SDD artifacts + evidence | Nothing | Adds Requirement Verification — a per-requirement, evidence-grounded verdict. See [Workflow — Verification](workflow.md#verification). |
| `aief close [--yes] [--change id]` | The selected Change | A `## Status` section in `change.md` — only with `--yes`, only when all readiness checks pass | Check (or, with `--yes`, mark) a Change Closed. |

## Other

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief use-profile <role>` | Nothing | Nothing | Print a minimal prompt header for a role, without a full Change context. |
| `aief release <version>` | `releases/` | `releases/v<version>.md` if it doesn't already exist | Scaffold release notes. |
| `aief help [command]` / `aief explain <command>` | Nothing | Nothing | Self-documenting help. |

## Change selection

Every command that acts on one Change follows the same rule: with **exactly one open Change**,
`--change` is optional and that Change is selected implicitly. With **more than one open Change**,
selection must be explicit — `prompt`/`verify`/`close`/`status --next` all list the open candidates
and refuse to guess. `--change <selector>` accepts a full ID, a full name, or a unique fragment;
an unknown or ambiguous selector is a loud, actionable error, never "last match wins."

## Assistants

`aief prompt [claude|gemini|codex|cursor]` (positional) or `aief prompt --assistant gemini` select
which instruction file (`CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md`) is included; the explicit
flag wins if both are given. An unknown assistant name fails with the list of known ones — never a
silent fallback. No assistant is required and none is treated specially by the engine.

## Guarantees

- `doctor`, `status`, `prompt`, and `verify` never write files.
- `close` writes exactly one thing — a `## Status` section in `change.md` — and only with `--yes`
  after every readiness check passes.
- `init`/`adopt`/`analyze` never modify application code and never overwrite an existing file.
- No hidden state: every command re-derives what it needs from the files in `changes/`,
  `knowledge/`, and `manifest.json` on every invocation.
- Every command ends with a `Next:` hint pointing to the recommended next step.

## Testing

```bash
npm test                          # from the repo root — delegates to cli/, node --test, no dependencies
cd examples/todo-app && npm test  # executable example project
node cli/bin/aief.js verify       # validate this repository's own AIEF structure
```
