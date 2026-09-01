# Tasks

## Decision recorded

- [x] (human) Project owner confirmed: read `consolidation.md`, decided to thaw both remaining
      items (Candidate DELETE/ARCHIVE, Type↔Track). Confirmed 2026-09-01.

## Implementation

- [x] ADR-032 added to `knowledge/decisions.md`, naming what's thawed, by whom, the precondition
      satisfied, which Changes resume, and — explicitly — what Change 0096's consolidation did
      and did not establish about Type/Track or DELETE-candidates specifically.
- [x] ADR-015's own entry updated with a pointer to both ADR-022 and ADR-032, original
      decision/consequences text unchanged.
- [x] Change 0038's `FROZEN` paragraph replaced with a `THAWED` one, pointing at ADR-032.

## Verification

- [x] Confirmed the freeze was always documentary (grepped `cli/src` for "ADR-015"/"FROZEN" —
      no code enforced it), so no CLI-behavior check applies here.
- [x] `npm test` passes.
- [x] `node cli/bin/aief.js verify` PASS.
- [x] `git diff --check` clean.
- [x] `git diff --stat` touches only `knowledge/decisions.md`, `changes/0038-.../change.md`, and
      this Change's own directory.

## Evidence

- [x] Update evidence.md.
