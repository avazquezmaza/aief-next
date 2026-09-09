# Change

## ID

`0124-workflow-gate-authority`

## Type

Definition

## Objective

Define workflow gate authority before implementation begins: resolve open questions, evaluate options, and turn approved decisions into durable knowledge and implementation prerequisites.

## Scope

### In scope

- Capture business/product context, known requirements and assumptions.
- Raise open questions and identify decisions that require a human.
- Evaluate options and trade-offs; recommend only where evidence supports it.
- Record approved decisions in knowledge/decisions.md.
- Produce implementation prerequisites and follow-up Changes.

### Out of scope

- Implementing application code.
- Refactoring or scaffolding a codebase.
- Modifying infrastructure.
- Auto-approving architecture or product decisions — every decision below requires explicit (human) approval.

## Context

AIEF publishes three Workflow tracks (`cli/src/workflows/{lite,standard,governed}.json`):
`lite` (work → verify → close), `standard` (+ review), `governed` (+ approval, + security
review). `aief status` reports a track's current `stage` and whether it is `BLOCKED` on a
gate, computed by `transition-engine.js`'s `resolveState()` from `gate-evaluator.js`'s
`evaluateGates()`.

But `aief close` (`commands/close.js`) never calls either of those. It calls
`checkChangeReadiness()` directly — the same structural checks used for a Change with no track
at all (missing/empty files, unresolved status, evidence completeness, unresolved `(human)`
tasks). It does not consult gate results, does not consult the Graph, and is unaware a track
was even declared. So today: a `governed` Change can show `Stage: approval` / blocked in
`aief status`, and still close successfully via `aief close --yes` the moment its files/tasks
are structurally complete — because `close` never asked the Workflow Engine anything.

This is not an accident of a rushed implementation. `gate-evaluator.js`'s own comments say
`review`/`approval`/`security_review` are deliberately unbuilt (no evaluator exists yet, WF-R8:
never fabricate "passed"). The gap is that nothing yet decided what should happen with `close`
*given* that those gates can never resolve — and until that's decided, "governed" and
"standard" mean less than their names and `AGENTS.md`'s framing of tracks/gates suggest.

A second, narrower instance of the same category of drift: `AGENTS.md` documents that both
`(human)` and `(review)` task labels "stay blocking for `aief close` while unchecked" — but
`change-verifier.js`'s `checkChangeReadiness()` only scans `tasks.md` for unresolved `(human)`
lines (`/^\s*[-*+]\s*\[\s\]\s*\(human\)\s*(.+)$/i`). There is no equivalent regex for
`(review)`. An unchecked `- [ ] (review) ...` task does not block `close` today, contrary to
what `AGENTS.md` states.

`gate-evaluator.js` already has architectural preparation for a related question — a
`specification` gate wrapping SDD provider validation — deliberately left unwired
(Entrega 3 comment, Change 0045): "no shipped workflow definition references it... a later,
explicitly-approved Change can enable it by editing a workflow definition alone". That Change
is out of scope here (see change.md Scope), but this Definition Change's decision should not
foreclose it.

## Business / Product Constraints

- AIEF's core positioning (docs/architecture.md, ADR-021) is repository-as-source-of-truth: no
  daemon, no database, no hidden state. Any resolution mechanism for `review`/`approval`/
  `security_review` must resolve from a repository-visible fact — a file a human edited and
  committed — never from runtime/environment state.
- `AGENTS.md` is the assistant-facing policy source across tools (Codex, Claude, Gemini, Kiro).
  A decision here that changes what `(human)`/`(review)` mean for `close` changes what every
  assistant is instructed to respect — it must be reflected there, not only in code.
- No AI assistant may self-approve a gate that requires human sign-off (`AGENTS.md`'s Prime
  Directive). Whatever mechanism resolves `approval`/`review`/`security_review` must be
  something only a human can satisfy, exactly like `(human)` tasks already are.

## Known Requirements

