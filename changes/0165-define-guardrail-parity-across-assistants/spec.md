# Specification

## Goal

Turn guardrail parity across assistants into durable, human-approved decisions and implementation-ready prerequisites — without writing application code.

## Requirements

- R1: A capability matrix for Claude Code, Gemini CLI, Codex and Cursor covering pre-edit blocking
  hooks, edit input format, block signal, project config location, trust gate, shell bypass and
  project-level credential deny — each cell sourced (local docs/CLI or official docs) and versioned
  where verified.
- R2: Options with trade-offs and a Recommendation for each of D1–D5 (`change.md`).
- R3: Open Questions that need a real installation are marked `(deferred)` with what would resolve
  them.
- R4: Follow-up Changes named, with the first one implementable without further research.
- R5: No application code, CLI flag or hook is written in this Change.

## Acceptance Criteria

- [x] Context, Business/Product Constraints and Known Requirements are captured.
- [x] Open Questions are answered or explicitly deferred.
- [x] Every Decision Required has a Recommendation and an explicit human Decision.
- [x] Approved decisions are recorded in knowledge/decisions.md.
- [x] Implementation Prerequisites and Follow-up Changes are listed.
- [x] Evidence updated.
