# Tasks

## Phase 1 — Investigation

- [x] Audit the AIEF repository (316 files, 15 commands, 11,602 Markdown lines, ~1,478 production LOC).
- [x] Audit the case-study repository `trk-orchestrator-portal` on disk — what was actually used, not what was offered.
- [x] Identify what nobody used during Flux Portal (7 of 15 commands; 3 of 4 knowledge dimensions; profiles: 0).
- [x] Identify what was discovered too late (ADR-007 reconstructed retroactively; 11/13 stale statuses).
- [x] Identify duplication (4 × AGENTS.md, 7 entry points, 4 starter surfaces, 3 tombstones, 2 change stores).
- [x] Identify what OpenSpec already solves; what SpecBoot already solves; what belongs to AIEF.
- [x] Build the responsibility map (responsibility, consumer, moment, dependency, complexity, frequency).
- [x] Classify every component (9 CORE / 8 OPTIONAL / 7 ADVANCED / 4 EXPERIMENTAL / 8 LEGACY).
- [x] Propose no deletions in Phase 1.

## Phase 2 — Experience redesign

- [x] Vision document, with the six laws derived from evidence.
- [x] Map of the proposed framework + conceptual architecture (six layers).
- [x] Comparison, current vs 2.0.
- [x] User flow from the newcomer's position; six-step flow mapped to today's commands.
- [x] Three profiles (Tracks): Basic / Standard / Migration.
- [x] Modular harness: eleven pieces, one question each.
- [x] Relationship with OpenSpec (no modification, no duplication).
- [x] Relationship with SpecBoot (no modification, no re-implementation).
- [x] Smallest example + full Flux Portal example.
- [x] Usability metrics and the test that would measure them.
- [x] Incremental roadmap with an evidence gate per stage.

## Documentation

- [x] Deliverables 1–11 under `docs/aief-2.0/`, indexed in `README.md`.
- [ ] Link `docs/aief-2.0/` from `docs/index.md` — **deferred**: the study proposes cutting 5 of 7 entry points; adding an eighth before that decision would make the finding worse. Do it when Stage 2 is decided.

## Verification

- [x] Every quantitative claim reproduces from a recorded command.
- [x] `aief verify` passes on this Change.
- [x] No production code, command, verifier or automation changed — this Change created only `changes/0037-*/` and `docs/aief-2.0/` (verified by modification time; see evidence, "Scope containment — with a correction").
- [-] Deferred to a human: Change 0036's accepted F1/F2/F3 work is present in the working tree **uncommitted**. Out of scope here by explicit instruction; flagged because it is invisible to git history.
- [x] OpenSpec and SpecBoot untouched.
- [x] Change 0036 untouched.
- [x] Conflicts with accepted ADRs flagged rather than resolved (ADR precedence).

## Evidence

- [x] Update evidence.md.

## Human gates

- [ ] (human) Accept, reject or amend the AIEF 2.0 study.
- [ ] (human) Decide the six open questions in `docs/aief-2.0/11-roadmap.md` — most urgently: is AIEF 2.0 a redesign or an addition?
- [ ] (review) Independent review of the audit's central claim (the CLI ran once) by someone other than its author.
