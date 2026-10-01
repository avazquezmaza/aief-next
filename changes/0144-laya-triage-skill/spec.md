# Specification

## Goal

Assistants in this repository can optionally ask a local Laya instance for typed triage proposals,
present them to the human as proposals, and fall back cleanly when Laya is absent. The AIEF engine
is untouched.

## Requirements

### R1: Verify before building (C0143-F6)

- Identify the upstream Laya source (repository URL) and pin a revision (tag or commit).
- For each `[S]` claim in 0143's Claim Provenance, record in `evidence.md`: confirmed, corrected
  (with the actual value), or unverifiable. Include the source of each result.
- Record the actual local interface (CLI command and/or HTTP endpoint, request and response shape)
  that R2 and R3 will use.
- **Stop condition:** if no usable local interface can be verified, skip R2–R3, record the outcome,
  and propose next steps.

### R2: Opt-in Skill template (C0143-F1, F2, F3)

`examples/laya-triage/SKILL.md`, with frontmatter (`name`, `description`) matching
`.agents/skills/aief-change/SKILL.md`, enabled only by copying it into `.agents/skills/laya-triage/`:

- When to use it: a second opinion on a new requirement's triage, not a replacement for the
  assistant's own judgment.
- Questions, per R1 measurements: `change_type` (hint), `security_sensitive` (alert when the
  probability is at or above a threshold, default 0.8, to suggest considering `(gate:security_review)`),
  `governance_track` (weak signal). `requirement_clarity` is excluded (failed the sanity case).
- Guardrails: outputs are proposals shown to the human. Never check `(human)`, `(review)` or
  `(gate:*)` tasks, never run `aief close`, never treat a probability as approval.
- Fallback: when Laya is missing, short on memory, slow or failing, say so, classify manually, and
  never block.
- Resource notes using only figures measured in R1.

### R3: Example script (C0143-F1)

`examples/laya-triage/` with a README, `questions.json` and one Node script without dependencies:

- Reads requirement text (argument, file or stdin) and prints proposals.
- Pre-checks that `laya` is executable and that available memory meets a minimum (default 3 GB);
  enforces a timeout (default 60 s); uses a single checkpoint (default `multilingual`, pending the
  R3 measurement) and `LAYA_REVISION=reviewed` unless overridden.
- Writes no files and does not call `aief`.
- Exits with a distinct non-zero code and a "classify manually" message when Laya is unavailable.
- Measure `--model multilingual` on the R1 probe set; keep it as the default only if
  `change_type` and `security_sensitive` stay comparable to the automatic routing.

### R4: Traceability

- Update `changes/0143-analyze-laya-integration/evidence.md` Findings Status for F1, F2, F3, F5, F6
  (`Resolved` by 0144, or the outcome R1 produced).

## Acceptance Criteria

- [x] R1: Every `[S]` claim has a recorded outcome against a pinned revision, or the stop condition is recorded.
- [x] R2: Skill template exists in `examples/laya-triage/` with questions, guardrails, fallback and measured resource notes; nothing added to `.agents/skills/`.
- [x] R3: Script prints proposals, writes nothing, fails clearly without Laya or resources; multilingual default measured.
- [x] R4: 0143 Findings Status updated.
- [x] No file under `cli/` changed and `git grep -i laya -- cli/` is empty; `npm test`, `node cli/bin/aief.js verify` and `git diff --check` pass.
- [x] (human) Approve the Skill's guardrail wording and the example before close.
