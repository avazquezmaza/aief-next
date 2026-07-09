# Tasks

## Documentation

- [x] Create the Change via `aief new-change runtime-governance-open-questions`.
- [x] Write `docs/runtime-governance-open-questions.md` — tension 1: Requirement vs Change (problem space vs solution space; falsification conditions; H1/H2; nothing proposed).
- [x] Write tension 2: Tasks vs Gates (single-checkbox mechanism; convention limits; H3/H4; formalization pointed into the closability-contract workstream; `tasks.md` untouched).
- [x] Write tension 3: Execution Identity (three rungs: procedural evidence / composition record / strong attestation; ADR-009/ADR-012 constraints; naming risk; H5/H6 with manual-convention experiment first).
- [x] Write the closing five-column summary table (one row per tension).
- [x] Complete this Change's change.md and spec.md (were generic scaffold).

## Verification

- [x] Confirm only the three requested tensions are covered, nothing more.
- [x] Confirm no code, CLI, test, or existing document was modified; no files moved.
- [x] Confirm ADR-008 posture: every "now" recommendation is non-implementation; every deferral names its evidence.
- [x] Run `aief verify` → PASS.
- [x] Tests not run: no executable file changed (documentation only) — per the Change instructions.
- [x] `git status` shows only this Change directory and the new document.

## Evidence

- [x] Update evidence.md
