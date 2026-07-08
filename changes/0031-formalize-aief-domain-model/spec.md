# Specification

## Goal

`docs/domain-model.md` exists as a single, authoritative product-architecture document formalizing AIEF's domain — usable to check future feature/refactor decisions against a stated conceptual model, without needing to read code to infer it.

## Requirements

- **Ubiquitous language**: a glossary of AIEF's terms (Change, Specification, Task, Evidence, VerificationReport, Profile, Skill, Standard, PromptContext, Workflow, Artifact, Requirement Source, Normalized Requirement, Active Change, Detector, Provider/Adapter, Proposal, Human Review Gate), each with its governing ADR/doc.
- **Core entities**: a dedicated subsection for each of the 11 requested entities (Change, Specification, Task, Evidence, VerificationReport, Profile, Skill, Standard, PromptContext, Workflow, Artifact) covering its definition, its domain rules/invariants, and its relationships to other entities. Where the documented model (an ADR) and the current implementation diverge (Profile), the divergence must be stated explicitly, not hidden.
- **Strategic classification**: an explicit split of Core domain vs Supporting domains vs Infrastructure/Adapters, each justified by reference to the governing ADRs.
- **Bounded contexts**: the six requested contexts (Change Management, Verification & Governance, Prompt Composition, Knowledge & Skills, Assistant Integration, Developer Experience), each with owned entities, responsibility, and relationships to the other contexts.
- **Risks of mixing contexts**: concrete risks grounded in the actual codebase (not generic DDD theory), each naming the specific boundary that could erode and how.
- **What does NOT belong to AIEF's core**: a list reframing README/VISION/architecture.md's "does not do" statements as domain boundaries.
- **Open questions for AIEF 1.x**: concrete, answerable questions surfaced by the research, not rhetorical ones.
- The document must read as product/conceptual architecture: illustrative code references are acceptable, exhaustive API documentation is not — that belongs in docs/architecture.md.
- No ADR is modified; no CLI behavior, folder, or existing document changes.

## Acceptance Criteria

- [x] `docs/domain-model.md` created with all sections above.
- [x] Every one of the 11 requested entities has its own subsection.
- [x] All six requested bounded contexts are defined with owned entities and relationships.
- [x] Core/Supporting/Infrastructure classification stated and justified.
- [x] Risks of mixing contexts section grounded in real findings (not generic).
- [x] "What does NOT belong to core" section present.
- [x] Open questions section present, with concrete (not rhetorical) questions.
- [x] No other file changed except this Change's own artifacts.
- [x] `npm test` still green (no executable file touched).
