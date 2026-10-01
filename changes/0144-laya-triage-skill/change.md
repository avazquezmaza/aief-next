# Change

## ID

`0144-laya-triage-skill`

## Type

Feature

## Objective

Give AI assistants working in this repository an optional, assistant-side way to use Laya for fast
typed triage proposals (Change type, track, security sensitivity, requirement clarity), as
recommended by Analysis Change 0143. Laya stays entirely outside the AIEF engine.

## Scope

### In scope

- Verify Laya's capability claims (C0143-F6) against a pinned upstream revision before anything
  depends on them, and record the results.
- A self-contained, opt-in package under `examples/laya-triage/`: a Skill template (`SKILL.md`), a
  question file and a script that prints second-opinion triage proposals and writes nothing
  (C0143-F1, F2, F3). The Skill is **not** placed in `.agents/skills/`: AIEF without Laya stays
  exactly as today, and enabling Laya is one documented copy step.
- Resource pre-checks, timeout and a mandatory manual fallback, so Laya never blocks AIEF.
- Measure `--model multilingual` accuracy on the same probe set before fixing it as the default.
- Update 0143's Findings Status table for the findings this Change resolves.

### Out of scope

- Any change under `cli/` (commands, requirement providers, verify rules, `package.json`) (C0143-F5).
- Distributing the Skill to user projects (`skills-catalog.json`, bootstrap templates). Needs an ADR
  and a separate Change.
- Laya calibration or fine-tuning datasets (C0143-F4).
- Writing `change.md`/`spec.md`/`manifest.json`, checking tasks, or running `aief close` automatically.

## Success Criteria

- Every `[S]` Laya claim in 0143's Claim Provenance is confirmed, corrected, or marked unverifiable
  against a pinned revision (URL plus version/commit).
- If Laya cannot be verified to exist with a usable local interface, the Change stops after
  recording that and does not ship the Skill or example.
- The Skill and example work without Laya installed (clear fallback to manual classification).
- `git grep -i laya -- cli/` returns nothing: AIEF without Laya is unchanged.
- No file under `cli/` changes; `npm test`, `aief verify` and `git diff --check` pass.

## Status

Closed (2026-10-01)
