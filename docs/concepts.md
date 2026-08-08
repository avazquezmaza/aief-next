# Core Concepts

AIEF has a small vocabulary. Learn these terms once; every other document and every CLI message
uses them consistently. Looking a single term up mid-flow instead of reading this end to end? See
the [Cheat Sheet](cheat-sheet.md).

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

There is no separate Change type field distinguishing these in code — `analyze` sets `## Type` to
`Analysis` in `change.md`, every other Change (including the one `bootstrap` creates) is `General`
— but the three shapes below carry distinct purposes and are worth naming:

- **Adoption Change** — created once by `aief bootstrap` (`changes/<id>-adopt-aief/`). Registers
  that AIEF was added to the project: its `evidence.md` is generated automatically from what
  `bootstrap` detected and created. It does not represent a product feature — there is nothing to
  implement beyond editing the starter standards to match the project and running `aief verify`.
- **Analysis Change** — created by `aief analyze` (`changes/<id>-analyze-current-architecture/` by
  default). Captures the existing repository's architecture, stack, standards gaps, and risks,
  seeded with the same signals `doctor` detects. It produces a roadmap, not code — it's the input
  for planning the first real Changes.
- **Delivery Change** — every Change created by `aief new-change` or `aief enrich`: a feature, fix,
  refactor, or other real unit of work, with its own `spec.md`, `tasks.md`, and implementation
  evidence. This is what `aief prompt` composes a context-complete prompt for.

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

This is distinct from the **Skill Catalog** (`aief doctor`/`aief bootstrap`'s recommended Skills,
written to `knowledge/skills.md`) — that is passive, static, contextual knowledge; the Skills
Runtime above is a registered, invocable contract. See [CLI Reference](cli.md#prompt) for both.

A Skill Catalog recommendation carries a `confidence`: `strong` when a real dependency in
`package.json` triggered it, `weak` when only a keyword in a doc file (`README.md`, `AGENTS.md`, ...)
did (Change 0072). `aief prompt` tags a weak-confidence Skill (`(weak signal — confirm before
relying on this)`) so the assistant reading it can tell a speculative match from a solid one;
`aief doctor`'s report lists strong-confidence recommendations first for the same reason.

## Hook / Harness

A **Hook** is a versioned observer that reacts to one of a small, closed set of lifecycle events
(`prompt.prepared`, `verify.completed`). A Hook can only add an observation to the output — it
never blocks a command, never changes an exit code, and never mutates a file itself. Hooks are
internally registered (not user-authored) — a Change's `manifest.json` cannot define a new one.

The **Harness** (Change 0056) is what a Change *can* configure over the existing Hooks: disable
specific ones per event (`manifest.harness.hooks.<event>.disabled`) and opt into a visible,
append-only execution log (`manifest.harness.log`, written to `<changeDir>/hooks.md`). `aief doctor
--verbose` shows every registered Hook; `aief status --change <id>` shows a Change's effective
Harness configuration, only when declared. See [Workflow — Harness](workflow.md#harness--hooks-runtime-visibility-and-configuration).

## Loop

Opt-in, per-Change attempt tracking over `aief verify --change <id>` (Change 0057):
**Verify → Feedback → Retry (if applicable) → Final result.** Feedback reuses Structural
Verification's own error lines; the outcome (`passed`/`retry_available`/`exhausted`) is a pure
decision over the attempt number (derived from `<changeDir>/loop.md` itself) and
`manifest.loop.verify.maxRetries`. "Retry" is always a manual re-invocation — Loop never re-runs
`verify`, a Hook, or anything else automatically, and never changes `verify`'s own PASS/FAIL or
exit code. See [Workflow — Loop](workflow.md#loop--verify-feedback-retry).

## Graph

The official Change dependency model (Change 0058): a Change's `manifest.json` may declare
`dependsOn`, naming other Changes it depends on. `change-graph.js`'s `buildGraph()` derives, on
every invocation, a deterministic node/edge structure, a topological order (dependencies first),
and any issues (`missing_dependency`, `self_dependency`, `duplicate_dependency`, `cycle`) — never
persisted, never cached. `aief status`/`aief status --graph` read it; `aief verify --change <id>`
prints a non-blocking note when the targeted Change has an issue. This is the foundation `aief
status --next`'s smart selection (Change 0059, below) builds on.
See [Workflow — Graph](workflow.md#graph--the-change-dependency-model).

## Smart next-Change selection

`aief status --next`, when 2+ Changes are open (Change 0059), deterministically recommends one:
open, valid manifest, every dependency exists and is closed, not a Graph cycle member, no
unsatisfied Workflow gate blocker. Ties break on the lowest Change id. Loop and Harness are never
consulted — both are non-blocking by design (ADR-026/027). With 0 or 1 open Changes, behavior is
unchanged from before this Change. See
[Workflow — Smart next-Change selection](workflow.md#smart-next-change-selection--aief-status---next).

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
