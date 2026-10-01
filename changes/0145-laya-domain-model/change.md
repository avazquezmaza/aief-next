# Change

## ID

`0145-laya-domain-model`

## Type

General

## Objective

Find out, with data, whether Laya can triage AIEF requirements well enough to improve AIEF, and if
so deliver a domain-tuned model wired into the opt-in `examples/laya-triage/` example. One Change
with an internal checkpoint: evaluate zero-shot first; fine-tune only if pre-registered criteria
hold (C0143-F4, C0144-F2).

## Scope

### In scope

- **Phase A, evaluation:** an evaluation set from this repository's Changes, a fixed train/test
  split, human-reviewed `security_sensitive` labels, zero-shot Laya against trivial baselines, and
  calibration of the `security_sensitive` threshold.
- **Checkpoint:** a go/no-go decision against criteria fixed in `spec.md` before any run.
- **Phase B, fine-tuning (only on go):** training data (the train split plus synthetic examples for
  minority classes), fine-tuning with the upstream Laya notebook, and re-evaluation on the same
  held-out test split.
- **Phase C, wiring (only if Phase B passes):** the example can use the tuned model from a local
  directory, opt-in, with the zero-shot model as default when none is configured.

### Out of scope

- Any change under `cli/` or `.agents/skills/`; Laya inside the engine needs an ADR (level 3).
- Committing model weights to the repository.
- Publishing the model or data anywhere without explicit owner confirmation for that specific action.
- Evaluating `governance_track`: no Change declares a track, so there is no ground truth.

## Success Criteria

- Phase A metrics are reported for Laya and both baselines, with class counts, on the held-out split.
- The checkpoint decision follows the pre-registered criteria and is recorded before Phase B starts.
- On no-go, the Change closes after Phase A with the evidence and the reason.
- On go, the tuned model is compared with zero-shot on the same held-out split, and wired into the
  example only if it meets the Phase B criterion.
- `git grep -i laya -- cli/` stays empty; `npm test`, `aief verify` and `git diff --check` pass.
