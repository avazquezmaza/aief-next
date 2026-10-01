# Tasks

## Architectural & Invariant Analysis (R1)

- [x] Validate alignment with AIEF core principles (local-first, repository source of truth, recommendation never execution).
- [x] Verify compliance with AGENTS.md operational guardrails (zero secrets, air-gapped support).
- [x] Verify constraint on @aief/cli zero runtime dependencies.

## Integration Surfaces Evaluation (R2)

- [x] Analyze Surface 1: Requirement triage during `aief enrich` / `aief propose`.
- [x] Analyze Surface 2: Assistant decision tool via AIEF Skill / MCP Server.
- [x] Analyze Surface 3: Evidence semantic pre-linter before `aief verify`.

## Runtime & Execution Architecture (R3)

- [x] Evaluate Pattern A (CLI Subprocess), Pattern B (Local HTTP Service), and Pattern C (In-process Node ONNX).
- [x] Formulate recommended runtime coupling strategy.

## Decision Schema Specification (R4)

- [x] Map AIEF tracks and change types to Laya `choice` questions.
- [x] Map requirement clarity to a Laya `score` question.
- [x] Map security risks and evidence presence to Laya `noul` questions.

## Findings, Evidence & Roadmap (R5)

- [x] Document detailed findings and risks in `evidence.md`.
- [x] Populate Findings Status table in `evidence.md`.
- [x] Label Laya capability claims as fact/inference/assumption with sources.
- [x] Define follow-up implementation Change roadmap.
- [x] (human) Review findings, risks, and approve recommended follow-up Change.
