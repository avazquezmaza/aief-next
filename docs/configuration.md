# Configuration

Everything AIEF reads is a visible file in your project. This page is the reference for each of
them.

## `changes/<id>-<slug>/manifest.json` (optional)

Absent by default — a Change with no manifest behaves exactly as it always has. Add one to opt
into the Workflow Engine and/or the SDD Provider.

```json
{
  "schema": "aief.change/v1",
  "id": "0002-add-login",
  "slug": "add-login",
  "title": "Add login",
  "status": "open",
  "track": "standard",
  "sdd": {
    "provider": "openspec",
    "change_id": "add-login"
  }
}
```

| Field | Required | Values | Notes |
|---|---|---|---|
| `schema` | yes | `"aief.change/v1"` | Must match exactly; anything else is reported as an invalid manifest. |
| `id` | yes | non-empty string | Should match the directory name. |
| `slug` | yes | non-empty string | |
| `title` | yes | non-empty string | |
| `status` | yes | `"open"` \| `"closed"` | Authoritative over `change.md`'s own `## Status` section when a manifest is present. |
| `track` | no | `"lite"` \| `"standard"` \| `"governed"` | Opts into the Workflow Engine. See [Workflow — Tracks](workflow.md#tracks). Any other value is an explicit "unrecognized track" error, never guessed into one of the three. |
| `sdd.provider` | no | `"local"` \| `"openspec"` | Opts into the SDD Provider. Defaults to none — `aief status` shows no SDD section for a Change without it. |
| `sdd.change_id` | no | non-empty string | The identifier the provider resolves against (e.g. the OpenSpec change's own directory name). |
| `harness.log` | no | boolean | Opts into a visible, append-only `<changeDir>/hooks.md` execution log. See [Workflow — Harness](workflow.md#harness--hooks-runtime-visibility-and-configuration). |
| `harness.hooks."<event>".disabled` | no | array of Hook id strings | Excludes listed Hook ids from that event's output/log. `<event>` must be `"prompt.prepared"` or `"verify.completed"` — any other key is an invalid-manifest error. An unknown Hook id inside the array is a visible warning (`aief status --change <id>`), never a crash and never disables anything real. |
| `loop.verify.maxRetries` | no | positive integer, default `3` | Opts the Change into Loop attempt tracking for `aief verify --change <id>`. See [Workflow — Loop](workflow.md#loop--verify-feedback-retry). |
| `dependsOn` | no | array of Change id strings | Names other Changes this one depends on. Referential validity (does the named Change exist? is there a cycle?) is a cross-Change fact resolved by `aief status`/`aief status --graph`/`aief verify --change <id>`, never checked here. See [Workflow — Graph](workflow.md#graph--the-change-dependency-model). |

An invalid manifest (bad JSON, wrong schema, missing required field, or — since Changes 0056–0058
— an unrecognized `harness`/`loop`/`dependsOn` shape) is reported as a distinct, visible state by
`aief status` — it is never silently treated as "no manifest," and never falls back to inferring
the missing fields.

## Workflow track definitions — `cli/src/workflows/*.json`

Ship with AIEF itself (`lite.json`, `standard.json`, `governed.json`) — not user-editable per
project. Each is a `{ schema, track, stages, transitions }` graph:

```json
{
  "schema": "aief.workflow/v1",
  "track": "standard",
  "stages": [
    { "id": "work" },
    { "id": "verify", "gateIds": ["readiness"] },
    { "id": "review", "gateIds": ["review"] },
    { "id": "close" }
  ],
  "transitions": [
    { "from": "work", "to": "verify" },
    { "from": "verify", "to": "review" },
    { "from": "review", "to": "close" }
  ]
}
```

A stage's `gateIds` names which gates must be satisfied before the engine reports the next
transition as available. See [Architecture — Workflow Engine](architecture.md#workflow-engine).

## `knowledge/standards/*.md`

Editable project standards, created by `aief bootstrap` from
`cli/templates/standards/` and never overwritten afterward:

- Always: `base-standards.md`, `documentation-standards.md`, `testing-standards.md`,
  `security-standards.md`.
- If frontend signals fire (Next.js/React/Tailwind): `frontend-standards.md`.
- If backend signals fire (NestJS/Postgres/Cognito/n8n): `backend-standards.md`.

`aief prompt` instructs the assistant to follow every file present here. Edit them freely — they
are a property of your project, not of AIEF.

A project's own `ai-specs/standards/<id>.md` (LIDR/SpecBoot convention) is discovered and resolved
against these built-ins — project always wins on a matching id, referenced from its own real
location, never copied here (Change 0055/ADR-025). See [CLI Reference](cli.md#work) (`aief
prompt`) and `templates/specboot/README.md`.

## `knowledge/skills.md`

Generated once by `aief bootstrap` as a readable view of the Skill Catalog's recommendations for this
project (detector, reason, prompt context, common risks). Never overwritten on re-adoption; edit it
to add project-specific notes. This is the Skill *Catalog* (static, contextual, unexecuted) — not
to be confused with the Skills *Runtime* (`aief prompt --skill <id>`), which is a registered,
invocable contract with no per-project configuration file.

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

## `knowledge/sdd-provider.json`

Optional, project-level SDD Provider choice (`{ "provider": "openspec" | "local", "setBy":
"bootstrap", "date": "..." }`). Written only by `aief bootstrap`, only when the choice is
genuinely ambiguous (OpenSpec and SpecBoot both detected) and you are prompted for it in an
interactive shell. Absent by default — a Change's own `manifest.sdd.provider` still wins over it.
See `sdd-provider-resolver.js`'s step 2.

## `changes/<id>-<slug>/hooks.md`

Optional, per-Change, visible Harness execution log (Change 0056/ADR-026). Written only when that
Change's `manifest.harness.log` is `true`; appended to on every `aief prompt`/`aief verify
--change <id>` call targeting it — never truncated or rewritten. Each entry lists, for every
active (non-disabled) Hook evaluated for the fired event: id, event, status, and the Hook's own
short summary — never raw command output, full context, or a credential. Absent by default. See
[Workflow — Harness](workflow.md#harness--hooks-runtime-visibility-and-configuration).

## `changes/<id>-<slug>/loop.md`

Optional, per-Change, visible Loop attempt log (Change 0057/ADR-027). Written only when that
Change's `manifest.loop.verify` is declared; appended to on every `aief verify --change <id>` call
targeting it — never truncated or rewritten. Each entry records: attempt number, timestamp,
PASS/FAIL, Feedback (Structural Verification's own error lines, reused as-is), and the decision
(`retry available`/`retry limit reached`/`loop complete`). The current attempt number is derived
by counting this file's own prior entries — never a hidden counter, never a `manifest.json` write.
Absent by default. See [Workflow — Loop](workflow.md#loop--verify-feedback-retry).

## CI gate

`aief bootstrap` creates `.github/workflows/aief-verify.yml` from
`cli/templates/ci/aief-verify.yml` if missing (never overwritten) — one job that runs
`npx aief verify` on every push and pull request. Not on GitHub Actions? The gate is one command
you can wire into any CI system yourself: `npx aief verify`.
