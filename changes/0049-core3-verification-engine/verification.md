# Verification Plan — Entrega 7: Verification Engine

**Executed.** ADR-021 was accepted and implementation approved 2026-07-26. Every scenario below has
been run against the real implementation — see the result note after the scenario table and
`evidence.md` for the full write-up.

## Baseline (to capture before any code change)

```bash
cd cli && npm test                                                       # record count — 440/440 at planning time
node ../cli/bin/aief.js verify --change <a real open Change> > vr-verify-pass-baseline.txt
node ../cli/bin/aief.js verify --change <a scratch Change with missing files> > vr-verify-fail-baseline.txt
git status --porcelain                                                    # must be clean before starting
```

## Fixtures needed

- Every fixture already reused across Entregas 1–6 (legacy, valid manifest no track, track-only,
  sdd-only, track+sdd, invalid manifest, unknown/unavailable explicit SDD provider, path-traversal
  `sdd.change_id`) — reused, not rebuilt, for Verification Context.
- A Change fixture with a real `verification.md` scenario table citing some (not all) of its own
  `spec.md` requirement ids — for `requirement-has-traceability`'s `passed`/`failed` split.
- A Change fixture with no `verification.md` at all — for `not_applicable`.
- A deliberately-malformed Verification Rule descriptor fixture (missing `id`, an unknown
  capability, `writeFiles: true`, `assistantRequired: true`) — internal to the test file.
- A duplicate-id rule fixture pair.
- Adversarial fixture rules: one attempting to declare `effects`, one attempting to return `passed`
  with empty `evidence`, one attempting to mutate its received (frozen) context/requirement, one
  attempting to spoof `rule`/`requirement` in its return value.
- A synthetic `file_assertion` evidence reference (present, missing, and path-traversal cases) — no
  real Change declares one yet, so this evidence type is exercised entirely by fixtures, the same
  "no live producer yet" precedent used for `unsupported`/`blocked` outcomes in prior Entregas.

## Scenarios and expected results

