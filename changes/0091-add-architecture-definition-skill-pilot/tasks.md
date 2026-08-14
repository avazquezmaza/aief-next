# Tasks

## Implementation

- [x] Inspect `requirements-analysis-instructions.js`, `change-context.js`, `skills/index.js`,
      `skill.js`, `skill-service.js` before writing any code (no assumptions from the feasibility
      review's own field-name guesses).
- [x] Write `cli/src/skills/architecture-definition.js`: descriptor, `appliesTo()`,
      `buildInstructions()`, `summarize()`.
- [x] Register it in `cli/src/skills/index.js`'s `MODULES`.

## Documentation

- [x] Add a short mention in `docs/workflow.md#skills-runtime` or `docs/concepts.md#skill` naming
      `architecture-definition` as the pilot Skill, additive only.

## Verification

- [x] Add `cli/tests/skill-architecture-definition.test.js` covering spec.md's Acceptance Criteria.
- [x] Focused: `node --test cli/tests/skill-architecture-definition.test.js cli/tests/skill-context.test.js cli/tests/skill-service.test.js cli/tests/skill-model.test.js cli/tests/skill-registry.test.js`.
- [x] Full: `npm test`.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.
- [x] Adversarial review (change.md's own list) — every answer NO.
- [x] End-to-end pilot scenario run against a disposable scratch project (B2B SaaS: enterprise
      auth, sensitive operational data, external ERP integration, no architecture selected).

## Evidence

- [x] Update evidence.md
