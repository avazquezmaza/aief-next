# Tasks

> **Not executed.** This Change is specified and ready. Execution edits `runAdoption()` — a core adoption path — and the approved restrictions gate execution on a human decision. See "Human gates".

## Analysis

- [x] Identify the four variants (170 / 35 / 10 / 14 lines).
- [x] Determine which one actually ships → the inline string in `runAdoption()` (`cli/src/cli.js:530`).
- [x] Diff them rule by rule ([spec.md §1](spec.md)).
- [x] Quantify what an adopted project receives: **7 of ~40 normative statements (~18%)**.
- [x] Find the rule that exists **only** in the poorest variant (assistant-file pointer) — the merge must go both ways.
- [x] Confirm the human-gate governance (`(human)`/`(review)`, Change 0035) never reaches an adopted project.
- [x] Confirm the packaging constraint: `cli/package.json` has no `files` field; the canonical must live under `cli/`.

## Implementation (not started)

- [x] Create `cli/templates/agents/AGENTS.md` = canonical, merged both ways (172 lines).
- [x] Add the assistant-file pointer to the canonical (was missing from the 170-line root).
- [x] Replace the inline string in `runAdoption()` with a read of the canonical (`cli.js:534`).
- [x] Make root `AGENTS.md` byte-identical to the canonical.

## Tests (not started)

- [x] Root `AGENTS.md` === canonical template (drift guard).
- [x] `aief adopt` in a temp dir produces output byte-identical to canonical.
- [x] Generated output contains `(human)` / `(review)` and the `aief close` consequence.
- [x] Generated output contains the assistant-file pointer.
- [x] Every matrix row present in generated output (22 rules asserted).
- [x] `adopt` still never overwrites an existing `AGENTS.md` (idempotence, ADR-005).

## Verification (not started)

- [x] `aief adopt` on a temporary project; diff vs canonical = empty.
- [x] `cd cli && npm test` passes (128/128).
- [x] `git diff --stat`: only AGENTS.md, cli/src/cli.js, cli/package.json, cli/templates/agents/, cli/tests/agents-canonical.test.js.
- [x] No file deleted or renamed.
- [x] `Understand -> Plan -> Build` still present (its removal belongs to Change 0038's concept cluster).

## Evidence

- [x] Record the analysis and the rule matrix.
- [x] Record execution results (evidence.md updated).

## Human gates

- [x] (human) **Approve execution.** Approved 2026-07-17; executed.
- [ ] (review) Independent review of the merged canonical content before it ships.

## Out of scope — do not do here

- [-] Deleting `starter-project/AGENTS.md` or `templates/project/AGENTS.md` — Change 0041 / cluster work. This Change makes them inert, not absent.
- [-] Removing `Understand -> Plan -> Build` — Change 0038 concept cluster.
- [-] Any other onboarding change.
