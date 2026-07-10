# Change

## ID

`0034-workflow-cohesion-change-selection`

## Type

General

## Objective

Eliminate the ambiguity and operational risk that appear when multiple Changes are open at once. During Flux Portal dogfooding, workflow commands could implicitly select the chronologically latest open Change even when the user was working on another — a silent, wrong-target hazard. Make Change selection explicit and deterministic across `status`, `prompt`, `verify` and `close`, through one shared resolver. This is the first ROADMAP-TO-1.0 workstream ("Unified Change identity") partially materialized: the "confusing active-Change selection" symptom.

## Scope

### In scope

- One shared selection implementation (`matchChanges` in `cli/src/core/domain/change.js`) used by every command that operates on a Change — no per-command selection rules.
- Deterministic resolution tiers: exact directory name → exact numeric ID → unique substring of the name; ambiguous or unknown selectors fail loudly with the candidate list.
- `--change <id-or-slug>` accepted consistently by `prompt`, `verify`, `close`, and `propose --change`.
- Zero destructive ambiguity: with more than one open Change and no `--change`, mutating/composing commands (`prompt`, `close`, `propose --change`) refuse and list candidates instead of guessing; `close` never closes the latest open Change implicitly.
- `aief status`: lists all open Changes, flags when several are in progress, presents none as "active" without explicit selection, and suggests `--change` commands when ambiguous.
- `aief prompt`: composes context for the requested Change; never the chronologically latest by accident.
- `aief verify`: whole-project mode unchanged in spirit but its multi-open "Next:" hint no longer names a single active Change; new `--change <id>` mode verifies exactly one Change and states which one, sharing the same rules.
- `aief close`: requires unambiguous selection, shows the target, keeps the existing human gate / readiness (closability) checks and `--yes` confirmation.
- Backward compatibility: with exactly one open Change, all commands keep their current ergonomics (implicit target).
- Help text, usage banner, and the docs that described "latest open is automatically active" (`docs/cli.md`, `docs/Workflow.md`, `README.md`, the adoption tasks note) updated to the explicit-selection model.
- Tests for the twelve required scenarios plus `matchChanges` unit tests.

### Out of scope

- Formal Initiative, dependency graphs, Parent-Child Changes, a Checkpoint Change Type.
- Persistent/session selection state or any database (ADR-009 reaffirmed — resolution stays derived from files on every call).
- Agents, subagents, autonomous loops.
- Executing external project tests, Docker, or harnesses; Jira integration; OpenAPI parsing.

## Success Criteria

- A single resolver backs selection for all Change-operating commands; no command silently selects the latest open Change.
- `prompt`/`close`/`propose --change` refuse implicit selection when >1 Change is open and print an actionable candidate list.
- `verify --change` verifies and names exactly one Change; whole-project `verify` still works.
- Backward compatible with single-open repos and existing Change directories.
- Root + CLI `npm test` green; example tests green; `aief verify` PASS.

## Status

Closed (2026-07-09)
