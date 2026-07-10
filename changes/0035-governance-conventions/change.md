# Change

## ID

`0035-governance-conventions`

## Type

General

## Objective

Document and standardize the governance conventions that Flux Portal had to invent during dogfooding — task/gate distinction, deferred-work markers, OpenSpec↔AIEF traceability, harness declaration, SDD boundary, increments, and Architecture Checkpoints — as writing conventions and optional templates, **without** adding new CLI entities, commands, or hidden state. Documentation and templates only.

## Scope

### In scope

- `docs/governance-conventions.md`: the eight conventions (tasks/gates/reviews; deferred & moved work; OpenSpec↔AIEF; harness engineering; SDD target maturity; increments within large Changes; Architecture Checkpoints; Initiative as a deferred finding), each compatible with the current `verify`/`close` parser.
- `docs/dogfooding-findings.md`: a concise historical ledger (finding / evidence / decision / action / horizon) citing Flux Portal as the case study, without reproducing external secrets or content.
- Minimal, backward-compatible template pointers: `templates/change/tasks.md` (gate labels + `[-]` deferred marker), `templates/change/evidence.md` (optional Validation Harness / Increments), `templates/change/change.md` (optional Architecture Checkpoint).
- `AGENTS.md`: a short "Tasks and gates" rule — assistants must not check `(human)`/`(review)` boxes.
- `knowledge/backlog.md`: refine the Initiative deferral to reference the new docs and the conventions already landed.
- This Change's own artifacts.

### Out of scope

- Any CLI/runtime change, new command, or new Change Type (no `Type: Checkpoint`).
- A parser for gate/deferred markers (the conventions are parser-safe as-is; any future recognition belongs to the closability-contract workstream).
- Initiative, Parent-Child Changes, `Depends-On` metadata, dependency graphs.
- Contract hashes, semantic OpenAPI/OpenSpec parsing, generated clients.
- Executing Docker/Postgres/Jest or any project harness from AIEF; modifying Flux Portal.
- Introducing external dependencies or hidden state.

## Success Criteria

- `docs/governance-conventions.md` and `docs/dogfooding-findings.md` exist and cover all required sections.
- Every documented marker is verified parser-safe: `[ ]` and `(human)`/`(review)` block `close`; `[-]` does not.
- Template additions are optional and do not change how the CLI generates or verifies Changes.
- No CLI behavior changed; no new runtime entity; backward compatible.
- Root + CLI `npm test` green; example tests green; `aief verify` PASS.

## Status

Closed (2026-07-10)
