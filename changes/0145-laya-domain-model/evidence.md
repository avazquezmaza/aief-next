# Evidence

## Summary

Phase A (evaluation) is complete and the checkpoint decision is **no-go** (owner, 2026-10-01).
Phases B and C were abandoned. With owner-approved scope, the 0144 example was remediated. On this
repository's own 131 Changes, zero-shot Laya (`laya==0.3.22`, `multilingual`) does not
reliably beat a trivial "always `general`" baseline on `change_type` (Macro-F1 0.322 vs. 0.298; 95 %
bootstrap CI of the difference −0.082 to +0.126). Its `security_sensitive` signal has 0.17–0.20
precision. At the 0.8 threshold used by `examples/laya-triage/`, the alert fires on 24 % of
non-security Changes.

## Pre-registration

Committed in `f6c3089` before any Laya run on the set:

| Artifact | SHA-256 |
| --- | --- |
| `eval/dataset.jsonl` (131 items, stratified 50/50, seed 145) | `f8c46769fc42777f727c11a2e520680711daff3bbc5769c6bd38c847c6ca7008` |
| `eval/security-labels.jsonl` (12 true: 6 strict + 6 borderline; 3 borderline false) | `c8b7a8c54d06646102aa67d664a46017c6aed93758186e087a0eb3cd04d2c1c4` |

Split changed from 60/40 to 50/50 before any run, so `analysis` reaches 5 test items. Zero-shot and
baseline scores use all items, because none of them is trained (spec R4).

Exclusions (14): `0001`–`0012` have no `## Type` section (older format); `0013` has the scaffold
placeholder Objective; `0145` is this Change.

| Class | Total | Train | Test |
| --- | --- | --- | --- |
| general | 106 | 53 | 53 |
| fix | 12 | 6 | 6 |
| analysis | 9 | 4 | 5 |
| documentation | 3 | 1 | 2 |
| definition | 1 | 0 | 1 |

Security labels: proposed by the assistant from the question's definition, before the run, and
approved by the owner (`(human)` task checked).

## Zero-shot Run (R3)

`eval/laya-zero-shot.jsonl` (raw) and `eval/laya-zero-shot.meta.json`:

- `laya --batch … --questions examples/laya-triage/questions.json --model multilingual --json`,
  `LAYA_REVISION=reviewed`, `LAYA_DEVICE=cpu`, `HF_HUB_DISABLE_TELEMETRY=1`.
- laya 0.3.22, torch 2.14.1+cpu, transformers 5.18.0; 20 CPU cores, 46 GiB RAM, no GPU.
- **517 s wall for 131 items, 16.2 GB peak RSS.** An unbounded `--batch` holds every item at once;
  `--batch-size` would bound it.
- No item was truncated (median state 114 tokens).

## Results (R4)

From `node changes/0145-laya-domain-model/eval/score.js` → `eval/results-laya-zero-shot.json`.

### `change_type`: all items (Macro-F1 over `general`, `fix`, `analysis`)

| System | Macro-F1 | general F1 (n) | fix F1 (n) | analysis F1 (n) | definition F1 (n) | documentation F1 (n) |
| --- | --- | --- | --- | --- | --- | --- |
| Laya zero-shot | **0.322** | 0.458 (106) | 0.186 (12) | 0.323 (9) | 0.222 (1) | 0.057 (3) |
| Majority (`general`) | 0.298 | 0.895 (106) | 0 (12) | 0 (9) | 0 (1) | 0 (3) |
| Keyword rule | 0.197 | 0.286 (106) | 0.235 (12) | 0.071 (9) | 0.25 (1) | 0.143 (3) |

Test split: Laya 0.326, majority 0.294, keyword 0.202 (same pattern).

Bootstrap (5,000 resamples, seed 145), Laya − majority Macro-F1: **+0.024, 95 % CI [−0.082, +0.126],
P(diff ≤ 0) = 0.36.** The advantage is not distinguishable from zero.

Laya confusion matrix (all; rows = truth, columns = predicted):

