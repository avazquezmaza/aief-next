# Verification Plan — Entrega 2: Workflow Engine

**Executed.** This document was written as a plan before implementation; every command and
scenario below has now been run against the real implementation. Results are recorded inline.
Full transcript: `evidence.md`.

## Commands to run, in order (once implemented)

```bash
cd cli && npm test                                   # baseline before touching anything
node --test tests/workflow-definition.test.js
node --test tests/gate-evaluator.test.js
node --test tests/transition-engine.test.js
node --test tests/change-manifest.test.js             # L3 fix regression
node --test tests/change-loader.test.js               # track field regression
node --test tests/cli.test.js
cd .. && node cli/bin/aief.js status > /tmp/status-before.txt   # captured BEFORE any code change
#  ... implement ...
node cli/bin/aief.js status > /tmp/status-after.txt
diff /tmp/status-before.txt /tmp/status-after.txt      # must be empty — zero real Change has a track
cd cli && npm test                                     # full suite
node ../cli/bin/aief.js verify                         # whole-project verify (from repo root)
git status --porcelain                                 # must be clean of stray artifacts
```

## Fixtures needed

- A temp Change directory with no `manifest.json` (legacy — reuse existing `change-loader.test.js`
  fixtures).
- A temp Change directory with a valid Entrega-1-era manifest (no `track`).
- A temp Change directory with a valid manifest declaring each of `track: "lite"`,
  `track: "standard"`, `track: "governed"`.
- A temp Change directory with a manifest that is malformed JSON.
- A temp Change directory with a manifest that is valid JSON but fails `validateManifest()`.
- A temp Change directory where `manifest.json` is itself a directory (L3 regression).
- A temp Change directory with a manifest whose `track` is an unrecognized string (e.g. `"custom"`).
- A temp Change directory with a manifest whose `id`/`slug` disagree with its own directory name
  (M1/WF-R22).
- A temp Change directory with a manifest whose `status` disagrees with `change.md`'s own
  `## Status` (WF-R19).
- Per track, at least one fixture with `readiness` gate passing and one with it failing (missing/
  empty required files, or open tasks), to exercise both legal and illegal transitions.
- A malformed workflow-definition fixture (invalid JSON, or missing a required field) — this is an
  AIEF-internal-bug simulation, not a user-content test; used only to prove the CLI doesn't crash if
  it ever ships a broken definition file.

## Scenarios and results

Mapping the 20 scenarios from the commissioning request to the requirement(s) they verify and the
test that proves each:

