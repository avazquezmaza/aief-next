# Evidence

## Summary

F1–F3 implemented and verified against the **real** repository that produced the
findings (Flux Portal, `trk-orchestrator-portal`) and against AIEF itself as the
regression baseline. Every number below was measured, before and after.

| | Before | After |
|---|---|---|
| Flux Changes read as closed (parser) | **0 / 13** | **13 / 13** |
| Flux Changes shown `(closed)` by `verify` | 0 | **7** (the other 6 are outranked by their own `spec.md missing` error — correct) |
| Flux 0003 / 0005 evidence (688 / 496 lines, 3 `Pending.`) | `placeholder` → "evidence not completed yet" | **`complete`** |
| `verify` hint for finished work | `aief prompt` (redo it) | **`aief close`** |
| Uninterpretable status | silent `false` → "open" | **explicit error, run FAILs** |
| CI gate delivered at adoption | none | **`.github/workflows/aief-verify.yml`** |
| `cli` test suite | 93 pass | **121 pass** (+28) |
| AIEF's own `aief verify` | PASS | **PASS** (no regression) |

## Activities Performed

### F1 — status parsing (`cli/src/core/domain/change.js`)

Replaced the round-trip regex with a **declaration model**: find a label that means
"here is the status" (`## Status` heading, or an *unqualified* `Status:` possibly wrapped
in emphasis/blockquote), read its value tolerantly, classify the leading token.

- `parseChangeStatus()` → `{ state: "closed" | "open" | "unknown", token, raw, declarations }`.
- `unknown` is the new, load-bearing outcome: **a status was declared and could not be
  interpreted**. It is an error, never a fallback to "open".
- Vocabulary kept deliberately small; `COMPLETE`/`PASS` map to `unknown` **on purpose**
  (Flux wrote both meaning "done" — guessing intent is how a parser starts lying).
- `isClosedContent()` kept as the name every caller imports, now delegating.

### F3 — evidence classification (`cli/src/core/domain/change.js`)

`classifyEvidence()` → `placeholder` | `partial` | `complete`, by **placeholder
dominance** over substantive lines rather than an absolute `Pending.` count (any absolute
threshold is wrong at some document size).

### F1/F3 surfaced (`cli/src/core/services/change-verifier.js`)

- `unknown` status → explicit error quoting the raw value and naming accepted forms.
- Readiness blocks unless evidence is `complete` (placeholder **and** partial still
  block — the safety property is preserved; the false positive is gone).
- `verify`'s "Next:" hint follows the classification, in both project and single-Change mode.

### F2 — the gate (`cli/src/cli.js`, `cli/templates/ci/aief-verify.yml`, `docs/ci-gate.md`)

`runAdoption()` now writes `.github/workflows/aief-verify.yml`, records it as an adoption
artifact, and never overwrites it. **No new core capability**: `aief verify` already
exited non-zero on FAIL (verified below).

## Verification

Reproduce from the AIEF repo root unless stated otherwise.

### 1. Suite (baseline → after)

```bash
cd cli && npm test
# before: # tests 93   # pass 93   # fail 0
# after:  # tests 121  # pass 121  # fail 0
```

New: `cli/tests/change-status.test.js` (F1), `cli/tests/evidence-classification.test.js`
(F3), both registered in `cli/package.json`. Fixtures are copied from **real** Flux
`change.md` files, including the decoys that break a naive parser:
`Status (orig): PASS`, `Status confirmed by …`, `*Status field added …*`.

### 2. Regression caught during implementation (and fixed)

The existing test *"missing evidence.md is reported as missing, not as placeholder"*
failed on the first draft: an absent file (content `""`) classified as `placeholder`, so
one problem was reported twice under two names. The test was right; the code was wrong.
Fixed by classifying "no placeholder markers at all" as `complete` and letting
`missing`/`empty` own that case. **93/93 restored before continuing.**

### 3. F1 against the real repository

```bash
# in trk-orchestrator-portal
node …/cli/bin/aief.js verify | grep -c '(closed)'
# before: 0        after: 7
```
Parser-level, all 13 (`parseChangeStatus` over each `changes/*/change.md`):
**before 0/13 closed → after 13/13**, tokens all `CLOSED`, across all three real formats
(`Closed (date)`, `**CLOSED** (date; note)`, `> **Status: CLOSED …**`, `CLOSED · ARCHIVED`,
`CLOSED — CUTOVER EXECUTED, …`).

`verify` displays `(closed)` for 7 of them: Changes 0008–0013 are outranked by their own
`spec.md missing` error, which **must** keep failing. **The pre-existing signal was not
weakened to make the new one look good.**

### 4. F3 against the real repository

```bash
grep -cE '^Pending\.\s*$' changes/0003-frontend-backend-separation/evidence.md   # 3
wc -l changes/0003-frontend-backend-separation/evidence.md                        # 688
```
Before: `○ … in progress (evidence not completed yet)` → `close` blocked.
After: `complete` → `✓ (closed)`, `close` unblocked. Same for 0005 (496 lines).

### 5. Regression — AIEF itself

```bash
node cli/bin/aief.js verify   # Result: PASS, exit 0
# 21 Changes read as (closed); the `Closed (date)` format written by `aief close` is intact
```

### 6. F2 — proof the gate would have fired at Change 0008

A scratch tree containing only Flux Changes **0001–0007**, then adding 0008:

```
0001-0007 present          -> Result: PASS   exit 0
+ changes/0008-…           -> ✗ changes/0008-user-management-mutations/spec.md missing
                              Result: FAIL   exit 1
```

