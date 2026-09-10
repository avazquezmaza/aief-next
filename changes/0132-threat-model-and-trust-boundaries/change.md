# Change

## ID

`0132-threat-model-and-trust-boundaries`

## Type

General

## Objective

`SECURITY.md` is 19 lines: how to report a vulnerability and a bare list of in-scope categories.
It names no trust boundaries, no threat categories, and no mitigations — even though this
project already has real, consistent security-relevant discipline scattered across code
comments, ADRs, and Skills content: path-traversal containment on every surface that resolves a
user- or external-supplied path (`isPathWithin`/`isReallyWithin`, Changes 0074/0105), Skills
instructing an assistant to treat project content as untrusted data rather than instructions,
Hooks structurally forbidden from writing files/executing commands/reaching the network
(ADR-019/020's `FORBIDDEN_CAPABILITIES`), and an explicit execution boundary (ADR-021: AIEF
Core never executes a test, a command, or reaches the network on the user's behalf).

This Change consolidates what already exists into one document — `docs/security-model.md` — so
a reader (or a future contributor) has one place naming AIEF's trust boundaries, instead of
having to reconstruct them from scattered comments and six separate ADRs.

## Scope

### In scope

- New `docs/security-model.md`: trust zones (reusing `docs/architecture.md`'s existing "System
  context" four-zone model), a trust-boundary table (what crosses each boundary, what's
  trusted/untrusted, what enforces it), the assets AIEF's own controls protect, a threat
  category → existing mitigation mapping (grounded in real code/ADRs, not invented), and an
  explicit "known gaps / accepted risk" section naming what is not yet covered (supply-chain
  hardening, no sandboxing of assistant execution by design).
- `SECURITY.md`: one added line pointing to the new document (its own scope — "how to report" —
  stays unchanged).
- `README.md`'s documentation table: one added row.

### Out of scope

- Any new code, control, or enforcement mechanism — this Change is documentation only,
  consolidating controls that already exist.
- Supply-chain hardening (CodeQL, dependency review, secret scanning, SBOM) — named as a known
  gap in the new document, not implemented here; a separate, later Change per this project's own
  backlog ordering.
- Rewriting or superseding any ADR — the new document cites and links existing ADRs, it does not
  restate or duplicate their decision text.

## Success Criteria

- `docs/security-model.md` exists, names every trust boundary already implicit in
  Skills/Hooks/ADR-019/020/021/AGENTS.md, and every claim in it is traceable to real code, a
  real ADR, or real AGENTS.md text — not invented.
- `SECURITY.md` and `README.md` link to it.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0132-threat-model-and-trust-boundaries --strict`, and `git diff --check` all pass (no application code touched — these commands should be unaffected by a docs-only Change).

## Status

Closed (2026-09-10)
