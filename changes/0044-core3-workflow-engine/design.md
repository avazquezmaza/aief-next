# Design — Entrega 2: Workflow Engine

## 1. Architecture overview

```text
loadChangeUnified(changeDir)              [Entrega 1 — cli/src/core/domain/change-loader.js, unchanged]
        │
        ▼
Change { source, manifest, manifestError, closed, statusState, type, track?, ... }
        │
        ▼
workflow-loader.js  ──loads──▶  cli/src/workflows/{lite,standard,governed}.json
        │                                (validated by workflow-validator.js)
        ▼
gate-evaluator.js  ──wraps──▶  checkChangeReadiness()  [change-verifier.js, unchanged, reused]
        │
        ▼
GateResult[] { id, status, blocking, reason, evidence }
        │
        ▼
transition-engine.js  ──derives──▶  { stage, blockers[], warnings[], next_action }
        │
        ▼
cli.js status()  ──renders, additively──▶  stdout
```

No box above is a second Change loader, a second manifest parser, or a second readiness-rule
engine — every one of them wraps or consumes something Entrega 1 or earlier already built. This is
the direct consequence of restriction 3 ("reutiliza `loadChangeUnified()`") and restriction 6 ("no
dupliques el estado").

## 2. Modules and responsibilities

Following Entrega 1's own precedent (design.md §2 of Change 0043: extend `core/domain/`/
`core/services/` rather than build the vision document's full `core/workflow/` tree prematurely),
this Entrega adds the smallest set of new files that map to genuinely new responsibilities:

```text
cli/src/core/domain/
  change-manifest.js        [Entrega 1, MODIFIED for H2 — see §4]
  change-loader.js           [Entrega 1, unmodified]
  workflow-definition.js     NEW — parseWorkflowDefinition(), validateWorkflowDefinition()
                              (WF-R5–R7) — same shape of responsibility as change-manifest.js,
                              deliberately named differently (not "workflow-manifest.js") because
                              it validates AIEF's own shipped files, not user content.

cli/src/core/services/
  change-verifier.js         [unchanged — checkChangeReadiness() is reused, not touched]
  gate-evaluator.js          NEW — evaluateGates(change, workflowDefinition) -> GateResult[]
  transition-engine.js       NEW — resolveState(change, workflowDefinition, gateResults) ->
                              { stage, blockers, warnings, nextAction }

cli/src/workflows/
  lite.json                  NEW — declarative definition
  standard.json               NEW
  governed.json                NEW
```

**Why `gate-evaluator.js` and `transition-engine.js` are two modules, not one.** A gate answers "is
this one condition satisfied" (a pure, narrow question, testable in isolation, and the natural home
for WF-R8's contract). A transition/stage answer requires combining *all* gate results for a track
with the track's stage order — a different question ("given all of this, where are we, and what's
next"). Keeping them separate means a future Entrega that adds a new gate (e.g. Entrega 6's semantic
verification) extends `gate-evaluator.js` without touching how stages/`next_action` are derived —
and a future Entrega that changes how stages are sequenced touches `transition-engine.js` without
having to understand every gate's internals. This mirrors the existing split between
`change-verifier.js` (rules) and `verification-report.js` (shape) that Entrega 1 inherited and
left alone.