| truth \ pred | general | fix | analysis | definition | documentation |
| --- | --- | --- | --- | --- | --- |
| general | 33 | 26 | 12 | 7 | 28 |
| fix | 2 | 4 | 4 | 0 | 2 |
| analysis | 3 | 0 | 5 | 0 | 1 |
| definition | 0 | 0 | 0 | 1 | 0 |
| documentation | 0 | 1 | 1 | 0 | 1 |

Laya labels 73 of 106 `general` Changes as something else, mostly `documentation` and `fix`.

The pre-registered keyword rule did worse than "always `general`": substrings such as `doc` and
`defin` occur in many feature Objectives. It was fixed before the run and is reported as written.

### `security_sensitive`

Threshold fitted on train (max F1 with recall ≥ 0.8): **0.50** in both scenarios.

| Scenario | Split | Threshold | Precision | Recall | F1 | FPR | TP/positives | FP |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| inclusive | all | 0.50 | 0.20 | 0.917 | 0.328 | 0.37 | 11/12 | 44 |
| inclusive | test | 0.50 | 0.20 | 0.80 | 0.32 | 0.258 | 4/5 | 16 |
| inclusive | all | 0.80 (example default) | 0.171 | 0.50 | 0.255 | 0.244 | 6/12 | 29 |
| strict | all | 0.50 | 0.122 | 1.00 | 0.218 | 0.371 | 6/6 | 43 |
| strict | all | 0.80 | 0.067 | 0.333 | 0.111 | 0.241 | 2/6 | 28 |

The highest scores went to non-security Changes: `0070` (shared process utils) 0.978, `0057` (verify
loop) 0.973, `0095` (manifest lint) 0.961. True positives such as `0132` (0.96) and `0136` (0.91)
are mixed among them. The strict scenario has no positives in the test split, because the split
was stratified by `change_type`, not by security.

### Comparison with Change 0144's 8-case probe

The 0144 probe used short, hand-written requirement sentences and looked promising (7/7
`change_type`, clean security separation). On 131 real Objectives (median 489 characters) both
signals collapse. Score and text length correlate only mildly (r = 0.28 for security).

## Checkpoint: no-go

| Pre-registered criterion | Result |
| --- | --- |
| 1. Room to improve: Macro-F1 < 0.85 or security F1 < 0.85 (all items) | Met (0.322; 0.328) |
| 2. Signal: zero-shot Laya beats majority on Macro-F1 (all items) | **Met on the point estimate only** (+0.024); 95 % CI includes 0 |
| 3. Feasibility: data source per scored class, owner confirms external actions | Train has 53/6/4 real items; minority classes would be mostly synthetic; owner confirmation pending |

The pre-registration did not require a significance margin for criterion 2. That gap is in the
spec's design and is recorded here, not adjusted after the fact.

**Decision: no-go** (owner, 2026-10-01). Criterion 2 passed only nominally: the advantage is not
distinguishable from zero. With 5–6 test items in the minority classes, a +0.10 gain in Phase B
could come from noise. Training would rest mostly on synthetic text for `fix` and `analysis`.
Phase B and C tasks are marked `[-] Abandoned` (governance conventions §2).

## Remediation of the 0144 example (R9)

Owner-approved scope extension after the no-go (C0145-F2):

- `laya-triage.js`: removed the ALERT, the `LAYA_SECURITY_THRESHOLD` variable and the
  `(gate:security_review)` suggestion. It prints raw scores under an "EXPERIMENTAL, not validated"
  header, followed by one line with the 0145 results.
- `SKILL.md`: renamed the use to "experimental"; assistants show scores only when the human asks,
  triage independently first, and never use the scores for type, track or gate decisions.
- `README.md`: added a "Not validated" warning with the 0145 table, updated the sample output, and
  noted the `--batch` memory finding.

Script cases re-run after the change:

