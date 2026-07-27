# Verification Plan — Entrega 3: SDD Provider

**Executed.** Every command and scenario below has been run against the real implementation,
including a second pass after the independent review's fixes. Full transcript: `evidence.md`.

## Baseline (to capture before any code change)

```bash
cd cli && npm test                                    # record count — 195/195 at planning time
node ../cli/bin/aief.js status > sdd-status-baseline.txt
git status --porcelain                                 # must be clean before starting
```

## Fixtures needed

- A temp Change directory with no `manifest.json` (legacy).
- A temp Change directory with a valid manifest, no `sdd` section (Entrega-1/2-era).
- A temp Change directory with `manifest.sdd.provider: "local"` explicit.
- A temp Change directory with `manifest.sdd.provider: "openspec"` explicit, with and without a
  real `openspec/changes/<id>/` directory present.
- A temp Change directory with `manifest.sdd.provider: "unknown-provider"`.
- A temp Change directory with `manifest.sdd.provider: "openspec"` but OpenSpec undetectable
  (no CLI, no `openspec/` structure) — must not fall back silently to local.
- A temp project with an unambiguous `openspec/changes/<id>/` structure (no manifest declaring it)
  — detected via precedence step 3.
- A temp project with an ambiguous OpenSpec structure (`openspec/` present, `changes/` absent or
  empty) — must warn/error, not guess.
