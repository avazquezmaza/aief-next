# Tasks — Documentation Architecture and System Map (AIEF Core 3.0)

> **Note:** superseded in framing by `design.md`'s Information Architecture rewrite. The task list
> below reflects the original System Map-oriented scope, preserved as historical context. The current
> deliverables (audience model, classification model, canonical surface, concept ownership matrix,
> target IA, learning journeys, source-of-truth rules, current-to-target mapping, Change 0051
> blueprint, cleanup decision framework) are tracked directly as `design.md`'s numbered sections
> (§4–§16), each completed while producing that file in this same pass.

**This Change is planning-only.** Tasks 1–16 are this Change's own scope (already executed while
producing `proposal.md`/`spec.md`/`design.md`) and are checked off below. Tasks 17–22 describe the
**future**, separately-approved implementation Change — listed here so the staged plan is visible,
not because this Change performs them.

## This Change's own scope (executed)

1. [x] Inventory every `.md` file (382), by location (`design.md` §2.1).
2. [x] Read/grep every root-level and `docs/`-top-level file's real content, not just its filename
       (`design.md` §2.2/§2.3).
3. [x] Classify every file into one primary category, flagging ambiguous cases (`design.md` §1–§3).
4. [x] Identify semantic duplicates and competing entry points (`design.md` §2.4).
5. [x] Identify obsolescence grounded in concrete contradictions with Entrega-7 reality (`design.md`
       §3), including the two-status-framings contradiction.
6. [x] Design the two-layer target model (`design.md` §4).
7. [x] Design `docs/core3-system-map.md`'s full content, capped, non-duplicating (`design.md` §5).
8. [x] Justify the System Map's name against an alternative (`design.md` §5.1).
9. [x] Draft the workflow diagram, including the FAIL/INCOMPLETE loop and Review-as-future
       (`design.md` §6).
10. [x] Draft the component diagram with receives/produces/cannot per component (`design.md` §7).
11. [x] Draft the authority diagram distinguishing Workflow/Verification/Review/Human Approval/Close
       (`design.md` §8).
12. [x] Design the reading map by intent/audience (`design.md` §9).
13. [x] Design the Change index and ADR index (summaries, not full-content copies) (`design.md`
       §10/§11).
14. [x] Define the documentation maintenance policy (`design.md` §12).
15. [x] Assign status and conceptual ownership to every Layer 1 document (`design.md` §13).
16. [x] Confirm no code/CLI/test file was touched; confirm 534 tests unaffected; confirm repo clean
       except this Change's own new files (`verification.md`).

## Future implementation Change (staged, NOT executed by this Change — listed for visibility only)

17. [ ] **Stage 1 — Publish, don't move.** Create `docs/core3-system-map.md` with the content
       drafted in `design.md` §5.3. Zero other files touched. Rollback: delete the one new file.
18. [ ] **Stage 2 — Redirect known-superseded documents.** Trim `docs/Vision-and-Principles.md`,
       `docs/project-lifecycle.md`, `docs/tooling.md` to a one-line pointer each (they already say
       "Superseded" — this only shortens them). Rollback: restore from git history.
19. [ ] **Stage 3 — Update `docs/index.md`.** Add a "Core 3.0" section linking
       `docs/core3-system-map.md`, the Change index, and the ADR index. Zero other sections changed.
       Rollback: revert the one file.
20. [ ] **Stage 4 — Update `README.md`.** Add Core 3.0 to "What is AIEF?"/"Learn more," resolve the
       status-framing contradiction (requires the human decision in `design.md` §16 first). Rollback:
       revert the one file.
21. [ ] **Stage 5 — Update stale operational docs.** `docs/cli.md` (add `--change`/`--next`/
       `--skill`/`--list-skills`/`--requirements`), `docs/lifecycle.md` (mention Structural/
       Requirement Verification), `docs/roadmap.md`/`docs/ROADMAP-TO-1.0.md` (reflect Entregas 1–7 as
       delivered — content depends on the human decision in `design.md` §16). Each is its own,
       independently reversible sub-step.
22. [ ] **Stage 6 — Merge the three onboarding documents** (`Getting-Started.md`/
       `first-30-minutes.md`/`learning-path.md`) into one, per the human's preferred shape (`design.md`
       §16). Requires explicit human input on the merge target before starting — not a mechanical
       step.

Each stage above requires its own explicit human go-ahead per `spec.md` DOC-R34 — none auto-proceeds
to the next.

## Deferred (explicitly out of scope for this Change and its future implementation stage)

- [-] Deleting any Change artifact, ADR, or historical document.
- [-] Automating the Change index/ADR index generation — no evidence of need beyond manual
      maintenance yet.
- [-] Rewriting `docs/architecture.md`/`docs/domain-model.md` structurally — both are current and
      working; only new Entrega sections get appended, as already happened for Entregas 2–7.
- [-] Review (Entrega 8) content or implementation.
- [-] Any code, CLI, or test change.
