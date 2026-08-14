# Specification

## Goal

Decide, with real repository evidence (not hypothetical token-panic reasoning), whether durable
knowledge should become a shared AIEF capability or remain a domain-specific, per-Skill
instruction — and act accordingly, at the smallest scope the verdict actually requires.

## Requirements

- R1. Inspect actual code (`cli.js`, `skill-context.js`, `architecture-definition.js`,
  `change-context.js`, `requirements-analysis-instructions.js`) — no inference from the Change
  0092 report alone.
- R2. Use this repository's own real `knowledge/decisions.md` (31 ADRs, 1437 lines) as concrete
  evidence for the "many irrelevant decisions" / "large ledger" scenarios — not a hypothetical.
- R3. Evaluate all six scenarios (A–F) against all three options, with a stated helpfulness/noise
  judgment for each — not skipped.
- R4. Apply the mission's own six-criterion Foundation Change Threshold explicitly; a shared fix
  is justified only if all six hold, not by preference.
- R5. If the verdict is A or C, make zero runtime code changes.
- R6. If the verdict is B, the fix must be: small, deterministic, repository-native, read-only,
  assistant-agnostic, dependency-free, raw-content-preferred over parsed/semantic — implemented in
  this same Change, with focused tests.
- R7. Explicitly answer the Data Definition gate question with a stated condition, not a bare
  yes/no.

## Acceptance Criteria

- [x] Durable knowledge model, prompt composition, and Skill Context are traced against actual
      source, cited by file/line.
- [x] All six scenarios (A–F) are recorded with a Shared-Context-Helpful / Noise-Risk / Explicit-
      Instruction-Enough judgment each.
- [x] The Foundation Change Threshold's six criteria are each explicitly answered true/false against
      real evidence.
- [x] A verdict (A/B/C) is recorded with justification tied to the threshold answers.
- [x] If B, implementation + tests + evidence are complete in this Change; if A/C, `git diff --stat`
      shows no runtime file changed.
- [x] `npm test` ≥ 940 pass, 0 fail; `aief verify` PASS; `git diff --check` clean.
- [x] The Data Definition gate question is answered with an explicit condition.
