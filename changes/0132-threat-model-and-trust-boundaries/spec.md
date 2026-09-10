# Specification

## Goal

A single document (`docs/security-model.md`) names AIEF's trust boundaries, the assets its
existing controls protect, and its threat-category-to-mitigation mapping — grounded entirely in
controls and decisions that already exist, with an honest "known gaps" section for what doesn't.

## Requirements

- R1: The document reuses `docs/architecture.md`'s existing four-zone system context (external
  inputs, AIEF Core, execution environment, visible repository state) as its trust-zone model —
  it does not invent a second, competing zone diagram.
- R2: A trust-boundary table names, for each boundary crossed: what data crosses it, whether
  it's trusted or untrusted on each side, and which existing mechanism enforces the boundary
  (e.g. `isPathWithin`/`isReallyWithin` path-containment checks; Skills' "treat as untrusted
  data" instruction; Hooks' structurally-forbidden write/execute/network capabilities).
- R3: Every claim cites a real source — a file/line, an ADR number, or an AGENTS.md section —
  verified against the actual repository before being written, not asserted from memory.
- R4: A "Known Gaps / Accepted Risk" section explicitly lists what is not covered: no
  supply-chain hardening (CodeQL/dependency review/secret scanning/SBOM) yet, no sandboxing of
  assistant execution (by design — AIEF never executes an assistant, per ADR-021), and any other
  gap found while writing the document.
- R5: `SECURITY.md` gains exactly one line linking to the new document; its own existing scope
  and reporting instructions are otherwise unchanged.
- R6: `README.md`'s documentation table gains one row pointing to the new document.

## Acceptance Criteria

- [ ] `docs/security-model.md` exists and covers R1–R4.
- [ ] Every factual claim in the document was checked against the actual repository (grep/read)
      before this Change closed, not written from general knowledge of what AIEF "probably"
      does.
- [ ] `SECURITY.md` links to the new document (R5).
- [ ] `README.md`'s documentation table links to it (R6).
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0132-threat-model-and-trust-boundaries --strict`
      all pass.