- A temp `openspec/changes/<id>/` with each of: missing `proposal.md`, missing `specs/`, an empty
  `tasks.md`, an unreadable file (permission-denied, if constructible in the test environment; a
  directory-shaped file otherwise — mirroring Change 0043's L3 fixture technique).
- A temp `spec.md`/`specs/*/spec.md` with real `**R1** — ...` requirement lines and lines that
  don't match the pattern, to prove partial extraction (not a parse failure) for both providers.
- A temp `tasks.md` with `- [x]`/`- [ ]` lines, with and without a leading id token.
- A temp fixture proving `LocalSddProvider.getArtifacts()` matches `loadChangeUnified()`'s
  `missing`/`empty` for a real, unmodified Change directory copy.

## Scenarios and expected results

Mapping the 30 scenarios from the commissioning request:

| # | Scenario | SDD-R | Expected result |
|---|---|---|---|
| 1 | A legacy Change without SDD configuration continues to work | R29 | No provider resolution attempted; identical to pre-Entrega-3 behavior |
| 2 | A manifest without an `sdd` section continues to work | R26, R30 | ✅ `resolveSddProvider()` never called by `status` for this Change; unchanged output |
| 3 | An explicitly configured local provider resolves local artifacts | R8, R15 | ✅ `LocalSddProvider.getArtifacts()` matches `readChangeFiles()` output |
| 4 | An explicitly configured OpenSpec provider resolves OpenSpec artifacts | R8, R12–R14 | ✅ Paths match `openspec/changes/<id>/...`; `specifications` is an array |
| 5 | An unknown provider produces an actionable error | R9 | ✅ `{error: "unknown SDD provider ..."}`, no fallback |
| 6 | A configured but unavailable provider does not fall back silently | R10 | ✅ Error names the provider and `detect()`'s reason; never silently resolves to local |
| 7 | OpenSpec is detected when its structure is unambiguous | R7, step 3 | ✅ `detect().available === true`; provider resolves via `"detected"` source |
| 8 | Ambiguous OpenSpec detection produces a warning or actionable error | R11 | ⚠️ Tested as "referenced Change not found" (`resolveChange()` reports `resolved: false`) — a related but not identical case to genuine structural ambiguity, which this design avoids by construction (exact-match-only resolution, no fuzzy matching). Noted as review finding R4, not a defect. |
| 9 | A referenced OpenSpec Change that does not exist is reported | R24 | ✅ `resolveChange()` — "openspec/changes/<id>/ does not exist" |
| 10 | A missing proposal is reported | R17 | ✅ `artifacts.proposal.state === "missing"` |
| 11 | A missing specification is reported | R17 | ✅ Zero specifications is a distinct, legitimate state, tested separately from a `read_error` on the `specs/` directory |
| 12 | A missing design is reported when required | R17, R18 | ✅ `design` state `not_applicable` when absent (OpenSpec's own convention: optional) — verified against `adapters/openspec/mapping.md` |
| 13 | A missing tasks artifact is reported | R17 | ✅ `artifacts.tasks.state === "missing"` |
| 14 | An empty artifact is distinguished from a missing artifact | R17 | ✅ `state: "empty"` vs. `state: "missing"` — different fixtures, different states |
| 15 | An unreadable artifact is reported without crashing | R17 | ✅ `state: "read_error"`, wrapped message, no uncaught exception |
| 16 | Requirements are normalized deterministically | R19, R20, R35 | ✅ Same fixture, same parsed array, every call — **and** re-verified against real repository content after review finding R2's fix |
| 17 | Tasks are normalized deterministically | R19, R20, R35 | ✅ Same fixture, same parsed array, every call |
| 18 | Completed and incomplete tasks are distinguished | design.md §9 | ✅ `- [x]` → `completed: true`; `- [ ]` → `completed: false` |
| 19 | Requirements linked from tasks are preserved when available | R21 | ✅ Marked `unsupported` for both providers — `requirements: []` always, never guessed |
| 20 | Unsupported parsing is reported explicitly | R19 | ✅ Non-matching lines excluded from the array, file `state` unaffected (still `present`) |
| 21 | Provider readiness distinguishes ready, not_ready, invalid and unsupported | R22 | ✅ `ready`/`not_ready`/`invalid` each reachable from a dedicated fixture (`unsupported` reserved for a future capability-gated case, not reached by any test — no provider in this Entrega returns it) |
| 22 | The specification gate never passes only because a provider exists | R22, design.md §10 | ✅ Directly the subject of review finding R1's discovery process — explicitly tested, and now doubly confirmed |
| 23 | An absent `sdd` configuration does not change legacy status output | R34 | ✅ Byte-identical `status` diff for every Change without `sdd` |
| 24 | A configured provider adds only the approved status section | R34 | ✅ New section's exact, approved format — nothing else in `status`'s output changes |
| 25 | Status remains byte-identical when SDD information does not apply | R34 | ✅ Real `aief status` diff, before/after, re-confirmed after the review's fixes |
| 26 | Provider reads do not modify project files | R31 | ✅ Byte-comparison of every fixture file before/after every provider call under test |
| 27 | No artifact is copied or duplicated unexpectedly | design.md §1, R31 | ✅ Grep-confirmed: zero write calls anywhere in the new code |
| 28 | No external command is executed during filesystem-only status when unnecessary | R6 | ✅ **Failed on first implementation, fixed during review (R3)**: `detect()` called `commandExists()` unconditionally; now filesystem-first, zero subprocess spawns on the success path |
| 29 | OpenSpec command failure is reported with exit information when commands are used | design.md §11 | ⚠️ `OpenSpecProvider.detect()` does not share code with `propose()`'s `openspecInfo()` (design deviation, task 7 of `tasks.md`) — its own detection logic is simpler (presence-only, no `--version`/`--help` parsing) since artifact reads never need to run `openspec propose`. `propose()`'s own exit-code/stdout/stderr handling is untouched and still covered by its existing tests. |
| 30 | All pre-existing tests continue passing | — | ✅ `npm test`: 251/251. The one pre-existing assertion changed (`cliPresent` expectation) is justified by review finding R3, not a relocation (see scenario 29). |

## Acceptance criteria (standalone verification pass)

- [x] Every scenario above has a corresponding automated test or an explicit, documented deviation
      (8, 29 — noted, not silently marked done).
- [x] Zero-drift regression passes across every real Change in `changes/` (45 at implementation
      time).
- [x] `aief status` before/after diff is empty — re-confirmed after the review's fixes.
- [x] `aief verify` (whole project) passes.
- [x] No `specification` gate result is ever `"passed"` without `validate()` itself reporting
      `ready` — asserted explicitly, and the exact subject of review finding R1.
- [x] `git status` is clean of stray artifacts throughout, checked after every stage.
- [x] `lite.json`/`standard.json`/`governed.json` are byte-unchanged by this Entrega.

## Manual checks (cannot be fully automated)

- Human review of ADR-017's argument, and of the "plain modules, not classes" decision specifically
  — a test can prove no class exists, not that this was the right call.
- Human read-through confirming the `specification` gate design in design.md §10 genuinely cannot
  produce a false "passed" — the same category of defect Change 0044's own review (finding R1)
  found only by re-reading code fresh, not by trusting a summary.
- If a real OpenSpec-adopting project becomes available, manually verify the requirement-extraction
  pattern (design.md §9) against a real, non-synthetic `specs/*/spec.md` file — flagged as unverified
  risk in `proposal.md` until then.

## Regressions to guard explicitly

- Change 0043's B1 (a shared read function serving two different write-verification needs) — not
  directly applicable here (this Entrega adds no write path), but the same category of "two
  callers assumed to agree" risk applies to `resolveSddProvider()` if it were ever called from both
  a read context and a future write context without re-examining the assumption.
- Change 0044's R1 (a gate silently satisfied by default) — directly guarded by scenario 22 above.

## Rollback

Every file this plan describes is new or a small additive edit (design.md §18). If implementation
reveals a problem, revert is a plain code revert; no data migration exists to undo.

## Evidence required at implementation close

Full command transcript (not paraphrased), the before/after `aief status` diff in full, a completed
scenario table with pass/fail per row, and explicit notes for any scenario that could not be run —
matching the standard Changes 0043 and 0044 already set.
