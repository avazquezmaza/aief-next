# Change

## ID

`0092-validate-architecture-definition-skill-on-realistic-projects`

## Type

General

## Objective

Validate the `architecture-definition` Skill (Change 0091) against realistic, imperfect
Definition-stage projects — partial requirements, contradictions, weak signals, existing approved
decisions, existing unresolved decisions, mixed context across files, irrelevant historical
knowledge, deferred concerns, and previously-resolved ambiguity — before any decision to
generalize the expert-skill pattern to a second domain (Security/Data/Integration/NFR).

This is primarily a **validation and adversarial review Change**, not a feature-expansion Change.
No new expert skill, graph infrastructure, approval mechanism, or Definition redesign is in scope.
Any code change is permitted only for a demonstrated **real defect**, fixed at the smallest
coherent scope.

## Scope

### In scope

- Ten disposable validation scenarios (A–J, per this Change's own `spec.md`), run against real
  `aief` CLI invocations and/or the `architecture-definition`/`skill-context` modules directly,
  covering: incomplete PRD, contradictory requirements, an existing approved architecture
  decision, an existing unresolved decision, an approved decision plus a new related concern, weak
  architecture signals, context mixed across files, irrelevant historical knowledge, a deferred
  concern, and a previously-resolved ambiguity.
- An adversarial review of the fixed-keyword applicability mechanism (false positives/negatives,
  scaffold-header leakage, case sensitivity, negative statements, generic words).
- A defect classification for every issue found (`REAL DEFECT` / `DESIGN LIMITATION` /
  `EXPECTED BEHAVIOR` / `DOCUMENTATION GAP` / `TEST GAP` / `OVERENGINEERING TO FIX`) — only a
  `REAL DEFECT` gets a code fix, at the smallest coherent scope, with a regression test.
- A generalization verdict (A/B/C/D per this Change's own report) and, if applicable, a
  recommendation for the second expert Definition domain — **not implemented in this Change**.

### Out of scope

- Security/Data/Integration/NFR Definition Skills.
- Any new graph, decision store, approval engine, lifecycle, state machine, applicability DSL, or
  LLM-based classification.
- Broadening the Skills Runtime or Skill Context beyond the smallest fix a real, demonstrated
  defect requires.
- The optional Definition-vs-Analysis maturity diagram (prior review's own open item) — only
  re-evaluated here if a scenario makes it directly relevant; not built in this Change either way.

## Success Criteria

- Every scenario in `spec.md` is actually run (not simulated in prose) against a real fixture or
  scratch project, with recorded input state, Skill Context/applicability result, and output.
- Every finding is classified; only `REAL DEFECT` findings receive a fix, each with a reproduction,
  a regression test, and a rerun of the affected scenario.
- The proven architecture (Definition → definitionEnrichment → Skill Context →
  architecture-definition → assistant reasoning → existing sections → human decision →
  knowledge/decisions.md → prerequisites) is unchanged unless a real defect proves it insufficient.
- `npm test` ≥ 932 pass, 0 fail; `aief verify` PASS; `git diff --check` clean.
- A final generalization verdict (A/B/C/D) is recorded, with a second-domain recommendation only
  if the verdict is A or B.

## Status

Closed (2026-08-14)
