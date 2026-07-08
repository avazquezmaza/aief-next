# Tasks

## Research

- [x] Read README.md, docs/architecture.md, docs/Workflow.md, docs/lifecycle.md, docs/principles.md, docs/ecosystem.md, docs/VISION.md, docs/requirement-sources.md.
- [x] Read every ADR in knowledge/decisions.md in full (ADR-001 through ADR-012).
- [x] Read profiles/ (confirm current shape: free-form prose vs ADR-012's structured model).
- [x] Read specs/ (historical v1 — confirm superseded status per architecture.md).
- [x] Read templates/ (change templates, change-types/analysis, openspec, specboot).
- [x] Read examples/ (todo-app, openspec-mapping) for purpose/structure only.
- [x] Read cli/src/core/domain/change.js, core/domain/verification-report.js, core/services/change-verifier.js in full.
- [x] Read cli/src/requirement.js and cli/src/requirement-providers/ in full.
- [x] Skim cli/src/cli.js structure: commands, artifact-creation functions, Prompt Engine composition.
- [x] Read cli/src/skills-catalog.json shape (detectors, skills).
- [x] Read adapters/openspec/ and adapters/specboot/ (integration boundary, not core).

## Documentation

- [x] Write docs/domain-model.md: ubiquitous language glossary.
- [x] Write docs/domain-model.md: 11 core entity subsections (Change, Specification, Task, Evidence, VerificationReport, Profile, Skill, Standard, PromptContext, Workflow, Artifact).
- [x] Write docs/domain-model.md: Core domain / Supporting domains / Infrastructure-Adapters classification.
- [x] Write docs/domain-model.md: six bounded contexts with owned entities and relationships.
- [x] Write docs/domain-model.md: risks of mixing contexts (grounded in real findings).
- [x] Write docs/domain-model.md: what does NOT belong to AIEF's core.
- [x] Write docs/domain-model.md: open questions to validate before AIEF 1.x.

## Verification

- [x] Confirm no ADR modified.
- [x] Confirm no folder moved/renamed, no existing document reorganized.
- [x] Confirm no CLI command or behavior changed.
- [x] Confirm no executable file changed (docs + Change scaffold only) — no test changes required.
- [x] `npm test` run and green.
- [x] `git status` shows only the new Change directory and docs/domain-model.md.

## Evidence

- [x] Update evidence.md
