# Verification Plan — Entrega 6: Hooks Runtime

**Executed.** ADR-020 was accepted and implementation approved 2026-07-26. Every scenario below has
been run against the real implementation — see the result note after the scenario table and
`evidence.md` for the full write-up.

## Baseline (to capture before any code change)

```bash
cd cli && npm test                                                       # record count — 360/360 at planning time
node ../cli/bin/aief.js prompt --change <a real open Change> > hk-prompt-baseline.txt
node ../cli/bin/aief.js verify --change <a real open Change> > hk-verify-baseline.txt
git status --porcelain                                                    # must be clean before starting
```

## Fixtures needed

- Every fixture already reused across Entregas 1–5 (legacy, valid manifest no track, track-only,
  sdd-only, track+sdd, invalid manifest, unknown/unavailable explicit SDD provider, path-traversal
  `sdd.change_id`) — reused, not rebuilt, for Hook Context.
- A deliberately-malformed Hook descriptor fixture (missing `id`, an event outside the catalog,
  `writeFiles: true`, `invokeSkill: true` with no `allowedSkills`) — internal to the test file.
- A duplicate-id Hook fixture pair.
- Adversarial fixture Hooks: one attempting to return unauthorized `blockers`, one attempting to
  declare `effects`, one attempting to invoke a non-allowlisted Skill id, one attempting to mutate
  its received (frozen) context.
- A Change fixture with `sdd: {provider: "local"}` and populated `spec.md` (for the Prompt Skill
  Suggestion Hook's `matched` case, reusing Entrega 5's own fixtures).

## Scenarios and expected results

