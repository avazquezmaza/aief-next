# CLI Reference

`aief --help` shows usage; `aief --version` prints the version. Every command also answers, via
`aief help <command>` (alias: `aief explain <command>`): purpose, when to use it, what it reads,
what it writes, an example, and the recommended next step — this reference does not repeat that,
it adds the flag-level detail the built-in help keeps compact.

No command below is a new top-level command — every Core 3.0 and AIEF 3.1 addition landed as
additive, opt-in flags on an existing command (`status --change`/`--next`/`--graph`,
`prompt --skill`/`--list-skills`, `verify --requirements`, `doctor --verbose`). Every command's
default (no-flag) output and exit code are unchanged; each row below cites the Change/ADR that
introduced its flag.

## Discovery

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief doctor` | PATH tools, project files, `ai-specs/skills/`, `ai-specs/standards/`, whether `GEMINI_API_KEY` is set in the environment | Nothing | Environment (required/recommended/optional tools) + project readiness. Recommended Skills include a project's own `ai-specs/skills/*.md` alongside AIEF's built-ins — project always wins on id collision (Change 0054/ADR-024). A "Standards:" section appears — only when `ai-specs/standards/` contributes something — with the same project-over-built-in precedence (Change 0055/ADR-025). One line always reports the graph-engine mode an assistant would use for the `graphify-ast-architecture` Skill — `Graphify Semantic Engine available` when `GEMINI_API_KEY` is set, `AST Engine active` otherwise; this reads the variable's presence only, never its value, and never calls Gemini (Change 0064). Exits 1 only when a required tool (Node, npm, git) is missing; exits 0 otherwise, including when recommended tools are absent. |
| `aief doctor --verbose` | Same, plus every open Change's `manifest.loop`/`loop.md` | Nothing | Same, plus each Skill's/Standard's `source`, file `path` when project-sourced, `overrides` when it shadows a built-in, full `ai-specs` resolution warnings, a "Harness:" section listing every registered Hook and the event it fires on (Change 0056/ADR-026), and — only when at least one open Change configures it — a "Loop:" section with each such Change's current attempt count (Change 0057/ADR-027, read-only). |
| `aief status` | `changes/`, project files, every Change's `manifest.dependsOn` | Nothing | Adoption overview, recent Changes, all open Changes, Workflow/SDD summaries, and — only when at least one Change declares `dependsOn` — a "Dependency Graph:" section (Change 0058/ADR-028). |
| `aief status --graph` | Every Change's `manifest.dependsOn` | Nothing | The full Change dependency graph: every Change as a node, all edges, topological order (or an explicit cycle statement), all issues. New flag, Change 0058/ADR-028. |
| `aief status --change <id>` | The selected Change | Nothing | Deep inspection: track, stage, gates, SDD readiness, and — only when that Change's manifest declares `harness` — a "Harness:" configuration summary (Change 0056/ADR-026). |
| `aief status --change <id> --next` | The selected Change | Nothing | Compact Normalized Action: the one next command to run. |
| `aief status --next` | Every open Change, their `manifest.dependsOn`, the Graph, Workflow gate state | Nothing | Zero open Changes: error. Exactly one: same compact Normalized Action as `--change <id> --next`, unchanged. **2+ open Changes** (Change 0059/ADR-029): deterministically recommends the next eligible Change (open, valid manifest, dependencies closed, no Graph cycle, no Workflow gate blocker), tie-broken by lowest id — or explains why none is eligible. Replaces the prior "select one explicitly" error for this case only. |

## Bootstrap and adoption

`aief bootstrap` (AIEF 3.1, Change 0052) replaces the former `aief init`/`aief adopt` commands —
both now print a one-line redirect and exit 1.

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief bootstrap` | `AGENTS.md`, `changes/`, PATH (OpenSpec/SpecBoot, TTY) | `AGENTS.md` if missing, `changes/`, `knowledge/`, `profiles/`, starter standards, `knowledge/skills.md`, the CI gate, an `adopt-aief` Change, and `knowledge/sdd-provider.json` only when the SDD Provider choice is ambiguous and you are prompted | Bootstrap the current directory (the primary use case: an existing project). Never touches application code, never overwrites existing files. Idempotent — a second run creates nothing new and reports "already exists" for each artifact. Exits 0 regardless of whether anything new was created. |
| `aief bootstrap <name>` | Only checks whether `<name>/` already exists | `<name>/README.md`, a minimal `<name>/AGENTS.md`, and empty `changes/`, `knowledge/`, `src/`, `tests/` directories | Create a brand-new project skeleton at `<name>/` — engineering governance structure only, no application code, no framework, no `package.json`. Fails (exit 1) if `<name>/` already exists; run it once per new project, then `cd <name>` and add your chosen stack yourself. `--interactive` has no effect here (see below). |
| `aief bootstrap --interactive` | Everything plain `aief bootstrap` reads, plus stdin (one guided question) | Everything plain `aief bootstrap` writes, plus whatever `aief analyze`/`aief new-change` writes if you choose one | AIEF 3.1, Change 0068. Current-directory bootstrap only. After the same detection/adoption steps as plain `bootstrap`, asks once — analyze this project, start a new Change, or skip — and runs the chosen command directly instead of printing the static "Next steps" list. Skipping (or giving no usable answer) falls back to that same static list. Without `--interactive`, `aief bootstrap`'s output is unchanged. |
| `aief analyze [name]` | Detected project signals | `changes/<id>-<name>/`, seeded with signals/Skills/standards | Create an Analysis Change capturing the existing repository's architecture, stack and risks — see [Concepts — Change](concepts.md#change) for how this differs from the Adoption Change `bootstrap` creates and the Delivery Changes `new-change`/`enrich` create. Exits 0; writes exactly one new Change directory. |

## Work

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief new-change <name>` | `changes/` (for the next ID) | `changes/<id>-<name>/` | Create a plain Change skeleton. |
| `aief enrich <provider> <source-id> [--file path]` | The Requirement Source, read-only | A new Change (`Requires Human Review`) | Seed a Change from Jira/manual instead of an idea. See [Workflow — Requirement Sources](workflow.md#starting-from-a-requirement-source). |
| `aief propose "<idea>"` | OpenSpec availability, `changes/` | OpenSpec output, or a local Change + `proposal.md` | Turn an idea into a proposal, delegating to OpenSpec when available. |
| `aief propose --change <id>` | The existing Change | Only `proposal.md` inside it | Continue an existing Change (e.g. after `enrich` + Human Review) without forking a new one. |
| `aief prompt [assistant] [--profile role] [--change id]` | `AGENTS.md`, assistant file, `AIEF_ASSISTANT`, `knowledge/assistant.json`, profile, standards (`knowledge/standards/` + a project's `ai-specs/standards/`, project wins on id collision — Change 0055/ADR-025), the selected Change, its `manifest.harness` (if any) | Nothing, unless the Change's `manifest.harness.log` is `true` — then appends to `<changeDir>/hooks.md` (Change 0056/ADR-026) | Generate a ready-to-paste, context-complete prompt. With no explicit assistant argument, resolves one automatically — see [Assistants](#assistants) below (Change 0061/ADR-031). With no `ai-specs/standards/` and no `harness` field, output is byte-identical to before Changes 0055/0056. A Hook the Change disabled is excluded; a `failed`/`invalid` Hook result is now shown (previously silently dropped), never affecting the command's own exit code. |
| `aief prompt --skill <id> [...]` | The Skill's declared context | Nothing | Attach one registered Skill's output to the prompt. Unknown id, or a `invalid`/`failed` Skill result, exits 1 before any prompt is printed. |
| `aief prompt --list-skills` | The Skill registry | Nothing | List every registered Skill (id, version, title, description). |
| `aief prompt --set-assistant <name>` | The assistant registry | `knowledge/assistant.json` (creates or overwrites) | Persist the project's default assistant. Unknown `<name>` exits 1 and writes nothing (Change 0061/ADR-031). |
| `aief prompt --show-assistant` | `AIEF_ASSISTANT`, `knowledge/assistant.json`, assistant files | Nothing | Report the configured preference, the resolved assistant, and its source. |
| `aief prompt --clear-assistant` | `knowledge/assistant.json` | Deletes `knowledge/assistant.json` if present | Remove the saved preference. Exit 0, no error, if nothing was saved. |

## Governance

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief verify` | `README.md`, `AGENTS.md`, `changes/`, `knowledge/` | Nothing | Structural Verification for the whole project. |
| `aief verify --change <id>` | The selected Change, its `manifest.harness`/`manifest.loop`/`manifest.dependsOn` (if any), `<changeDir>/loop.md` (if any) | Nothing, unless `manifest.harness.log` is `true` (appends `<changeDir>/hooks.md`) or `manifest.loop.verify` is declared (appends `<changeDir>/loop.md`) | Structural Verification for one Change; says exactly which one. Same Harness disabled/failure-visibility treatment as `aief prompt` (Change 0056/ADR-026). With `loop.verify` configured, also prints a "Loop:" summary (attempt N of M, retry available/limit reached) — Change 0057/ADR-027. If the Change has a Dependency Graph issue, prints one non-blocking note — Change 0058/ADR-028. None of these ever affect PASS/FAIL or the exit code. |
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
flag wins if both are given. An unknown assistant name (e.g. `opencode`, `chatgpt`) fails with the
list of known ones — never a silent fallback. No assistant is required and none is treated
specially by the engine: `AGENTS.md` is the one instruction file every prompt tells the assistant
to read first, generated identically no matter which (if any) assistant name is passed.

### Resolving the assistant automatically (Change 0061/ADR-031)

With no explicit argument, `aief prompt` resolves an assistant deterministically, in this order —
stopping at the first layer that produces a signal:

1. **Explicit override** — `aief prompt <name>` / `--assistant <name>`, as above.
2. **`AIEF_ASSISTANT` environment variable** — developer-local configuration, not committed to the
   repository (`AIEF_ASSISTANT=gemini aief prompt`). Use this for a personal default that differs
   from the team's, or in a shell profile.
3. **`knowledge/assistant.json`** — the project's own, versioned preference, the repository's
   source of truth for this setting. Set it with `aief prompt --set-assistant <name>`, inspect it
   with `--show-assistant`, remove it with `--clear-assistant`.
4. **Passive detection** — every registered assistant's native file is checked the same way; if
   exactly one is present, it is used. No assistant is checked before another and none is a
   fallback for another (Claude included).
5. **Interactive choice** — only reached when 2+ native files are found and nothing above
   disambiguates them, and only on a TTY. The choice applies to that run only and is never saved;
   the output suggests `--set-assistant` to persist it.
6. **Non-interactive ambiguity error** — the same 2+-candidates case off a TTY (CI, a script, a
   piped shell) exits non-zero with the candidates and the three ways to resolve it, instead of
   guessing.

Zero native files and no other signal is not an error — `aief prompt` produces the same generic,
`AGENTS.md`-only prompt it always has. An invalid `AIEF_ASSISTANT` value or an invalid
`knowledge/assistant.json` (malformed JSON, unknown assistant) is always a loud error — never
silently skipped in favor of the next layer.

`aief bootstrap` never creates any of `CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md` — they are
optional, hand-authored, per-assistant adaptations of format only (this repository's own four are
an example: each says "follow `AGENTS.md`," "do not duplicate it," and adds only tone/emphasis
guidance, never a contradictory engineering rule).

Compatibility levels, verified live against a from-scratch scratch project (evidence:
`changes/0060-*/evidence.md`) — never by invoking any assistant's own API or network service:

| Assistant | Level | Mechanism | Instruction file | Limitations |
|---|---|---|---|---|
| Claude Code | Native target | `aief prompt claude` includes the assistant file when present | `CLAUDE.md` | Falls back to AGENTS.md-only if `CLAUDE.md` is absent |
| Gemini CLI | Native target | `aief prompt gemini` includes the assistant file when present | `GEMINI.md` | Same fallback |
| Codex CLI | Native target | `aief prompt codex` includes the assistant file when present | `CODEX.md` | Same fallback |
| Cursor | Native target | `aief prompt cursor` includes the assistant file when present | `CURSOR.md` | Same fallback |
| OpenCode | Generic prompt compatible | `opencode` is not a recognized positional value; use `aief prompt` (no assistant name) | `AGENTS.md` only | No dedicated `OPENCODE.md` adapter yet |
| Continue, GitHub Copilot Chat, other prompt-driven assistants | Generic prompt compatible, not validated natively | Same generic `aief prompt` output, pasted manually | `AGENTS.md` only | Not exercised against these tools in this repository's evidence |

Naming an assistant `aief` doesn't recognize (`aief prompt <unknown>`) is a hard, loud error listing
the known names — never a silent fallback to the generic form. Simplified summary (Assistant / Mode
/ Command only): [README.md — Assistant compatibility](../README.md#assistant-compatibility).

## Guarantees

- `doctor`, `status`, and `verify` never write files. `prompt` never writes files either, with
  three explicitly named exceptions: `--set-assistant` (writes `knowledge/assistant.json`),
  `--clear-assistant` (deletes it), and `--show-assistant` (reads only, still writes nothing). A
  plain `aief prompt` — including its interactive assistant choice — never writes, in every case.
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
