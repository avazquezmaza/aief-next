# Specification — Entrega 2: Workflow Engine

## Goal

`aief status`, for a Change whose manifest declares a recognized `track`, can state its current
workflow stage, which gates apply, which are satisfied, what blocks or warns, and the derived next
action — computed fresh every time from the Change's own files and its track definition, never
from a cached or manually-written answer. Every other Change (no manifest, or a manifest without a
`track`) is completely unaffected. A manifest that exists but is invalid is always visible, never
silently treated as absent or legacy.

## Requirements

### Manifest hardening (H2 — prerequisite)

- **WF-R1 — Three distinct manifest states, always distinguishable.** For any Change directory,
  exactly one holds: (a) no `manifest.json` — legacy path, unaffected; (b) `manifest.json` present
  and valid — manifest path, as Entrega 1 shipped it; (c) `manifest.json` present and invalid
  (malformed JSON or failing `validateManifest()`) — a new, first-class state that must never be
  reported identically to (a) or (b) by any command this Entrega touches.
- **WF-R2 — No silent fallback.** A Change in state (c) is never treated as if it were state (a).
  `loadChangeUnified()` already returns `source: "manifest"` with `manifestError` populated for
  this case (Entrega 1) — WF-R1's requirement is that a *command* (starting with `status`) surfaces
  this distinction, not just the loader.
- **WF-R3 — Actionable, consistent errors.** `status`'s reporting of state (c) names the file
  (`manifest.json`), the Change, and reuses the exact `manifestError` entries `change-manifest.js`
  already produces (field + reason) — no new error vocabulary invented at the `status` layer.
- **WF-R4 — No auto-repair.** Detecting an invalid manifest never rewrites it, never deletes it,
  never falls back to inferring a legacy `## Type`/`## Status` in its place. The Change remains in
  state (c) until a human edits the file.

### Workflow definitions and loading

- **WF-R5 — One declarative definition per track.** Exactly three tracks are defined at this
  Entrega: `lite`, `standard`, `governed`. Each is a versioned file, not inline code, not inline in
  `manifest.json`.
- **WF-R6 — Structural validation.** A workflow definition is validated before use (required
  fields: `schema`, `track`, ordered `stages` list, each stage's `gateIds`, and a `transitions`
  edge list) with the same "actionable, one error per problem" discipline `change-manifest.js`
  established. An invalid *definition* (a bug in AIEF's own shipped files, not a user's manifest)
  is a loud internal error, not a silently-skipped track. **Added during implementation**: the
  explicit `transitions: [{from, to}]` array (not fully specified in the original design sketch),
  needed to make "a transition to a nonexistent stage is rejected" concretely checkable, as the
  commissioning instruction required — validated by cross-referencing every `from`/`to` against the
  declared `stages` ids.
- **WF-R7 — Unknown track is rejected, not guessed.** A manifest declaring `track: "custom"` (or
  any value outside `lite`/`standard`/`governed`) produces an explicit, visible error — never
  silently defaults to any of the three, never silently ignored.

### State, transitions, gates

- **WF-R8 — Gate result contract.** Every gate evaluation produces
  `{ id, status: "passed"|"failed"|"pending"|"warning"|"not_applicable", blocking, reason, evidence }`.
  `status` is never invented — `"passed"` requires an observable, checked fact; a gate with no
  evaluator built yet (`review`, `approval`, `security_review` in this Entrega) is always
  `"pending"`, never `"passed"`.
- **WF-R9 — Structural gates reuse existing rules.** The engine does not reimplement readiness
  checks — it wraps `checkChangeReadiness()`'s existing output as one gate (`id: "readiness"`).
  Passing/failing this gate is byte-for-byte the same condition `close` already refuses/accepts on
  today.
- **WF-R10 — Blockers vs. warnings are structurally distinct.** A gate's `blocking` field, not its
  `status`, determines whether it prevents a transition. `status: "warning"` gates (e.g. a
  manifest/`change.md` status disagreement, or an M1 identity mismatch) never set `blocking: true`.
  A caller must be able to compute "can this transition proceed" from `blocking` fields alone,
  without inspecting `status` strings.
