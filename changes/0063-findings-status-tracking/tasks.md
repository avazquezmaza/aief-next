# Tasks

## Implementation

- [x] Add "9. Findings Status" section to `docs/history/governance-conventions.md` (table shape,
      status vocabulary, write/update ownership, parser-compatibility note).
- [x] Update the "Parser compatibility" closing section to list `## Findings Status` alongside the
      other free-form, ignored sections.
- [x] Add a short Evidence Guidance pointer in `AGENTS.md` linking to the convention, and mirror
      it byte-identically in `cli/templates/agents/AGENTS.md` (canonical source, Change 0040).
- [x] Retrofit `changes/0013-analyze-current-architecture/evidence.md` with a `## Findings Status`
      table, one row per existing finding, cited against 0014/0015/`adapters/openspec/README.md`.

## Documentation

- [-] No other document requires updating: `docs/workflow.md` and `docs/concepts.md` describe
      Analysis Changes at the concept level only; this convention lives in
      `docs/history/governance-conventions.md` per the existing "one document per concept" rule.

## Verification

- [x] `npm test` (root) passes.
- [x] `node cli/bin/aief.js verify` at repo root passes.
- [x] `git diff --check` passes.
- [x] Confirmed no file under `cli/src/` was touched.

## Evidence

- [ ] Update evidence.md