- 100% of Changes closed in this repository to date declare no `track` in their manifest (the
  legacy/no-track path). Whatever this Change decides must leave that path's `close` behavior
  byte-identical — this is a hard backward-compatibility floor, not a preference.
- `evaluateGates()` (`gate-evaluator.js`) already computes `readiness`, `status_consistency`,
  and `identity` gates correctly and is exercised by existing tests; only `review`/`approval`/
  `security_review` are the unresolved ones.
- `AGENTS.md`'s Prime Directive already establishes the exact shape of the answer this Change
  needs for gate resolution: "AI proposes. Human decides. AIEF records. AIEF enforces." — the
  question is only how that maps onto `close`'s current, parallel notion of readiness.

## Assumptions

- A Change's manifest `track` field, once declared, is intended by its author as an opt-in to
  more governance, not less — closing it with less rigor than a no-track Change would violate
  that intent even if no code currently enforces it.
- The three shipped tracks (`lite`/`standard`/`governed`) are not expected to change in number
  or ordering as part of this decision — only what their gates *mean* for `close`.

## Open Questions

- Q1: Should `review`/`approval`/`security_review` gates be **advisory** (narration only, as
  they effectively are today — in which case `blocking: true` on them and words like "governed"
  are overclaiming and should be reworded) or **enforceable** (able to actually block
  `aief close`)?
- Q2: If enforceable, what resolves them? Reusing the `(human)`/`(review)` `tasks.md` label
  convention is the leading candidate (per `AGENTS.md`'s Prime Directive framing) — but does one
  checked `(human)`/`(review)` task per gate suffice, or does each gate need its own explicitly
  labeled task (e.g. a task tagged for `approval` specifically, distinct from one tagged for
  `security_review`)?
- Q3: Should this apply to every Change, or only to a Change that explicitly declares a track
  (opt-in)? A no-track Change closing exactly as it does today is a hard requirement either way
  (see Known Requirements) — the question is only whether a *tracked* Change's `close` should
  change behavior.
- Q4: Independently of Q1–Q3: should the existing `(review)`-task enforcement gap
  (`change-verifier.js` checks `(human)` but not `(review)`) be closed now, as a fix to bring
  code in line with `AGENTS.md`'s already-stated rule, regardless of how Q1–Q3 resolve?
- Q5: Should `aief close` gain a way to report *why* it refused (which gate/task blocked it) in
  the same structured way `aief status`'s gate rendering already does, so a human isn't left
  re-deriving the reason from two different subsystems?

## Decisions Required

- D1 (resolves Q1): Advisory vs. enforceable gate authority for `standard`/`governed` tracks.
- D2 (resolves Q2, contingent on D1 = enforceable): the exact resolution mechanism for
  `review`/`approval`/`security_review` gates.
- D3 (resolves Q3, contingent on D1 = enforceable): scope of enforcement — only Changes that
  declare a track, or every Change.
- D4 (resolves Q4): whether to close the `(review)`-task enforcement gap in
  `change-verifier.js` now, as its own follow-up Change, independent of D1–D3's outcome.

## Options Considered

**For D1 (advisory vs. enforceable):**
- Option A — Advisory only: rename/reframe `blocking: true` on `review`/`approval`/
  `security_review` and the words "governed"/"standard" to be explicit that they are
  recommendations, not enforced gates. Cheapest; changes only docs/wording, no `close` change.
  Downside: does not close the actual governance gap the tracks were presumably introduced to
  provide — a `governed` Change offers no more real protection at close time than `lite`.
- Option B — Enforceable, opt-in by declared track: `close` consults `evaluateGates()` only
  for a Change whose manifest declares `track`; a no-track Change is entirely unaffected.
  Matches `AGENTS.md`'s Prime Directive ("AIEF enforces") without imposing new obligations on
  existing/legacy Changes. This is the option this Change's author recommends (see
  Recommendation).
