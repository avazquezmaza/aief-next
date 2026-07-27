# Proposal — Entrega 2: Workflow Engine

## Problem

[Entrega 1](../0043-core3-change-foundation/) shipped an optional `manifest.json` per Change, but
today it does almost nothing: a manifest can only declare `schema`, `id`, `slug`, `title`, and
`status` (`open`/`closed`). Its `track` field is accepted and stored (lowercased into `.type`),
but nothing reads it as policy — there are no tracks, no gates, no transitions, no `next_action`.
Only `aief status` consults the manifest at all; `aief verify`'s rules and `aief close`'s readiness
gate are deliberately blind to it (design.md §9 of Change 0043, reaffirmed after review finding
B1). Separately, an invalid-but-present manifest is invisible to every command (finding H2) — a
gap that becomes load-bearing the moment a workflow engine needs `track` to be *correct*, not just
present, to make a `blocking: true/false` decision.

`docs/aief-core-3-claude-code-prompt.md` §8–§10 describes what should fill the workflow gap: a
declarative engine with three tracks (Lite/Standard/Governed), gates, transition validation, and a
`next_action`. This proposal is written against **the manifest and loader that actually shipped**,
not the richer example in the vision document (whose sample manifest includes a `gates` block with
per-stage state and an `execution`/`sdd` section Entrega 1 never validates).

## Context after Entrega 1 (real, not assumed)

- `loadChangeUnified(changeDir)` ([cli/src/core/domain/change-loader.js](../../cli/src/core/domain/change-loader.js))
  is the one Change-loading entry point with two branches: legacy (wraps `loadChange()`) and
  manifest (`loadManifestChange()`), selected purely by `manifest.json`'s presence.
- Only `cli.js`'s `isClosed()` — and, through it, `openChangeDirs()`/`status()` — reads through the
  unified loader. `verify`'s rules and `close`'s readiness gate (`checkChangeReadiness()`,
  `verifyProject()`) still call `loadChange()` directly and know nothing about manifests. `close`'s
  write-verification reads `change.md` directly, by design, after review finding B1.
- The manifest schema Entrega 1 actually validates: `schema` (must equal `"aief.change/v1"`),
  `id`, `slug`, `title`, `status` (`"open"` \| `"closed"`) — required. `track` and everything else
  from the vision document's example (`sdd`, `context`, `evidence`, `next_action`, `gates`,
  `risks`) are accepted and stored unvalidated, per `spec.md` R3 of Change 0043.
- `manifestError` exists on the loader's return value for a present-but-invalid manifest, but no
  command reads it (finding H2) — a broken manifest today looks identical, in `aief status`, to a
  healthy open Change.
- 149 tests pass; zero Changes in this repository carry a `manifest.json`.
- **ADR-016 (this Change, proposed alongside this document)** resolves the ADR-013 question: a new
  ADR, not a silent extension, because a gate evaluator produces active `blocking` verdicts even
  before Entrega 2 wires anything to enforce them.

## Objective

Give a Change's `track` field real meaning — Lite, Standard, or Governed — by:

1. Hardening manifest loading so a present-but-invalid manifest is always visible and never
   silently treated as legacy or absent (H2, promoted to a prerequisite inside this Entrega's own
   scope, per explicit instruction).
2. Loading a declarative, versioned definition per track and evaluating it against a Change's real
   state (via `loadChangeUnified()` — no second loader) to produce structured gate results,
   blockers, warnings, and a derived `next_action`.
3. Narrating all of this through `aief status` only. No new command, no enforcement wired into
   `verify`/`close` yet.

## Scope

