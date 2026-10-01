# Tasks

## Verification of Laya claims (R1)

- [x] Locate upstream Laya source and pin a revision.
- [x] Record the outcome of each `[S]` claim from 0143 with its source.
- [x] Record the verified local interface (CLI and/or HTTP), or the stop condition.

## Skill template (R2)

- [x] Write `examples/laya-triage/SKILL.md` (questions, guardrails, fallback, resource notes).

## Example (R3)

- [x] Write `examples/laya-triage/` README, `questions.json` and script.
- [x] Measure `--model multilingual` on the R1 probe set and decide the default.
- [x] Run the script without Laya, and with an unmet memory minimum, and confirm the fallback message.
- [x] Run the script against a local Laya, if available, and record the output.

## Traceability (R4)

- [x] Update 0143 Findings Status.

## Verification

- [x] Confirm no file under `cli/` changed and `git grep -i laya -- cli/` is empty.
- [x] Run `npm test`, `node cli/bin/aief.js verify`, `node cli/bin/aief.js verify --change 0144-laya-triage-skill --strict` and `git diff --check`.

## Evidence

- [x] Update evidence.md
- [x] (human) Approve the Skill's guardrail wording and the example before close.
