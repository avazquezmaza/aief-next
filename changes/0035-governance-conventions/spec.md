# Specification

## Goal

The conventions Flux Portal invented ad hoc are written down once, consistently, and parser-safe — so any team can apply them and any future machine-enforcement (closability contract) has a documented starting point, without AIEF gaining a new runtime concept today.

## Requirements

- `docs/governance-conventions.md` covers, each with a compatibility note: (1) task/gate/review labels `(human)`/`(review)`; (2) deferred/moved work vocabulary via `[-]`; (3) OpenSpec↔AIEF WHAT/HOW split + the draft-vs-real-backend rule; (4) harness engineering (project runs it, AIEF records it, no secrets); (5) SDD target maturity (no contract hashes/parsers); (6) increments within large Changes; (7) optional Architecture Checkpoint section; (8) Initiative as a deferred finding.
- `docs/dogfooding-findings.md`: a five-column ledger (finding / evidence / decision / action / horizon) with Flux Portal as case study, no external secrets.
- Templates gain only optional, commented pointers; the CLI still generates and verifies Changes exactly as before.
- `AGENTS.md` states assistants must not check `(human)`/`(review)`.
- `knowledge/backlog.md` reflects that conventions landed and only the Initiative entity remains deferred.

## Acceptance Criteria

- [x] `docs/governance-conventions.md` created with all eight sections + a parser-compatibility section.
- [x] `docs/dogfooding-findings.md` created with the five-column ledger.
- [x] Empirically confirmed: `[ ]` and `(human)`/`(review)` block `close`; `[-]` does not (tested in a temp repo).
- [x] `templates/change/{tasks,evidence,change}.md` gained optional, backward-compatible guidance only.
- [x] `AGENTS.md` gained a concise Tasks-and-gates rule.
- [x] `knowledge/backlog.md` updated; Initiative remains deferred (not implemented).
- [x] No CLI/runtime change; no new entity; Flux Portal untouched.
- [x] Root + CLI `npm test` green; example tests green; `aief verify` PASS; new-doc links resolve.

## Constraints

- No new CLI command, Change Type, parser, or hidden state; backward compatible; assistant- and stack-agnostic.

## Assumptions

- `templates/change/*.md` are reference documents, not consumed by the CLI's Change generation (verified during Fase 0).
