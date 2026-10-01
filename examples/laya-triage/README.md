# Laya Triage Example (optional)

A second opinion on a new requirement's triage, from a locally installed
[Laya](https://huggingface.co/convaiinnovations/laya) decision model. AIEF does not depend on it:
without Laya, nothing in AIEF changes.

It prints proposals for `change_type`, `security_sensitive` and `governance_track`. It writes no
files and never calls `aief`. A human decides.

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
Laya triage PROPOSAL (zero-shot, model: multilingual). A human decides.
  change_type        : general (p=0.47)   hint
  security_sensitive : 0.94   ALERT >= 0.8: consider (gate:security_review)
  governance_track   : standard (p=0.35)   weak signal
```

A file or stdin (`-`) works too. The first run downloads the model.

| Exit code | Meaning |
| --- | --- |
| 0 | Proposals printed |
| 2 | Usage error |
| 3 | Laya unavailable (missing, not enough memory, timeout or error): classify manually |

| Variable | Default |
| --- | --- |
| `LAYA_BIN` | `laya` |
| `LAYA_MODEL` | `multilingual` (2.4 GB; English and Spanish) |
| `LAYA_TIMEOUT_MS` | `60000` |
| `LAYA_MIN_FREE_MB` | `3072` |
| `LAYA_SECURITY_THRESHOLD` | `0.8` (provisional) |

## Enable the assistant skill

```bash
mkdir -p .agents/skills/laya-triage
cp examples/laya-triage/SKILL.md .agents/skills/laya-triage/SKILL.md
```

Remove that directory to go back to AIEF without Laya.

## Limits

Zero-shot, checked on 8 cases only (Change 0144): `change_type` and `security_sensitive` are
useful hints, `governance_track` is weak, and requirement clarity was dropped because it failed.
About 12–14 s per call on CPU. Details: `changes/0144-laya-triage-skill/evidence.md`.
