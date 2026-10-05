# Configuration

Everything AIEF reads is a visible file in your project. This page is the reference for each of
them.

## `changes/<id>-<slug>/change.md` → `## Depends on` (optional)

Lists the Changes this one depends on, one id per bullet — a full basename or a bare numeric id:

```markdown
## Depends on

- 0002-base-api
- 0003
```

`aief new-change <name> --depends-on <id>[,<id>...]` writes it with full basenames. `aief status
--graph` and `aief status --next` read it (missing, self and duplicate dependencies and cycles are
reported as Graph issues). `aief close` prints a notice while a dependency is still open and closes
anyway. Absent by default.

AIEF 4.0 no longer reads `manifest.json` (ADR-038). If a Change directory still has one, `aief
verify` names it as no longer read; it has no other effect.

## `knowledge/standards/*.md`

Editable project standards, created by `aief bootstrap` from
`cli/templates/standards/` and never overwritten afterward:

- Always: `base-standards.md`, `documentation-standards.md`, `testing-standards.md`,
  `security-standards.md`.
- If frontend signals fire (Next.js/React/Tailwind): `frontend-standards.md`.
- If backend signals fire (NestJS/Postgres/Cognito/n8n): `backend-standards.md`.

`aief prompt` instructs the assistant to follow every file present here. Edit them freely — they
are a property of your project, not of AIEF.

## `knowledge/skills.md`

Generated once by `aief bootstrap` as a readable view of the Skill Catalog's recommendations for this
project (detector, reason, prompt context, common risks). Never overwritten on re-adoption; edit it
to add project-specific notes. This is the Skill *Catalog* (static, contextual, unexecuted) — not
to be confused with the Skills *Runtime* (`aief prompt --skill <id>`), which is a registered,
invocable contract with no per-project configuration file.

## `aief-change` skill — `.claude/`, `.kiro/`, `.agents/skills/aief-change/SKILL.md`

The Change procedure as a native skill for Claude Code, Kiro and Codex (ADR-039). Installed by
`aief bootstrap` and `aief skill install`, from one template. Edit it freely: AIEF rewrites only a
missing file or an unmodified older AIEF version, never an edited one, and `aief doctor` tells you
when an edited copy falls behind. An unmodified copy does not count as a sign that the project uses
that assistant.

## Claude Code guardrails — `aief guardrails install`

Adds `permissions.deny` rules to `.claude/settings.json` (or `.claude/settings.local.json` with
`--local`, which Claude Code does not share with the team) so an assistant cannot read credentials:
`.env` files except examples, `~/.aws`, `~/.ssh`, keys and certificates, Terraform state and
variables, AWS credential CSVs, and the AWS CLI commands that print credentials. The list lives in
`cli/templates/guardrails/claude-deny.json`. AIEF only adds missing rules; Claude Code merges deny
lists across settings files, so yours stay in effect.

`--approval-hook` also installs `.claude/hooks/aief-approval-guard.mjs` and registers it as a
PreToolUse hook (ADR-041). It refuses an Edit/Write/MultiEdit on a Change's `tasks.md` or `spec.md`
that would check, abandon or delete a `(human)`/`(review)` item, and tells the assistant to ask you.
Restart Claude Code after installing it.

## Keeping AIEF-shipped files current — `aief update`

`AGENTS.md` and the installed `aief-change` skills are files AIEF ships. After upgrading AIEF,
`aief update` replaces each one that is still byte-identical to a version AIEF shipped before, and
leaves any file you edited exactly as it is. `aief doctor` lists which ones are behind. Review the
result with `git diff`; AIEF never commits.

## Assistant instruction files

`CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `CURSOR.md` at the project root — one per assistant, selected
by `aief prompt [assistant]`. Each should extend `AGENTS.md`, never contradict it. Only the one
matching the requested assistant is included in a given prompt; if an *explicitly requested*
assistant's file is missing, `aief prompt` warns and falls back to `CLAUDE.md` if present
(unchanged, explicit-argument-only behavior).

With no assistant argument, `aief prompt` resolves one automatically instead of requiring it on
every invocation — see [`docs/cli.md` — Assistants](cli.md#assistants) for the full precedence
order (explicit → `AIEF_ASSISTANT` → `knowledge/assistant.json` → passive detection → interactive
choice on a TTY → non-interactive error). Passive detection checks every registered assistant's
file the same way; none is a fallback for another.

## `AIEF_ASSISTANT` (environment variable)

Developer-local default assistant, e.g. `AIEF_ASSISTANT=gemini` in a shell profile. Read by `aief
prompt` only when no explicit assistant argument is given; wins over `knowledge/assistant.json`
and passive detection. Not versioned, not visible to the rest of the team — for a preference the
whole project should share, use `knowledge/assistant.json` instead.

## `knowledge/assistant.json`

Optional, project-level default assistant (`{ "defaultAssistant": "claude", "updatedAt": "...",
"configuredBy": "aief prompt --set-assistant" }`). The repository's own source of truth for this
preference — versioned, visible to every contributor. Written only by `aief prompt
--set-assistant <name>` (validated against the known assistants; creates or overwrites), removed
only by `aief prompt --clear-assistant`, inspected by `aief prompt --show-assistant`. Absent by
default. See `assistant-resolver.js`.

## Profiles — `profiles/`

Role guidance selected explicitly per Change with `--profile <role>` (e.g. `architect`,
`developer`) — never auto-detected. `aief use-profile <role>` prints the minimal header alone;
`aief prompt --profile <role>` includes it as part of a full Change-aware prompt.

## Requirement Source providers

Selected by name in `aief enrich <provider> <source-id>`. Implemented today: `manual` (a human
fills the facts), `jira` (reads a **local export file** at `requirements/jira/<issue-key>.json`,
or any path via `--file` — no network call, no credentials). Requesting an unimplemented provider
(`notion`, `github`, `azure-devops`) fails loudly, naming what is and isn't implemented.

## CI gate

`aief bootstrap` does not generate CI configuration: it would be host-specific (GitHub, GitLab,
Bitbucket…), and wiring the gate into CI is the team's choice (Change 0139). The gate is one
command that exits non-zero on FAIL — add it as a step in whatever CI you use:

```bash
git clone --depth 1 https://github.com/avazquezmaza/aief-next.git /tmp/aief
node /tmp/aief/cli/bin/aief.js verify
```

The CLI is not published to the npm registry, so do not use `npx aief verify` — it would fail, or
run an unrelated package if one is ever published under that name. Pin the clone to a tag or
commit if you need reproducible CI.
