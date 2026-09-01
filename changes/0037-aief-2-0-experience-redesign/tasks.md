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
- [-] Link `docs/aief-2.0/` from `docs/index.md` — moot as written: the deliverables live at
      `docs/history/aief-2.0-experience-redesign/` (moved there by a later docs reorganization,
      not `docs/aief-2.0/`), and Stage 2 (delete) already executed as part of the "Release AIEF
      Core 3.0" commit (`92906af`, 2026-07-27) — `docs/navigator/`, `starter-project/`, `specs/`,
      `reference-implementation/` are gone. Linking a history/ archive from the live docs index is
      a separate, small documentation decision, not this Change's own blocking task.

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

- [x] (human) Accept, reject or amend the AIEF 2.0 study. **Accepted, as amended, 2026-09-01** —
      the six open questions below are decided; the study's own recommended sequence (Stage 0
      done via Change 0036, Stage 2 delete already executed via "Release AIEF Core 3.0") is
      confirmed as the path actually taken.
- [x] (human) Decide the six open questions in `docs/history/aief-2.0-experience-redesign/11-roadmap.md`.
      **All six decided 2026-09-01**, three already answered by what was actually built and three
      by fresh explicit decision:
      1. **Redesign, not addition.** Already answered in practice: [ADR-013](../../knowledge/decisions.md)
         ("no capability enters the core without removing an equivalent"), accepted 2026-07-17,
         and Stage 2's deletions actually executed 10 days later.
      2. **Track, not Profile**, as the shipped mechanism. Already answered in practice: `KNOWN_TRACKS
         = ["lite", "standard", "governed"]` is implemented (Workflow Engine, ADR-016+); ADR-012's
         structured Profile model (`thinkingStyle` etc.) has zero implementation anywhere in `cli/src`.
      3. **The 6-step flow replaces the three levels as the user-facing model** — new decision,
         [ADR-033](../../knowledge/decisions.md).
      4. **ADR-006 amended to progressive teaching** — new decision, [ADR-034](../../knowledge/decisions.md).
      5. **ADR-010 survives unamended** — new decision, [ADR-035](../../knowledge/decisions.md),
         citing Change 0096's second real case (standards *were* edited, unprompted, by at least
         two of five participants).
      6. **ADR-012 not implemented; reconsidered.** Already answered in practice: zero uses across
         Change 0096's five real sessions (none of the five participants needed a profile,
         mirroring the zero uses Change 0033 already found across a full migration) plus zero
         code implementation of the structured model — the same conclusion the audit's own
         confirm-condition for "reconsidered" names.
- [x] (review) Independent review of the audit's central claim (the CLI ran once) by someone other
      than its author. **Satisfied by Change 0096's H6 result** — the exact claim this task names
      (Flux Portal's F2: "the CLI ran once... the validator... never invoked") was tested with
      five real, independent sessions and **REFUTED**: every participant ran `aief verify`
      spontaneously. The project owner confirmed this counts as the review this gate required, in
      lieu of a separate re-read of the audit document itself.
