# Tasks

## Research

- [x] Create the Change via `aief new-change evaluate-external-harness-patterns`.
- [x] Read `betta-tech/harness-sdd` (GitHub): methodology, phase gates, roles, artifacts, state files, traceability, verification.
- [x] Read `multica-ai/andrej-karpathy-skills` (GitHub): four principles, file structure, distribution model.

## Documentation

- [x] Write `docs/external-harness-patterns.md`: per-repo contribution summary.
- [x] Write compatible-patterns section (already AIEF's model — independent convergence, no work).
- [x] Write adapt-patterns section (concept in, mechanism out; AIEF-native landing place; evidence gate each).
- [x] Write reject-patterns section (agent runtime, Claude-specific core, session state files, "skills" naming — each tied to its ADR/boundary).
- [x] Write risks-of-copying-without-validating section (8 risks).
- [x] Cover all seven relationship dimensions (human-gated workflow, profiles, skills, standards, evidence, verification, governance).
- [x] Write the decision table (Fuente | Patrón | Adoptar | Adaptar | Rechazar | Razón | Evidencia requerida — 15 rows).
- [x] Confirm the six expected decisions explicitly (§7).
- [x] Complete this Change's change.md and spec.md (were generic scaffold).

## Verification

- [x] Confirm no file copied from the external repos; no external dependency introduced.
- [x] Confirm AGENTS.md, CLI, tests and folder structure untouched.
- [x] Confirm every "adaptar" verdict has a named evidence gate; every "rechazar" names its ADR/boundary.
- [x] Run `aief verify` → PASS.
- [x] Tests not run: no executable file changed (documentation only).
- [x] `git status` shows only this Change directory and the new document.

## Human Review (required before acting on any verdict)

- [ ] Review the adopt/adapt/reject verdicts and their evidence gates.
- [ ] Decide whether any "adaptar" item should become a roadmap entry now, or wait for its evidence.
- [ ] Close this Change manually when reviewed (not closed automatically, per instructions).

## Evidence

- [x] Update evidence.md
