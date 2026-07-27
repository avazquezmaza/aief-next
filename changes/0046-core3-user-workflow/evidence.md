# Evidence

## Summary

Entrega 4 (Change 0046, ADR-018, Path B) is implemented, tested, and reviewed. `status --change <id>`
and `status --change <id> --next` extend the existing `status` command; `prompt` gained additive
Workflow/SDD context blocks. No new command verb was added. `WorkflowService`
(`cli/src/core/services/workflow-service.js`) is now the single computation for "what's next" — the
`printNext()`/`resolveState()` discrepancy the Entrega set out to eliminate no longer exists.
287/287 tests pass (251 baseline + 36 new: 22 in `workflow-service.test.js`, 14 in `cli.test.js`).
`aief verify` (whole project) PASS. `git status --porcelain` clean except this Change's own files.
One design bug was found and fixed via live reproduction during implementation (Etapa G), before the
formal adversarial review began; the formal review (25-point checklist) found no further
blocking/high issues and one low-severity discoverability gap, which was also fixed.

## Activities Performed

- Etapa A: baseline captured (251/251 tests, `aief status`/`aief prompt` real output snapshots,
  clean `git status`). ADR-018 updated to `Status: Accepted`, `Selected path: Path B`, documenting
  the ADR-015 relationship (frozen, unmodified; Change 0042 not closed/modified by this Entrega) and
  that naming is deferred to post-Change-0042.
- Etapa B: `workflow-service.js` created — `inspect()`, `deriveNextAction()`/`nextAction()`,
  `canTransition()`, `explain()` — plain functions, reusing `evaluateGates()`/`resolveState()`/
  `isTransitionLegal()` (Change 0044) and `resolveSddProvider()` (Change 0045) exactly as shipped,
  never re-deriving gate/readiness facts. 22 unit tests added (`workflow-service.test.js`).
