# Change

## ID

`0157-implement-4-0-simplification`

## Type

General

## Objective

Implement AIEF 4.0 exactly as decided in Definition Change 0156 and ADR-038. Remove the features
that only a `manifest.json` could switch on, move dependencies into `change.md`, and release
4.0.0.

## Scope

### In scope

- Remove: `manifest.json` support, tracks and the workflow engine, Loop, Harness log, SDD
  providers and OpenSpec integration, requirement verification (`verify --requirements`),
  `ai-specs`. `(gate:<id>)` lines become ordinary tasks.
- `verify` prints a notice when it finds a `manifest.json`, which is no longer read.
- Dependencies: an optional `## Depends on` section in `change.md`, written by
  `new-change --depends-on`. `status --next` and `status --graph` read it, and `close` prints a
  notice, never a block, while a dependency is open.
- Mark `adapters/openspec/` and `adapters/specboot/` as "conceptual reference, not supported in
  4.0".
- Remove the track/gate guidance from `AGENTS.md` (root and template stay byte-identical).
- Update docs, tests, version 4.0.0 and release notes.
- Analysis 0154's Findings Status: B3 and B4 resolved by Change 0155.

### Out of scope

- Anything ADR-038 keeps: Change files, `verify`, `close`, `prompt`, approval labels, Skills,
  detection, the two informational Hooks.
- Wave 2 and 3 items from Analysis 0154.

## Success Criteria

- No source file imports a removed module, and no doc describes a removed feature as current.
- `npm test` and `npm run lint` pass in `cli/`. `aief verify --strict` passes on this repository.
- A Change with `## Depends on` naming an open Change gets a notice at close and still closes.

## Status

Closed (2026-10-04)
