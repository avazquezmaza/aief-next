# Specification

## Goal

AIEF 4.0 ships as the Change contract described in ADR-038, with every manifest-gated feature
gone and dependencies declared in `change.md`.

## Requirements

### R1: Removals

- The modules listed in Change 0156's Context table are deleted, except `change-graph.js` and
  `next-change-service.js`, together with their tests, CLI flags (`--requirements`) and output
  sections (Track/Stage/Harness/Loop/SDD in `status`, `doctor` and `verify`).
- Readiness for every Change is `checkChangeReadiness()`.

### R2: Leftover manifests

- `verify` prints `! <change>: manifest.json is no longer read (AIEF 4.0, ADR-038)` for each
  Change directory holding one. It is not an error.

### R3: Dependencies

- `## Depends on` lists Change ids, one per bullet (for example `- 0002-base-api` or `- 0002`).
- `aief new-change <name> --depends-on <id>[,<id>...]` writes the section.
- `status --graph` and `status --next` build the graph from that section, with the same rules as
  before (missing dependency, self dependency, duplicates, cycles).
- `close` prints `! depends on <id>, which is still open` for each open dependency, and closes
  anyway.

### R4: Docs and release

- `AGENTS.md` and its template have no track or gate guidance and stay byte-identical.
- `docs/` describe only what exists. `adapters/openspec/` and `adapters/specboot/` carry a
  "conceptual reference, not supported in 4.0" note.
- Version 4.0.0 in `package.json` files, and release notes in `releases/v4.0.0.md`.
- Analysis 0154's Findings Status records B3 and B4 as resolved by Change 0155.

## Acceptance Criteria

- [x] R1: Removed modules, tests, flags and output sections are gone; suite green.
- [x] R2: Leftover manifest notice (test).
- [x] R3: Depends on section, flag, graph/next and close notice (tests).
- [x] R4: Docs, adapters, version and release notes updated.
- [x] (human) Owner reviews the 4.0 diff before merge.
