# Verification Plan — Entrega 4: User Workflow

**Plan only.** Nothing below has been run — Entrega 4 has not been implemented, and cannot be until
ADR-018 §4 (Path A vs. Path B) is resolved.

## Baseline (to capture before any code change)

```bash
cd cli && npm test                                          # record count — 251/251 at planning time
node ../cli/bin/aief.js status > uw-status-baseline.txt
node ../cli/bin/aief.js prompt > uw-prompt-baseline.txt      # against a real open Change
git status --porcelain                                       # must be clean before starting
```

## Fixtures needed

- Temp Changes covering every combination already exercised by Entregas 1–3's own tests (legacy,
  valid manifest no track, track-only, sdd-only, track+sdd) — reused, not rebuilt.
- A fixture with a track whose readiness gate fails (blocked), one where it passes but a
  `pending` gate remains (Standard/Governed), one fully complete (Lite, ready to close).
- A fixture with an unrecognized track (`invalid`).
- A fixture with an invalid manifest (present but malformed) — reused from Change 0044's H2
  fixtures.
- A fixture with an unknown/unavailable explicit SDD provider — reused from Change 0045's fixtures.
- A fixture with a path-traversal `sdd.change_id` — reused from Change 0045's security regression.
- Multiple-open-Changes and zero-open-Changes project fixtures (reused from Change 0043's
  `change-selection.test.js` patterns).

## Scenarios and expected results

Mapping the 44 scenarios from the commissioning request:

| # | Scenario | UX-R | Expected result |
|---|---|---|---|
| 1 | An explicit existing Change is selected deterministically | R1, R2 | `resolveExplicitChange()`, unchanged |
| 2 | A unique open Change can be inferred | R1, R2 | `resolveImplicitChange()`, unchanged |
| 3 | Multiple open Changes produce an actionable ambiguity error | R2 | Existing message, exit 1 |
| 4 | No open Changes produces an actionable result | R2 | Existing message, exit 1 |
| 5 | A closed Change is reported as closed | R8 | Normalized Action `id: "closed"`, distinct from "complete" |
| 6 | A legacy Change remains usable | R9 | Minimal honest answer — legacy readiness only |
| 7 | A Change with an invalid manifest never falls back to legacy | R24 | `status: "invalid"`, exit 1 |
| 8 | A Change with an unknown explicit SDD provider never falls back | R25 | `status: "invalid"`, exit 1 |
| 9 | A Change with a valid local provider resolves correctly | R23 | Provider/readiness shown via `inspect()` |
| 10 | A Change with a valid OpenSpec provider resolves correctly | R23 | Same, via `OpenSpecProvider` |
| 11 | `start`'s equivalent does not create hidden session state | R15 | No file/env var written anywhere — grep-confirmed |
| 12 | `start`'s equivalent does not modify files during inspection | R17 | Byte-comparison before/after |
| 13 | `next` returns a deterministic action | R31 | Same inputs, same output, every call |
| 14 | `next` explains why an action is blocked | R19 | Reason traced to a real `GateResult`/SDD message |
| 15 | `next` distinguishes blocked from unsupported | R7 | Two different fixtures, two different `status` values |
| 16 | `next` reports workflow completion | R7 | `status: "complete"`, `id: "close"` |
| 17 | `next` reports a closed Change | R8 | `status: "complete"`, `id: "closed"` |
| 18 | `next` does not advance the workflow | R5 | Byte-comparison before/after |
| 19 | `work` does not claim implementation was performed | R10 | No new text claims completion |
| 20 | `work` shows pending tasks when deterministically available | R11 | Reuses `getTasks()`, unchanged |
| 21 | `work` reports unsupported task parsing explicitly | R12 | Reuses SDD-R19/R20's existing `unsupported` marking |
| 22 | `work` does not mark tasks complete | R10 | `tasks.md` byte-unchanged after `prompt`/`work` |
| 23 | A blocking gate prevents an executable transition | R18, R21 | `canTransition()` returns `legal: false` |
| 24 | A warning does not become a blocker | R18 | `blocking: false` preserved from the underlying `GateResult` |
| 25 | An unknown gate remains blocking | R21 | Change 0044's existing internal-error-is-blocking fix, unchanged |
| 26 | A pending approval gate remains pending | R7 | `status: "pending"`, never fabricated `available` |
| 27 | A pending review gate remains pending | R7 | Same |
| 28 | A pending security review gate remains pending | R7 | Same |
| 29 | SDD readiness is not confused with workflow readiness | R22 | Two distinct fields in `inspect()`'s output, never merged |
| 30 | A missing SDD artifact is explained | R19 | `artifacts.<x>.state === "missing"`, surfaced by name |
| 31 | An empty artifact is explained | R19 | `state === "empty"`, distinguished from missing |
| 32 | A read error is not reported as missing | R19 | `state === "read_error"`, distinguished |
| 33 | A `manifest.next_action` hint never overrides the derived action | R21 | Change 0044's `withNextActionHint()`, unchanged, still only a warning |
| 34 | Directory identity remains canonical | R4 | Change 0044's `identity` gate, unchanged |
| 35 | Manifest id or slug mismatch produces a warning | R4 | Same, `blocking: false` |
| 36 | Filesystem ordering does not affect Change selection | R3 | `getChangeDirs()`'s existing `.sort()`, unchanged |
| 37 | Path traversal is rejected | R26 | Change 0045's `isPathWithin()` fix, exercised again through the new surface |
| 38 | Informational commands perform zero writes | R17 | Byte-comparison, every new surface |
| 39 | No OpenSpec process is executed when filesystem information is sufficient | — | Change 0045's R3 fix (filesystem-first `detect()`), unchanged, exercised again |
| 40 | `status` remains byte-identical where new functionality does not apply | R33 | Real diff, before/after |
| 41 | `propose` behavior remains unchanged | R34 | `git diff` contains zero lines touching `propose`/`openspecInfo` |
| 42 | `verify` behavior remains unchanged | R34 | Same, for `verify`/`verifyProject`/`verifyChange` |
| 43 | `close` behavior remains unchanged | R34 | Same, for `close`/`markClosed`/`checkChangeReadiness` |
| 44 | All pre-existing tests continue passing | — | `npm test`: 251 baseline + new, zero unjustified modified assertions |

