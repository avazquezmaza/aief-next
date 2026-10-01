# Evidence

## Summary

Laya 0.3.22 was verified, security-reviewed, installed outside the repository and measured. An
opt-in package in `examples/laya-triage/` (Skill template, `questions.json`, Node script without
dependencies) gives assistants a second-opinion triage. AIEF without Laya is unchanged: nothing in
`cli/` and nothing in `.agents/skills/`. Enabling the Skill is one documented copy step.

## Pinned Upstream (R1)

| Item | Value |
| --- | --- |
| Publisher | Convai Innovations, Apache-2.0 |
| Source repository | <https://github.com/NandhaKishorM/laya> (linked from the package README) |
| Package | PyPI `laya==0.3.22` (uploaded 2026-09-29), Python >= 3.10 |
| Wheel SHA-256 | `408e716b946a0566a9d4090117d4df9647540b6435e2f3dfed0b2c6b1abeed8a` (`laya-0.3.22-py3-none-any.whl`) |
| Checkpoint pins | `LAYA_REVISION=reviewed` uses the package's `PINNED_REVISIONS`: `laya` `55cf4c4e…`, `laya-multilingual` `e4e9ddf2…`, `laya-typed-decisions` `1a793eb5…` |

Method: the wheel was downloaded without installing it (`pip download --no-deps`), and its source
(`cli.py`, `serve.py`, `agent.py`, `revisions.py`, `router.py`, `mcp/`) and README (`METADATA`) were
read. Laya was **not** installed or run: that needs PyTorch plus multi-GB checkpoint downloads.

## Claim Outcomes (R1, C0143-F6)

| 0143 claim (`[S]`) | Outcome | Actual (source: laya 0.3.22) |
| --- | --- | --- |
| Single-pass latency ~30 ms | **Corrected** | 33 ms for one question, 7.2 ms/question batched, **measured on a T4 GPU** (README). No CPU figure published; CPU latency stays `[S]`. |
| Checkpoints `ModernBERT-large`, `mmBERT-base` | **Confirmed, incomplete** | Three checkpoints: `laya` (ModernBERT-large, 421M, 512 ctx), `laya-multilingual` (mmBERT-base, 322M, 1024 ctx), `laya-typed-decisions` (ModernBERT-large, 421M, 1024 ctx). |
| ~1.5 GB RAM for all three preloaded | **Unverifiable, likely low** | No RAM figure published. On disk (16-bit `model.safetensors`, HF API): `laya` 843 MB, `laya-multilingual` 644 MB, `laya-typed-decisions` 843 MB, ≈ 2.3 GB for all three. `[I]` Resident memory is at least that, and ≈ 4.7 GB if weights are held in fp32. To be measured. |
| Cold load 500 ms–2 s | **Corrected** | Checkpoint reload: 7.4 s median on CPU, 10.3 s on T4; first-time `warmup()` ~46 s on GPU (README). |
| `laya-serve` (FastAPI) | **Confirmed** | `laya[serve]`; `POST /v1/systemone`, `POST /v1/systemone/batch`, `GET /health`. **Binds `0.0.0.0:8000` by default** (`LAYA_HOST`), and auth is optional (`LAYA_API_KEY`). |
| `laya-ts` (ONNX in Node) | **Corrected** | Exists in the source repo; `npm view laya-ts` and `npm view laya-client` both return 404 on 2026-09-30. Not installable from npm today. |
| `laya[mcp]` | **Confirmed** | `laya-mcp-server` (stdio); tools `laya_predict`, `laya_predict_batch`, `laya_route`, `laya_route_batch`, `laya_decide`, `laya_shortlist`, `laya_preset`, `laya_status`. |
| `Router(preload=false)` | **Confirmed** | `preload=False` is the default; the CLI uses it. `laya-serve` defaults to `LAYA_PRELOAD=1`. |
| `LAYA_REVISION` | **Confirmed** | Commit, branch, tag, or `reviewed`; plus `LAYA_SHA256_DIGESTS` for artifact integrity. |
| RLCD calibration | **Confirmed** | Named as the training method (RL against strictly proper scoring rules). |
| "Zero network / air-gapped" (0143 Summary) | **Corrected** | Routing alone is offline. `--predict` downloads checkpoints from the Hugging Face hub on first use; offline after that with `HF_HUB_OFFLINE=1` and a warm cache. |

### Additional facts relevant to AIEF

- **Zero-shot accuracy is low on typed decisions.** On upstream's typed-decisions benchmark, the base
  English checkpoint scores **0.362** accuracy against **0.766** for the fine-tuned
  `laya-typed-decisions` (README). AIEF's schema is zero-shot, which strengthens C0143-F4: proposals
  must be presented as weak hints.
