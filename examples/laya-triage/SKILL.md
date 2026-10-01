---
name: laya-triage
description: Experimental, unvalidated Laya scores for a new requirement. Use only when `laya` is installed and the human asks for it; never base a decision on its output.
---

# Laya triage (experimental)

This template is opt-in. To enable it, copy it to `.agents/skills/laya-triage/SKILL.md`; see
`examples/laya-triage/README.md`. AIEF itself never calls Laya.

> **Not validated.** Change 0145 measured zero-shot Laya on 131 real Changes of this repository:
> `change_type` Macro-F1 0.32, no better than always answering `general` (0.30; 95 % CI of the
> difference includes 0). `security_sensitive` reached 0.17 precision and a 24 % false-positive
> rate at 0.8. Treat every score as an experiment, not as a hint.

## When to use

Only when the human explicitly asks to see Laya's scores for a requirement, for example to
experiment or to compare. Do your own triage first and independently.

## How

```bash
node examples/laya-triage/laya-triage.js "<requirement text>"
```

Show the three scores to the human as printed, with the warning line. Do not use them to choose a
Change type or a track, or to add or skip any gate. Do not repeat a Laya score as if it were a
finding.

## Guardrails

- Never check `(human)`, `(review)` or `(gate:*)` tasks, never run `aief close`, and never treat a
  probability as approval.
- Do not write `change.md`, `spec.md` or `manifest.json` from Laya output.
- Security review decisions come from the human and the project's own rules, never from
  `security_sensitive`.

## Fallback

If the script exits with code 3 (Laya missing, not enough memory, timeout or error), say so in one
line and continue without it. Never block or retry in a loop.

## Resources (measured in Change 0144, CPU only)

- About 12–14 s per call, mostly model loading.
- About 2.4 GB of RAM with the default `multilingual` model.
- The first run downloads about 0.65 GB of model weights from Hugging Face.
