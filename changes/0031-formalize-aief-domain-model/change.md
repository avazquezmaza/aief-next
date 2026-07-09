# Change

## ID

`0031-formalize-aief-domain-model`

## Type

General

## Objective

Document AIEF's conceptual domain model as product architecture — its ubiquitous language, core entities, bounded contexts, and the boundaries between core domain, supporting domains, and infrastructure/adapters — so future decisions can be checked against a stated model instead of inferred from code.

## Scope

### In scope

- Read and cross-reference README.md, docs/ (architecture.md, Workflow.md, lifecycle.md, principles.md, ecosystem.md, VISION.md, requirement-sources.md), knowledge/decisions.md (all ADRs), profiles/, specs/ (historical v1), templates/, examples/, cli/src/core/, cli/src/requirement.js + requirement-providers/, cli/src/cli.js (structure only), cli/src/skills-catalog.json, and adapters/.
- Create `docs/domain-model.md` covering: ubiquitous language; the 11 requested entities (Change, Specification, Task, Evidence, VerificationReport, Profile, Skill, Standard, PromptContext, Workflow, Artifact); the core domain / supporting domains / infrastructure-adapters classification; the six requested bounded contexts (Change Management, Verification & Governance, Prompt Composition, Knowledge & Skills, Assistant Integration, Developer Experience); risks of mixing contexts; what does not belong to AIEF's core; open questions to validate before 1.x.

### Out of scope

- Any new CLI functionality, command, or behavior change.
- Moving, renaming, or reorganizing any existing folder or document.
- Implementing any of the gaps the document identifies (e.g. structured Profiles, Prompt Composition extraction) — this Change only documents them as open questions.
- Modifying tests, unless strictly required (none were required: no executable file changed).

## Success Criteria

- `docs/domain-model.md` exists, is internally consistent with the accepted ADRs (does not contradict ADR-009, ADR-010, ADR-012 in particular), and reads as product/conceptual architecture rather than an implementation reference.
- No CLI behavior, folder structure, or existing documentation changed.
- `npm test` still green (no executable file was touched).

## Status

Closed (2026-07-09)