- The English checkpoint is confidently wrong on non-Latin scripts. `Router` detects the script and
  routes to `laya-multilingual`; Spanish requirement text is routed there too.
- `min_confidence=` flags answers below a threshold with `low_confidence: True`.

## Pre-install Security Review (R1)

Requested by the owner before installing Laya. Static review of the downloaded wheel and checkpoint
repository; nothing was installed or executed.

| Check | Result |
| --- | --- |
| Install-time code | None. Pure-Python wheel (`py3-none-any`, `Root-Is-Purelib`); no `setup.py` runs, and no `.pth`, `.so` or other binary. |
| Wheel integrity | All `RECORD` hashes match the files; wheel SHA-256 recorded above. |
| Provenance | PyPI Trusted Publishing attestation: GitHub `NandhaKishorM/laya`, workflow `release.yml`, the same repository the README and Hugging Face link. |
| Known vulnerabilities | OSV: no advisories for `laya` 0.3.22. GitHub security advisories for the repository: none. |
| Dangerous code patterns | No `eval`/`exec`, `subprocess`, `os.system`, `shell=True`, `ctypes`, `marshal`, `pickle`, `torch.load`, base64 decoding, or `trust_remote_code`. The single `__import__` (`mcp/tools.py`) reads `laya`/`transformers` versions for a status tool. |
| Model weights | Loaded with `safetensors.load_file` + `load_state_dict(strict=True)`: no pickle deserialization, so the weights cannot execute code. |
| Remote code in checkpoint repo | The HF repo contains `.py` files (`rl_agent_api.py`, `rl_common.py`, `email_utils.py`), but `snapshot_download` uses `allow_patterns` limited to `rl_agent_config.json`, `model.safetensors`, `tokenizer/*` and `encoder/*`, so they are never downloaded or imported. |
| Network | Core downloads only from the Hugging Face hub (`snapshot_download`). `urllib` appears only in the optional LangChain/LlamaIndex/CrewAI integrations, which call a caller-configured `laya-serve` URL with a same-origin redirect guard. No telemetry or analytics calls. |
| Filesystem writes | Only in the HF cache (atomic rewrite of `tokenizer_config.json` for compatibility) and in explicitly requested outputs (`laya-evals --json-out`, `save_calibration(path)`). No home-directory or shell-config writes, and no deletes outside its own temp file. |
| Credentials | Reads `HF_TOKEN` if set and passes it to the HF hub (standard `huggingface_hub` behavior). Not needed: the checkpoints are public. |
| Server exposure | `laya-serve` binds `0.0.0.0:8000` with optional auth. Not used in this Change. |

**Residual risks**
- **Project age.** The repository was created 2026-09-18 (12 days old) and has ~29k stars and
  frequent releases. It is young and moving fast, so pin exact versions.
- **Transitive dependencies** (`torch`, `transformers`, `huggingface_hub`, `safetensors`, `numpy`) are
  mainstream but large. They were not audited here; pip resolves their latest compatible versions.

**Install conditions, if approved:** isolated venv outside the repository; `laya==0.3.22`
installed from the already-verified local wheel (SHA-256 above); CPU-only PyTorch; `LAYA_REVISION=reviewed`;
`HF_HUB_DISABLE_TELEMETRY=1`; `HF_TOKEN` unset; no `laya-serve` or `laya-mcp-server`.

## Verified Local Interface (R1)

Pattern A, the CLI, is the simplest interface that needs no daemon:

```bash
laya "<requirement text>" --questions questions.json --json
```

- `--questions` file: `{"state_key": "request", "questions": {<id>: <definition>}}`; the state is
  sent as `{"request": "<text>"}`.
- Definitions: `type` is one of `choice`, `score`, `noul`; `instructions` is required. `choice`
  `criteria` is a dict `label -> description`; `score` `criteria` is a list of levels, index 0 first;
  `noul` `criteria` is optional `{"true", "false"}`.
- Output: `{"answers": {<id>: {"choice": ..., "probabilities": {...}} | {"score": ...} | {"noul": ...}}, "routing": {...}}`.
- Exit code 2 on a handled error (bad questions, missing dependencies, checkpoint download failure).

The 0143 decision schema fits these shapes unchanged.

## Local Run (R1/R3)

Installed after owner approval, under the conditions above: venv `~/.venvs/laya` (outside the
repository), wheel hash re-checked, `torch 2.14.1+cpu`, `transformers 5.18.0`, `LAYA_REVISION=reviewed`,
`HF_HUB_DISABLE_TELEMETRY=1`, `LAYA_DEVICE=cpu`, `HF_TOKEN` unset, no server started. OSV check of the
36 resolved packages flagged only `setuptools 78.1.0` (venv bootstrap, unused by Laya), which was
upgraded to 84.0.0.