**The build would have broken exactly at Change 0008 — two days before the production
cutover.** The signal was correct and available the whole time; nothing ran it.

### 7. F2 — gate delivery

```
aief adopt (scratch project)
  ✓ Created .github/workflows/aief-verify.yml — CI gate: runs aief verify on every push/PR
  run: npx --yes aief verify
aief adopt (second run, file locally edited)
  ✓ CI gate already present (nothing overwritten)     [user edit preserved]
aief verify (healthy scratch project)  -> Result: PASS, exit 0
```

## Findings

- **The two bugs were the same bug.** F1 measured "the string we wrote" instead of "what
  the document declares"; F3 measured "are there placeholders?" instead of "do
  placeholders dominate?". Both were **proxies mistaken for the thing itself**, and both
  failed *quietly and confidently*. That is why `unknown` exists now: the code had no way
  to say "I cannot tell", so it said "no".
- **This is the same failure class the same migration found in OpenSpec** (`validate
  --all` reporting `4 passed` while silently skipping an entire change). Two independent
  tools, one shape: **absence of a signal rendered as a healthy signal**.
- **AIEF's capability was ahead of its adoption.** The artifact validator I was asked to
  add **already existed and was right** — `verify` correctly reported six missing
  `spec.md` and exited 1. It was simply never invoked. The recommendation "add a
  validator" was **wrong**, and only running the real CLI against the real repository
  revealed it.
- **The `Status (orig):` decoy is why the qualification rule matters.** Flux preserves an
  original status beside the reconciled one. A parser that merged both would see `CLOSED`
  and `IN PROGRESS`, correctly call it a contradiction, and **fail a well-formed file**.
  The ambiguity rule (R1.4) is only safe *because* qualified labels are excluded.

## Risks

- **`COMPLETE`/`PASS` now fail loudly** where they were silently "open". This is the
  intended behaviour and is flagged as a **`(human)` gate** in `tasks.md`: it is a
  deliberate choice of *honest failure over guessed intent*, and a human should ratify it.
- **A GitHub Actions workflow ships from an otherwise CI-agnostic tool.** Mitigated by
  documenting that the gate is one command (`npx aief verify`) runnable anywhere
  (`docs/ci-gate.md`), and by never overwriting. Also flagged `(human)`.
- **`partial` still blocks `close`.** Conservative on purpose (the `2x` margin leans
  toward "not done"). If it proves noisy on real projects, that is evidence to tune the
  ratio — not to remove the classification.
- **The gate lands on projects adopted from now on.** Existing adoptions (Flux included)
  do not retroactively gain it; they get it by re-running `aief adopt` or copying the
  file. Not solved here.

## Recommendations

- **Ratify the two `(human)` gates** in `tasks.md` before closing: the `COMPLETE`/`PASS`
  → `unknown` decision, and shipping the workflow.
- **Do not implement F4 yet.** The design is in
  [docs/proposals/f4-adr-openspec-declaration.md](../../docs/proposals/f4-adr-openspec-declaration.md);
  the evidence supports the *problem*, not yet the *rule*.
- **F6 (stale detection) is now unblocked but still deferred** — staleness could not even
  be measured while the parser could not read a status. F1 is its prerequisite; the
  second data point is still missing.
- Re-run `aief adopt` in Flux Portal if that repository should carry the gate. **Not done
  here** — out of this Change's scope, and Flux Portal is closed.

## Artifacts Produced

**AIEF — modified**
- `cli/src/core/domain/change.js` — `parseChangeStatus`, `classifyEvidence`, new flags
- `cli/src/core/services/change-verifier.js` — loud `unknown`, evidence states, hints
- `cli/src/cli.js` — `CI_TEMPLATE`, `createCiGate()`, wired into `runAdoption()`
- `cli/package.json` — two new test files registered
- `docs/dogfooding-findings.md` — F1–F6 recorded

**AIEF — created**
- `cli/templates/ci/aief-verify.yml`
- `cli/tests/change-status.test.js`, `cli/tests/evidence-classification.test.js`
- `docs/ci-gate.md`, `docs/proposals/f4-adr-openspec-declaration.md`
- `changes/0036-governance-signal-integrity/{change,spec,design,tasks,evidence}.md`

**Untouched:** OpenSpec · SpecBoot · the Flux Portal repository (read-only throughout) ·
Initiative / Parent-Child / contract hashes / traceability parser. No `git add`,
`commit` or `push`.

## Lessons Learned

- **Run the tool against the real repository before recommending changes to it.** Three
  of the six findings were only visible that way, and one prior recommendation ("add an
  artifact validator") was **refuted** by a single command — the validator existed and
  worked.
- **A tool that cannot determine the truth must say so.** Every defect here reduces to
  the absence of a third answer. Yes/no forced "I don't know" to become "no", and "no"
  is indistinguishable from a real "no".
- **Governance decays exactly where throughput is highest.** Flux's discipline was
  perfect through Change 0007 (24/24 tasks checked) and collapsed at 0008, which opened
  in "throughput mode". `tasks.md` and OpenSpec were dropped *together*, permanently,
  and nothing objected for two days. Enforcement must be automatic precisely because
  discipline is not.

## Next Change

None required by this Change. Candidates, both evidence-gated:

- **F4** — mandatory `ADR:` / `OpenSpec:` fields ([design](../../docs/proposals/f4-adr-openspec-declaration.md)); needs a second data point.
- **F5 / F6** — richer status vocabulary and stale detection; recorded as deferred
  evidence in [docs/dogfooding-findings.md](../../docs/dogfooding-findings.md). n=1 today.