- **H2 hardening** (prerequisite, see spec.md WF-R1–WF-R4): `status` visibly distinguishes three
  cases per Change — no manifest (legacy, unchanged), valid manifest (unchanged), and
  present-but-invalid manifest (new: reported with actionable errors, never merged into "Open
  Changes"). No silent fallback to legacy inference when a manifest exists but is broken.
- **M1 identity policy** (non-blocking, see design.md): directory basename stays the sole canonical
  identity for selection (`matchChanges`); a manifest's `id`/`slug` disagreeing with it becomes a
  non-blocking warning, never an error, never auto-corrected.
- **Workflow definitions**: one JSON file per track (`lite`, `standard`, `governed`) under
  `cli/src/workflows/`, each an ordered list of stages and the gates that apply at each, validated
  by a hand-rolled validator (same approach as `change-manifest.js`, no new dependency).
- **`track` as its own field**, distinct from `.type` (resolves proposal's former blocking question
  3 — see design.md).
- **Gate evaluator**: wraps existing readiness rules (`checkChangeReadiness()`) as one structural
  gate; represents not-yet-built gates (`review`, `approval`, `security_review`) honestly as
  `status: "pending"`, never fabricated as passed.
- **`next_action` resolver**: derived from track + gate results on every invocation; never
  authoritative from a stored value.
- **`status` integration**: a new, additive block shown only for a Change whose manifest declares a
  recognized `track` — invisible otherwise, preserving the existing byte-identical guarantee for
  every Change without one (all of them, today).
- Unit and integration tests, including the 20 scenarios enumerated by the commissioning request
  and a zero-drift regression.

## Out of Scope

- `aief work`, `aief review`, `aief close` becoming gate-*enforcing* — reserved for later,
  explicitly-approved Changes (Entregas 4/7/8 per the vision document's sequencing). This Entrega's
  engine only narrates through `status`.
- Hooks (Entrega 5), the SDD Provider interface (Entrega 3).
- Implementing `review`, `approval`, or `security_review` themselves — represented as pending
  capabilities only.
- Any new command or flag (ADR-015 still in effect; Change 0042 not consolidated).
- Automatic manifest migration or auto-correction of `id`/`slug` mismatches (M1) — detection only.
- L1–L3 (Change 0043's low-severity debt) — out of scope unless required to implement H2 or the
  engine correctly (see design.md for the one exception: L3's unguarded `readFileSync` is folded
  into H2's hardening because both touch the same code path).

## Compatibility

- **Legacy Changes (no manifest):** entirely untouched — the Workflow Engine has nothing to attach
  to; `status` output identical to today.
- **Entrega-1-era manifests (no `track`):** Workflow Engine does not activate; `status` output
  identical to today. This is a compatibility decision, not silence — see design.md.
- **`close`:** unchanged. Still writes and verifies only `change.md`, per Change 0043's B1 fix.
  Nothing in this Entrega adds a second thing `close` must agree with.
- **`aief status`'s existing output:** byte-identical for every Change without a recognized `track`
  (100% of this repository's Changes) — re-proven with the same before/after diff technique
  Change 0043 used. New output only appears for a Change that has a `track`; none exist yet.

## Risks

1. **ADR-016 (proposed here) might not be accepted as written** — its "not yet a completed merge"
   consequence (see the ADR) commits a future Change to retiring `status()`'s/`close()`'s ad hoc
   narration logic. If the project owner disagrees with that framing, spec.md/design.md need to be
   revisited before implementation.
2. **H2's hardening changes `status`'s output** (new section for invalid manifests) — mitigated by
   making the new section conditional on a case that occurs zero times in this repository today,
   preserving the byte-identical guarantee for everything that exists now.
3. **Gate evaluator honesty is easy to violate under schedule pressure** — a `review` gate reported
   as `"passed"` because "nobody's using it yet" would be exactly the kind of silent lie ADR-016
   and this repository's `verify` philosophy (Change 0043 design.md §7, "never guess") forbid.
   Mitigated by making "pending, never fabricated" an explicit, tested requirement (spec.md).
4. **Track vs. `.type` conflation**, if not kept separate, would recreate at the code level the
   exact "two classification axes" collision ADR-013 already flags at the product level (Track vs.
   `## Type`). Resolved in design.md: `track` is its own field on the loaded Change; `.type` is
   untouched.

## Alternatives Considered

See ADR-016 "Alternatives considered" for the state-model alternatives (event sourcing, full
manifest-as-cache). At the proposal level, one further alternative: **build the gate evaluator
directly into `checkChangeReadiness()`** rather than as a separate module reusing it. Rejected —
`checkChangeReadiness()` is `close`'s own readiness gate, used today independent of any manifest;
folding workflow/track logic into it would make `close`'s behavior implicitly depend on the
Workflow Engine before this Entrega intends to wire that dependency, and would violate the "small,
verifiable, one thing at a time" discipline that Change 0043's review established.

## Success Criteria

See "Success Criteria" in [change.md](change.md).
