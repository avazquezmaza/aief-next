# Core Concepts

AIEF has a small vocabulary. Learn these terms once; every other document and every CLI message
uses them consistently.

## Change

The unit of work. Every meaningful task — a feature, a fix, an analysis, an adoption — is a
**Change**: a directory under `changes/<id>-<slug>/` containing plain Markdown files:

```text
changes/0001-add-login/
├── change.md      # why and what — objective, scope, success criteria
├── spec.md        # requirements and acceptance criteria
├── tasks.md       # implementation checklist
├── evidence.md    # what actually happened, verified
└── manifest.json  # optional — opts into Workflow Engine / SDD Provider features
```

A Change is **open** until its `change.md` carries a `## Status / Closed` section (written only by
`aief close --yes`), or — if it has a `manifest.json` — until the manifest's own `status` field says
`closed`. Either way, **the files are the only source of truth**: there is no database, no session
state, no hidden flag. Selection is always derived by reading `changes/` fresh.

## Change Manifest

An optional `manifest.json` next to `change.md`. A Change with no manifest behaves exactly as it
always has — this is a strictly additive, opt-in layer. A Change with a manifest gets it as the
authoritative source for the fields it declares (never merged with `change.md`'s prose). Minimal
shape:

```json
{
  "schema": "aief.change/v1",
  "id": "0001-add-login",
  "slug": "add-login",
  "title": "Add login",
  "status": "open",
  "track": "standard"
}
```

`track` is what opts a Change into the **Workflow Engine** below; `sdd` opts it into the
**SDD Provider**. Both are optional and independent. Full field reference:
[Configuration](configuration.md).

## Workflow Engine — Track, Stage, Gate

A Change that declares a `track` gets a small state machine layered on top of it, read-only from
the outside — it narrates where the Change stands, it never forces a transition:

- **Track** — one of `lite`, `standard`, `governed`. Chooses which stages and gates apply. See
  [Workflow](workflow.md#tracks) for when to use each.
- **Stage** — a named point in the track's sequence (`work`, `verify`, `review`, `approval`,
  `security_review`, `close`, depending on the track).
- **Gate** — a named condition a stage may require before advancing (e.g. `readiness`, `review`,
  `approval`, `security_review`). A gate is `pending` (not yet satisfied), `passed`, or a `blocker`
  for the next transition.

`aief status --change <id>` shows the resolved stage, the next action, and which gates are blocking
or merely pending — never claims a transition happened that a gate is still blocking.

## SDD Provider

An abstraction over "where does this Change's specification/tasks actually live." Two providers
exist:

- **`local`** — the Change's own `spec.md`/`tasks.md` (the default; every Change already has this).
- **`openspec`** — an OpenSpec change under `openspec/changes/<name>/`, when the Change opts in via
  `manifest.json`'s `sdd` section.

AIEF's core never reads a provider's native files directly — it always goes through the provider
boundary, so adding a third SDD tool later means adding one provider module, not touching every
command that inspects readiness.

## Requirement Source / Normalized Requirement

Real work often starts in a ticket, not in `aief new-change`. A **Requirement Source** is a
read-only view of one item in an external system (Jira today; Notion/GitHub Issues/Azure DevOps
planned) or a human's own words (`manual`). Every provider produces the same **Normalized
Requirement** shape, so the rest of the workflow never branches on where the requirement came from.
`aief enrich <provider> <source-id>` creates a Change from one, classified as Fact `[H]` /
Inference `[I]` / Assumption `[S]`, always requiring human review before implementation. Full model:
[Workflow — Starting from a Requirement Source](workflow.md#starting-from-a-requirement-source).

## Skill

A versioned, registered capability that `aief prompt --skill <id>` can attach to a generated
prompt. A Skill declares what it needs and what it's allowed to do (its `capabilities`), and
reports one of seven honest statuses (`ready`, `completed`, `not_applicable`, `blocked`,
`unsupported`, `invalid`, `failed`) — it never silently does nothing. Every shipped Skill this
release is **instructions-only**: it hands the assistant guidance to follow, it does not write
files, execute commands, or reach the network on its own.

This is distinct from the **Skill Catalog** (`aief doctor`/`aief adopt`'s recommended Skills,
written to `knowledge/skills.md`) — that is passive, static, contextual knowledge; the Skills
Runtime above is a registered, invocable contract. See [CLI Reference](cli.md#prompt) for both.

## Hook

A versioned observer that reacts to one of a small, closed set of lifecycle events
(`prompt.prepared`, `verify.completed`). A Hook can only add an observation to the output — it
never blocks a command, never changes an exit code, and never mutates a file. Hooks are internally
registered (not user-authored) and exist so future contextual behavior has one shared extension
point instead of another bespoke `if` inside `cli.js`.

## Verification Rule / Requirement Verification

`aief verify --requirements` runs **Requirement Verification**: for each requirement a Change's
SDD artifacts declare, a **Verification Rule** produces a deterministic, evidence-grounded verdict
(`passed`, `failed`, `not_applicable`, `blocked`, `unsupported`, `invalid`, `error`). Rules never
use AI, never execute a command, never reach the network — they only read already-produced
Evidence (e.g. an SDD artifact's state, or a file that must exist). This is a distinct layer from
**Structural Verification** (`aief verify`'s default output), which checks that the Change's own
files and structure are intact. Structural Verification always runs; Requirement Verification is
additive and opt-in. See [Workflow — Verification](workflow.md#verification).

## Evidence

`evidence.md` is a Change's proof: what was done, how it was verified, what was found, what's next.
AIEF treats it as load-bearing — `aief close` refuses to close a Change whose evidence is still a
placeholder, and `aief prompt` guards real evidence against being blindly overwritten on a re-run.

## AGENTS.md and the instruction hierarchy

`AGENTS.md` is the constitution every AI assistant follows in every Change — the one file that must
never be contradicted. Everything else layers on top of it, composed by `aief prompt` in a fixed
order:

```text
AGENTS.md -> assistant file (CLAUDE.md, GEMINI.md, ...) -> profile -> standards -> skills -> active Change
```

See [Architecture — Prompt composition](architecture.md#prompt-composition) for how that
composition actually works.
