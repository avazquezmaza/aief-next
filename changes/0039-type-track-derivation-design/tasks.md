# Tasks

## Design

- [x] Define Track and Type as distinct dimensions with distinct audiences.
- [x] Define the derivation and the resolution order.
- [x] Resolve "one question" (human declares Track; CLI writes Type).
- [x] Valid-combination table, including both legacy populations.
- [x] Invalid cases, each protecting a gate or a parser.
- [x] Impact: `changeType()`, prompt composition, Enrichment gates.
- [x] Compatibility, metadata migration, reversibility.
- [x] Required tests, including zero-drift regression.

## Verification against the real corpus

- [x] Confirm 12 of 40 Changes have no `## Type` and resolve to `""` today.
- [x] Enumerate every real `## Type` value — found free text, not an enum (Implementation, Documentation/…, prose suffixes).
- [x] Confirm `Type: Enrichment` has zero uses across 40 Changes.
- [x] Confirm zero Changes declare a `## Requirement Source` section, here or in the case study.
- [x] Correct I4 (non-fatal) after finding it would break Change 0036.
- [x] Correct I2's detector (heading-anchored) after finding it would trip on Change 0030's prose.

## Verification

- [x] `aief verify` passes on this Change.
- [x] Nothing implemented; no file deleted or renamed.
- [x] OpenSpec and SpecBoot untouched.

## Evidence

- [x] Update evidence.md.

## Human gates

- [ ] (human) Approve or amend the design.
- [ ] (human) Confirm I4 stays non-fatal.
- [ ] (review) Independent review before implementation.

## Deferred

- [-] Implementation — a separate Change, blocked on approval and on Stage 1 of the AIEF 2.0 roadmap.
