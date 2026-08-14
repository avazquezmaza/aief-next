# Tasks

## Inspection

- [x] Trace `knowledge/decisions.md`'s real structure/convention (this repo's own 31 ADRs, 1437
      lines, "accepted unless explicitly marked otherwise," reverse-chronological, no structured
      status field).
- [x] Trace `cli.js`'s `prompt()` composer end to end for every reference to `decisions.md`.
- [x] Trace `buildSkillContext()`'s actual current fields.
- [x] Trace `change-context.js`/`requirements-analysis-instructions.js` for a "check X file"
      precedent (none found).

## Scenarios

- [x] Scenario A — one relevant approved decision
- [x] Scenario B — many irrelevant decisions (real evidence: this repo's own ledger)
- [x] Scenario C — superseded decision (real evidence: no structured status field exists)
- [x] Scenario D — conflicting current Definition state
- [x] Scenario E — no durable decisions file
- [x] Scenario F — large ledger (real evidence: 1437 lines / ~36.5K token estimate)

## Verdict

- [x] Apply the Foundation Change Threshold's six criteria explicitly.
- [x] Record the verdict (A/B/C) with justification.

## Implementation (only if verdict is B)

- [x] N/A — verdict is A (KEEP AS-IS); no implementation performed, per spec.md R5.

## Verification

- [x] `npm test` — ≥ 940 pass, 0 fail.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.
- [x] `git diff --stat` reviewed to confirm scope matches the verdict.

## Evidence

- [x] Update evidence.md with the full trace, scenario table, threshold answers, and verdict.
