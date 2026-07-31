# Specification

## Goal

`aief status --next` with more than one open Change deterministically recommends the next eligible
one (or honestly reports none), explaining why, its relevant dependencies, and the tie-break rule
— reusing `buildGraph()` and the Workflow Engine's existing gate blockers, never inferring
anything from Change id, folder name, or date.

## Non-goals

- **Loop/Harness as eligibility conditions.** Both are explicitly non-blocking by design
  (ADR-026/027 — a Loop-exhausted or Harness-flagged Change still verifies/closes normally); using
  either to withhold a recommendation here would silently grant them authority neither ADR gives
  them. Only the Workflow Engine's own gate blockers (already, explicitly, blocking by design,
  ADR-018) are reused.
- **`aief status --change <id> --next`, `aief status --graph`, `verify`, `close`, `prompt`.**
  Untouched — this Change's only new surface is `aief status --next` with **more than one** open
  Change (0/1-open-Change paths are byte-identical to before).
- **Multi-step planning, reordering suggestions, automatic execution.** One recommendation, one
  explanation, nothing more.

## Eligibility rule (exact, minimum required by the commissioning instruction)

A Change is **eligible** when **all** of the following hold:

1. **Open** — `!change.closed`.
2. **Valid manifest** — `!change.manifestError` (a Change with no `manifest.json` at all is not an
   error — this condition only excludes a Change whose *existing* manifest failed validation).
3. **Every declared dependency exists** — no `missing_dependency`/`self_dependency`/
   `duplicate_dependency` Graph issue names this Change as source.
4. **Every dependency is closed** — for each of this Change's resolved outgoing edges (from
   `buildGraph()`, i.e. only dependencies that actually exist), the target Change's `closed` is
   `true`. A Change with no dependencies trivially satisfies this.
5. **Not a cycle member** — this Change's id does not appear in any `cycle` issue's `members`.
6. **Not blocked by the Workflow Engine** — if the Change declares a recognized `track`,
   `resolveWorkflowFor()` must resolve (`kind: "resolved"`) with an empty `state.blockers`; an
   unrecognized track or a resolution error counts as blocked (the Change's own workflow
   configuration cannot be trusted enough to call it ready). A Change with no `track` has no
   workflow blockers by definition.

Conditions 3–5 are answered entirely from `buildGraph()`'s already-computed `edges`/`issues` —
never recomputed. Condition 6 is answered entirely from the existing `resolveWorkflowFor()` — never
a second, parallel gate evaluator.

## Tie-break rule (exact, documented per the commissioning instruction)