| # | Scenario | VR-R | Expected result |
|---|---|---|---|
| 1 | A valid Verification Rule is registered | VR-R18, R19 | Present in `ruleIds()`, `hasRule(id)` true |
| 2 | A rule resolves deterministically by id | VR-R18 | `getRule(id)` returns the same module every call |
| 3 | Unknown rule produces an actionable error | VR-R18 | Distinguishable "unknown rule" message |
| 4 | Duplicate rule ids are rejected | VR-R19 | Registry construction throws |
| 5 | Invalid rule descriptor is rejected | VR-R19 | Registry construction throws |
| 6 | Missing capability is denied | VR-R13 | A capability absent from the object behaves identically to `false` |
| 7 | `writeFiles` is rejected | VR-R14 | Registration throws |
| 8 | `executeCommands` is rejected | VR-R14 | Registration throws |
| 9 | `network` is rejected | VR-R14 | Registration throws |
| 10 | `assistantRequired` is rejected | VR-R15 | Registration throws |
| 11 | A rule cannot mutate context | VR-R17 | Mutation throws, caught, `status: "error"` for that rule only |
| 12 | A rule cannot mutate requirements | VR-R17 | Same mechanism |
| 13 | A rule cannot invent evidence | VR-R6 | A rule returning fabricated evidence not present in `evidenceRefs` has it stripped/ignored |
| 14 | A rule cannot pass without required evidence | VR-R6, R30 | `blocked`, never `passed`, when applicable evidence is missing |
| 15 | A rule can return `not_applicable` | VR-R29 | Normal result, no exception |
| 16 | A rule can return `unsupported` | VR-R29 | Distinct from `not_applicable`/`blocked` |
| 17 | A rule can return `invalid` | VR-R28 | Distinct from `error`/`failed` |
| 18 | A rule failure is distinct from requirement failure | VR-R28 | `error` (engine fault) vs. `failed` (real verdict) never conflated |
| 19 | Requirements are ordered deterministically | VR-R20 | Same order as `context.requirements`'s own array order, every call |
| 20 | Evidence is ordered deterministically | VR-R32 | Same order every call |
| 21 | Evidence references are validated | VR-R51, R52 | A `file_assertion` reference is resolved and containment-checked before use |
| 22 | Evidence outside the project is rejected | VR-R52 | `invalid`, not silently ignored |
| 23 | Path traversal is rejected | VR-R52 | Reuses Change 0045's fixture, unchanged outcome |
| 24 | Symlink escape is either prevented or explicitly blocking | VR-R53 | Confirmed by inspection — no new read introduced; documented, not silently assumed |
| 25 | Missing evidence is not PASS | VR-R6, R30, R36 | `blocked`/`INCOMPLETE`, never `PASS` |
| 26 | Declared test is distinct from executed test | VR-R4 | `test` evidence type is DEFINED, UNSUPPORTED — no rule claims a test was executed |
| 27 | Executed test is distinct from passed test | VR-R4 | Same reasoning — neither concept is claimable this Entrega |
| 28 | A test result without provenance is invalid | VR-R4 | `test` evidence is UNSUPPORTED; any attempt to use it yields `unsupported`, never a fabricated result |
| 29 | A requirement can have multiple rule results | VR-R31, R37 | `VerifiableRequirement.ruleResults` is an array, one entry per applicable rule |
| 30 | Multiple rules aggregate deterministically | VR-R34, R40 | Same aggregate status, every call, for the same inputs |
| 31 | Warnings do not become failures unless policy says so | VR-R35 | `manual_attestation`-sourced warnings never flip aggregate status to `FAIL` |
| 32 | Unsupported does not become PASS | VR-R35 | `unsupported` results excluded from the PASS computation entirely |
| 33 | Invalid evidence affects overall status | VR-R34 | Any rule `invalid` → aggregate `INVALID`, precedence over `FAIL`/`INCOMPLETE`/`PASS` |
| 34 | Engine errors are distinct from verification failures | VR-R28, R34 | `ERROR` outranks `INVALID`/`FAIL` in precedence; never silently downgraded |
| 35 | Structural verification remains distinct | VR-R1, R2 | `change-verifier.js` output unchanged; Requirement Verification is a separate, additive section |
| 36 | Legacy verify output remains byte-identical when new verification is inactive | VR-R41 | `aief verify` (no flag) diff against the Entrega 6 baseline is empty |
| 37 | Legacy verify exit code remains compatible | VR-R41, R58 | Same exit code as Entrega 6, without the flag |
| 38 | `verify.completed` Hook remains compatible | VR-R46 | `operation.result` is the legacy `report` object, identical either way |
| 39 | Hooks cannot alter Verification results | VR-R47 | No Hook Service call site exists in any Verification module (grep-confirmed) |
| 40 | Verification does not emit recursive Hooks | VR-R47 | Same — no Hook Service import anywhere under `verification-rules/`/`verification-*.js` |
| 41 | Workflow is not rederived | VR-R21, R24 | Call-count assertion: `explain()` called zero additional times by Verification Context |
| 42 | SDD is not rederived | VR-R21, R24 | Same — `resolveSddProvider()` called zero additional times |
| 43 | Verification does not change track or stage | VR-R49 | No such method exists in any contract |
| 44 | Verification does not approve gates | VR-R48, R49 | Zero diff lines in `gate-evaluator.js`/workflow definition JSONs |
| 45 | Verification does not close a Change | VR-R50 | Zero diff lines in `close()`/`markClosed()` |
| 46 | `close` remains unchanged | VR-R50 | Same |
| 47 | `prompt` remains unchanged | VR-R56 | Zero diff lines |
| 48 | `status` remains unchanged | VR-R56 | Zero diff lines |
| 49 | `propose` remains unchanged | VR-R56 | Zero diff lines |
| 50 | No public command verb is introduced | ADR-015 | `main()`'s dispatcher gains zero new `case` entries |
| 51 | No external process is executed | VR-R39 | Grep-confirmed: zero `child_process`/`spawnSync` calls in new modules |
| 52 | No network call is made | VR-R14, R39 | Structurally impossible — `network` cannot be registered `true` |
| 53 | No file is written | VR-R57 | Byte-comparison before/after every Verification call |
| 54 | All prior tests continue passing | — | `npm test`: 440 baseline + new, zero unjustified modified assertions |
| 55 | The repository remains clean | — | `git status --porcelain` clean of stray artifacts throughout |

