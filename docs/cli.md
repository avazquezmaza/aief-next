# CLI Reference

`aief --help` shows usage; `aief --version` prints the version. Every command also answers, via
`aief help <command>` (alias: `aief explain <command>`): purpose, when to use it, what it reads,
what it writes, an example, and the recommended next step — this reference does not repeat that,
it adds the flag-level detail the built-in help keeps compact.

No command below is a new top-level command — every Core 3.0, AIEF 3.1 and pre-implementation
Definition addition landed as additive, opt-in flags/values on an existing command
(`status --change`/`--next`/`--graph`, `prompt --skill`/`--list-skills`,
`doctor --verbose`, `new-change --depends-on`, `new-change --type definition`, `analyze --maturity`, `verify --strict`). Every command's
default (no-flag) output and exit code are unchanged; each row below cites the Change/ADR that
introduced its flag.

## Discovery

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief doctor` | PATH tools, project files, whether `GEMINI_API_KEY` is set in the environment | Nothing | Environment (required/optional tools) + project readiness, recommended Skills, `AGENTS.md` and each installed `aief-change` skill — flagging an unmodified older AIEF version (`aief update` refreshes it) — and, when `.claude/` exists, the guardrail deny rules and approval hook (Change 0162) or an edited one older than AIEF's (ADR-039). Doctor reports only whether `GEMINI_API_KEY` is present; it does not verify Graphify installation, authorize external processing or execute an analysis engine. Local static analysis remains available. It never displays the credential value or calls Gemini. Exits 1 only when a required tool (Node, npm, git) is missing; exits 0 otherwise. |
| `aief doctor --verbose` | Same | Nothing | Same, plus a "Hooks:" section listing every registered Hook and the event it fires on (Change 0056). |
| `aief status` | `changes/`, project files, every Change's `## Depends on` | Nothing | Adoption overview, recent Changes, all open Changes, and — only when at least one Change declares a dependency — a "Dependency Graph:" section (Change 0058; ADR-038 moved the source to `change.md`). |
| `aief status --graph` | Every Change's `## Depends on` | Nothing | The full Change dependency graph: every Change as a node, all edges, topological order (or an explicit cycle statement), all issues (Change 0058). |
| `aief status --change <id>` | The selected Change | Nothing | Deep inspection: status, declared dependencies, readiness blockers and the next command. For a Definition Change (`## Type: Definition`), also a "Definition readiness:" block — a literal known/total section count plus every explicitly `(deferred)`/`(ambiguous)`/`(decision required)`/`(human)`-marked item, never inferred from prose and never a fabricated completeness score (Change 0081). Absent for every other Change type. |
| `aief status --change <id> --next` | The selected Change | Nothing | Compact Normalized Action: the one next command to run. |
| `aief status --next` | Every open Change, their `## Depends on`, the Graph | Nothing | Zero open Changes: error. Exactly one: same compact Normalized Action as `--change <id> --next`. **2+ open Changes** (Change 0059/ADR-029): deterministically recommends the next eligible Change (open, dependencies closed, no Graph issue or cycle), tie-broken by lowest id — or explains why none is eligible. |

## Bootstrap and adoption