- Option C — Enforceable for every Change, tracked or not (i.e. every Change gets an implicit
  default track). Rejected outright: violates the backward-compatibility floor in Known
  Requirements and silently changes the meaning of every existing and future no-track Change
  without an explicit opt-in.

**For D2 (resolution mechanism, if D1 = Option B):**
- Option A — Reuse `(human)`/`(review)` `tasks.md` labels as-is: an author adds
  `- [ ] (human) Architecture approved` (etc.) to `tasks.md`; once checked, that satisfies the
  corresponding gate. Cheapest, reuses an existing, already-`AGENTS.md`-documented convention;
  no new syntax to learn. Downside: today's `(human)`/`(review)` labels are generic — they
  don't say *which* gate they resolve, so `evaluateGates()` would need a way to know that an
  unchecked `(human)` task in a `governed` Change's `tasks.md` corresponds specifically to,
  say, `approval` and not `security_review`.
- Option B — A small, explicit per-gate task label, e.g. `(gate:approval)`,
  `(gate:security_review)`, `(gate:review)`, alongside the existing generic `(human)`/
  `(review)`. Slightly more syntax, but each gate resolves from an unambiguous,
  repository-visible fact — no inference from task wording or ordering. This is the option
  this Change's author recommends (see Recommendation).
- Option C — A dedicated `approvals.md` file per Change, machine-parsed. Rejected: a new file
  format for something `tasks.md` + a label already expresses; adds surface area without a
  demonstrated need (the same "no observed need, no abstraction" discipline the Graph and
  multi-agent-runtime ADRs already apply elsewhere in this project).

**For D3 (scope):** covered by D1's Option B itself (opt-in by declared track) — no separate
options beyond "declared track" vs. "every Change", the latter already rejected under D1.

**For D4 (the `(review)`-task gap):**
- Option A — Fix now, as this Change's own immediate implementation-adjacent fix (a one-line
  regex addition to `change-verifier.js`, mirroring the existing `(human)` check). Small,
  isolated, doesn't need to wait on D1–D3.
- Option B — Defer to the same follow-up Change that implements D1–D3, since both touch
  `change-verifier.js`'s readiness logic and reviewing them together may reveal overlap (e.g.
  if D2 = gate-specific labels, `(review)` may be subsumed rather than fixed as a bare label).
  This Change's author recommends this option (see Recommendation) — see Rationale.

## Recommendation

- D1: Option B (enforceable, opt-in by declared track).
- D2: Option B (explicit per-gate task labels, e.g. `(gate:approval)`).
- D3: settled by D1's own shape (opt-in by declared track; no-track Changes unaffected).
- D4: Option B (defer the `(review)`-gap fix into the same follow-up implementation Change as
  D1–D3, not as a separate, earlier fix) — see Rationale.

## Decision (human)

Approved as recommended, 2026-09-09 (mandara0.ia@gmail.com):

- D1: Option B — enforceable, opt-in by declared `track`. A Change with no `track` is
  completely unaffected.
- D2: Option B — explicit per-gate task labels (`(gate:approval)`, `(gate:security_review)`,
  `(gate:review)`), alongside the existing generic `(human)`/`(review)` labels.
- D3: settled by D1 (opt-in by declared track; no separate mechanism needed).
- D4: Option B — defer the `(review)`-task enforcement gap fix into the same follow-up
  implementation Change as D1–D3, rather than fixing it in isolation first.

No amendments to the Recommendation as written.

## Rationale