Hardware: 20 cores, 46 GiB RAM, CPU only.

| Run | Wall time | Peak RSS |
| --- | --- | --- |
| First `--predict`, including `laya` checkpoint download | 36.4 s | 2.9 GB |
| Same single request, warm cache (one CLI process) | 12.1 s | 2.9 GB |
| `--batch` of 8 requests (loads `english` + `multilingual`) | 57.1 s | 4.2 GB |

Per-invocation cost on CPU is dominated by process and checkpoint load (~12 s), not by the forward
pass. The "~30 ms" figure only applies to a warm, resident model on a GPU.

Accuracy probe: 8 requirement texts with the 0143 schema (`questions.json`, zero-shot, pinned
`reviewed` checkpoints). Expected values are the owner-convention answers for this repository.

| Requirement (abridged) | Expected type | `change_type` (p) | `governance_track` (p) | `security_sensitive` | `requirement_clarity` (0–2) |
| --- | --- | --- | --- | --- | --- |
| Fix login 500 on expired password | fix | fix (0.95) | lite (0.60) | 0.54 | 1.85 |
| Update README for Node 22, remove `aief adopt` | documentation | documentation (0.78) | lite (0.69) | 0.23 | 1.76 |
| Analyze Laya integration, findings only | analysis | analysis (0.97) | lite (0.46) | 0.12 | 1.83 |
| Define data model for a project with no code | definition | definition (0.89) | governed (0.52) | 0.16 | 1.56 |
| Add `--json` to `aief status` | general | general (0.46) | lite (0.58) | 0.11 | 1.82 |
| Encrypt token storage, rotate API keys | general | **fix (0.38)** | governed (0.47) | **0.92** | 1.88 |
| (ES) Fix `aief close` failing on trailing blank lines | fix | fix (0.97) | lite (0.79) | 0.08 | 1.46 |
| "Make it better." | — (vague) | general (0.50) | standard (0.50) | 0.09 | **1.87** |