`aief bootstrap` (AIEF 3.1, Change 0052) replaces the former `aief init`/`aief adopt` commands —
both now print a one-line redirect and exit 1.

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief bootstrap [--assistant id]` | `AGENTS.md`, `changes/`, project files | `AGENTS.md` if missing, `changes/`, `knowledge/`, `profiles/`, starter standards, `knowledge/skills.md`, an `adopt-aief` Change, and the `aief-change` skill for the configured assistant — or for Claude Code, Kiro and Codex when none is configured (ADR-039) | Bootstrap the current directory (the primary use case: an existing project). Never touches application code, never overwrites existing files. Idempotent — a second run creates nothing new and reports "already exists" for each artifact. Exits 0 regardless of whether anything new was created. |
| `aief skill install [claude\|kiro\|codex]` | `knowledge/assistant.json`, the installed skill files | `.claude/`, `.kiro/` or `.agents/skills/aief-change/SKILL.md` | Install or refresh the `aief-change` skill: the named assistant, else the configured one, else all three. Rewrites only a missing file or an unmodified older AIEF version; an edited copy is left as is (ADR-039, Change 0159). |
| `aief update` | `AGENTS.md`, installed `aief-change` skills | Those files, only when each is an unmodified older AIEF version | Refresh what AIEF shipped into the project after an upgrade. An edited file is left as is; a missing one is not created (`bootstrap` / `skill install` do that). Lists skill-capable assistants that have no skill yet (Change 0160). |
| `aief guardrails install [--local] [--approval-hook]` | `.claude/settings.json` (or `settings.local.json` with `--local`) | That settings file; with `--approval-hook`, also `.claude/hooks/aief-approval-guard.mjs` | Add Claude Code `permissions.deny` rules that keep credentials (`.env`, `~/.aws`, `~/.ssh`, `*.pem`, `*.tfstate`, …) out of an assistant's reach. Only adds missing rules; never removes or changes yours; an invalid settings file stops it before writing. `--approval-hook` installs and registers a PreToolUse hook that refuses an edit checking, abandoning or deleting a `(human)`/`(review)` item (ADR-041, Change 0162). |
| `aief bootstrap <name>` | Only checks whether `<name>/` already exists | `<name>/README.md`, a minimal `<name>/AGENTS.md`, and empty `changes/`, `knowledge/`, `src/`, `tests/` directories | Create a brand-new project skeleton at `<name>/` — engineering governance structure only, no application code, no framework, no `package.json`. Fails (exit 1) if `<name>/` already exists; run it once per new project, then `cd <name>` and add your chosen stack yourself. `--interactive` has no effect here (see below). |
| `aief bootstrap --interactive` | Everything plain `aief bootstrap` reads, plus stdin (one guided question) | Everything plain `aief bootstrap` writes, plus whatever `aief analyze`/`aief new-change` writes if you choose one | AIEF 3.1, Change 0068. Current-directory bootstrap only. After the same detection/adoption steps as plain `bootstrap`, asks once — analyze this project, start a new Change, or skip — and runs the chosen command directly instead of printing the static "Next steps" list. Skipping (or giving no usable answer) falls back to that same static list. Without `--interactive`, `aief bootstrap`'s output is unchanged. |
| `aief analyze [name]` | Detected project signals, project-maturity classification (`classifyMaturity()`: real source under `src`/`lib`/`app`/... vs. README/PRD-style content at the root) | `changes/<id>-<name>/` — an Analysis Change (seeded with signals/Skills/standards) or a Definition Change, depending on detected maturity | Routes by project maturity (Change 0080): a repository with real application source gets the existing Analysis Change, unchanged; a repository with requirements/context but no source (e.g. a PRD-only repo) gets a Definition Change instead; an ambiguous/near-empty repository keeps today's Analysis Change default, with an explicit note (never a silent guess). See [Concepts — Change](concepts.md#change) and [Getting Started — Starting from a PRD](getting-started.md#starting-from-a-prd-no-code-yet). Exits 0; writes exactly one new Change directory. |
| `aief analyze --maturity <definition\|implemented\|ambiguous>` | Same as above; detection is skipped | Same as above, per the forced value | Explicit human override of maturity routing (Change 0080). An unrecognized value exits 1 and creates no Change. |

## Work

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief new-change <name> [--no-branch] [--depends-on id[,id...]]` | `changes/` (for the next ID), the current git branch | `changes/<id>-<name>/`; on `main`/`dev`, a new branch `<type>/<id>-<slug>` first | Create a plain Change skeleton. On `main`/`dev` it switches to a dedicated branch before writing any file (Changes 0114/0117); on any other branch, including a worktree, it stays put. `analyze`, `propose` and `enrich` behave the same. `--no-branch` skips the switch. It never commits, pushes or deletes a branch. `--depends-on` writes a `## Depends on` section with the full basename of each named Change, and fails before writing anything if one does not exist (ADR-038). |
| `aief new-change <name> --type definition` | `changes/` (for the next ID) | `changes/<id>-<name>/` — a Definition Change scaffold | Create a pre-implementation Definition Change instead: Context, Business/Product Constraints, Known Requirements, Assumptions, Open Questions, Decisions Required, Options Considered, Recommendation, `Decision (human)`, Rationale, Consequences, NFRs, Security & Compliance, Data & Domain, Integrations, Deployment & Operations, Implementation Prerequisites, Follow-up Changes (Change 0079). `aief prompt` on it forbids implementing application code and self-approving `(human)` decisions, and explains the `(deferred)`/`(ambiguous)`/`(decision required)`/`(human)` line-marker convention (Change 0081) — see [Concepts — Change](concepts.md#change). |
| `aief enrich <provider> <source-id> [--file path]` | The Requirement Source, read-only | A new Change (`Requires Human Review`) | Seed a Change from Jira/manual instead of an idea. See [Workflow — Requirement Sources](workflow.md#starting-from-a-requirement-source). |
| `aief propose "<idea>"` | `changes/` | A local Change + `proposal.md` | Turn an idea into a proposal. Never runs an external tool (ADR-038 removed OpenSpec delegation). |
| `aief propose --change <id>` | The existing Change | Only `proposal.md` inside it | Continue an existing Change (e.g. after `enrich` + Human Review) without forking a new one. |
| `aief prompt [assistant] [--profile role] [--change id]` | `AGENTS.md`, assistant file, `AIEF_ASSISTANT`, `knowledge/assistant.json`, profile, `knowledge/standards/`, the selected Change | Nothing | Generate a ready-to-paste, context-complete prompt. With no explicit assistant argument, resolves one automatically — see [Assistants](#assistants) below (Change 0061/ADR-031). Points to the installed `aief-change` skill, or includes the Change procedure when the assistant has none (Gemini, Cursor, generic — ADR-039). A `failed`/`invalid` Hook result is shown, never affecting the command's own exit code. |
| `aief prompt --skill <id> [...]` | The Skill's declared context | Nothing | Attach one registered Skill's output to the prompt. Unknown id, or a `invalid`/`failed` Skill result, exits 1 before any prompt is printed. |
| `aief prompt --list-skills` | The Skill registry | Nothing | List every registered Skill (id, version, title, description). |
| `aief prompt --set-assistant <name>` | The assistant registry | `knowledge/assistant.json` (creates or overwrites) | Persist the project's default assistant. Unknown `<name>` exits 1 and writes nothing (Change 0061/ADR-031). |
| `aief prompt --show-assistant` | `AIEF_ASSISTANT`, `knowledge/assistant.json`, assistant files | Nothing | Report the configured preference, the resolved assistant, and its source. |
| `aief prompt --clear-assistant` | `knowledge/assistant.json` | Deletes `knowledge/assistant.json` if present | Remove the saved preference. Exit 0, no error, if nothing was saved. |

## Governance

| Command | Reads | Writes | Purpose |
|---|---|---|---|
| `aief verify` | `README.md`, `AGENTS.md`, `changes/`, `knowledge/` | Nothing | Structural Verification for the whole project. |
| `aief verify --change <id>` | The selected Change and the Changes it depends on | Nothing | Structural Verification for one Change; says exactly which one. If the Change has a Dependency Graph issue, prints one non-blocking note (Change 0058). Names a leftover `manifest.json` as no longer read (ADR-038). None of these ever affect PASS/FAIL or the exit code. |
| `aief verify --strict [--change id]` | Same as plain `verify`/`verify --change` | Nothing | AIEF 3.1, Change 0083. Adds opt-in, deterministic objective-completeness checks on top of the same Structural Verification — an unresolved TODO/TBD, an untouched scaffold placeholder (Scope/Success Criteria/Requirements/Acceptance Criteria), a Definition Change's `Decisions Required` with no `Decision (human)` outcome, an unresolved required `(human)` task, a `(human)`/`(review)` approval marked `[-]` (Change 0150), an unchecked or `[-]` `(human)`/`(review)` Acceptance Criterion in `spec.md` (Change 0155). A non-blocking `!` notice flags an Analysis/Definition Change with no `(human)` line, a closed Change that has such a `spec.md` approval still unchecked, and a `## Type` outside the closed list (Change 0161, see [Concepts — Change](concepts.md#change)). Every check is a literal file condition, never a quality score. Without `--strict`, none of this runs — default `verify`'s output and exit code are unchanged. |
| `aief verify --json [--change id]` | Same as plain `verify`/`verify --change` | Nothing | Change 0138. Replaces every other line of output with exactly one JSON object on stdout — a versioned envelope (`schema: "aief.result/v1"`), for a script/CI consumer rather than a human. Whole-project: `{ schema, operation: "verify", change: null, result: "PASS"\|"FAIL", errors, warnings, duplicateChangeIds }`. `--change <id>`: `{ ..., change: "<id>", errors, warnings, graphIssues }`. AIEF 4.0 dropped the `manifestStatusDrift` field (ADR-038). A `--change` selector matching no Change returns `{ ..., result: "ERROR", errors: [...] }` on stdout with exit code 1 — the human-readable diagnostic still goes to stderr, never mixed into the JSON on stdout. `--strict`/Hooks narration are not part of the envelope yet — no observed consumer need for them (ADR-008/013). |
| `aief close [--yes] [--change id]` | The selected Change | A `## Status` section in `change.md` — only with `--yes`, only when all readiness checks pass | Check (or, with `--yes`, mark) a Change Closed. A `(human)` or `(review)` line marked `[-]` blocks (Change 0150). A `(human)` or `(review)` Acceptance Criterion in `spec.md` blocks while unchecked or `[-]`; unlabeled criteria do not (Change 0155). When readiness passes, prints "Approvals relied on:" with every checked `(human)`/`(review)` line, or `none`; `spec.md` ones are marked `[spec.md]`. Prints `! depends on <id>, which is still open` for each open `## Depends on` Change, and closes anyway (ADR-038). |
| `aief close --evidence-from <path> [--yes] [--change id]` | A JUnit XML test report at `<path>` (already produced by your own test runner/CI — AIEF never executes anything) | The Change's `evidence.md` `## Verification` section, filled in with the report's counts under a `### Captured Test Report` sub-block; existing content in that section is never overwritten, only appended to (or, on a repeat capture, replaced in place) | AIEF 3.1, Change 0071. Turns "manually copy test numbers into evidence.md" into one flag. A missing/unreadable path or a file with no `<testsuite>` element is a clear, exit-1 error — no write. Every other `evidence.md` section (Summary, Findings, Risks, ...) is left for a human/assistant to write. |

`--evidence-from <path>` is deliberately not required to be project-local: CI systems commonly
write test reports outside the checked-out project (a runner's own temp directory, an artifact
mount), so `<path>` may point anywhere the invoking user or CI job can already read — you are
supplying a path you trust, the same way you would to any other CLI flag that takes one. Only the
report's numeric JUnit counts are ever extracted into `evidence.md`; no other file content crosses
that boundary.

`aief verify` and `aief close` can disagree on the same Change because they answer different
questions: `verify` is **Structural Verification** — do the required files exist and are they
non-empty, is the declared status interpretable — and can PASS on a Change that is still very much
in progress. `aief close`'s readiness check adds the close-specific questions (are all tasks
checked, is evidence more than a placeholder). A Change can legitimately show `verify: PASS` and
`close: blocked` at the same time — that is not a contradiction, it is `verify` confirming the
Change is structurally sound to keep working on, while `close` confirms it isn't finished yet.

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

`aief prompt [claude|gemini|codex|cursor|kiro]` (positional) or `aief prompt --assistant gemini`
select which native file is included — `CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md` for the
first four, `.kiro/skills/aief-change/SKILL.md` for Kiro (a workspace Skill, not a root
instructions file — Kiro has no equivalent of `CLAUDE.md`; it discovers `AGENTS.md` on its own).
The explicit flag wins if both are given. An unknown assistant name (e.g. `opencode`, `chatgpt`)
fails with the list of known ones — never a silent fallback. No assistant is required and none is
treated specially by the engine: `AGENTS.md` is the one instruction file every prompt tells the
assistant to read first, generated identically no matter which (if any) assistant name is passed.

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

Compatibility levels below describe the AIEF CLI prompt contract. Native context discovery and
behavioral validation are separate; see [Working a Change with an assistant](assistant-workflow.md).

| Assistant | Level | Mechanism | Instruction file | Limitations |
|---|---|---|---|---|
| Claude Code | Native target | `aief prompt claude` includes the assistant file when present | `CLAUDE.md` | Falls back to AGENTS.md-only if `CLAUDE.md` is absent |
| Gemini CLI | Native target | `aief prompt gemini` includes the assistant file when present | `GEMINI.md` | Same fallback |
| Codex CLI | Native target | `aief prompt codex` includes the assistant file when present | `CODEX.md` | Same fallback |
| Cursor | Native target | `aief prompt cursor` includes the assistant file when present | `CURSOR.md` | Same fallback |
| Kiro | Native target | `aief prompt kiro` includes the Skill file when present (Change 0112) | `.kiro/skills/aief-change/SKILL.md` | Same fallback — never `CLAUDE.md` or another assistant's file; the Skill must be added to the project first, `aief bootstrap` does not create it |
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
- No hidden state: every command re-derives what it needs from the files in `changes/` and
  `knowledge/` on every invocation.
- Every command ends with a `Next:` hint pointing to the recommended next step.

## Testing

```bash
npm test                          # from the repo root — delegates to cli/, node --test, no dependencies
cd examples/todo-app && npm test  # executable example project
node cli/bin/aief.js verify       # validate this repository's own AIEF structure
```