| # | Scenario | WF-R | Test | Result |
|---|---|---|---|---|
| 1 | A missing manifest continues using the legacy path | WF-R17 | `change-loader.test.js` zero-drift regression | ✅ pass |
| 2 | A valid manifest loads normally | WF-R18 | `cli.test.js` "unaffected by H2's new section"; `change-loader.test.js` "resolves from the manifest" | ✅ pass |
| 3 | A present but invalid manifest produces an actionable error | WF-R1(c), WF-R3 | `cli.test.js` "reports a malformed manifest.json as invalid" + "structurally invalid manifest.json" | ✅ pass |
| 4 | An invalid manifest never falls back silently to legacy | WF-R2 | `cli.test.js` "does not fall back silently to legacy" | ✅ pass |
| 5 | A workflow definition loads correctly | WF-R5, WF-R6 | `workflow-definition.test.js` "all three real, shipped definitions load" | ✅ pass |
| 6 | An invalid workflow definition is rejected | WF-R6 | `workflow-definition.test.js` (8 structural-rejection tests) | ✅ pass |
| 7 | An unknown track is rejected | WF-R7 | `workflow-definition.test.js` "unknown track is rejected"; `cli.test.js` "reports an unrecognized track distinctly" | ✅ pass |
| 8 | Lite resolves its expected next action | WF-R13 | `transition-engine.test.js` "Lite resolves its expected next action"; `cli.test.js` (both pass/fail live) | ✅ pass |
| 9 | Standard requires review before close | WF-R14 | `transition-engine.test.js` + `cli.test.js` "never shows Standard resolving to close" | ✅ pass |
| 10 | Governed represents approval and security review gates | WF-R8, WF-R14 | `transition-engine.test.js` + `gate-evaluator.test.js` + `cli.test.js` "represents Governed's ... gates as pending, never passed" | ✅ pass |
| 11 | A failed blocking gate prevents transition | WF-R10, WF-R11 | `transition-engine.test.js` "a failed blocking gate prevents reaching close"; `isTransitionLegal` rejection test | ✅ pass |
| 12 | A warning does not prevent transition | WF-R10 | `transition-engine.test.js` "a warning-status gate never blocks"; `cli.test.js` "warning (identity mismatch) without blocking" | ✅ pass |
| 13 | An invalid transition is rejected | WF-R11 | `transition-engine.test.js` "isTransitionLegal: an invalid transition ... is rejected" | ✅ pass |
| 14 | A valid transition is accepted | WF-R11 | `transition-engine.test.js` "isTransitionLegal: a valid transition ... is accepted" | ✅ pass |
| 15 | Next action is derived deterministically | WF-R23 | `transition-engine.test.js` "is deterministic — the same inputs produce deep-equal output" | ✅ pass |
| 16 | Legacy Changes remain readable | WF-R17 | `change-loader.test.js` zero-drift regression | ✅ pass |
| 17 | Legacy status output remains compatible | WF-R15 | Live `aief status` diff, before/after every Etapa — byte-identical each time | ✅ pass |
| 18 | Manifest and change.md inconsistencies are detected | WF-R19 | `gate-evaluator.test.js` "status_consistency warns ... when change.md's ## Status disagrees" | ✅ pass |
| 19 | Close cannot reproduce the B1 divergence | WF-R20 | `cli.test.js` "close succeeds on a Governed Change even though its 'approval' ... gate is permanently pending"; live reproduction (see evidence.md) | ✅ pass |
| 20 | No user file is overwritten unexpectedly | WF-R24 | `git status --porcelain` checked clean after every Etapa (A–F); B1-extension test asserts `manifest.json` byte-unchanged after `close` | ✅ pass |
| 21 | All pre-existing tests continue passing | — | `npm test`: 195/195 (149 baseline + 46 new (42 from Etapas B–F, 4 from the adversarial review)) | ✅ pass |

No scenario could not be run — every one above has a passing, named test or a live reproduction
recorded in `evidence.md`.

## Acceptance criteria (repeated here for a standalone verification pass, not just spec.md)

- [x] Every scenario above has a corresponding automated test, named clearly enough to state which
      branch/case it covers (Change 0043's own lesson — a test name is a claim).
- [x] Zero-drift regression passes across every real Change in `changes/` (44, including this
      Change's own directory).
- [x] `aief status` before/after diff is empty — checked repeatedly (Etapas B, E, F), not once.
- [x] `aief verify` (whole project) passes.
- [x] No `status: "passed"` is ever produced for `review`/`approval`/`security_review` anywhere in
      the test suite — asserted explicitly, not just absent by omission (`gate-evaluator.test.js`,
      `assert.notEqual(gate.status, "passed", ...)`).
- [x] `git status` is clean of stray artifacts at the end of the verification pass (Change 0043's
      finding F7 — routine discipline, not optional). Checked after every Etapa.

## Manual checks (cannot be fully automated)

- Human review of ADR-016's argument itself — automated tests cannot verify that an architectural
  justification is *sound*, only that the code matches what the ADR says it does.
- Human read-through of `design.md` §6's state-model table against the actual shipped code, to
  confirm nothing beyond `track` ended up persisted (a test can check today's fixtures; it can't
  guarantee a future edit doesn't quietly add a new persisted field without updating this table).
- Manual confirmation that the honest-incompleteness `next_action` messages (WF-R14) read clearly
  to a human, not just structurally correct to a test.

## Evidence required at implementation close

- Full transcript of every command in "Commands to run," with actual output (not paraphrased),
  matching the standard this repository's own Changes hold each other to (Change 0043's
  `evidence.md` as the reference example).
- The before/after `aief status` diff, attached or quoted in full.
- A completed version of the scenario table above with pass/fail per row, not just "all passed."
- Explicit note of any scenario that could not be run and why (per the commissioning instruction:
  "registra cualquier prueba que no puedas ejecutar").