- D1/Option B keeps the change local to Changes that opt into more governance, matching the
  same "opt-in capability, no forced behavior change" discipline AIEF already applies elsewhere
  (Skills' closed capabilities, `--evidence-from` being optional, etc.) — it does not touch the
  100% of Changes that declare no track.
- D2/Option B (explicit per-gate labels) avoids `evaluateGates()` having to guess which
  generic `(human)`/`(review)` task in `tasks.md` corresponds to which named gate once a
  `governed` Change can have three of them (`approval`, `security_review`, `review`) — an
  unambiguous label per gate is a small addition that keeps resolution "must resolve from a
  repository-visible fact" (this Change's own framing in Business/Product Constraints) exact,
  not inferred.
- D4/Option B (defer): fixing the `(review)`-gap in isolation risks landing a label convention
  that D2's decision then immediately supersedes or renames. Since both changes touch the same
  function (`checkChangeReadiness()`'s tasks.md scan), doing them in one follow-up Change avoids
  a second, avoidable edit to the same code path — consistent with `AGENTS.md`'s "keep changes
  small and reviewable", read here as "small in count of decisions landed per diff", not
  "smallest possible diff regardless of churn".

## Consequences

- A `governed`/`standard` Change gains real teeth: `aief close` will refuse to close while an
  `approval`/`security_review`/`review` gate's corresponding `(gate:*)` task is unchecked, the
  same way it already refuses on an unresolved `(human)` decision or incomplete evidence today.
- Existing Changes with no `track` declared: zero behavior change (explicit requirement).
- `AGENTS.md` needs a documentation update describing the new `(gate:<id>)` label alongside the
  existing `(human)`/`(review)` ones, once the follow-up implementation Change lands.
- The follow-up implementation Change (out of scope here) will need to: wire `close.js` to call
  `evaluateGates()`/`resolveState()` for a tracked Change; add `(gate:<id>)` label parsing to
  `change-verifier.js`; fix the `(review)`-task gap in the same pass (D4); update
  `cli/src/workflows/*.json`'s stage/gate documentation if wording changes; add tests for the
  exact scenario that motivated this Change (`governed` Change blocked in `status`, previously
  closable anyway).

## Non-Functional Requirements

- No new dependency. No daemon, network call, or persisted state beyond `tasks.md` itself
  (ADR-021's execution boundary; Hooks stay observation-only, per this project's existing,
  correct discipline — the follow-up Change must not turn a Hook into a gate authority).
- Deterministic: the same `tasks.md` + manifest must always resolve to the same gate results,
  with no reliance on process/environment state (matches `transition-engine.js`'s existing
  purity guarantee, which the follow-up Change must not break).

## Security & Compliance

- The explicit goal of D1/D2 is closing a governance gap where a "human sign-off required"
  gate could be silently bypassed by closing before the gate existed to check it. No new
  attack surface is introduced — the mechanism is the same trusted, git-tracked `tasks.md` any
  reviewer already reads.

## Data & Domain

- No new domain entity. `(gate:<id>)` is a label convention on the existing `tasks.md`/Task
  domain concept, not a new model.

## Integrations

- None. This stays entirely within `tasks.md`, `change.md`'s manifest `track` field, and the
  existing Workflow Engine (`gate-evaluator.js`, `transition-engine.js`).

## Deployment & Operations

- No CI/deployment impact. `aief verify`'s existing `--strict` mode is the natural place a
  follow-up Change would add a check for a malformed/duplicate `(gate:<id>)` label, mirroring
  how `(human)` is already checked.

## Implementation Prerequisites

- This Change's `Decision (human)` must record an explicit human-approved outcome for D1–D4
  before any implementation Change proceeds (per `AGENTS.md`: a Definition Change resolves
  prerequisites and proposed decisions, it does not self-approve them).
- `knowledge/decisions.md` must record the approved decision (D1–D4) once made.

## Follow-up Changes

- `implement-workflow-gate-authority` (or similar name): wires `close.js` to
  `evaluateGates()`/`resolveState()` for tracked Changes, adds `(gate:<id>)` label parsing to
  `change-verifier.js`, fixes the `(review)`-task enforcement gap (D4), and updates
  `AGENTS.md`/`docs/` accordingly. Depends on this Change's `Decision (human)` being recorded
  first.

## Success Criteria

- Open Questions are resolved or explicitly deferred.
- Every entry in Decisions Required has a human-approved Decision recorded here and in knowledge/decisions.md.
- Implementation Prerequisites and Follow-up Changes are identified.

## Status

Closed (2026-09-09)
