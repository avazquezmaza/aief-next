# Evidence

## Summary

Product identity consolidated on 2026-07-06. The repository now has one canonical document per identity topic (vision, architecture, ecosystem, principles, lifecycle), a README that answers the eleven product questions in ~6 minutes of reading (1,315 words), zero pre-CLI-era instructions in the main documentation paths, and full alignment with the accepted ADRs. No runtime file was touched by this Change.

## Activities Performed

- **Full repository review**: README, 24 docs under `docs/` (including `navigator/`), `specs/`, `adapters/`, `knowledge/decisions.md` (all 12 ADRs), `starter-project/`, CHANGELOG.
- **README.md rewritten** around the product questions: what / why / what-not / OpenSpec / SpecBoot / assistants / lifecycle / install / bootstrap / execute-a-Change, with the responsibility table and instruction hierarchy kept from the previous version.
- **Created canonical docs**: `docs/VISION.md`, `docs/architecture.md` (2 Mermaid diagrams; Prompt Engine and four orthogonal knowledge dimensions per ADR-012; Profiles marked honestly as accepted-but-not-implemented), `docs/ecosystem.md` (responsibility matrix + per-relationship contracts + Mermaid), `docs/principles.md` (Human-Led + the 8 permanent principles, each with why + backing ADRs), `docs/lifecycle.md` (8 stages × responsible/inputs/outputs + knowledge loop + Mermaid).
- **Superseded → pointers** (old links keep working, no duplicate sources of truth): `Vision-and-Principles.md` → VISION/principles; `project-lifecycle.md` → lifecycle; `tooling.md` → ecosystem.
- **Pre-CLI docs updated to the implemented flow**: Getting-Started, first-30-minutes, learning-path, mental-model ("What do I copy?" → "What do I run?"), choosing-your-workflow, navigator/README (first-30-minutes steps), navigator/new-project (CLI as Option A with linked `aief`), navigator/existing-project (manual mkdir steps → `aief doctor/init/verify/analyze/prompt`), navigator/tooling (`node cli/bin/aief.js` → linked `aief`).
- **docs/index.md** restructured ("The Product" section first; `specs/` labeled historical v1 reference); **docs/roadmap.md** updated to completed statuses (Phase 2 ✅ with Change references; Phase 3 current, ADR-012 as the committed next step); **docs/cli.md** level-1 table now includes `init`; **docs/Workflow.md** notes `init` reuses adopt; **FAQ** first answer updated ("starter kit" → workflow engine); **CHANGELOG** entry added.

## Verification

- **Link check**: script resolved every relative link in the 24 new/changed docs — `All relative links resolve.` (0 broken).
- **No runtime change**: `git diff -- cli/` for this Change is empty — the only pending `cli/` modifications in the working tree belong to (uncommitted) Change 0025. `npm test`: 50 tests, 50 pass, 0 fail — suite identical to before this Change.
- **Stale-pattern check**: no remaining `starter kit`, `Copy starter-project` or `cd aief-next/cli` in README/docs main paths (the navigator diagram keeps "Copy starter-project" only as the explicit manual/no-CLI branch).
- **Readability**: README = 1,315 words (~6 min at 220 wpm); each canonical doc ≤ 1,059 words.
- **Ten-minute test (structural)**: README alone answers all eleven questions from the Change objective; ecosystem.md is self-contained for a reader who has never seen AIEF.
- `aief verify`: PASS.

## Findings

ADR consistency review (ADRs untouched, as required):

1. **ADR-012 stale reference**: it names its future implementation Change `0025-operational-profiles`, but ID 0025 was consumed by the bootstrap experience. The Profiles implementation will take the next free ID. Documented here and in change.md; the ADR is historical record and stays as written.
2. **Spec-vs-ADR conflict — SpecBoot ownership**: the incoming spec assigned AGENTS.md/Standards/Skills to SpecBoot; ADR-003/004/010 place these artifacts under AIEF ownership with SpecBoot as conceptual source. Docs follow the ADRs (per the 0025 precedent: accepted ADRs > incoming specs).
3. **Spec-vs-ADR conflict — naming**: "AI Engineering Runtime" (spec) vs "Workflow Engine" (ADR-001, implemented). Docs keep Workflow Engine; "runtime" appears in VISION.md only as long-term direction.
4. **Outdated era**: seven documents still taught the manual pre-CLI flow ("copy starter-project/"), contradicting ADR-005 (adoption engine as core product) and the Bootstrap Experience. All updated; the manual path remains documented as an explicit alternative.
5. `specs/` (Core/Architecture/Runtime/Compliance) describe the v1 conceptual model ("Kernel/Extensions") that no longer matches the implemented product; repositioned in the index as historical reference rather than deleted.

## Risks

- Old deep links from external sites to the superseded docs' *sections* (not files) would land on pointer stubs — acceptable; the stubs say exactly where to go.
- Two workflow-adjacent docs remain by design (`Workflow.md` canonical for the three-level model per ADR-011; `lifecycle.md` for stage/inputs/outputs) — the cross-references state the relationship, but future edits must keep them in sync.

## Recommendations

- When the Profiles implementation Change starts, update `architecture.md`'s honest status line — it is the single place that says "not implemented yet".
- Consider retiring the pointer stubs after one release cycle if nothing external links to them.

## Artifacts Produced

- New: `docs/VISION.md`, `docs/architecture.md`, `docs/ecosystem.md`, `docs/principles.md`, `docs/lifecycle.md`, `changes/0026-product-identity-consolidation/`.
- Rewritten: `README.md`, `docs/index.md`, `docs/roadmap.md`, `docs/Getting-Started.md`, `docs/first-30-minutes.md`, `docs/learning-path.md`.
- Converted to pointers: `docs/Vision-and-Principles.md`, `docs/project-lifecycle.md`, `docs/tooling.md`.
- Edited: `docs/mental-model.md`, `docs/choosing-your-workflow.md`, `docs/FAQ.md`, `docs/cli.md`, `docs/Workflow.md`, `docs/navigator/{README,new-project,existing-project,tooling}.md`, `CHANGELOG.md`.

## Lessons Learned

- The repo had accumulated three documentation eras (manual starter kit → CLI → bootstrap); each era's docs were individually correct when written but jointly contradictory. Canonical-doc-plus-pointer is the cheapest structure that prevents this from recurring: new content has exactly one home.
- Writing the principles as "why + which ADR embodies it" surfaced that all eight spec principles were already implemented — good confirmation that this Change consolidated rather than invented.

## Next Change

Candidate: Operational Profiles implementation (ADR-012) — the one accepted architecture piece not yet implemented, and the committed next step in the roadmap.