**Why no `workflow-engine.js` facade module.** The vision document's target tree names one; this
design does not add it, because nothing yet needs to hide `gate-evaluator.js` +
`transition-engine.js` + `workflow-definition.js` behind a single entry point — `cli.js`'s
`status()` is their only caller in this Entrega, and it can call three small functions as easily as
one facade. Per Entrega 1's design.md §2, and the vision document's own instruction ("no
implementar abstracciones sin un caso de uso inmediato"), a facade is added when a second caller
exists, not preemptively.

## 3. Data flow (single `status` invocation, manifest+track Change)

```text
1. getChangeDirs()                          [cli.js, unchanged]
2. for each dir: loadChangeUnified(dir)     [Entrega 1, unchanged]
3. if change.manifestError:                 → WF-R1(c): render as "invalid manifest", stop here
4. if change.manifest is null OR
   change.manifest.track is absent/unknown: → WF-R17/R18/R7: render exactly as Entrega 1 did, stop
5. workflowDefinition = loadWorkflowDefinition(change.manifest.track)   [cached in-process per run,
                                                                          never across invocations —
                                                                          see §7]
6. gateResults = evaluateGates(change, workflowDefinition)
     - "readiness" gate  = wrap(checkChangeReadiness(loadChange(dir)))   [legacy loader — see §5]
     - "status_consistency" gate = compare(manifest.status, parseChangeStatus(change.md))  [WF-R19]
     - "identity" gate = compare(manifest.id/slug, directory basename)   [WF-R22, M1]
     - one gate per stage-specific capability not yet built (review/approval/security_review) =
       always { status: "pending", blocking: true, reason: "not implemented (Entrega N)" }
7. { stage, blockers, warnings, nextAction } = resolveState(change, workflowDefinition, gateResults)
8. status() renders the additive block from step 7's output.
```

Step 3 and step 4 are the two places this Entrega must not fall through silently — they are WF-R2's
"no silent fallback" made concrete as control flow, not just as a stated rule.

## 4. H2 hardening — precise change to `change-loader.js`'s consumers

Entrega 1 already computes everything WF-R1 needs — `loadChangeUnified()` returns
`{ source: "manifest", manifestError: [...] }` for an invalid manifest today. What's missing is
purely on the consumer side: `cli.js`'s `status()` and `openChangeDirs()` currently only read
`.closed` (via `isClosed()`), discarding `manifestError` entirely.

**Design decision: `openChangeDirs()`'s definition of "open" does not change.** An invalid manifest
still yields `statusState: "unknown"` → `closed: false` → the Change still appears in "open"
listings, exactly as today (Entrega 1 already chose "unknown is not closed," matching
`parseChangeStatus()`'s own legacy posture — no reason to special-case it here). What changes is
that `status()` gains a **second pass** over the same `getChangeDirs()` list, collecting Changes
whose `loadChangeUnified()` result has a non-null `manifestError`, and rendering them in a distinct
section — never merged into, and never silently absent from, the existing "Open Changes" list.

```text
Changes: 43
- changes/...

Open Changes: 21
- 0001-example
- ...

Changes with an invalid manifest.json: 1     <- NEW, WF-R1(c)/WF-R3. Absent entirely when zero
- 0050-example: schema: must be "aief.change/v1", got "aief.change/v2"    (no such Changes exist,
                                                                             which is every Change
                                                                             in this repo today)
```

This satisfies WF-R15 (additive-only) precisely: the new section's *presence* is conditional on a
case that has zero instances today, so the existing byte-for-byte diff proof still holds for the
unconditional part of the output; only the new, always-appended, empty-when-inapplicable section is
new.

**L3 folded in here, not deferred further.** Change 0043's low-severity finding L3
(`fs.readFileSync(manifestPath)` in `loadManifestChange()` not wrapped in try/catch — a
`manifest.json` that is actually a directory would throw uncaught) sits exactly on the code path
this hardening touches. Per the commissioning instruction ("L1–L3 fuera de alcance salvo que sea
necesaria para H2"), this one is: WF-R2 ("no silent fallback... never crash") cannot be honestly
claimed while a directory-shaped `manifest.json` still throws past the loader boundary. L1 (cosmetic
message asymmetry) and L2 (no typo detection) are not touched — they don't block WF-R1–R4.

## 5. Gate evaluator — reuse, not reimplementation

`evaluateGates()` does not reimplement any readiness rule. Its "readiness" gate is a thin wrapper:

```js
function readinessGate(changeDir) {
  const legacyChange = loadChange(changeDir);              // change.js, unchanged
  const problems = checkChangeReadiness(legacyChange);      // change-verifier.js, unchanged
  return {
    id: "readiness",
    status: problems.length ? "failed" : "passed",
    blocking: true,
    reason: problems.join("; "),
    evidence: []
  };
}
```

This is the same function `close` already calls today (`cli.js` `close()`, line ~652) — the gate
evaluator does not introduce a second definition of "is this Change ready," it exposes the existing
one through the gate contract. If `checkChangeReadiness()`'s rules change in a future Entrega, this
gate changes with it automatically, by construction — not by remembering to update two places.

**Why `loadChange()` (legacy) here, and not `loadChangeUnified()`.** `checkChangeReadiness()` was
written against `loadChange()`'s shape and is not manifest-aware — matching Entrega 1's explicit,
reaffirmed boundary that `verify`/`close` stay legacy-only in this Entrega (design.md §9 of Change
0043; restriction: "no avances a la Entrega 3" implicitly also means not silently expanding
Entrega 1's already-settled boundaries as a side effect of Entrega 2). Calling `loadChangeUnified()`
here would be a step toward making `close` manifest-aware — explicitly out of scope (proposal.md
"Out of Scope").

**Gates without an evaluator yet** (`review`, `approval`, `security_review`) are not wrapped calls —
they are constant results:

```js
const NOT_YET_BUILT = (id, entrega) => ({
  id, status: "pending", blocking: true,
  reason: `No automated evaluator yet (planned for Entrega ${entrega}). A human must confirm this manually.`,
  evidence: []
});
```

This is WF-R8's "never fabricate `passed`" made literal — there is no code path in this Entrega
that can produce `status: "passed"` for any of these three ids, because no function computing that
verdict exists yet.

## 6. Transition engine — state model

**Decision (confirms the commissioning preference against the real repository): persist only
`track`; derive everything else.**

| What | Persisted? | Where | Why |
|---|---|---|---|
| `status` (open/closed) | Yes | `manifest.status` (Entrega 1) | Explicit human/tool fact; not inferable from files alone for a manifest-governed Change (this is unchanged from Entrega 1 — not a new decision) |
| `track` | Yes | `manifest.track` (accepted since Entrega 1, given meaning now) | A human's explicit choice of process weight; no reliable signal in Markdown content implies it |
| Current stage | **No** | — | `resolveState()` output, recomputed every call from gate results + track's stage order |
| Gate results | **No** | — | `evaluateGates()` output, recomputed every call |
| Blockers / warnings | **No** | — | Derived from gate results' `blocking`/`status` fields |
| `next_action` | **No**, primary source | — | `resolveState()` output. If `manifest.next_action` is ever written (accepted-but-unused field since Entrega 1), it is read and *compared*, never trusted as-is (WF-R13) |

**Why hybrid, not fully persisted or fully event-sourced** — evaluated against the three
alternatives in ADR-016:

- *Fully persisted* (write current stage / gate results into the manifest after every command) was
  rejected because it turns the manifest into a mutable results cache that itself needs a
  freshness/invalidation story — precisely the "manifest becomes a database" the commissioning
  instruction ruled out. It would also reintroduce a B1-shaped risk: a cached "stage: verify" that
  disagrees with what the files actually show the moment anything changes outside of AIEF's own
  commands (a human editing `tasks.md` by hand, for instance).
- *Fully event-sourced* (append a transition log) was rejected in ADR-016 for the same reason
  ADR-009 rejected `.aief/state.json`: a second source of truth for history that Git already
  provides, without AIEF inventing a parallel one.
- *Hybrid* (this design): the only fact persisted is one no algorithm can derive (`track`, and
  `status`, unchanged from Entrega 1). Everything the algorithm *can* derive, it does, every time —
  matching the commissioning preference exactly, confirmed against the real `loadChangeUnified()`/
  `checkChangeReadiness()` shapes rather than assumed.

**`resolveState()` algorithm:**

```text
resolveState(change, workflowDefinition, gateResults):
  if change.closed: return { stage: "closed", blockers: [], warnings: [], nextAction: null }
  for stage in workflowDefinition.stages (in order):
    stageGates = gateResults filtered to stage.gateIds
    blocking = stageGates where blocking == true and status in {"failed", "pending"}
    if blocking.length > 0:
      return {
        stage: stage.id,
        blockers: blocking,
        warnings: gateResults where status == "warning",
        nextAction: describeNextAction(stage, blocking)
      }
  return { stage: "close", blockers: [], warnings: [...], nextAction: "close" }
```

This is a pure function: same three inputs, same output, every time (WF-R23). It never reads a
file itself — `change` and `gateResults` are already-computed inputs, keeping this module testable
without any filesystem fixture at all (only `workflow-definition.js` and `gate-evaluator.js` touch
disk).

## 7. `track` vs. `.type` — resolved

**Decision: `track` is its own field on the object `loadChangeUnified()` already returns; `.type`
is untouched.** Concretely, `change-loader.js`'s `loadManifestChange()` currently does:

```js
type: typeof parsed.value.track === "string" ? parsed.value.track.toLowerCase() : "",
```

This Entrega changes that line to populate a **new** field, `track`, leaving `.type` populated the
same way Entrega 1 populated it for legacy Changes — from nothing, for the manifest branch, since a
manifest has no `## Type` heading to read. (Whether a manifest should ever declare its own `type`
for Enrichment/Analysis/General purposes is not addressed by this Entrega; it was never in scope —
Entrega 1's manifest schema has no `type` field, and this Entrega does not add one.) This is a
one-line, additive change to Entrega 1's code, not a rewrite: `.type` stops being fed by `track`
(a field it was never conceptually supposed to hold, per the compatibility risk raised in
proposal.md) and gains a sibling `.track` field instead. No existing test asserts `.type ===`
a track value for a manifest Change (Entrega 1's tests check `.type === "standard"` in exactly one
place — `change-loader.test.js`'s "resolves from the manifest" test — which must be updated to
assert `.track === "standard"` and `.type === ""` instead; flagged in tasks.md).

## 8. Precedence of sources (extends Change 0043 R1)

Unchanged: manifest, when present and valid, is authoritative for `status`/identity — no merge with
`change.md` (Entrega 1 R1, unmodified). This Entrega adds one precedence rule that did not exist
before because nothing needed it: **when both a manifest and workflow definitions exist, the
manifest's `track` selects *which* workflow definition applies; the workflow definition then
governs stage order and gate applicability. Neither overrides the other — they answer different
questions** (which process vs. what state that process is in).

## 9. `close`/B1 non-repetition, explicitly

`close`'s write (`markClosed()`, `cli.js`) and its write-verification remain wired exactly as
Change 0043 fixed them: read and write `change.md` only, never the manifest, never
`loadChangeUnified()`. This Entrega adds no call from `close` into any new module. The rule
Change 0043's design.md §11 states — "a command's post-write verification must read the exact file
it wrote, never a broader unified view" — is not re-derived here; it is simply not violated, because
nothing in this Entrega gives `close` a new thing to check.

## 10. Errors

| Case | WF-R | Behavior |
|---|---|---|
| Manifest present, malformed JSON | WF-R1(c), WF-R3 | Reported by `status`, `manifestError[0].message` shown, Change stays "open" (not closed, not crashed) |
| Manifest present, valid JSON, fails `validateManifest()` | WF-R1(c), WF-R3 | Same as above, one error per field |
| Manifest present, valid, `track` absent | WF-R18 | Workflow Engine does not activate; no error, no warning — this is Entrega 1's normal shape |
| Manifest present, valid, `track` unknown value | WF-R7 | New, explicit error — distinct from "absent" |
| Workflow definition file missing for a *known* track (`lite.json` not found) | WF-R6 | Internal error — AIEF's own bug, not a user-facing "your manifest is wrong" message; logged distinctly |
| Workflow definition file present but structurally invalid | WF-R6 | Same as above |
| `manifest.id`/`slug` disagree with directory | WF-R22 | Warning gate, `blocking: false`, never surfaced as an error |
| `manifest.status` disagrees with `change.md`'s `## Status` | WF-R19 | Warning gate, `blocking: false` — manifest value still governs (unchanged from R1) |

Every row distinguishes *user content is wrong* (manifest, actionable, expected to happen) from
*AIEF's own shipped files are wrong* (workflow definitions, should never happen outside AIEF's own
development, but still must not crash the CLI for an end user if it somehow does) — the same
distinction Entrega 1 drew between "manifest fails validation" and "manifest can't even be read."

## 11. Tests (planned; see `verification.md` for the full plan)

- `workflow-definition.test.js` — parse/validate three real definitions + invalid fixtures.
- `gate-evaluator.test.js` — each gate type in isolation, including the `NOT_YET_BUILT` constant
  gates never resolving to `"passed"`.
- `transition-engine.test.js` — `resolveState()` as a pure function, one fixture per track, at
  least one legal and one illegal transition per track (per the commissioning scenario list).
- `change-manifest.test.js` (extended) — the L3 fix (directory-shaped `manifest.json` no longer
  throws uncaught).
- `cli.test.js` (extended) — end-to-end: `status` shows the new invalid-manifest section; `status`
  shows a track's stage/next_action; `status` output is unchanged for every Change without a track;
  `close` still only touches `change.md` even when a manifest/track is present (B1 non-repetition,
  live through the real binary, matching how Change 0043's B1 regression test works).
- Zero-drift regression: every real Change in `changes/` (43 today, including this Change and
  Change 0043 — neither carries a manifest) resolves with no Workflow Engine section in `status`.

## 12. Rollback

Every artifact this Entrega adds is either a new file (deletable with no trace) or a small, additive
edit to `change-loader.js` (the `track` field addition) and `cli.js` (`status()`'s new section).
Rollback is a plain code revert:

1. Delete `cli/src/workflows/`, `workflow-definition.js`, `gate-evaluator.js`,
   `transition-engine.js`, and their test files.
2. Revert `change-loader.js`'s `track` field addition and `cli.js`'s new `status()` section and H2
   second-pass logic.
3. No data migration to undo — no Change file anywhere is rewritten by this Entrega; `manifest.json`
   files (none exist in production yet) are only ever read, never written, by anything this design
   adds.

Same discipline as Change 0043 (design.md §9/rollback note) — nothing here is harder to reverse than
"revert the commit."

## 13. Future evolution (not built here)

- Wiring `close`'s actual gate (not just `status`'s narration) to `evaluateGates()` — a distinct,
  later Change, per proposal.md's "Out of Scope" and ADR-016's consequence that this Entrega does
  not yet complete the ADR-013 merge it starts.
- `aief work`/`aief review` gaining gate-awareness (Entregas 4/7).
- Building real evaluators for `review`/`approval`/`security_review`, replacing their
  `NOT_YET_BUILT` constants one at a time — each such change is additive to `gate-evaluator.js` and
  requires no change to `transition-engine.js`.
- `status --json`/`--verbose` (WF-R16) once a real consumer needs machine-readable workflow state.
- Persisting `next_action` as a genuinely verified hint (WF-R13 already designs for this being safe
  to add later without a redesign — the comparison-and-warn behavior is the extension point).