- **WF-R11 — Transitions are evaluated, never executed, in this Entrega.** The engine can answer
  "is transition X legal for this Change right now," but nothing in this Entrega calls it to
  actually perform a transition — no command's behavior changes except `status`'s narration.
- **WF-R12 — No model decides a transition.** Every input to gate/transition evaluation is a
  filesystem fact (file presence/emptiness, evidence classification, open-task count) or a
  structural manifest field. No AI assistant, model, or heuristic judgment is consulted.

### `next_action`

- **WF-R13 — Derived, not authoritative from storage.** `next_action` is computed from
  `{track, current stage, gate results}` on every invocation. If `manifest.json` ever carries a
  written `next_action` (accepted, unused field since Entrega 1), it is displayed alongside the
  derived value as a hint, and a disagreement between the two is reported as a warning — the
  derived value is what any decision is based on, never the stored one.
- **WF-R14 — Honest incompleteness.** For Standard/Governed tracks, `next_action` may resolve to a
  gate this Entrega cannot itself satisfy (`review`, `approval`, `security_review`) — the response
  states this plainly ("next: review — no automated evaluator yet; a human must confirm manually"),
  never omits it, never substitutes `close`.

### `status` integration

- **WF-R15 — Additive only.** The Workflow Engine's output in `status` is a new block, shown only
  for a Change whose manifest declares a recognized `track`. For every Change without one (100% of
  this repository today), `status`'s output is unchanged — proven the same way Entrega 1 proved it
  (byte-identical diff of real `status` output, before and after).
- **WF-R16 — `status --json`/`--verbose`.** Not introduced by this Entrega (no new flag; existing
  `status` has none today) — deferred to whichever later Entrega actually needs machine-readable
  output. Flagged here only so it is not silently assumed in design.md.

### Legacy and manifest compatibility

- **WF-R17 — Legacy Changes are untouched.** A Change with no `manifest.json` is invisible to every
  requirement above except WF-R1(a)'s classification itself.
- **WF-R18 — Entrega-1-era manifests are untouched.** A Change with a valid manifest but no `track`
  field is invisible to the Workflow Engine (WF-R5–WF-R14 do not apply); `status` output for it is
  unchanged from Entrega 1.
- **WF-R19 — `change.md`/manifest inconsistency detection.** When a Change has both a manifest and
  a `change.md` whose own `## Status` disagrees with `manifest.status`, this is surfaced as a
  `warning`-severity gate result (`blocking: false`) — informational, matching the manifest's
  existing precedence (Change 0043 R1: the manifest still wins outright; this requirement only adds
  *visibility* of the disagreement, it does not change which value governs).
- **WF-R20 — `close` cannot reproduce B1.** `close`'s write (`markClosed()`) and its
  write-verification continue to read and write only `change.md`, exactly as fixed in Change 0043.
  No code path introduced by this Entrega gives `close` a second thing to agree with.

### Identity (M1)

- **WF-R21 — Directory basename is the sole canonical identity.** Change selection
  (`matchChanges`/`getChangeDirs`) is unchanged by this Entrega.
- **WF-R22 — Manifest identity mismatch is a non-blocking warning.** If `manifest.id` or
  `manifest.slug` disagrees with the directory's own id/slug, this is reported as a `warning`
  gate result, never an error, never auto-corrected, never blocking.
  **Implementation note (recorded, not silent):** the directory basename is parsed with a
  self-contained `/^(\d+)-(.+)$/` regex inside `gate-evaluator.js`, not by importing
  `nextChangeId()`/`slugify()` from `cli.js` — those are private to the command layer, and `core/`
  modules must not depend on it (the dependency runs the other way). The regex encodes the same
  `<digits>-<slug>` convention those functions already assume; `id` comparison additionally
  tolerates numeric padding differences (`"1"` vs `"0001"`).

