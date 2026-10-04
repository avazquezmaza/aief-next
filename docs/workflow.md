# Workflow

The canonical description of how AIEF and your AI assistant work together, and how a Change moves
from idea to closed. Vocabulary used here (Change, Skill, Hook) is defined in
[Concepts](concepts.md).

## The three levels

![AIEF Change lifecycle: Level 1 Context and Change preparation (doctor, bootstrap, analyze/new-change/enrich, prompt) feeds Level 2 Assistant implementation (any AI assistant writes evidence.md), which feeds Level 3 Verification and closing (verify, close --yes, status --graph/--next); a failed verify is fixed and re-prompted manually, and Hooks and dependency notices only observe and report, never execute or gate](images/workflow-lifecycle.svg)

- **Level 1 — Context.** AIEF prepares the ground: `doctor` checks environment and project
  readiness (not a Change's own `verify`), `bootstrap` adopts an existing project without touching
  application code, then a Change is created and a context-complete prompt is composed. This level
  never implements functional code.
- **Level 2 — Feature.** The engineering itself, done by your AI assistant. AIEF does not
  implement, generate specs, or duplicate this level.
- **Level 3 — Governance.** AIEF checks the result and closes the loop: `verify` reports a
  specific Change's structure; `close --yes` marks that Change Closed once its tasks, approvals and
  evidence are complete.

## The Change lifecycle end to end

```text
Idea, or an external Requirement Source (Jira, manual, ...)
  -> aief new-change / analyze / enrich        (level 1: create the Change)
  -> [enrich only] Human Review required before continuing
  -> aief propose [--change <id>]              (new idea, or continue an enriched Change)
  -> aief prompt -> assistant works            (level 2: implementation)
  -> evidence.md completed
  -> aief verify                               (level 3: structural check)
  -> aief close --yes                          (level 3: Change marked Closed)
  -> aief status --next                        (what to do next)
```

## Checking where a Change stands

```bash
aief status --change 0002-add-login          # deep view: blockers, dependencies, next action
aief status --change 0002-add-login --next   # compact view: the one next action to take
aief status --next                           # same, with exactly one open Change
```

## Starting from a Requirement Source

Real work often starts in a ticket, not in `aief new-change`. `aief enrich <provider>
<source-id>` reads a requirement **read-only** — AIEF never writes back to Jira or any other
system — and creates a Change seeded with it, classified as Fact `[H]` / Inference `[I]` /
Assumption `[S]`, with a `Requires Human Review` status:

```bash
aief enrich manual TEST-001
aief enrich jira ISSUE-123 --file requirements/jira/ISSUE-123.json   # local export, no network
```

`aief close --yes` refuses this Change until every Human Review task is checked off by a human —
an assistant must never check one itself. Once reviewed, `aief propose --change <id>` continues the
**same** Change (adds `proposal.md`, never forks a new one), or go straight to `aief prompt`. Only
`manual` and `jira` (local-export) are implemented today; Notion, GitHub Issues and Azure DevOps
are defined in the same contract but not yet built — requesting one fails loudly, never silently.

## Skills Runtime

`aief prompt --skill <id>` attaches one registered Skill's output to the generated prompt, after
every other context block. A Skill reports one of seven statuses; only `ready` carries real
instructions — every other status (`not_applicable`, `blocked`, `unsupported`, `completed`) is
rendered as one honest line, and `invalid`/`failed` stop the command before any prompt is printed.
List what's registered:

```bash
aief prompt --list-skills
```

Every shipped Skill is instructions-only: it hands the assistant guidance to follow, it never
writes a file, runs a command, or calls the network on its own — following the instructions is not
by itself evidence the described work happened.

Four Skills ship this release: `change-context` (Change composition context for any assistant),
`adversarial-review` (instructions for an independent,
failure-hunting review before a Change is closed), and two expert Definition Skills,
`architecture-definition` (Change 0091) and `data-definition` (Change 0094) — the last two
validated together as a domain-coexistence pilot, not a framework. Each of the two Definition
Skills applies only to a Definition Change (`## Type: Definition`) whose own content carries its
own domain-relevant signal — `architecture-definition`: authentication, tenancy, integration, persistence,
availability, scalability, ...; `data-definition`: PII, personal/sensitive/customer data,
retention, residency, classification, deletion, archival, ... (deliberately excluding bare
"data"/"database"/"schema"/"storage", which would collide with `architecture-definition`'s own
signal). Both read `context.definitionEnrichment` (Change 0090) to avoid duplicating what the
Change already records, and instruct the assistant to draft Concerns, Options Considered,
Trade-offs and a Recommendation inside the Change's own existing sections — never filling `Decision
(human)`, checking a `(human)` task, or writing application code itself. Each Skill's own
instructions state an explicit domain boundary (architecture owns persistence technology/
deployment topology/tenant-isolation topology/cloud-provider selection; data owns classification/
retention/residency/ownership/deletion/archival) so the two can apply to the same Definition Change
without duplicating a governed concern or issuing a contradictory recommendation — proven by real
coexistence scenarios in Change 0094's own evidence, not merely asserted. The human decision either
leads to is recorded the same way any other Definition decision already is: in
`knowledge/decisions.md`, gated by the same `(human)` markers and `verify --strict` completeness
check every other Definition Change already uses. No new graph, state store, approval mechanism, or
Skill orchestration layer was introduced for either — see [Concepts — Skill](concepts.md#skill).

## Hooks

Two lifecycle events exist: `prompt.prepared` (fires at the end of `aief prompt`, after every other
context block) and `verify.completed` (fires after `aief verify` has already printed its PASS/FAIL
and set its exit code). A Hook observing either event can only append an additional, clearly
labeled section — it cannot influence the exit code, block the command, or write a file. Hooks are
internally registered, not user-authored. One ships today: `post-verify-next-action`, which
suggests the next command after `aief verify --change <id>`.

`aief doctor --verbose` lists every registered Hook and the event it fires on.

## Graph — the Change dependency model

A Change lists the Changes it depends on under `## Depends on` in its own `change.md`, one id per
bullet (ADR-038; Change 0058 introduced the Graph). `aief new-change <name> --depends-on
<id>[,<id>...]` writes the section with full basenames:

```markdown
## Depends on

- 0002-user-model
- 0003-add-login
```

An entry is a Change directory basename or a bare numeric id (`- 0002`), which resolves to the one
Change with that id. Nothing is persisted elsewhere: the graph is rebuilt, deterministically, from
every `change.md` on each invocation.

- **`aief status`** (overview) shows a "Dependency Graph:" section — present only when at least one
  Change declares a dependency — listing each such Change's dependencies and any issues.
- **`aief status --graph`** renders the *full* graph: every Change as a node, every edge, the
  topological order (dependencies first), or an explicit "unavailable — dependency cycle among:
  ..." statement when a cycle exists.
- **`aief verify --change <id>`** prints one small, non-blocking note when the targeted Change has
  a Graph issue — never affects PASS/FAIL or the exit code.
- **`aief close`** prints `! depends on <id>, which is still open` for each open dependency, and
  closes anyway: the human decides whether closing out of order is fine.

Issues detected, always as informational diagnostics, never as blockers:

| Issue | Meaning |
|---|---|
| `missing_dependency` | `## Depends on` names a Change that doesn't exist. |
| `self_dependency` | A Change lists itself. |
| `duplicate_dependency` | The same dependency is listed more than once. |
| `cycle` | Two or more Changes depend on each other, directly or transitively — no valid order exists among them. |

## Smart next-Change selection — `aief status --next`

`aief status --next` (no `--change`) already had two paths (Change 0046): zero open Changes
(error), exactly one (shows that Change's compact Normalized Action — unchanged). **With two or
more open Changes, it now recommends one deterministically** instead of erroring (Change 0059,
ADR-029) — replacing the prior "select one explicitly" message for that case specifically.

A Change is **eligible** when all of:

1. it is open;
2. every `## Depends on` entry names a Change that exists (no Graph `missing_dependency`/
   `self_dependency`/`duplicate_dependency` issue names it);
3. every dependency is **closed**;
4. it is not a member of a dependency cycle.

When more than one Change is eligible, **the lowest Change id wins** (string-ascending comparison
— the same sort `buildGraph()`'s `nodes` and `status`'s own listings already use). This tie-break
never decides *eligibility* — only which already-equally-eligible Change to recommend.

```text
Next Change: 0002-add-login

Ready because:
- status: open
- dependencies: all closed (0001-user-model)
- graph: valid

Tie-break: lowest Change id, sorted ascending (...)
Other eligible Change(s): 0004-add-payments
```

When nothing is eligible, every open Change is listed with its own specific blocking reason —
never a bare "nothing found" — and the exit code is still `0` (an honest report, not an error).

With exactly one or zero open Changes, `aief status --next` shows that Change's compact next
action, or an error when none is open.

## Verification

`aief verify` runs **Structural Verification**: are the Change's required files present, is
evidence classified as more than a placeholder, how many tasks are still open. `aief verify
--strict` adds objective completeness checks (untouched placeholders, unresolved TODO/TBD,
unchecked `(human)`/`(review)` approvals in `tasks.md` or in `spec.md`'s Acceptance Criteria).
`aief close` runs the readiness checks before it marks a Change Closed.

## Responsibilities

| Actor | Responsibility | Never does |
|---|---|---|
| **AIEF** | Context, standards, Skills, prompts, evidence, governance, verification | Generate specs, implement code, commit |
| **SpecBoot**, **OpenSpec** *(conceptual sources)* | Inspiration for standards, instruction hierarchy and spec structure | Nothing at runtime — not integrated in 4.0 (ADR-038) |
| **AI assistant** *(any)* | Implementation, refactoring, tests, review | Approve scope or releases |
| **Humans** | Scope, trade-offs, `(human)`/`(review)` approvals, release decisions | — |

## What AIEF does not do

- Generate proposals, specs or task content — a human or the assistant does.
- Implement, refactor, test or review code — the AI assistant does.
- Execute a Skill's instructions, run a command, or reach the network from a Skill or Hook.
- Keep hidden state — the Change files are the only source of truth.
- Mark an approval, or decide a Change is ready to close — those stay human decisions the CLI
  only reports on.
- Create commits, publish PRs, or approve releases.
