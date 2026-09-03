# Tasks

## Implementation

- [x] `enrich.js`: call `ensureChangeBranch(id, slug, "enrichment", { skip })` before any
      `writeFile`, wrapped in the same try/catch abort pattern `createChange()` uses.
- [x] `KNOWN_FLAGS`: add `--no-branch` to `enrich`, `analyze`, `propose`.
- [x] `analyze.js`: thread `noBranch: parsed["no-branch"]` through both `createChange()` call sites.
- [x] `propose.js`: thread `noBranch: parsed["no-branch"]` through its `createChange()` call site.

## Documentation

- [x] `docs/maintainer.md` — updated the Change-0114 note to reflect enrich now having the same
      contract via its own `ensureChangeBranch()` call.
- [x] `AGENTS.md` (and its byte-identical template copy `cli/templates/agents/AGENTS.md`) — mention
      `enrich` alongside `analyze`/`propose`.

## Verification

- [x] `cli/tests/git-branch.test.js`: enrich auto-branch, enrich `--no-branch`, enrich
      failed-checkout-aborts, analyze `--no-branch`, propose `--no-branch` (5 new tests).
- [x] `npm test` (full suite).
- [x] `node cli/bin/aief.js verify --strict`.
- [x] `git diff --check`.

## Evidence

- [x] Update evidence.md.