- Etapa C: `status()`'s bottom-line suggestion consolidated — for the one case where the old
  `printNext()` logic and the Workflow status block could disagree (a single open, track-carrying
  Change), both now come from the same `nextAction()` call. Every Change without a track (100% of
  this repository's real Changes) is untouched — same branch, same wording, byte-identical.
- Etapa D/E: `status --change <id>` (deep, read-only inspection: track, stage, blockers, warnings,
  SDD provider/readiness) and `status --change <id> --next` / `status --next` (compact Normalized
  Action view, implicit single-open-Change inference) implemented as flags on the existing `status`
  entry point — no new command verb, per ADR-018 Path B.
- Etapa F: `prompt()` extended with two additive, opt-in blocks (Workflow context, SDD context) —
  same pattern as the existing `standardsBlock`/`skillsBlock`. Empty string, no header, for any
  Change without `track`/`sdd` (100% of this repository's real Changes today) — byte-identical
  output confirmed.
- Etapa G: compatibility regressions run live — re-reproduced Change 0043's B1 scenario (Governed
  Change, pending approval gate, `close`) and Change 0045's path-traversal rejection through the new
  `status --change --next` surface. The traversal reproduction surfaced a real bug (below), fixed
  immediately, with a permanent regression test added before Etapa G was considered complete.
- Etapa H: final verification — 287/287 tests, `aief verify` PASS, `aief status`/`aief prompt` diffs
  literally empty against the Etapa A baselines, `git status --porcelain` clean.
- Documentation: `docs/architecture.md` (new subsection), `docs/domain-model.md` (two new
  ubiquitous-language entries, both pointing at ADR-018).
- Formal adversarial review (25-point checklist, this session, after Etapa H) — see below.
- Post-review fix: `status`/`help`'s topic text for `status` did not mention `--change`/`--next` —
  a discoverability gap, not a correctness defect. Fixed (`cli.js`, `help()`/`COMMAND_HELP.status`).
  Re-ran the full suite: still 287/287 (no test pins the old help wording).

## Verification

```
cd cli && npm test
# 287/287 pass (251 baseline + 36 new), 0 fail
node ../cli/bin/aief.js verify        # whole project: PASS
git status --porcelain                # clean (except this Change's own in-progress files)
```

`aief status` and `aief prompt` real-output diffs against the Etapa A baseline (every real Change in
this repository lacks `track`/`sdd`): **byte-identical, zero diff lines.**

Scenario table (`verification.md`, 44 scenarios mapped to UX-R1–R36): **all 44 PASS**, each backed by
a dedicated automated test. See `verification.md` for the full table and the mapping.

## Findings

### Bug found and fixed during implementation (Etapa G, before the formal review)

**`deriveNextAction()` silently discarded a real SDD error for a no-`track` Change.** Live-reproducing
Change 0045's path-traversal rejection (a malicious `sdd.change_id`) through the new `status --change
--next` surface, on a Change with no `track` set, produced a normal "blocked, legacy readiness"
answer instead of surfacing the rejection. Root cause: `deriveNextAction()` checked `sdd?.error`
(resolver-level errors) and `sdd?.readiness?.status === "unsupported"`, but never checked
`sdd?.readiness?.status === "invalid"` — so for a no-`track` Change, execution fell straight through
past the SDD check to the legacy branch, discarding a correctly-detected provider-layer error.
**Fix**: added an explicit `sdd?.readiness?.status === "invalid"` branch
(`workflow-service.js:102-111`), mapping to `{status: "invalid", id: "sdd", blocking: true}`.
**Regression test**: `"status --change <id> --next surfaces a rejected SDD path-traversal change_id,
even for a Change with no track"` (`cli.test.js:1037`).

### Formal adversarial review (25-point checklist, post-implementation)

Re-read `workflow-service.js`, `cli.js` (`status`/`statusOverview`/`statusSingleChange`/`prompt`),
and `cli.test.js` fresh against each item:

| # | Check | Result |
|---|---|---|
| 1 | `printNext()`/WorkflowService divergence | None — consolidated to one call (`statusOverview()` line ~887), byte-identical for every trackless Change. |
| 2 | First-Change selection by filesystem order | None — `resolveImplicitChange()`/`resolveExplicitChange()` reused unchanged; ambiguity is always an explicit error, never a guess. |
| 3 | Hidden session state | None — every function re-derives from disk on every call (`inspect()` reloads via `loadChangeUnified()`); no file/env var written. |
| 4 | Writes during `status`/`prompt` | None — grep-confirmed no `writeFile`/`fs.write*` call reachable from `statusSingleChange()`, `statusOverview()`, `prompt()`'s new blocks, or any `workflow-service.js` function; proven by byte-comparison tests. |
| 5 | `next` advancing state | None — `status --next` only calls `nextAction()` (read), never `markClosed()` or any writer. |
| 6 | `prompt` claiming work performed | None — new blocks are explicitly labeled "read-only — reflects current state, does not advance it" / "not yet marked complete"; tested via negative-match assertions. |
| 7 | SDD readiness confused with workflow readiness | None — `inspect()` keeps `workflow` and `sdd` as two distinct fields; `deriveNextAction()` branches on them separately, never merges. |
| 8 | Pending gate treated as passed | None — `pendingOnly` branch maps to `status: "pending"`, `blocking: true`, never `"available"`. |
| 9 | Warning converted to blocker | None — `state.warnings` is only ever used as informational `evidence` on the `close`-available action; `blocking` always comes from `GateResult.blocking` untouched. |
| 10 | Blocker ignored | None — any non-empty `state.blockers` forces `status` to `"blocked"`/`"pending"`, never `"available"`. |
| 11 | Invalid manifest with fallback | None — `change.manifestError` is checked first in `deriveNextAction()`, before any track/sdd logic; `statusSingleChange()` also short-circuits on it. Regression test at `cli.test.js` (invalid manifest never falls back). |
| 12 | Explicit provider with fallback | None — `resolveSdd()` returns `{error}` immediately on `resolution.error`; no fallback path exists in `sdd-provider-resolver.js` (Change 0045, unchanged). Regression test at `cli.test.js:1017`. |
| 13 | Unnecessary OpenSpec execution | None — `resolveSdd()` only calls `getTasks()`/`getRequirements()` when `changeResolution.resolved` or the provider is `local`; an unresolved OpenSpec Change never triggers provider execution. |
| 14 | Path traversal | Found (see above) and fixed; permanent regression test added. |
| 15 | `next_action` persisted as authority | None — nothing in this Entrega writes or reads a persisted `next_action`; every value is recomputed per call (`manifest.next_action`, where it exists, remains Change 0044's existing warning-only hint, untouched). |
| 16 | Closed Change shown as available | None — `change.closed` is checked first in `deriveNextAction()`, returns `status: "complete"`, `command: null`; `openChangeDirs()` (used by the implicit-selection path) already excludes closed Changes. |
| 17 | Tasks marked or modified | None — `resolveSdd()` only calls existing read-only `getTasks()`/`getRequirements()` (Change 0045); byte-comparison test confirms `tasks.md` unchanged after `prompt`. |
| 18 | Accidental changes in `propose` | None — `git diff` shows zero lines touching `propose()`. |
| 19 | Accidental changes in `verify` | None — `git diff` shows zero lines touching `verify()`/`verifyProject()`/`verifyChange()`. |
| 20 | Accidental changes in `close` | None — `git diff` shows zero lines touching `close()`/`markClosed()`/`checkChangeReadiness()`. |
| 21 | Legacy output regression | None — `aief status`/`aief prompt` real output byte-identical against the Etapa A baseline. |
| 22 | Operational errors returning exit 0 | None — invalid manifest, ambiguous `--change`, no open Change, unavailable explicit provider all set `process.exitCode = 1`. |
| 23 | Blocked states returning exit 1 | None — `statusSingleChange()` only sets `process.exitCode = 1` for `action.status === "invalid"` or a manifest error; `blocked`/`pending`/`unsupported`/`complete` all return exit 0, per ADR-018 §3/UX-R29. |
| 24 | UX-R requirements without evidence | None outstanding — all 36 UX-R requirements map to at least one dedicated test (see `verification.md`'s scenario table and this file's Verification section). |
| 25 | Temporary artifacts | None — `git status --porcelain` clean of stray files; all untracked entries predate this Entrega (prior Entregas 1–3's own files, not yet committed). |

**One low-severity finding** (not on the 25-point list, found while reviewing `help`/`COMMAND_HELP`
for consistency): `aief help` and `aief help status` did not mention the new `--change`/`--next`
flags — a discoverability gap only, no behavioral or compatibility impact (not covered by the
byte-identical guarantee, which applies to `status`/`prompt` *output for a Change*, not to static
help text). Fixed in the same session; re-ran the full suite (287/287, unaffected).

**No blocking or high-severity findings.**

## Risks

- Naming (`status --change`/`--next` vs. a future dedicated verb) is explicitly deferred to after
  Change 0042 (usability study) consolidates, per ADR-018 §4 and the user's original instruction —
  not a risk to this Entrega's correctness, but a known follow-up.
- `canTransition()` has no production call site yet beyond `workflow-service.js`'s own tests — it
  exists as the read-only prerequisite for a future write-capable transition surface, deliberately
  out of scope this Entrega (tasks.md §11, deferred).

## Recommendations

- When Change 0042 consolidates, revisit whether `status --change <id> --next` should gain a shorter
  alias (e.g., a future `aief next`) now that its semantics are proven and stable.
- Any future write-capable transition surface should reuse `canTransition()` as its legality check
  rather than re-deriving gate satisfaction, to avoid recreating the exact `printNext()`/
  `resolveState()`-style discrepancy this Entrega eliminated.

## Artifacts Produced

- `cli/src/core/services/workflow-service.js` (new)
- `cli/tests/workflow-service.test.js` (new, 22 tests)
- `cli/src/cli.js` (extended: `statusOverview()`, `statusSingleChange()`, `status()`, `prompt()`,
  `help()`/`COMMAND_HELP.status`)
- `cli/tests/cli.test.js` (extended: 14 new tests)
- `cli/package.json` (test script includes `workflow-service.test.js`)
- `knowledge/decisions.md` (ADR-018: `Accepted`, Path B)
- `docs/architecture.md`, `docs/domain-model.md` (documentation)
- `changes/0046-core3-user-workflow/{spec.md,tasks.md,verification.md,evidence.md}` (this Change's
  own artifacts, updated to reflect execution)

## Lessons Learned

- Live-reproducing prior Entregas' own regression scenarios (B1, path traversal) through a brand-new
  surface — rather than trusting that "the underlying function is unchanged, so it's fine" — is what
  caught the one real bug in this Entrega (§Findings). The bug was not in the reused
  `resolveSddProvider()`/`validate()` logic itself (Change 0045, correct), but in a new caller that
  forgot to check one of that function's own documented outcomes.
- The `canTransition()` design (defaulting `fromStage` to the workflow's *current* stage) looked
  reasonable until its own unit tests were written — `resolveState()`'s definition of "current stage"
  (a stage whose gates are unsatisfied) made that default structurally unable to ever return
  `legal: true`. Writing tests before/alongside the implementation surfaced this before it reached
  review.

## Next Change

Entrega 5 is explicitly out of scope for this Change, per the user's instruction. This Change closes
here; Entrega 5 planning begins as a separate, later conversation/Change.
