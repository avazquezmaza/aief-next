# Tasks

## Design

- [x] Define Depth and Type as distinct dimensions with distinct audiences.
- [x] Define the derivation and the resolution order.
- [x] Resolve "one question" (human declares Depth; CLI writes Type).
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

- [x] (human) Approve or amend the design. **Approved, as amended, 2026-09-01**: renamed "Track" →
      **Depth** throughout this Change (`change.md`, `spec.md`, `design.md`, `tasks.md`) before
      approval — the Workflow Engine (ADR-016 onward, shipped after this design was drafted)
      independently claimed `manifest.track` (`lite`/`standard`/`governed`) for stage/gate
      progression, a different purpose than this design's own concept (`Basic`/`Standard`/
      `Migration`, deriving `## Type`). Same word, two unrelated concepts, overlapping vocabulary
      (`Standard` in both) — flagged and fixed before sign-off, not shipped as a collision. The
      rest of the design (derivation table, resolution order, invalid cases) is approved unchanged.
- [x] (human) Confirm I4 stays non-fatal. **Confirmed 2026-09-01**, re-validated against the
      current corpus (not just the design's original 2026-07-17 numbers): `for f in changes/*/change.md;
      do sed -n '/^## Type/,+2p' "$f" | sed -n '3p'; done | sort | uniq -c` shows **~10 non-standard
      Type tokens today** (incl. 3× `Implementation`, one of them Change 0036) across a ~94-Change
      corpus — up from the 5-of-40 the design originally cited. A strict "unknown Type ⇒ error"
      rule would break twice as many real, already-closed Changes today as when this was designed.
      I4 stays non-fatal.
- [x] (review) Independent review before implementation. **Rule deliberately relaxed by the
      project owner, 2026-09-01** — not silently passed. This gate asked for the same discipline
      as Change 0042 (a reviewer distinct from whoever approved the work), and no such reviewer
      exists on this single-maintainer project. Walked the review checklist below with the
      project owner directly (§1 derivation-table/backward-compat/I4 claims, §2 the now-stale
      §5 caller list, §3 the unvalidated-in-production Enrichment gate) and the project owner —
      the same person who approved the rename — explicitly chose to accept their own
      confirmation over leaving the gate open indefinitely or blocking on an external reviewer
      that does not exist. Recorded here as what it is: a relaxation, not an independent review.

      **Checklist walked:**
      1. §3 "a declared Type always wins" — confirmed no row in the 14-combination table lets
         Depth override an explicit Type.
      2. §2 step 3 "both absent → `\"\"`" — confirmed the 12 legacy Changes (0001–0012) keep
         today's exact behavior.
      3. §4 I4 non-fatal — confirmed reasonable given ~10 non-standard tokens across ~94 Changes
         today, including the already-accepted Change 0036.
      4. evidence.md's caller-list addendum — confirmed as a non-blocking note for the
         implementation Change, not a design defect.
      5. §12's "Enrichment gate unvalidated in production" risk — confirmed accepted knowingly:
         tests 6–8 remain the only evidence at implementation time, not proof today.

## Deferred

- [-] Implementation — a separate Change, blocked on approval and on Stage 1 of the AIEF 2.0 roadmap.