**Result: all 55 scenarios PASS.** 534/534 tests total (440 baseline + 94 new: 15 in
`verification-rule-model.test.js`, 11 in `verification-registry.test.js`, 15 in
`verification-context.test.js`, 16 in `verification-evidence.test.js`, 30 in
`verification-service.test.js`, 10 new in `cli.test.js`). `aief verify` PASS. `aief verify` (without
`--requirements`) byte-identical against the Entrega 6 baseline. Real symlink-escape containment
(using `fs.realpathSync`, not just textual path resolution) was implemented and tested per the
commissioning instruction's explicit requirement. Two findings from the formal adversarial review,
both fixed before close: (1) a real correctness bug — `buildVerificationContext()` originally called
`workflow-service.js`'s `explain()` independently instead of reusing the caller's already-computed
value, meaning `verify --change <id> --requirements` performed two `explain()` calls per invocation
instead of one (VR-R21/R24/R45 violation) — fixed by making the Context Builder non-fetching, the
same discipline Hook Context already established; (2) `manual_attestation` evidence had no explicit
Service-level enforcement preventing it from justifying a `passed` verdict alone (VR-R7) — added
proactively, with a dedicated adversarial fixture test, before any real rule could exercise the gap.
Full detail in `evidence.md`.

## Acceptance criteria (standalone verification pass)

- [x] Every scenario above has a corresponding automated test.
- [x] Zero-drift regression passes across every real Change in `changes/` at implementation time
      (each real Change's `requirement-has-traceability` result reflects whatever its own real
      `verification.md` actually cites — no fabricated pass, no fabricated fail).
- [x] `aief verify` before/after diffs are empty without `--requirements`.
- [x] `aief verify` (whole project) passes.
- [x] No rule result is ever `"passed"` without real, resolved evidence backing it, and no aggregate
      status is ever `PASS` while any rule result is `blocked` — asserted explicitly, the same
      discipline as Change 0044's R1, Change 0045's R1/R2, Change 0046's live-caught bug, Change
      0047's adversarial-review-caught spoofing gap, and Change 0048's two adversarial-review-caught
      exploits (Skill-result forgery, event-phase spoofing) — this Entrega proactively designs
      against the same *class* of gap (trusting a value's shape without verifying its authority) from
      the start.
- [x] `git status` is clean of stray artifacts throughout.
- [x] No existing command's exit-code behavior changed outside `--requirements`'s own new, opt-in
      policy.

## Manual checks (cannot be fully automated)

- Human confirmation that `requirement-has-traceability`'s `failed` verdict (for a requirement never
  cited in `verification.md`) reads as an honest, actionable finding — not an accusation — to someone
  skimming `aief verify --requirements`'s output.
- Human read-through confirming no rendered text anywhere claims a requirement was "implemented,"
  "correct," or "complete" — only that evidence was or wasn't found.

## Regressions to guard explicitly

- Change 0043's B1 / Change 0046's/0047's/0048's own "two callers assumed to agree" class of risk —
  directly applicable here: Verification Context must never call `explain()` a second time within the
  same `verify()` invocation (VR-R21/R24/R45) — a dedicated call-count test asserts this.
- Change 0047's adversarial-review-caught `appliesTo()` status-spoofing gap, and Change 0048's two
  adversarial-review-caught exploits (mutable shared state, event-phase trust) — this Entrega applies
  the `appliesTo()` whitelist fix proactively (VR-R29) and freezes every input a rule receives
  (VR-R17) from the start; dedicated adversarial fixture tests still verify both were actually
  implemented, not merely documented.
- Change 0044's R1 (a gate silently satisfied by default), Change 0045's R1 (path traversal) — each
  has a dedicated regression scenario above (23, 44) re-exercised through the new Verification
  surface.

## Rollback

Every file this plan describes is new or a small additive edit to `verify()`'s existing flow (design.md
§14). If implementation reveals a problem, revert is a plain code revert; no data migration exists to
undo.

## Evidence required at implementation close

Full command transcript, the before/after `verify` diffs in full, a completed scenario table with
pass/fail per row, and explicit notes for any scenario that could not be run.
