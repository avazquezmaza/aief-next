# Laya Triage Example (experimental)

Prints scores from a locally installed [Laya](https://huggingface.co/convaiinnovations/laya)
decision model for a new requirement: `change_type`, `security_sensitive` and `governance_track`.
AIEF does not depend on it: without Laya, nothing in AIEF changes. It writes no files and never
calls `aief`.

> **Not validated. Do not base decisions on it.** Change 0145 evaluated zero-shot Laya
> (`laya==0.3.22`, `multilingual`) on 131 real Changes of this repository:
>
> | Signal | Result |
> | --- | --- |
> | `change_type` | Macro-F1 0.32 vs. 0.30 for always answering `general`; 95 % CI of the difference [−0.08, +0.13] |
> | `security_sensitive` | Precision 0.17 and 24 % false-positive rate at 0.8; precision 0.20 at the best threshold |
> | `governance_track` | Not evaluated: no Change declares a track |
>
> Fine-tuning was not pursued (no-go at 0145's checkpoint). Details:
> `changes/0145-laya-domain-model/evidence.md`.

## Install Laya (outside this repository)

Requires Python >= 3.10, about 2.5 GB of free RAM and about 2 GB of disk.

```bash
python3 -m venv ~/.venvs/laya
~/.venvs/laya/bin/pip install torch --index-url https://download.pytorch.org/whl/cpu
~/.venvs/laya/bin/pip install laya==0.3.22
export LAYA_BIN=~/.venvs/laya/bin/laya
```

The script pins the reviewed model commits (`LAYA_REVISION=reviewed`) and disables Hugging Face
telemetry unless you override them. Do not start `laya-serve` for this: it binds `0.0.0.0` by default.

## Run

```bash
node examples/laya-triage/laya-triage.js "Replace token storage with encrypted secrets and rotate API keys"
```

```text
Laya triage (EXPERIMENTAL, not validated; model: multilingual). Do not base decisions on it.
  change_type        : general (p=0.47)
  security_sensitive : 0.94
  governance_track   : standard (p=0.35)
Change 0145: change_type no better than always "general"; security_sensitive 24 % false positives at 0.8.
```

A file or stdin (`-`) works too. The first run downloads the model.

| Exit code | Meaning |
| --- | --- |
| 0 | Scores printed |
| 2 | Usage error |
| 3 | Laya unavailable (missing, not enough memory, timeout or error): continue without it |

| Variable | Default |
| --- | --- |
| `LAYA_BIN` | `laya` |
| `LAYA_MODEL` | `multilingual` (2.4 GB; English and Spanish) |
| `LAYA_TIMEOUT_MS` | `60000` |
| `LAYA_MIN_FREE_MB` | `3072` |

## Enable the assistant skill

```bash
mkdir -p .agents/skills/laya-triage
cp examples/laya-triage/SKILL.md .agents/skills/laya-triage/SKILL.md
```

Remove that directory to go back to AIEF without Laya.

## Limits

- Zero-shot on short, hand-written sentences looked promising (Change 0144, 8 cases), but it did not
  hold on real Change Objectives (Change 0145, 131 cases).
- About 12–14 s per call on CPU. Running `laya --batch` over many items without `--batch-size`
  reached 16 GB of RAM.
