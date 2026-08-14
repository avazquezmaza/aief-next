# Change

## ID

`0079-add-definition-change-type`

## Type

General

## Objective

Introduce a first-class `Definition` Change type — a dedicated scaffold and prompt guidance for
pre-implementation work (resolving requirements/architecture/product decisions before any
application code exists), distinct from `Analysis` (which assumes an existing implemented system)
and from `Enrichment` (which normalizes an external requirement source). No new command verb, no
new approval mechanism.

## Inventory of what already exists (ADR-013 accounting)

- `## Type` is already a free-text slot read by `changeTypeFromContent()`
  (`cli/src/core/domain/change.js`) with two recognized values beyond the default
  (`analysis`, `enrichment`) each driving its own scaffold (`analysisChangeFiles`/the Enrichment
  branch in `cli.js`) and its own instruction block in `prompt()`. `Definition` reuses this exact
  mechanism — one more accepted value, not a second classification axis and not a new command.
  `new-change --type <value>` already exists and is already tested
  (`cli.test.js`, "valid flags still work after the parser migration").
- The `(human)` task-marker convention already governs required human approval throughout the
  repository (`changes/0038.../tasks.md`, `changes/0039.../tasks.md`,
  `changes/0044.../tasks.md`, `changes/0042.../tasks.md`) — a `- [ ] (human) ...` task is an
  ordinary unchecked task, so it blocks `aief close` through the existing `openTasksCount` rule
  in `checkChangeReadiness()` (`cli/src/core/services/change-verifier.js`) with zero new code.
  Definition's "Human Approval" tasks reuse this convention rather than inventing a second gate.
- `knowledge/decisions.md` is the existing durable-decision ledger (see its own ADR-0xx entries).
  Definition's `## Decision (human)` section and its "Durable Knowledge" tasks point approved
  decisions there — no new persistence surface.
- ADR-022 thaws ADR-015's "no new commands" freeze for AIEF 3.1, but restates that ADR-013 ("name
  what you remove/merge") still binds every Change individually; ADR-031/Change 0061 established
  the applicable pattern for additive, non-command-verb work: extend an existing surface instead
  of inventing a parallel one. This Change follows the same pattern — it adds one `## Type` value
  and one `createChange()`/`prompt()` branch, using mechanisms (`--type`, `(human)` tasks,
  `knowledge/decisions.md`) that already exist and are already exercised by Analysis/Enrichment.
  It replaces the alternative a repository is forced into today: pre-implementation work either
  misuses `Analysis` (which assumes an existing implemented system to inspect) or falls back to
  the untyped `General` scaffold (no open-questions/decisions/human-approval structure at all).

## Scope

### In scope

- A `Definition` scaffold (`change.md`/`spec.md`/`tasks.md`) covering context, business/product
  constraints, known requirements, assumptions, open questions, decisions required, options
  considered, recommendation, `(human)` decision, rationale, consequences, NFRs,
  security/compliance, data/domain, integrations, deployment/operations, implementation
  prerequisites, follow-up Changes.
- `aief new-change <name> --type definition` producing that scaffold.
- `aief prompt` on a Definition Change explaining: do not implement application code; resolve
  definition questions; explain options; recommend only with evidence; require human approval for
  architecture/product decisions; record durable decisions in `knowledge/decisions.md`.
- `aief help new-change` documenting `--type definition`.

### Out of scope

- Project maturity detection / `aief analyze` routing (Change 0080).
- The richer Known/Missing/Ambiguous/Decision-required enrichment workflow (Change 0081).
- Maturity-aware standards (Change 0082).
- `aief verify --strict` (Change 0083).
- Implementing any application code as a side effect of this Change.

## Success Criteria

- `aief new-change <name> --type definition` creates the dedicated scaffold with `## Type` =
  `Definition`.
- `aief prompt` on a Definition Change tells the assistant not to implement application code and
  not to self-approve `(human)` decisions.
- `aief verify` and `aief close` behave correctly on a Definition Change using only existing,
  unmodified rules (no Definition-specific readiness code added in this Change).
- Existing Analysis/Enrichment/General behavior is unchanged (regression tests pass).

## Status

Closed (2026-08-14)
