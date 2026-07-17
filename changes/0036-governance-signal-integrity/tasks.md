# Tasks

> Scope: F1–F3 only. F4 is design-only; F5/F6 are evidence-only. See `design.md`.
> Baseline captured before any edit, so the before/after is evidence, not memory.

## Baseline (before any change)

- [x] B1 Record `aief verify` against Flux Portal **before** the fix (13/13 read as open;
      FAIL on six missing `spec.md`; 0003/0005 reported "evidence not completed yet").
- [x] B2 Record `npm test` (cli) green **before** the fix.
- [x] B3 Record `aief verify` on AIEF itself **before** the fix (the regression baseline).

## Implementation — F1 (status parsing)

- [x] 1.1 Add `parseChangeStatus(changeMd)` to `cli/src/core/domain/change.js` →
      `{ state: "closed"|"open"|"unknown", token, raw, declarations }`.
- [x] 1.2 Declaration model: `## Status` heading (next non-empty line) + unqualified
      `Status:` label (emphasis/blockquote tolerated). Reject `Status (orig):`,
      `Status confirmed by …`, `Status field added …`.
- [x] 1.3 Normalise: strip blockquote/emphasis, take the leading token, uppercase.
- [x] 1.4 Vocabulary: `CLOSED` → closed; `OPEN/PROPOSED/DRAFT/IN PROGRESS/WIP/PENDING/
      ACTIVE/TODO` → open; anything else → `unknown`. Absence → `open`, no error.
- [x] 1.5 Contradiction between unqualified declarations → `unknown` (never "first wins").
- [x] 1.6 Keep `isClosedContent()` working, now delegating to the parser
      (`state === "closed"`), so existing callers are untouched.
- [x] 1.7 Expose `statusState` / `statusRaw` on `loadChange()` for the verifier.

## Implementation — F3 (evidence classification)

- [x] 3.1 Add `classifyEvidence(evidenceMd)` → `"placeholder"|"partial"|"complete"`
      using substantive-line dominance, not an absolute `Pending.` count.
- [x] 3.2 Keep `isEvidencePlaceholderContent()` (compat) = `classifyEvidence() ===
      "placeholder"`; expose `evidenceState` on `loadChange()`.
- [x] 3.3 `checkChangeReadiness()` blocks when evidence is **not** `complete`, with a
      message that distinguishes placeholder from partial.
- [x] 3.4 `verify`'s "Next:" hint follows the classification (`complete` → `aief close`).
- [x] 3.5 Per-Change line distinguishes placeholder vs partial vs complete.

## Implementation — F1/F3 in the verifier

- [x] 2.1 `change-verifier.js`: `unknown` status → **explicit error** quoting the raw
      value and naming the accepted forms. Never silent.
- [x] 2.2 Keep every existing report line/level for unaffected Changes (no output churn).

## Implementation — F2 (the gate)

- [x] 4.1 Add the CI workflow template (`cli/templates/ci/aief-verify.yml`) that runs
      `aief verify`.
- [x] 4.2 `runAdoption()` writes `.github/workflows/aief-verify.yml`, records it as an
      artifact, and **never overwrites** an existing file.
- [x] 4.3 No new core capability — `aief verify` already exits 1 on FAIL (verified).

## Documentation

- [x] 5.1 Document the adoption mechanism + the non-GitHub path (the gate is one
      command) in `docs/` and link it from the adoption flow.
- [x] 5.2 `docs/dogfooding-findings.md`: F1–F6 recorded with severity, evidence, impact,
      cause, decision, horizon, state. *(done before this Change was opened)*
- [x] 5.3 `docs/proposals/f4-adr-openspec-declaration.md` — **design only**, not
      implemented here.
- [x] 5.4 F5/F6 documented as deferred evidence (heuristics + false-positive risks +
      what would promote them). *(in dogfooding-findings.md)*

## Verification

- [x] 6.1 New unit tests **F1** (`cli/tests/change-status.test.js`) using the **real**
      Flux formats: `Closed (date)`, `**CLOSED** (date; note)`, `> **Status: CLOSED …**`,
      `CLOSED · ARCHIVED`, `CLOSED — CUTOVER EXECUTED…`, the `Status (orig):` decoy,
      absence, uninterpretable, contradiction.
- [x] 6.2 New unit tests **F3** (`cli/tests/evidence-classification.test.js`) with
      fixtures derived from Flux 0003/0005 (688/496 lines, 3 `Pending.`) and the
      untouched template.
- [x] 6.3 Register both test files in `cli/package.json`.
- [x] 6.4 Run the full suite — all green.
- [x] 6.5 `aief verify` against Flux Portal **after**: 13/13 closed; 0003/0005 complete;
      still FAIL on the six missing `spec.md` (correct — that signal must survive).
- [x] 6.6 Regression: `aief verify` on AIEF itself still passes (36 Changes,
      `Closed (date)` format).
- [x] 6.7 Gate demo: fails with missing artifacts (Flux, exit 1), passes on a healthy
      project (exit 0).
- [x] 6.8 Gate demo: `aief adopt` in a scratch project writes the workflow; a second run
      does not overwrite it.
- [x] 6.9 Prove F2's claim: Flux Portal would have failed **from Change 0008** — verify
      against a tree containing only Changes 0001–0008.
- [x] 6.10 Confirm OpenSpec and SpecBoot untouched; no `git add`/`commit`/`push`.

## Evidence

- [x] 7.1 Update `evidence.md`: before/after, commands, results, what remains pending.

## Human gates

- [ ] (human) Approve the F1 vocabulary decision — `COMPLETE`/`PASS` deliberately map to
      **`unknown` + loud error** rather than to `closed`. This is intent-guessing vs
      honest failure, and Flux Portal wrote both words meaning "done".
- [ ] (human) Approve shipping a **GitHub Actions** workflow from `aief adopt` in an
      otherwise CI-agnostic tool (documented alternative: one command, any CI).
- [ ] (review) Independent review that F1–F3 changed **no** behaviour beyond the three
      defects, and that F4/F5/F6 remain unimplemented.
