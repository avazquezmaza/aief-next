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
└── evidence.md    # what actually happened, verified
```

A Change is **open** until its `change.md` carries a `## Status / Closed` section (written only by
`aief close --yes`). **The files are the only source of truth**: there is no database, no session
state, no hidden flag. Selection is always derived by reading `changes/` fresh.

`change.md`'s `## Type` names which of these a Change is (`General` by default; `Analysis`,
`Enrichment` or `Definition` when created by the command that sets one) — read by `aief prompt`,
`aief status`, and `aief verify` to decide what guidance/checks apply, never by a second
classification field. The shapes below carry distinct purposes and are worth naming:

- **Adoption Change** — created once by `aief bootstrap` (`changes/<id>-adopt-aief/`). Registers
  that AIEF was added to the project: its `evidence.md` is generated automatically from what
  `bootstrap` detected and created. It does not represent a product feature — there is nothing to
  implement beyond editing the starter standards to match the project and running `aief verify`.
- **Analysis Change** — created by `aief analyze` when the repository has real application source
  (`changes/<id>-analyze-current-architecture/` by default). Captures the existing repository's
  architecture, stack, standards gaps, and risks, seeded with the same signals `doctor` detects. It
  produces a roadmap, not code — it's the input for planning the first real Changes.
- **Definition Change** — created by `aief new-change --type definition`, or by `aief analyze` when
  the repository looks pre-implementation: real requirements/context (a README/PRD/business
  requirements document with real content) but no application source yet (Change 0079/0080). It
  answers *what should be built*, not *what already exists*: Context, Known Requirements, Open
  Questions, Decisions Required, a `Decision (human)` recorded only after explicit human approval,
  and Implementation Prerequisites/Follow-up Changes — never application code as a side effect. See
  [Getting Started — Starting from a PRD](getting-started.md#starting-from-a-prd-no-code-yet) for
  the full flow, and [Project Maturity](#project-maturity) below for how `analyze` decides.
- **Delivery Change** — every Change created by `aief new-change` (default) or `aief enrich`: a
  feature, fix, refactor, or other real unit of work, with its own `spec.md`, `tasks.md`, and
  implementation evidence. This is what `aief prompt` composes a context-complete prompt for.

## Project Maturity

`aief analyze` classifies a repository, deterministically and from file evidence only (Change
0080), before deciding which kind of Change to create:

- **Implemented** — at least one real, non-trivial source file exists under a recognized source
  directory (`src`, `lib`, `app`, `cli`, `server`, `api`, `pkg`, `cmd`, `internal`). Routes to an
  Analysis Change, exactly as before this feature existed.
- **Definition** — no application source found, but a README/PRD/requirements-style document at
  the repository root carries real content (≥ 30 words). Routes to a Definition Change instead.
- **Ambiguous** — neither signal clears its bar (a near-empty repository). `aief analyze` keeps its
  original default (an Analysis Change) rather than refusing to act — the smallest,
  backward-compatible choice — but always says so explicitly, with the option to override via
  `aief analyze --maturity definition` or `aief new-change --type definition`.

Real source always wins over documentation richness: a well-documented, already-implemented
project is still classified Implemented, never Definition.

Project Standards (Change 0082) carry the same distinction where it matters: `base-standards.md`,
`testing-standards.md` and `security-standards.md` each split into an **Applies now** section (what
holds during Definition, before code exists — e.g. deciding testability and data ownership up
front) and an **Applies once implementation starts** section (conventional code-level guidance). A
Definition-stage project is never held to implementation-only guidance it hasn't reached yet; other
standards (frontend, backend, documentation) are not maturity-split because they only apply once
implementation exists.
## Approvals

Two task labels mark checkboxes an assistant must not check on its own: `(human)` (only a human)
and `(review)` (someone other than the implementer). They may appear in `tasks.md` or as an
Acceptance Criterion in `spec.md`. `aief close` refuses while one is unchecked or marked `[-]`, and
lists every checked one under "Approvals relied on". AIEF cannot verify *who* checked a box — see
[Security model](security-model.md).

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

A Skill's context (the Skill Context Builder's `buildSkillContext()`) always carries
`project`/`change`/`action`, plus `definitionEnrichment` (Change 0090) — the
Definition Change's own Known/Missing sections and `(deferred)`/`(ambiguous)`/`(decision
required)`/`(human)`-marked items, reusing `analyzeDefinitionSections()` (the same classification
`aief status --change <id>`'s "Definition readiness:" block already reports). `null` for every
non-Definition Change — a Skill never gets a fabricated result for a Change that isn't one.

## Hook

A **Hook** is a versioned observer that reacts to one of a small, closed set of lifecycle events
(`prompt.prepared`, `verify.completed`). A Hook can only add an observation to the output — it
never blocks a command, never changes an exit code, and never mutates a file itself. Hooks are
internally registered, not user-authored. `aief doctor --verbose` shows every registered Hook. See
[Workflow — Hooks](workflow.md#hooks).

## Graph

The Change dependency model (Change 0058; ADR-038 moved it into `change.md`): a Change lists the
Changes it depends on under `## Depends on`. `change-graph.js`'s `buildGraph()` derives, on
every invocation, a deterministic node/edge structure, a topological order (dependencies first),
and any issues (`missing_dependency`, `self_dependency`, `duplicate_dependency`, `cycle`) — never
persisted, never cached. `aief status`/`aief status --graph` read it; `aief verify --change <id>`
prints a non-blocking note when the targeted Change has an issue, and `aief close` warns while a
dependency is still open. This is the foundation `aief
status --next`'s smart selection (Change 0059, below) builds on.
See [Workflow — Graph](workflow.md#graph--the-change-dependency-model).

## Smart next-Change selection

`aief status --next`, when 2+ Changes are open (Change 0059), deterministically recommends one:
open, every dependency exists and is closed, not a Graph cycle member. Ties break on the lowest
Change id. With 0 or 1 open Changes, it shows that Change's next action. See
[Workflow — Smart next-Change selection](workflow.md#smart-next-change-selection--aief-status---next).

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