Reading (`[I]`, n = 8, not a benchmark):
- `change_type`: 7/8 plausible; the miss came with low confidence (0.38).
- `security_sensitive`: clearly separated the secrets/auth request (0.92). The login bug sat at 0.54.
- `governance_track`: probabilities near 0.5; weak signal.
- `requirement_clarity`: **failed the sanity case**. "Make it better." scored 1.87 of 2 ("fully
  actionable"). Not usable.
- Spanish input was routed to `laya-multilingual` as documented.

### Single checkpoint: `--model multilingual` (R3)

Same 8 texts, same questions, forced to `laya-multilingual`: **22.3 s for the batch, 2.4 GB peak RSS**
(vs. 57.1 s and 4.2 GB with automatic routing). A single request: 14.3 s, 2.4 GB.

| Requirement (abridged) | `change_type` auto → multilingual | `security_sensitive` auto → ml | `governance_track` auto → ml |
| --- | --- | --- | --- |
| Fix login 500 | fix 0.95 → fix 1.00 | 0.54 → 0.44 | lite 0.60 → lite 0.79 |
| README Node 22 | documentation 0.78 → documentation 0.64 | 0.23 → **0.74** | lite 0.69 → standard 0.65 |
| Analyze Laya | analysis 0.97 → analysis 1.00 | 0.12 → 0.06 | lite 0.46 → standard 0.76 |
| Define data model | definition 0.89 → definition 0.96 | 0.16 → 0.03 | governed 0.52 → standard 0.62 |
| Add `--json` | general 0.46 → general 0.70 | 0.11 → 0.03 | lite 0.58 → standard 0.63 |
| Encrypt tokens, rotate keys | **fix 0.38 → general 0.57** | 0.92 → 0.97 | governed 0.47 → lite 0.46 |
| (ES) Fix `aief close` | fix 0.97 → fix 0.97 | 0.08 → 0.08 | lite 0.79 → lite 0.79 |
| "Make it better." | general 0.50 → fix 0.53 | 0.09 → 0.01 | standard 0.50 → standard 0.55 |

Decision: keep `multilingual` as the default. `change_type` matched all 7 labeled cases, including
the auto-routing miss, and resource use is lower. Caveats (`[I]`, n = 8): `security_sensitive`
gave a 0.74 false-positive-like score on the README case, just under the 0.8 threshold, so the
threshold is provisional until 0145. `governance_track` stays a weak signal; it moved the secrets
case from `governed` to `lite`.

## Activities Performed

1. Located the upstream package and source; pinned `laya==0.3.22` by wheel SHA-256.
2. Read the package source and README; recorded each 0143 `[S]` claim's outcome above.
3. Checked npm for `laya-ts` / `laya-client` (both 404).
4. Pre-install security review (owner request), then installed in `~/.venvs/laya`.
5. Measured latency, memory and an 8-case accuracy probe; compared automatic routing with `multilingual`.
6. Owner decisions: option A (opt-in second opinion, not adoption); place everything in
   `examples/laya-triage/` so AIEF without Laya stays exactly as today; drop `requirement_clarity`.
7. Wrote `examples/laya-triage/` and updated 0143's Findings Status.

## Verification

Script behavior (`examples/laya-triage/laya-triage.js`):

| Case | Result |
| --- | --- |
| `laya` not on PATH | exit 3, `Laya unavailable: "laya" not found …`, "Classify this requirement manually" |
| `LAYA_MIN_FREE_MB=999999` | exit 3, memory message; Laya not started |
| `LAYA_TIMEOUT_MS=2000` | exit 3, timeout message; no orphaned `laya` process afterwards |
| No argument | exit 2, usage |
| Secrets/API-key requirement | exit 0, `general (0.47)`, `security_sensitive 0.94 ALERT`, `standard (0.35)`; 14.9 s |
| Spanish requirement via stdin (multi-line) | exit 0, `fix (0.96)`, `0.22`, `lite (0.80)` |
| Files written | none (`git status` showed only the new Change and example directories) |

Repository checks:

```bash
git grep -i laya -- cli/                         # no matches (exit 1)
npm test                                         # 1126/1126 pass
npm run lint                                     # clean
node cli/bin/aief.js verify                      # PASS
node cli/bin/aief.js verify --change 0144-laya-triage-skill --strict
# FAIL only on: [strict] unresolved required human decision: Approve the Skill's guardrail wording …
git diff --check                                 # clean
```

`.agents/skills/` still contains only `aief-change`. A plain `grep -ri laya cli/` matches
"Malayalam" inside the untracked `cli/node_modules/`, so the criterion uses `git grep`.

## Findings

- **C0144-F1:** `requirement_clarity` is unusable zero-shot ("Make it better." scored 1.87 of 2). Dropped.
- **C0144-F2:** The `security_sensitive` threshold of 0.8 rests on one positive case; the README case
  scored 0.74 with `multilingual`. Provisional until 0145.
- **C0144-F3:** On CPU, per-call cost is ~12–14 s and 2.4–2.9 GB, dominated by model loading.
- **C0144-F4:** No Change in this repository has `manifest.json` or a declared `track` (0 of 144),
  and Change types are free text with 1 `Definition` and ~10 `Analysis`. A fine-tuning dataset
  (0146) needs label normalization and data for the minority classes first.

## Risks

- `laya-serve` binds all interfaces by default; any guidance must set `LAYA_HOST=127.0.0.1`.
- Low zero-shot accuracy (0.362 on upstream's typed-decisions benchmark) limits the value of proposals.
- The first `--predict` needs network access and multi-GB downloads.

## Recommendations

1. **0145:** an evaluation set drawn from this repository's Changes (normalized types, stratified
   or Macro-F1, never plain accuracy given ~97/144 `General`), the zero-shot baseline for
   `change_type` and `security_sensitive`, and the threshold calibration.
2. **0146:** fine-tune only if 0145 shows a usable baseline and the label gaps (C0144-F4) are
   solved. Uploading data to Kaggle is an external action that needs owner confirmation.
3. Revisit engine-level integration only through an ADR, and only if 0146 shows clear value.

## Artifacts Produced

- `examples/laya-triage/README.md`
- `examples/laya-triage/SKILL.md` (opt-in template; not in `.agents/skills/`)
- `examples/laya-triage/questions.json`
- `examples/laya-triage/laya-triage.js`
- `changes/0143-analyze-laya-integration/evidence.md` (Findings Status updated)
- Outside the repository: `~/.venvs/laya` and the Hugging Face cache (multilingual and English
  checkpoints). Not tracked.

## Lessons Learned

- Verifying vendor claims before building changed several of them materially: cold start is ~10×
  slower than assumed, the "~30 ms" needs a warm GPU, and `laya-ts` is not on npm.
- Forcing one checkpoint (`multilingual`) beat automatic routing on this probe in accuracy, time and
  memory. Defaults are worth measuring rather than inheriting.
- Keeping an optional integration in `examples/` makes "AIEF with and without X" a copy step, not a fork.

## Next Change

`0145-laya-evaluation-baseline` (proposed): build the evaluation set and measure the zero-shot baseline.