### Determinism and no hidden state

- **WF-R23 — Pure function of files.** Every gate result, blocker, warning, and `next_action` is
  reproducible: the same Change directory, read twice with nothing changed on disk, produces
  identical output both times, from any process, without consulting any cache.
- **WF-R24 — No new persisted state.** No file is written by anything in this Entrega beyond what
  Entrega 1 already writes (`close` writing `change.md`). No `.aief/` directory, no database, no
  transition log (ADR-016; ADR-009).

## Acceptance Criteria

- [x] WF-R1–R4 (H2 hardening): `cli.test.js` — malformed manifest, structurally-invalid manifest,
      no-silent-fallback (still in Open Changes too), and a control test proving valid/absent
      manifests never trigger the new section. `change-loader.test.js` — L3's directory-shaped
      manifest regression.
- [x] WF-R5–R7 (workflow definitions): `workflow-definition.test.js` — all three real definitions
      load; unknown track rejected (`loadWorkflowDefinition`); 8 dedicated structural-rejection
      tests (missing fields, bad track, mismatched filename/track, undeclared-stage transitions,
      malformed gate ids, duplicate stage ids, malformed stage ids).
- [x] WF-R8–R12 (gates/transitions): `gate-evaluator.test.js` — contract shape asserted per gate;
      `review`/`approval`/`security_review` asserted `"pending"`, explicitly asserted `!= "passed"`
      in the Governed fixture test. `transition-engine.test.js` — a failing blocking gate prevents
      `resolveState()` from reaching `"close"` and `isTransitionLegal()` rejects the edge; a
      warning-only gate blocks neither.
- [x] WF-R13–R14 (`next_action`): `manifest.next_action`-as-hint comparison implemented
      (`withNextActionHint()` in `transition-engine.js`) and tested (agreement/disagreement/absent
      cases) — added during the independent review after being initially deferred; see
      `evidence.md`'s "Adversarial review" section. `transition-engine.test.js` — one fixture per track (Lite
      pass/fail, Standard, Governed); Standard/Governed assert the honest-incompleteness message
      and `nextAction !== "close"`. `manifest.next_action`-as-hint comparison itself: **not
      implemented** — see tasks.md §9, deferred with reasoning.
- [x] WF-R15 (additive `status`): `aief status` before/after diff across every stage (Etapas A–F)
      — byte-identical every time, confirmed live, not only by test.
- [x] WF-R17–R20 (compatibility): `change-loader.test.js`'s zero-drift regression re-passed across
      all real Changes; `cli.test.js`'s new B1-extension test — `close --yes` on a Governed Change
      with a permanently-blocking `approval` gate still succeeds, `manifest.json` byte-unchanged.
- [x] WF-R21–R22 (M1): `gate-evaluator.test.js` — matching id/slug → `passed`; mismatched slug →
      `warning`, `blocking: false`; `cli.test.js` end-to-end confirms the warning appears without
      blocking `Stage: close`.
- [x] WF-R23–R24 (determinism/no hidden state): `transition-engine.test.js` — same inputs produce
      deep-equal `resolveState()` output; `git status --porcelain` checked clean after every stage
      (Etapas A–F), not only once at the end.
- [x] `npm test` (from `cli/`) passes: 195/195. Every pre-existing assertion that changed is named
      in tasks.md §10 with the requirement that justified it (design.md §7's `track`/`.type`
      split); no other pre-existing assertion was touched.
- [x] (human) Approve ADR-016, or amend it — **Approved as `Accepted`**, 2026-07-25.
- [x] (human) Approve this spec.md and `design.md`, or amend either — **Approved**, 2026-07-25.
- [x] (review) Independent review — performed post-implementation; see `evidence.md`'s "Adversarial
      review" section for findings and disposition. (The pre-implementation plan review the
      commissioning instruction also requested was satisfied directly: the human resolved all four
      originally-blocking questions explicitly before authorizing implementation, leaving no
      plan-level ambiguity for a separate reviewer to adjudicate at that stage.)
