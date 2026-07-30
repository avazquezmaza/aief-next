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

An invalid manifest (bad JSON, wrong schema, missing required field) is reported as a distinct,
visible state by `aief status` — it is never silently treated as "no manifest," and never falls
back to inferring the missing fields.

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

## `knowledge/skills.md`

Generated once by `aief bootstrap` as a readable view of the Skill Catalog's recommendations for this
project (detector, reason, prompt context, common risks). Never overwritten on re-adoption; edit it
to add project-specific notes. This is the Skill *Catalog* (static, contextual, unexecuted) — not
to be confused with the Skills *Runtime* (`aief prompt --skill <id>`), which is a registered,
invocable contract with no per-project configuration file.

## Assistant instruction files

`CLAUDE.md`, `GEMINI.md`, `CODEX.md`, `CURSOR.md` at the project root — one per assistant, selected
by `aief prompt [assistant]`. Each should extend `AGENTS.md`, never contradict it. Only the one
matching the requested assistant is included in a given prompt; if it's missing, `aief prompt`
warns and falls back to `CLAUDE.md` if present.

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

## CI gate

`aief bootstrap` creates `.github/workflows/aief-verify.yml` from
`cli/templates/ci/aief-verify.yml` if missing (never overwritten) — one job that runs
`npx aief verify` on every push and pull request. Not on GitHub Actions? The gate is one command
you can wire into any CI system yourself: `npx aief verify`.
