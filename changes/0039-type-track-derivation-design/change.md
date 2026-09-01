# Change

## ID

`0039-type-track-derivation-design`

## Type

Analysis

## Objective

Design the **Type ↔ Depth** transition: Depth becomes the user-facing entry point for how deep a Change's work is; `## Type` stays internal and keeps its governance semantics (prompt composition, human-review gates, Enrichment).

**Naming note (2026-09-01):** this Change originally called this dimension "Track." Renamed to **Depth** before approval — the Workflow Engine ([ADR-016](../../knowledge/decisions.md) onward, shipped after this design was drafted) independently claimed `manifest.track` (`lite`/`standard`/`governed`) for a different purpose (stage/gate progression). Same word, two unrelated concepts, overlapping vocabulary (`standard` in both) — exactly the "two classification axes" collision this project's own ADRs warn against elsewhere. "Depth" is free across the repository; "Track" now refers exclusively to the Workflow Engine.

**Design only. Nothing is implemented.** Full design: [design.md](design.md).

## Scope

### In scope

- Default derivation: Basic → General · Standard → General · Migration → Analysis.
- Enrichment is never derived; it is declared explicitly and keeps every human gate.
- Explicit override (`Depth: Standard` + `Type: Enrichment`).
- Resolution order when Type is absent; loud failure on incoherence.
- One mandatory question for the new user.
- Compatibility with existing Changes; metadata migration; impact on `changeType()`, prompt composition and Enrichment gates.
- Valid-combination table; invalid cases; required tests; reversible strategy.

### Out of scope

- **Implementation.** No code, no tests written, no CLI change.
- Building Depth handling (still gated by Stage 1 of the AIEF 2.0 roadmap).
- Deleting, renaming or consolidating anything.
- The AGENTS.md fix (Change 0040) and the DELETE review (Change 0041).
- Modifying OpenSpec or SpecBoot.

## Success Criteria

- A declared Type always wins; Depth can never remove, weaken or hide a gate.
- Every existing Change resolves to exactly the Type it resolves to today.
- No metadata migration is required.
- The design is reversible by code revert alone, with no data to undo.
- Rules are validated against the real corpus, not against the documented model.

## Status

Open.
