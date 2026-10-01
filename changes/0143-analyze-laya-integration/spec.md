# Specification

## Goal

Provide a structured architectural assessment, runtime feasibility study, and integration design for incorporating Laya (non-autoregressive System 1 decision engine) into the AIEF engineering lifecycle without compromising AIEF's zero-runtime-dependency CLI or governance invariants.

## Requirements

### R1: Invariants & Architectural Alignment
Analyze Laya against AIEF core principles:
- Repository as single source of truth (no daemon or hidden state required for AIEF).
- Zero network calls on behalf of the user (air-gapped / local execution).
- Operational guardrail: No secrets in tracked files (Laya requires 0 API keys).
- Prime Directive: "AI assists. Humans decide." (Decisions remain recommendations; human gates remain strictly human).
- Core CLI runtime constraint: `@aief/cli` must retain 0 runtime dependencies.

### R2: Candidate Integration Surfaces
Evaluate three distinct touchpoints in the software lifecycle:
1. **Pre-Implementation Requirement Triage:** Classifying external requirement text during `aief enrich` / `aief propose` into Change metadata (`type`, `track`, `security_risk`).
2. **Assistant-Facing Fast Decision Tool:** Exposing Laya as an AIEF Skill (`.agents/skills/laya/`) or local MCP server tool (`laya[mcp]`) so primary LLMs (Claude, Gemini) can offload bulk binary/categorical decisions in ~30 ms without consuming context tokens.
3. **Pre-Verification Semantic Linter:** Pre-checking `evidence.md` against `spec.md` acceptance criteria using calibrated confidence scores (`min_confidence`) before `aief verify` / `aief close`.

### R3: Runtime & Deployment Architecture
Compare three deployment patterns:
- **Pattern A (CLI Subprocess Companion):** Standalone `laya` CLI invoked via child process from an opt-in script or provider.
- **Pattern B (Local HTTP Service):** `laya-serve` FastAPI daemon on `127.0.0.1:8000` consumed over standard HTTP `fetch()`.
- **Pattern C (In-Process ONNX in Node):** `laya-ts` using `@onnxruntime-node`.

### R4: Decision Schema Mapping
Define the mapping from AIEF domain objects to Laya's three primitives:
- `track`: `choice` (`lite`, `standard`, `governed`).
- `change_type`: `choice` (`general`, `fix`, `analysis`, `definition`, `documentation` — AIEF's actual Change types).
- `requirement_clarity`: `score` (`low`, `medium`, `high`).
- `is_security_sensitive`: `noul` (probability of security impact).
- `evidence_has_real_test_output`: `noul` (verification completeness check).

### R5: Findings & Roadmap
Formulate findings with severities in a living Findings Status table in `evidence.md`, identifying prerequisites for a follow-up implementation Change.

## Acceptance Criteria

- [x] R1: Invariant compatibility documented with no violations of AIEF core principles.
- [x] R2: Three candidate integration surfaces analyzed and compared (comparison table in `evidence.md`).
- [x] R3: Recommended runtime architecture selected (loose coupling preserving zero-dependency `@aief/cli` and the no-network engine principle; comparison table in `evidence.md`).
- [x] R4: Typed decision question schema defined for AIEF metadata.
- [x] R5: Findings Status table created in `evidence.md` with explicit IDs, severities, and statuses.
- [x] Laya capability claims are labeled `[H]`/`[I]`/`[S]` with their source (Claim Provenance in `evidence.md`).
- [x] (human) Review architectural analysis and approve follow-up implementation roadmap.