When more than one Change is eligible: **the eligible Change with the lowest id wins, comparing
Change directory basenames as strings (ascending).** This is `getChangeDirs()`'s own existing sort
— already the ordering every other cross-Change view in this codebase uses (`buildGraph()`'s
`nodes`, `statusOverview()`'s listings) — applied here only *after* the eligible set is already
fully determined from real dependency/Workflow facts, never used to decide eligibility itself (the
commissioning instruction's explicit "no infieras dependencias por ... nombre de carpeta").

## Requirements

- **R1 — `next-change-service.js` is pure.** `selectNextChange(changes, graph)` takes
  `changes: [{id, closed, manifestError, workflowBlockers}]` (already-computed facts) and
  `graph` (a `buildGraph()` result) and returns `{recommended, evaluations, tieBreakRule}` — no
  filesystem access, no `getChangeDirs()`/`resolveWorkflowFor()` call of its own.
- **R2 — Every open Change is evaluated, not just until the first eligible one.** `evaluations` has
  one entry per open Change, `{id, eligible, reasons, dependencies}` — `reasons` explains either
  why it's eligible or the specific blocking condition(s), so a "no eligible Change" result is
  still fully explained, per Change.
- **R3 — Deterministic.** Same input, same `recommended` and same `evaluations` order (sorted by
  id), every call — a dedicated repeated-call test proves this, plus a reordered-but-equivalent
  input test.
- **R4 — `cli.js` gathers real facts in exactly one place.** A new `gatherOpenChangeFacts()`
  (or equivalent) computes `{id, closed, manifestError, workflowBlockers}` for every Change via
  the existing `loadChangeUnified()`/`resolveWorkflowFor()` — no second implementation of Workflow
  resolution.
- **R5 — Wired only into the multiple-open-Changes branch of `aief status --next`.** `parsed.next
  === true && typeof parsed.change !== "string"`: with 0 or 1 open Changes, behavior is **exactly**
  what it was before this Change (same functions called, same output, same exit codes — proven by
  the existing, unmodified tests for those two cases still passing). With 2+, the new
  `statusNextSmart()` renders the recommendation or the "no eligible Change" report instead of the
  old ambiguity error.
- **R6 — Output is fully explained.** On a recommendation: the winning Change id, its eligibility
  reasons (status open, dependencies and their state, graph validity, workflow gate state), and,
  when more than one Change was eligible, the tie-break rule and the other eligible ids. On no
  eligible Change: every open Change listed with its specific blocking reason(s) — never a bare
  "nothing found."
- **R7 — Read-only, no side effects.** Neither `selectNextChange()` nor its `cli.js` wiring writes
  any file, mutates `manifest.json`, or calls `verify`/`close`/`prompt` — purely observational,
  exactly like `aief status`'s and `aief status --graph`'s existing guarantee.
- **R8 — Exit code reflects the honest outcome.** A recommendation found: exit `0`. No eligible
  Change among 2+ open ones: exit `0` too (an honest, non-error report — the project isn't broken,
  nothing is simply ready yet) with `printNext` pointing at what would unblock the closest
  candidate when identifiable, or at `aief status` otherwise. This mirrors `aief status`'s and
  `aief status --graph`'s own convention (both report cross-Change state without erroring on an
  unremarkable outcome).

## Compatibility

- **0 or 1 open Changes**: `aief status --next` (no `--change`) is byte-identical to before this
  Change — same `resolveImplicitChange()` call, same messages, same exit codes. Proven by the
  existing tests for both cases, unmodified.
- **`aief status --change <id> --next`, `aief status --graph`, `aief verify`, `aief close`, `aief
  prompt`, Bootstrap, LIDR, Harness, Loop**: zero diff, zero behavior change.
- **2+ open Changes**: behavior changes deliberately, per the commissioning instruction — see
  `change.md` "Deliberate, documented behavior change." The one existing test asserting the old
  ambiguity-error message is updated to assert the new, documented behavior instead.

## Acceptance Criteria

- [x] `selectNextChange([], emptyGraph)` returns `{recommended: null, evaluations: [], ...}`.
- [x] A single open, dependency-free, track-free Change is eligible and recommended.
- [x] Two open Changes, one depending on the other (open): the dependent is ineligible
      ("dependencies not closed"), the independent one is recommended.
- [x] The same scenario with the dependency **closed**: the dependent becomes eligible and, if it
      has the lower id or is the only eligible one, is recommended.
- [x] A Change with an invalid manifest is never eligible, never recommended.
- [x] A Change with a `missing_dependency`/`self_dependency` naming it is never eligible.
- [x] A Change that is a cycle member is never eligible, even if its own `dependsOn` array looks
      individually fine.
- [x] A Change with an unsatisfied Workflow gate blocker is never eligible; one with a satisfied
      workflow (or no track) is unaffected by this condition.
- [x] With multiple eligible Changes, the lowest id wins, and the tie-break rule and other eligible
      ids are both reported.
- [x] With zero eligible Changes among several open ones, every open Change is listed with its own
      specific blocking reason(s), exit code `0`.
- [x] `aief status --next` with exactly one open Change, and with zero open Changes, is
      byte-identical to the pre-Change baseline (existing tests, unmodified, still pass).
- [x] Full CLI test suite (706 baseline, one existing assertion deliberately updated) passes;
      `aief verify` passes; `git diff --check` is clean.
