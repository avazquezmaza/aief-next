# Tasks

## Implementation

- [x] Add `resolveDefinitionEnrichment(change)` (or inline equivalent) to `skill-context.js`,
      calling the existing `analyzeDefinitionSections()` on `change.files["change.md"]` only when
      `change.type === "definition"`; `null` otherwise.
- [x] Wire the result into `buildSkillContext()`'s returned (and frozen) object as
      `definitionEnrichment`.

## Documentation

- [x] Update `docs/concepts.md#skill` (or the nearest relevant section) to mention
      `definitionEnrichment` as part of the Skill Context, mirroring how `project`/`workflow`/`sdd`
      are already documented — additive, no rewrite of unrelated prose.

## Verification

- [x] Extend `cli/tests/skill-context.test.js` with the cases in spec.md's Acceptance Criteria.
- [x] Run focused tests: `node --test cli/tests/skill-context.test.js cli/tests/definition-enrichment.test.js cli/tests/skill-service.test.js cli/tests/skill-model.test.js cli/tests/skill-registry.test.js`.
- [x] Run full suite: `npm test` (907 baseline + new tests, 0 failures).
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.
- [x] Adversarial review checklist (change.md's own review questions) answered NO across the board.

## Evidence

- [x] Update evidence.md
