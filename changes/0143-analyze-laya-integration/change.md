# Change

## ID

`0143-analyze-laya-integration`

## Type

Analysis

## Objective

Analyze and validate the architectural, technical, and operational integration of Laya (non-autoregressive System 1 decision engine) within the AIEF workflow and governance engine.

## Scope

### In scope

- Review AIEF architectural invariants (`docs/architecture.md`, `AGENTS.md`) regarding local execution, zero-network, zero-secrets, and "recommendation, never execution".
- Evaluate candidate touchpoints in the AIEF lifecycle:
  - Requirement triage and metadata enrichment in `aief enrich` and `aief propose`.
  - Assistant-level decision delegator via AIEF Skills or MCP server (`laya[mcp]`).
  - Pre-verification semantic linter for `evidence.md` and acceptance criteria.
- Evaluate execution runtimes:
  - Loosely coupled companion CLI / script.
  - In-process TypeScript / ONNX Runtime (`laya-ts`).
  - Local HTTP microservice (`laya-serve`).
- Map AIEF governance concepts (`track`, `change_type`, `[H]/[I]/[S]` facts/inferences/assumptions) to Laya's typed question primitives (`choice`, `score`, `noul`).
- Identify technical risks, latency expectations, hardware prerequisites, and governance boundaries.
- Produce a living Findings Status table and recommend follow-up implementation Changes.

### Out of scope

- Modifying `@aief/cli` production code or introducing runtime dependencies to `cli/package.json`.
- Implementing application or neural network code in this repository.
- Auto-approving governance gates or modifying human-decision policies.

## Success Criteria

- Architectural fit and invariants are documented and validated.
- Integration patterns are evaluated with concrete trade-offs and a recommended path.
- Decision question schema for AIEF metadata is specified.
- Risks and mitigations are recorded.
- Living Findings Status table established in `evidence.md`.
- Strict verification (`node cli/bin/aief.js verify --change 0143-analyze-laya-integration --strict`) passes.

## Status

Closed (2026-10-01)
