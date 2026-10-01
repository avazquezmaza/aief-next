# Tasks

## Phase A: Evaluation

- [x] Write `eval/build-dataset.js`; generate `eval/dataset.jsonl` with the fixed split; list exclusions.
- [x] Propose `eval/security-labels.jsonl` with reasons, before any Laya run on the set.
- [ ] (human) Approve the security labels.
- [ ] Run zero-shot Laya once; store raw output and run metadata.
- [ ] Write `eval/score.js`; compute baselines and metrics on the test split.
- [ ] Fit the `security_sensitive` threshold on train; report on test.

## Checkpoint

- [ ] Record the go/no-go against the pre-registered criteria.

## Phase B: Fine-tuning (only on go)

On no-go, Phase B and C lines become `- [-] Abandoned: no-go at checkpoint — <reason>`
(governance conventions §2). The `(human)` line is converted by the owner.

- [ ] Propose `eval/train-synthetic.jsonl` for human review.
- [ ] (human) Confirm the external actions (Kaggle upload; no hub push unless confirmed).
- [ ] Run the upstream notebook; download the tuned model locally; record config, data hash and model SHA-256.
- [ ] Re-evaluate on the test split; record pass/fail.

## Phase C: Wiring (only if Phase B passes)

- [ ] Add `LAYA_MODEL_PATH` support through a small Python runner in `examples/laya-triage/`.
- [ ] Update `SKILL.md` and `README.md` with measured metrics and threshold.
- [ ] Re-run the script fallback cases.

## Verification

- [ ] `git grep -i laya -- cli/` empty; `npm test`, `node cli/bin/aief.js verify`, `git diff --check`.

## Evidence

- [ ] Update evidence.md, including a `## Findings Status` table; update 0143 and 0144 tables.
- [ ] (human) Review findings, decision and any wiring before close.