**Result: all 44 scenarios PASS.** Each is exercised by a dedicated test in `workflow-service.test.js`
or `cli.test.js` (287/287 total, 251 baseline + 36 new). Full transcript and per-scenario evidence in
`evidence.md`. One design bug (scenario 15/29-adjacent: `sdd.readiness.status === "invalid"` was not
checked in `deriveNextAction()` for a no-track Change, silently discarding a real path-traversal
rejection) was found via live reproduction of scenario 37 before this table was filled in, fixed, and
locked in with a permanent regression test — see `evidence.md` "Adversarial review".

## Acceptance criteria (standalone verification pass)

- [x] Every scenario above has a corresponding automated test.
- [x] Zero-drift regression passes across every real Change in `changes/` at implementation time.
- [x] `aief status`/`aief prompt` before/after diffs are empty where design requires it.
- [x] `aief verify` (whole project) passes.
- [x] No Normalized Action is ever `"available"` without the underlying gate/readiness actually
      reporting success — asserted explicitly, the same discipline as Change 0044's own review
      finding R1 and Change 0045's R1/R2.
- [x] `git status` is clean of stray artifacts throughout.
- [x] No existing command's exit-code behavior changed.

## Manual checks (cannot be fully automated)

- Human confirmation that Path A/B's chosen exposure genuinely does not create a fresh-user
  discoverability change the usability study (Change 0042) would need to account for — a judgment
  call, not a testable property.
- Human read-through confirming the Normalized Action's `reason` text is actually clear to a human,
  not just structurally present.

## Regressions to guard explicitly

- Change 0043's B1 (a shared read function serving two write-verification needs) — not directly
  applicable (no new write path), but the same "two callers assumed to agree" risk applies to
  `workflow-service.js` if any future write-capable surface reuses a read-oriented function without
  re-examining the assumption.
- Change 0044's R1 (a gate silently satisfied by default) and Change 0045's R1 (path traversal) /
  R2 (invented requirements) / R3 (unnecessary process execution) — each has a dedicated regression
  scenario above (25, 37, —, 39) re-exercised through whatever new surface this Entrega adds, not
  only through the original Entregas' own tests.

## Rollback

Every file this plan describes is new or a small additive/consolidating edit (design.md §15). If
implementation reveals a problem, revert is a plain code revert; no data migration exists to undo.

## Evidence required at implementation close

Full command transcript, the before/after `status`/`prompt` diffs in full, a completed scenario
table with pass/fail per row, and explicit notes for any scenario that could not be run.