| Case | Result |
| --- | --- |
| `laya` not on PATH | exit 3, unavailable message |
| `LAYA_MIN_FREE_MB=999999` | exit 3, memory message |
| `LAYA_TIMEOUT_MS=2000` | exit 3, timeout message; no `laya` process left running |
| No argument | exit 2, usage |
| Secrets/API-key requirement | exit 0: `general (0.47)`, `0.94`, `standard (0.35)`, warning line; matches the README sample |

## Activities Performed

1. Rewrote the Change as one Change with an internal checkpoint (owner decision).
2. Built the dataset and split; proposed security labels; committed both before any run (`f6c3089`).
3. Ran zero-shot Laya once over all 131 items; scored it against both baselines; fitted the threshold on train.
4. Checked for truncation and length effects, and bootstrapped the Macro-F1 difference.
5. Owner approved the security labels and decided no-go; Phase B/C abandoned.
6. Remediated the 0144 example (R9) and updated the 0143/0144/0145 Findings Status tables.

## Verification

```bash
git grep -i laya -- cli/                       # no matches (exit 1); .agents/skills/ holds only aief-change
npm test                                       # 1126/1126 pass
npm run lint                                   # clean
node cli/bin/aief.js verify                    # PASS
node cli/bin/aief.js verify --change 0145-laya-domain-model --strict
# Result: PASS (all tasks complete, abandoned items recorded, human review signed off)
git diff --check                               # clean
```

Reproducibility: `node changes/0145-laya-domain-model/eval/build-dataset.js` regenerates
`dataset.jsonl` with the recorded SHA-256; `node changes/0145-laya-domain-model/eval/score.js`
regenerates `results-laya-zero-shot.json` from the committed raw output.

## Findings

- **C0145-F1:** Zero-shot Laya does not reliably beat "always `general`" on `change_type`
  (CI [−0.082, +0.126]).
- **C0145-F2:** `security_sensitive` is not usable as an alert: 0.17 precision and 24 % FPR at 0.8;
  0.20 precision at the fitted 0.50. This contradicts the 0144 example, which prints an
  `ALERT … consider (gate:security_review)` at 0.8.
- **C0145-F3:** An unbounded `laya --batch` reached 16.2 GB RSS for 131 items.
- **C0145-F4:** The 0144 short-sentence probe overstated performance; real Objectives are longer and
  more mixed.

## Findings Status

| Finding | Status | Resolved By | Notes |
| --- | --- | --- | --- |
| C0145-F1 | Resolved | 0145 | Led to the no-go; stated in the example's README and SKILL. |
| C0145-F2 | Resolved | 0145 | ALERT and threshold removed from the example (R9). |
| C0145-F3 | Resolved | 0145 | Documented in the example's README limits. |
| C0145-F4 | Resolved | 0145 | Documented in the example's README limits. |

## Risks

- Security labels are one assistant's reading, pending owner approval; borderline items are
  reported separately.
- Small minority classes (5–6 test items) make per-class figures noisy.

## Recommendations

1. Keep `examples/laya-triage/` as an opt-in, explicitly unvalidated experiment. No AIEF behavior
   depends on it.
2. Do not pursue fine-tuning or engine integration with the current data. Revisit only if a larger
   labeled set exists (more `fix`/`analysis`/`definition` Changes, declared tracks) or a newer Laya
   release reports domain gains. Re-use `eval/` to re-measure.
3. For future evaluations, pre-register a margin or confidence requirement for "beats baseline".

## Artifacts Produced

- `eval/build-dataset.js`, `eval/dataset.jsonl`, `eval/security-labels.jsonl`
- `eval/laya-zero-shot.jsonl`, `eval/laya-zero-shot.meta.json`
- `eval/score.js`, `eval/results-laya-zero-shot.json`
- `examples/laya-triage/laya-triage.js`, `SKILL.md`, `README.md` (remediated, R9)

## Lessons Learned

- A promising 8-case probe on hand-written sentences did not survive 131 real items. Measure on
  the real distribution before shipping signals.
- A pre-registered "beats baseline" criterion needs a margin or a confidence requirement;
  otherwise a +0.024 point estimate formally passes.

## Next Change

None proposed. Laya work stops here unless the conditions in Recommendation 2 change.