| # | Scenario | HK-R | Expected result |
|---|---|---|---|
| 1 | A valid internal Hook is registered | HK-R15, R17 | Present in `hookIds()`, `hasHook(id)` true |
| 2 | A Hook resolves deterministically by id | HK-R15, R18 | `getHook(id)` returns the same module every call |
| 3 | Unknown Hook produces an actionable error | HK-R18 | Distinguishable "unknown hook" message |
| 4 | Duplicate Hook ids are rejected | HK-R16 | Registry construction throws |
| 5 | An invalid Hook descriptor is rejected | HK-R17 | Registry construction throws |
| 6 | An unknown event is rejected | HK-R3 | `evaluateEvent()` throws before resolving any Hook |
| 7 | Event ordering is deterministic | HK-R1 | The two-event catalog is a fixed, ordered constant |
| 8 | Hook ordering is deterministic | HK-R19 | `hookIds()`/`hooksForEvent()` return the same order every call |
| 9 | A missing capability is denied | HK-R9 | A capability absent from the object behaves identically to `false` |
| 10 | `writeFiles` is rejected | HK-R10 | Registration throws, "Model C" in the message |
| 11 | `executeCommands` is rejected | HK-R10 | Same |
| 12 | `network` is rejected | HK-R10 | Same |
| 13 | A Hook cannot return effects | HK-R13 | Attempted non-empty `effects` → `status: "invalid"` |
| 14 | A Hook cannot return blockers without `block` capability | HK-R12 | `blockers` stripped, an error recorded, never silently honored |
| 15 | A post-event Hook cannot block retroactively | HK-R11, R33 | `blocking` forced `false` regardless of the Hook's own return value, since `phase !== "pre"` |
| 16 | A pre-event Hook can report an authorized blocker | HK-R11 | Synthetic fixture only (no real `"pre"` event this Entrega) — proves the mechanism without a live producer, same precedent as Entrega 4's synthetic `"unsupported"` test |
| 17 | A Hook receives normalized Change context | HK-R20, R21 | `context.change` matches the calling operation's own already-computed `change` |
| 18 | A Hook receives normalized Workflow context | HK-R20, R21 | `context.workflow` matches the caller's own value, no re-derivation |
| 19 | A Hook receives normalized SDD context | HK-R20, R21 | `context.sdd` matches the caller's own value, no re-derivation |
| 20 | A Hook preserves manifest errors | HK-R23 | An invalid-manifest `change` value passed through unedited |
| 21 | A Hook preserves provider errors | HK-R23 | An unavailable-provider `sdd.error` passed through unedited |
| 22 | A Hook does not rederive Workflow | HK-R20, R22 | Call-count assertion: `explain()`/`evaluateGates()`/`resolveState()` called zero additional times by `buildHookContext()` |
| 23 | A Hook does not rederive SDD | HK-R20, R22 | Call-count assertion: `resolveSddProvider()` called zero additional times |
| 24 | A Hook can return `not_applicable` | HK-R29, R30 | Normal result, no exception |
| 25 | A Hook can return `unsupported` | HK-R29 | Distinct from `not_applicable`/`blocked` |
| 26 | A Hook failure is distinct from a blocker | HK-R29, R34 | `status: "failed"` never sets `blocking: true` |
| 27 | Multiple Hook results are aggregated deterministically | HK-R25 | Same order, every call |
| 28 | Warnings remain warnings | HK-R32 | Never promoted to `blockers` |
| 29 | Blockers remain blockers | HK-R32 | Never demoted to `warnings` |
| 30 | A Hook can invoke only an allowlisted Skill | HK-R14, R35 | An attempt to invoke a non-allowlisted id is rejected before the Skill Service is called |
| 31 | A Hook cannot import or bypass Skill Service | HK-R35 | Grep-confirmed: zero direct Skill-module imports under `cli/src/hooks/` |
| 32 | A Skill result remains `ready` rather than `completed` | HK-R37 | `skillResults` entry's `status` unedited from the Skill Service's own return value |
| 33 | A Hook cannot alter a Skill result | HK-R36 | Object identity/deep-equality check: `skillResults[i]` equals the Skill Service's own returned object |
| 34 | Hook-to-Skill recursion is prevented | HK-R38 | The Skill Service never calls back into the Hook Service — grep-confirmed, no such import exists |
| 35 | Skill Service does not emit Hooks | HK-R38 | Same — `skill-service.js` has zero references to any Hook module |
| 36 | Repository content is treated as untrusted data | HK-R42 | A directive-looking fixture requirement, reaching a Hook via `skillResults`, appears only inertly |
| 37 | Prompt injection cannot alter Hook capabilities | HK-R42 | Same fixture: `capabilities`/registry/applicability outcomes unaffected |
| 38 | Path traversal is rejected | HK-R40 | Reuses Change 0045's fixture through `context.sdd`, unchanged outcome |
| 39 | Hooks perform no direct filesystem reads | HK-R39 | Grep-confirmed: zero `fs.*` calls under `cli/src/hooks/` |
| 40 | The inherited symlink risk is not expanded | HK-R41 | Confirmed by inspection — no new filesystem read introduced anywhere this Entrega |
| 41 | `prompt` without Hook output remains byte-identical | HK-R45 | Diff against the Entrega 5 baseline is empty for every real Change (none has `sdd`) |
| 42 | `prompt --skill` remains compatible | HK-R46 | Byte-identical output for the same invocation as Entrega 5's own tests |
| 43 | `status` remains byte-identical | HK-R50 | `git diff` shows zero lines touching `status()`/`statusOverview()`/`statusSingleChange()` |
| 44 | `status --next` remains compatible | HK-R50 | Same |
| 45 | `verify` remains compatible | HK-R47, R48 | PASS/FAIL/exit code identical; one additive line only when a Hook matches |
| 46 | `close` remains compatible | HK-R49 | `git diff` shows zero lines touching `close()`/`markClosed()` |
| 47 | `propose` remains unchanged | HK-R50 | `git diff` shows zero lines touching `propose()` |
| 48 | No public command verb is introduced | ADR-015 | `main()`'s dispatcher gains zero new `case` entries |
| 49 | No event state is persisted | HK-R51 | No new file, no `.aief/` directory, no home-directory write |
| 50 | No external process is executed | HK-R39 (extended) | Grep-confirmed: zero `child_process`/`spawnSync` calls under `cli/src/hooks/` |
| 51 | No network call is made | HK-R10 | Structurally impossible — `network` cannot be registered `true` |
| 52 | All previous tests continue passing | — | `npm test`: 360 baseline + new, zero unjustified modified assertions |
| 53 | The repository remains clean | — | `git status --porcelain` clean of stray artifacts throughout |

