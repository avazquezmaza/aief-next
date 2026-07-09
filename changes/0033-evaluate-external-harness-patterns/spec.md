# Specification

## Goal

A single architecture document records, pattern by pattern, what AIEF should adopt, adapt or reject from `betta-tech/harness-sdd` and `multica-ai/andrej-karpathy-skills` — with every adaptation gated on named evidence and every rejection anchored to an accepted ADR or product-identity boundary — so external inspiration enters AIEF deliberately (concepts, never copies) instead of by osmosis.

## Requirements

- **Document**: `docs/external-harness-patterns.md`, new file; no existing document modified.
- **Per-repo contribution summary**: harness-sdd (artifact-based communication, four-phase gate system, role separation, requirement traceability, CHECKPOINTS/init.sh, WIP gate, session state files, progressive disclosure) and karpathy-skills (the four principles: Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution; Claude-oriented distribution).
- **Compatible patterns** section: patterns AIEF already embodies (artifact-based communication; human approval gate; spec-before-code), framed as independent convergence, requiring no new work.
- **Adapt patterns** section: each with the concept to keep, the mechanism to discard, the AIEF-native landing place (Profiles per ADR-012; spec/evidence templates; closability-contract workstream; derived verify checks; AGENTS/Standards placement by knowledge dimension), and its evidence gate.
- **Reject patterns** section: agent runtime as core; Claude-specific dependency in core; session state files; "skills" naming for behavior rules — each tied to the ADR or boundary it violates (Prime Directive, AIEF-1.0-READINESS, ADR-004, ADR-009, ADR-012).
- **Risks of copying without validating**: at minimum ADR-008 violation, rejected-state reintroduction, dimension blur, assistant lock-in, autonomy creep, prompt bloat, fork maintenance, naming collisions.
- **Relationship coverage**: human-gated workflow, profiles, skills, standards, evidence, verification, governance — each addressed explicitly in the analysis.
- **Decision table** with exactly these columns: Fuente | Patrón | Adoptar | Adaptar | Rechazar | Razón | Evidencia requerida.
- **Expected decisions** confirmed explicitly: adopt artifact-based communication; adapt roles as profiles (not autonomous agents); adapt requirement→task→evidence traceability; adapt "think first, code second" into AGENTS/profiles/standards; reject agent runtime as core; reject Claude-specific core dependency.
- **Constraints**: no code; no folder moves; no CLI/test changes; AGENTS.md untouched; no files copied from external repos; no external dependencies; Change not closed automatically.

## Acceptance Criteria

- [x] `docs/external-harness-patterns.md` created with all required sections.
- [x] Decision table present with the seven required columns and one row per evaluated pattern (15 rows).
- [x] Each "adaptar" row names concrete required evidence; each "rechazar" row names the ADR/boundary protected.
- [x] The six expected decisions are explicitly confirmed (§7 of the document).
- [x] All seven relationship dimensions (human-gated workflow, profiles, skills, standards, evidence, verification, governance) addressed.
- [x] No file copied from external repos; no dependency added; AGENTS.md, CLI, tests and folder structure untouched.
- [x] `aief verify` PASS.
- [x] Tests not run/not required: no executable file changed (documentation only).
