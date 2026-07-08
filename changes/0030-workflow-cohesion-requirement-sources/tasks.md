# Tasks

## Implementation

- [x] Create `cli/src/requirement.js`: `PROVIDERS` (description-only catalog), `providerList`, `emptyRequirement`, `normalizeJira` (with ADF-to-text flattening for Jira descriptions/comments).
- [x] Add `aief enrich <provider> <source-id> [--file path]` to `cli/src/cli.js`: provider/source-id validation, duplicate-Change guard (`findChangeBySlugSuffix`), `enrichmentChangeFiles` (change.md/spec.md/tasks.md/evidence.md rendering with `[H]`/`[I]`/`[S]` classification, Requirement Source section, Review Status).
- [x] Wire `enrich` into `main()` dispatch, `COMMAND_HELP`, and the `help()` usage text.
- [x] Extend `aief prompt` to detect Enrichment Changes and instruct the assistant not to implement or touch the source, without marking Human Review tasks itself.
- [x] Make `aief verify` phase-aware: `README.md` optional while only Discovery/Enrichment Changes exist (`discoveryOnly` check); add `checkEnrichmentChange` for the four required markers per Enrichment Change.

## Architecture review follow-up (design fixes before approval)

- [x] **Fix 1 — propose continuity:** add `aief propose --change <id>` (new `proposeForChange()`), continuing an existing Change by adding/keeping `proposal.md` only, never touching `change.md`/`spec.md`/`tasks.md`, never creating a new Change directory; plain `aief propose <idea>` unchanged. Updated `COMMAND_HELP.propose` and the usage banner.
- [x] **Fix 2 — provider adapter layer:** create `cli/src/requirement-providers/{manual.js,jira.js,index.js}` implementing a uniform `retrieve(sourceId, options) -> { requirement, retrieved, openQuestions, riskNotes, consoleNotes }` contract; remove the old `retrieveRequirement()` from `cli.js` along with every `provider === "jira"` branch (previously in three functions); `cli.js` now calls only `retrieveRequirement`/`hasAdapter`/`implementedProviders` from the adapter layer. `PROVIDERS` in `requirement.js` lost its `implemented` field (single source of truth is now the adapter registry); `providerList()` takes an `isImplemented` predicate instead.
- [x] **Fix 3 — canonical workflow doc:** updated `docs/Workflow.md` (mermaid diagram, Level 1 text diagram, new "Starting from a Requirement Source" subsection, all-levels lifecycle diagram) to include `aief enrich` and `aief propose --change`; rewrote `docs/enrichment-workflow.md` to drop its standalone competing lifecycle diagram in favor of an enrich-specific diagram plus an explicit pointer to `docs/Workflow.md` as canonical (per ADR-011).
- [x] **Fix 4 — dedupe Type parsing:** added shared `changeType(changeDir)` helper next to `isClosed`; replaced the inline `isAnalysis` regex in `prompt()` and the standalone `isEnrichmentChange()` function (3 call sites) with `changeType(dir) === "analysis"` / `"enrichment"`.

## Documentation

- [x] Write `docs/requirement-sources.md` (Requirement Source, Normalized Requirement, provider table, Jira export format, future integration path).
- [x] Write `docs/enrichment-workflow.md` (enrich-specific detail, deferring to `docs/Workflow.md`; Human Review Gate incl. `propose --change`; verify-by-phase; known limitation).
- [x] Update `docs/Workflow.md` as canonical (see Fix 3 above).
- [x] Update `docs/TEAM-USAGE-GUIDE.md` (new "start from a requirement source" section incl. `propose --change`; Human Review points list).
- [x] Update `README.md` (new "Start from a Requirement Source" section incl. `propose --change`; Commands list).
- [x] Update `CHANGELOG.md`.

## Verification

- [x] `aief enrich manual TEST-001` creates a Change with source metadata, read-only marker, `[H]`/`[I]`/`[S]`, Open Questions, Requires Human Review (manual smoke test + `cli/tests/cli.test.js`).
- [x] `aief enrich jira <id>` tested both with a local export file and without one.
- [x] Unknown/unimplemented provider and missing source-id fail loudly (tested).
- [x] Duplicate `provider`/`source-id` does not create a second Change (tested).
- [x] `aief close --yes` refuses an Enrichment Change with unchecked Human Review tasks (tested).
- [x] `aief prompt` on an Enrichment Change shows the no-implementation guidance (tested).
- [x] `aief propose --change <id>` continues the existing Change without creating a new one, leaves `change.md`/`spec.md` byte-for-byte unchanged, never overwrites an existing `proposal.md`, and fails loudly for an unmatched `--change` value; plain `aief propose <idea>` still creates a new Change (all tested).
- [x] New unit test file `cli/tests/requirement-providers.test.js` verifies every registered adapter returns the uniform shape, and that `retrieveRequirement` throws for an unregistered provider.
- [x] `aief verify` passes without `README.md` in a Discovery/Enrichment-only project, and requires it again once another Change type exists (tested).
- [x] `aief help enrich`, `aief help propose` and `aief --help` document the commands, including `--change` (tested via the help-coverage test).
- [x] `npm test` full suite green.
- [x] `aief verify` PASS on this repository.
- [x] Manual temporary-project run: `aief init` → `aief enrich manual TEST-001` → `aief propose --change 0002-manual-test-001` → `aief verify` → confirm no `0003-...` was created and `proposal.md` sits inside `0002-.../`.

## Evidence

- [x] Update evidence.md