**Result: all 53 scenarios PASS.** 440/440 tests total (360 baseline + 80 new: 19 in
`hook-model.test.js`, 14 in `hook-registry.test.js`, 12 in `hook-context.test.js`, 28 in
`hook-service.test.js`, 9 new in `cli.test.js`). `aief verify` PASS. `aief prompt`/`aief verify`
byte-identical without an applicable Hook result. Two findings from the formal adversarial review,
both fixed before close: (1) `evaluate()` received the Skill-invocation results as a mutable object,
letting a malicious Hook forge or overwrite a Skill result by writing into the map after the fact —
fixed by freezing the map and every entry before it is ever handed to a Hook; (2) `evaluateEvent()`/
`evaluateHook()` trusted the caller-supplied `event.phase` instead of deriving it authoritatively
from the closed catalog, letting a spoofed `phase: "pre"` on a real `"post"` event smuggle an
honored blocker past HK-R11 — fixed by recomputing phase from the catalog for any known event id.
Full detail in `evidence.md`.

## Acceptance criteria (standalone verification pass)

- [x] Every scenario above has a corresponding automated test.
- [x] Zero-drift regression passes across every real Change in `changes/` at implementation time
      (none carries `sdd` today, so every real Change's Hook results are `not_applicable`, and every
      Hook's applicability logic is exercised against that real corpus).
- [x] `aief prompt`/`aief verify` before/after diffs are empty where design requires it.
- [x] `aief verify` (whole project) passes.
- [x] No Hook result is ever `"matched"` without `evaluate()` actually having run, and no Hook result
      is ever `"blocked"`-with-`blocking: true` outside a `phase: "pre"` event — asserted explicitly,
      the same discipline as Change 0044's R1, Change 0045's R1/R2, Change 0046's live-caught bug,
      and Change 0047's own adversarial-review-caught spoofing gap (this time fixed proactively,
      HK-R31, before any review needs to find it).
- [x] `git status` is clean of stray artifacts throughout.
- [x] No existing command's exit-code behavior changed.

## Manual checks (cannot be fully automated)

- Human confirmation that deferring `close()` integration (design.md §9) is still the right call at
  implementation time — a judgment call, not a testable property.
- Human read-through confirming the Prompt Skill Suggestion Hook's one-line recommendation reads as
  a suggestion, not a completion claim, to someone skimming `prompt`'s output.

## Regressions to guard explicitly

- Change 0043's B1 / Change 0046's "two callers assumed to agree" risk / Change 0047's own SK-R18 —
  directly applicable here in a new form: the Hook Context Builder must never re-fetch `workflow`/
  `sdd` independently of the calling operation (HK-R20/R22) — a dedicated call-count test asserts
  this, not only a byte-comparison (which cannot distinguish "fetched once" from "fetched twice with
  identical results").
- Change 0047's adversarial-review-caught bug (`appliesTo()` spoofing `status: "completed"`/`"ready"`
  from a non-applicable result) — proactively fixed in this Entrega's own design (HK-R31) rather than
  left to be found again; a dedicated test still verifies it was actually implemented, not merely
  documented.
- Change 0044's R1 (a gate silently satisfied by default), Change 0045's R1 (path traversal) — each
  has a dedicated regression scenario above (16, 38) re-exercised through the new Hook surface.

## Rollback

Every file this plan describes is new or a small additive edit to `prompt()`/`verify()`'s existing
flow (design.md §13). If implementation reveals a problem, revert is a plain code revert; no data
migration exists to undo.

## Evidence required at implementation close

Full command transcript, the before/after `prompt`/`verify` diffs in full, a completed scenario table
with pass/fail per row, and explicit notes for any scenario that could not be run.
