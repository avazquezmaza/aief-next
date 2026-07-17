# Change

## ID

`0039-type-track-derivation-design`

## Type

Analysis

## Objective

Design the **Type ↔ Track** transition: Track becomes the user-facing entry for depth of work; `## Type` stays internal and keeps its governance semantics (prompt composition, human-review gates, Enrichment).

**Design only. Nothing is implemented.** Full design: [design.md](design.md).

## Scope

### In scope

- Default derivation: Basic → General · Standard → General · Migration → Analysis.
- Enrichment is never derived; it is declared explicitly and keeps every human gate.
- Explicit override (`Track: Standard` + `Type: Enrichment`).
- Resolution order when Type is absent; loud failure on incoherence.
- One mandatory question for the new user.
- Compatibility with existing Changes; metadata migration; impact on `changeType()`, prompt composition and Enrichment gates.
- Valid-combination table; invalid cases; required tests; reversible strategy.

### Out of scope

- **Implementation.** No code, no tests written, no CLI change.
- Building Tracks (still gated by Stage 1 of the AIEF 2.0 roadmap).
- Deleting, renaming or consolidating anything.
- The AGENTS.md fix (Change 0040) and the DELETE review (Change 0041).
- Modifying OpenSpec or SpecBoot.

## Success Criteria

- A declared Type always wins; Track can never remove, weaken or hide a gate.
- Every existing Change resolves to exactly the Type it resolves to today.
- No metadata migration is required.
- The design is reversible by code revert alone, with no data to undo.
- Rules are validated against the real corpus, not against the documented model.

## Status

Open.
