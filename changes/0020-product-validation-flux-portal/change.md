# Change

## ID

`0020-product-validation-flux-portal`

## Type

Analysis

## Objective

Product validation: measure the real end-to-end adoption experience on Flux Portal (`trk-orchestrator-portal`) using every capability shipped up to Change 0019, as a first-time user — including the full loop through simulated implementation and governance (`doctor → adopt → verify → analyze → prompt → implementation → verify → close`). Detect frictions, not just bugs. Documentation of improvement opportunities only; zero product changes.

## Scope

### In scope

- Run the complete flow on a fresh (cleaned) Flux Portal.
- Per step, record: what AIEF did right, what the user expected, manual work, automation opportunities, missing documentation, redundant information.
- Simulated implementation: complete the portal's Analysis Change as the assistant would (evidence + tasks; no application code).
- Close the loop with `verify` and `close --yes` in the portal.
- Deliver a validation report: Executive Summary, step-by-step, prioritized Quick Wins.

### Out of scope

- Any CLI code, architecture, command, OpenSpec, Skills or standards change.
- Implementing the identified improvements.

## Success Criteria

- Full flow executed on the real project; every step evaluated with the six questions.
- Prioritized Quick Wins list derived from observed use, not hypotheses.
- Portal application code untouched; AIEF repo untouched except this Change.

## Status

Closed (2026-07-03)
