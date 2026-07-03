# Change

## ID

`0016-real-project-validation`

## Type

General

## Objective

Validate the AIEF Adoption Engine on a real existing project — Flux Portal (`trk-orchestrator-portal`), the multitenant n8n orchestrator that motivated AIEF v4 — following the roadmap Phase 2 validation principles: do not reorganize the project, adopt incrementally, record every friction, improve AIEF only from observed evidence.

## Scope

### In scope

- Run the full adoption flow on Flux Portal: `doctor → adopt → verify → analyze → prompt --assistant claude --profile architect`.
- Record every friction observed.
- Complete the adoption Change evidence in the target project.
- Apply to AIEF only fixes backed by observed friction (catalog gaps, output duplication, hint inconsistency), with tests.

### Out of scope

- Performing the architecture analysis of Flux Portal itself (that is the target's `0002-analyze-current-architecture`, to be driven with an assistant).
- Modifying any Flux Portal application code, configuration or documentation.
- Speculative AIEF features not backed by observed friction.

## Success Criteria

- Adoption completes on the real project with zero manual fixes and zero modifications to tracked files.
- All frictions are recorded in evidence.
- Evidence-driven fixes land in AIEF with test coverage; full suite passes.

## Status

Closed (2026-07-03)
