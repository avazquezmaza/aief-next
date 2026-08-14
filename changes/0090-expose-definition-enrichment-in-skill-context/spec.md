# Specification

## Goal

`buildSkillContext(changeDir, cwd)` returns `{ project, change, workflow, sdd, action, definitionEnrichment }`.
`definitionEnrichment` is `analyzeDefinitionSections(change.md)`'s output for a Definition Change
(`change.type === "definition"`), and `null` for every other Change type — computed with zero new
file I/O and zero new parsing logic.

## Requirements

- R1. `buildSkillContext()` imports and calls the existing `analyzeDefinitionSections()`
  (`cli/src/core/domain/definition-enrichment.js`) — no new function reimplements any part of its
  Known/Missing/marker classification.
- R2. `definitionEnrichment` is computed only from `change.files["change.md"]`, the content
  `loadChangeUnified()` already read as part of `inspect()`/`explain()` — no new
  `fs.readFileSync` call is added anywhere in `skill-context.js`.
- R3. `definitionEnrichment` is `null` when `change.type !== "definition"` (covers `"general"`,
  `"analysis"`, `"enrichment"`, `""`, and any manifest-carrying Change, whose `.type` is always
  `""` per `change-loader.js`).
- R4. The returned context remains deep-frozen, exactly as today — `definitionEnrichment` (and its
  nested arrays) must be unwritable by a caller, same as every other field.
- R5. Output is deterministic and idempotent: the same Change directory produces byte-identical
  `definitionEnrichment` on every call.
- R6. `buildSkillContext()` performs zero writes — unchanged, verified by the existing
  byte-comparison test pattern, now also covering the new field's code path.
- R7. No existing Skill's behavior changes: `change-context.js` and
  `requirements-analysis-instructions.js` do not read `definitionEnrichment` and are unaffected;
  their own tests must still pass unmodified.
- R8. The `changeDir`/`cwd` parameters and every other existing field's shape/values are unchanged
  (`project`, `change`, `workflow`, `sdd`, `action` byte-identical to before this Change for every
  Change fixture already covered by `skill-context.test.js`).

## Acceptance Criteria

- [x] A Definition Change with unmarked, untouched scaffold sections yields
      `definitionEnrichment.missing.length === DEFINITION_SECTIONS.length` and
      `definitionEnrichment.known.length === 0`.
- [x] A Definition Change with `(deferred)`/`(ambiguous)`/`(decision required)`/`(human)`-marked
      lines yields matching non-empty arrays in `definitionEnrichment`.
- [x] A General/Analysis/Enrichment Change (and a manifest-carrying Change) yields
      `definitionEnrichment === null`.
- [x] `buildSkillContext()`'s result for `definitionEnrichment` matches
      `analyzeDefinitionSections(changeMd)` called directly on the same content — verified by
      direct comparison in a test, not merely "some non-null value."
- [x] Two calls to `buildSkillContext()` against the same directory return `deepEqual` results.
- [x] A before/after byte-comparison of every file in the Change directory shows no write.
- [x] `context.definitionEnrichment` (and its arrays) throw `TypeError` on an attempted mutation.
- [x] `npm test` passes at 907 + (new test count); `aief verify` reports PASS; `git diff --check`
      is clean.
