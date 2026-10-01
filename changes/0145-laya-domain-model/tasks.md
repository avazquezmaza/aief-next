# Tasks

## Phase A: Evaluation

- [x] Write `eval/build-dataset.js`; generate `eval/dataset.jsonl` with the fixed split; list exclusions.
- [x] Propose `eval/security-labels.jsonl` with reasons, before any Laya run on the set.
- [x] (human) Approve the security labels.
- [x] Run zero-shot Laya once; store raw output and run metadata.
- [x] Write `eval/score.js`; compute baselines and metrics on the test split.
- [x] Fit the `security_sensitive` threshold on train; report on test.

## Checkpoint

- [x] Record the go/no-go against the pre-registered criteria. **No-go** (owner decision, 2026-10-01).

## Phase B: Fine-tuning (only on go)

On no-go, Phase B and C lines become `- [-] Abandoned: no-go at checkpoint — <reason>`
(governance conventions §2). The `(human)` line is converted by the owner.

- [-] Abandoned: no-go at checkpoint — propose `eval/train-synthetic.jsonl` for human review.
- [-] Abandoned: no-go at checkpoint — no external actions needed.
- [-] Abandoned: no-go at checkpoint — run the upstream notebook; download the tuned model locally; record config, data hash and model SHA-256.
- [-] Abandoned: no-go at checkpoint — re-evaluate on the test split; record pass/fail.

## Phase C: Wiring (only if Phase B passes)

- [-] Abandoned: no-go at checkpoint — add `LAYA_MODEL_PATH` support through a small Python runner in `examples/laya-triage/`.
- [-] Abandoned: no-go at checkpoint — update `SKILL.md` and `README.md` with measured metrics and threshold.
- [-] Abandoned: no-go at checkpoint — re-run the script fallback cases.

## Remediation of the 0144 example (R9, owner-approved scope extension)

- [x] Remove the ALERT and threshold from `laya-triage.js`; label all signals as unvalidated.
- [x] Add the 0145 results and an "experimental, not validated" warning to `SKILL.md` and `README.md`.
- [x] Re-run the script fallback cases and one real run.

## Verification

- [x] `git grep -i laya -- cli/` empty; `npm test`, `node cli/bin/aief.js verify`, `git diff --check`.

## Evidence

- [x] Update evidence.md, including a `## Findings Status` table; update 0143 and 0144 tables.
- [x] (human) Review findings, decision and any wiring before close.
