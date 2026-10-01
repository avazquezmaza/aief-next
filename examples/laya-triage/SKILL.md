---
name: laya-triage
description: Optional second-opinion triage of a new requirement with a locally installed Laya. Use only when `laya` is installed; otherwise ignore this skill and classify manually.
---

# Laya triage (optional)

This template is opt-in. To enable it, copy it to `.agents/skills/laya-triage/SKILL.md`; see
`examples/laya-triage/README.md`. AIEF itself never calls Laya.

## When to use

Before scaffolding or editing a Change for a new requirement, as a **second opinion** on your own
triage. It never replaces your judgment or the human's.

## How

```bash
node examples/laya-triage/laya-triage.js "<requirement text>"
```

Read the three answers:

| Answer | How to use it |
| --- | --- |
| `change_type` | Hint. If it disagrees with yours, mention both to the human. |
| `security_sensitive` | When an ALERT is printed (>= 0.8 by default), tell the human to consider `(gate:security_review)`, even if the track looks `lite`. |
| `governance_track` | Weak signal. Never decide a track from it. |

## Guardrails

- Present every answer as a **proposal** with its probability. The human confirms.
- Never check `(human)`, `(review)` or `(gate:*)` tasks, never run `aief close`, and never treat a
  probability as approval.
- Do not write `change.md`, `spec.md` or `manifest.json` from Laya output without the human's
  confirmation.
- The models are zero-shot and were checked on 8 cases only (Change 0144). Expect mistakes.

## Fallback

If the script exits with code 3 (Laya missing, not enough memory, timeout or error), say so in one
line, classify the requirement yourself, and label it as manual classification. Never block or
retry in a loop.

## Resources (measured in Change 0144, CPU only)

- About 12–14 s per call, mostly model loading. The 33 ms upstream figure needs a warm model on a GPU.
- About 2.4 GB of RAM with the default `multilingual` model, which covers English and Spanish.
- The first run downloads about 0.65 GB of model weights from Hugging Face.
