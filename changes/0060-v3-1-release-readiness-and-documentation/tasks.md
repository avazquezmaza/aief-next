# Tasks

## Audit

- [x] Read every 0052–0059 `change.md`/`spec.md`/ADR pair.
- [x] Exercise the full onboarding path (bootstrap → new-change → prompt → verify → status →
      close) in a from-scratch scratch project outside this repo.
- [x] Exercise every opt-in surface live: LIDR Standards/Skills discovery, Harness (`hooks.md`),
      Loop (`loop.md`), Graph (`status --graph`, `manifest.dependsOn`), `status --next` with 2+
      open Changes.
- [x] Exercise legacy/error paths: manifest-less Change, invalid manifest, zero-configuration
      project.
- [x] Re-verify ADR-024 through ADR-029 against the live output above (spec.md table).
- [x] Grep docs/README/help text for stale command references (`init`/`adopt`) — none found live
      (both already print `commandRemoved` redirects; docs already reflect this).

## Implementation (in-scope fixes only)

- [x] `cli/src/cli.js`: add `--graph` to the top-level `--help` usage banner.
- [x] `cli/src/cli.js`: expand `aief help status` (`COMMAND_HELP.status`) to document `--graph`
      and `--next`'s multi-open-Change behavior.
- [x] `docs/cli.md`: fix the introductory sentence that contradicted its own table's Change/ADR
      citations.

## Documentation

- [x] Confirm `README.md`, `docs/architecture.md`, `docs/cli.md`, `docs/concepts.md`,
      `docs/configuration.md`, `docs/workflow.md`, `docs/getting-started.md`, `docs/examples.md`
      already describe v3.1 accurately (they do — see spec.md "Findings"; only F1/F2 needed a
      fix).
- [x] Confirm `docs/configuration.md` already has a complete reference for every official v3.1
      manifest field (`sdd`, `harness`, `harness.log`, `loop.verify.maxRetries`, `dependsOn`) with
      required/values/default/effects — it does; no gap found.
- [x] Confirm `CLAUDE.md`/`docs/maintainer.md` state this repo's own validation commands, no-push
      rule, and no-destructive-operations rule; add what was genuinely missing (see spec.md "F3").
- [x] Confirm `AGENTS.md` (the project template) intentionally stays generic — no repo-specific
      instruction added to it (spec.md "F3").
- [x] Add the Breaking Changes / migration note (spec.md) — the one deliberate v3.1 behavior
      change, with condition, reason, impact and mitigation.

## Verification

- [x] Full test suite: `npm test` (repo root) — 728/728 before, checked again after all fixes.
- [x] `node cli/bin/aief.js verify` — repository's own AIEF structure.
- [x] `git diff --check` — no whitespace errors.
- [x] Manual `git status`/diff review — no unrelated files touched.
- [x] Scan changed files for NUL bytes and obvious secrets.
- [x] Scratch-project smoke test for every command in "Audit" above (see evidence.md).

## Evidence

- [x] Update evidence.md with reproducible commands and their actual output.

## Second pass — visual documentation and assistant-agnostic evidence (F5/F6)

- [x] Audit `scripts/generate_workflow_diagram.py` / `docs/images/workflow.svg` / `.png` /
      README's Mermaid against actual AIEF Core 3.1 behavior — found stale "Core 3.0" header,
      `aief init / adopt` residue, and no coverage of Changes 0053–0059.
- [x] Rewrite `scripts/generate_workflow_diagram.py` (three levels + cross-cutting capabilities
      sidebar; assistant-agnostic Level 2; no automatic-execution/blocking framing).
- [x] Regenerate `docs/images/workflow.svg` (`python3 scripts/generate_workflow_diagram.py`) and
      `docs/images/workflow.png` (rendered from the regenerated SVG).
- [x] Fix remaining `init / adopt` residue: `docs/workflow.md`, `docs/architecture.md`.
- [x] Update README's Mermaid source and image alt text for semantic parity with the regenerated
      SVG; add the "Assistant compatibility" section and matrix.
- [x] Expand `docs/cli.md` "Assistants" with the three compatibility categories and a matrix
      pointer.
- [x] Add `docs/maintainer.md` "Regenerating the workflow diagram."
- [x] Live smoke test `aief prompt claude|gemini|codex|cursor|opencode|chatgpt` (plus no-name
      generic) in a from-scratch scratch project; record transcripts in evidence.md.
- [x] Confirm bootstrap creates no assistant-specific file; confirm all four of this repository's
      own assistant files (`CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md`) are format-only
      adaptations with no contradictory engineering rule.
- [x] Fix `cli.js`'s `aief help prompt` purpose string ("ChatGPT" claim not in `ASSISTANT_FILES`).
- [x] Add ADR-030 (compatibility categories, `AGENTS.md` reconfirmation, canonical diagram source).
- [x] Extend this Change's `change.md`/`spec.md`/`tasks.md`/`evidence.md` with F5/F6 and re-close.
- [x] Re-run full validation suite (tests, `aief verify`, `git diff --check`, `doctor`,
      `doctor --verbose`, `status`, `status --graph`, `status --next`, NUL-byte scan, secret scan,
      temp-file scan, full staged diff review) before the final commit.

## Third pass — public documentation clarity and diagram quality (F7/F8/F9)

- [x] Editorially rewrite `README.md`: title/value proposition, why AIEF exists, core-workflow
      section with one simplified Mermaid diagram (linear flow + opt-in-capabilities band), quick
      start, what AIEF adds, "How AIEF fits into your engineering workflow" (renamed from "How
      AIEF relates to OpenSpec, SpecBoot, and assistants"), a 3-column assistant compatibility
      table, documentation index, contributing, and a Status section describing 3.1 as one
      coherent release (no "Core 3.0 subsystems plus 3.1 additions" framing).
- [x] Restructure `docs/architecture.md` into 10 sections (principles, system context, core
      runtime, Change lifecycle, prompt composition, verification & evidence, Graph Engineering &
      Smart Workflow, extension model, deliberate boundaries, implementation map); move filenames
      out of the first diagram into "Implementation map."
- [x] Add/redesign 4 diagrams: System Context (4 zones), Core Runtime (5 responsibility layers +
      mapping table), Prompt Composition (3 input groups → composer → output), Graph Engineering
      (`dependsOn` → builder → eligibility → Smart Workflow), each within the 8–12 visible node
      guideline, each followed by explanatory text.
- [x] Verify no historical-usage claim is made for the Graph beyond what the repository's own
      `changes/*/manifest.json` actually show: confirmed **zero** manifest.json files (and
      therefore zero `dependsOn` edges) exist anywhere in `changes/` — architecture.md states this
      explicitly rather than implying 0052–0060 used dependencies.
- [x] Fix `docs/workflow.md`'s Level-1 diagram: removed the unlabeled `verify` node between
      `bootstrap` and Change creation; labeled Level 3's `verify` node
      `"verify (Change verification)"`; clarified `doctor` vs. Change-scoped `verify` in prose.
      Confirmed Level 2 already read "assistant, optionally OpenSpec" (no change needed there),
      `status --next` already described as a recommendation, Harness/Loop already described as
      non-blocking.
- [x] Amend ADR-030 §3 in `knowledge/decisions.md` in place (dated 2026-07-30 addendum, prior text
      struck through and kept for history) to decouple README's diagram shape from the generated
      SVG's; update `docs/maintainer.md`'s "Regenerating the workflow diagram" to reflect the SVG/
      PNG are no longer embedded in any Markdown doc.
- [x] Update `docs/cli.md`'s "Assistants" table to carry the Mechanism/Limitations columns moved
      out of the simplified README table; fix the now-inaccurate cross-reference sentence.
- [x] Render all 6 Mermaid blocks (README ×1, `docs/architecture.md` ×4, `docs/workflow.md` ×1)
      through `@mermaid-js/mermaid-cli` to confirm valid syntax; checked each SVG's `viewBox` for
      excessive width — README's diagram was switched from `flowchart LR` to `flowchart TD`
      specifically to fit within a normal GitHub page width.
- [x] Grepped for stale `aief init`/`aief adopt` references outside legitimate historical mentions,
      stale "Core 3.0" product-description language, and false Graph historical-usage claims — none
      found beyond the one already-legitimate `docs/cli.md` sentence explaining what `bootstrap`
      replaced.
- [x] Re-run full validation suite (`npm test` 728/728, `node cli/bin/aief.js verify`,
      `git diff --check`) after all documentation edits.
- [x] Extend this Change's `spec.md` (F7/F8/F9) and `evidence.md`; keep the Change Closed.

## Fourth pass — Mermaid to generated SVG (2026-07-30)

- [x] Confirmed branch `feat/v3.1`, HEAD `f2844c1`, clean working tree before starting.
- [x] `rg -n '```mermaid'` inventory: 6 live blocks (README ×1, `docs/architecture.md` ×4,
      `docs/workflow.md` ×1) plus one historical, unmoved-by-design occurrence in
      `changes/0050-core3-documentation-architecture/design.md` (kept — Change 0050's own design
      states its tree section is "unmoved, unedited") and one non-block string match inside this
      Change's own `evidence.md` (a `re.findall` regex literal from the third pass's Mermaid
      syntax check, not a Mermaid fence itself).
- [x] Built `scripts/diagrams/common.py`, then one `generate_<diagram>.py` per diagram:
      `generate_product_workflow.py`, `generate_system_context.py`, `generate_core_runtime.py`,
      `generate_prompt_composition.py`, `generate_graph_engineering.py`,
      `generate_workflow_lifecycle.py`.
- [x] Rewrote `scripts/generate_workflow_diagram.py` as a compatibility wrapper around
      `generate_workflow_lifecycle.generate()`; confirmed `docs/images/workflow.svg` is
      byte-identical to `docs/images/workflow-lifecycle.svg`.
- [x] Built `scripts/diagrams/generate_all.py`: runs every generator, verifies each SVG/PNG exists,
      renders PNGs via the first available local renderer (ImageMagick with its librsvg delegate,
      in this environment — verified with `identify -list format | grep -i svg`), refuses to leave
      files outside `docs/images/`, uses no network.
- [x] Ran `generate_all.py` twice and diffed the SVG outputs — byte-identical (deterministic; no
      embedded timestamps).
- [x] Visually inspected every SVG's rendered PNG at GitHub-comparable width: no clipped text, no
      card overflow, arrows connected with no unnecessary crossings, consistent palette/typography
      across all 6 diagrams, footnote text within the viewBox.
- [x] Replaced all 6 Mermaid fences with `![specific alt text](path.svg)` references plus the
      existing explanatory prose (kept, not rewritten) directly below each image.
- [x] Verified every factual claim rendered in the new SVGs against the current codebase/ADRs
      (AIEF never executes an assistant/test/CI; Harness/Hooks never block; Loop retry is always
      manual; the Graph never persists or mutates a Change; `status --next` only recommends; zero
      historical `dependsOn` edges in this repository's `changes/`) — no new or contradicted claim.
- [x] Updated `docs/maintainer.md` "Regenerating the diagrams" and ADR-030 §3 (fourth amendment).
- [x] Added `cli/tests/diagrams.test.js` (9 cases) to `cli/package.json`'s test script; all pass.
- [x] Re-ran full validation: `npm test` (737/737), `node cli/bin/aief.js verify` (PASS),
      `node cli/bin/aief.js verify --change 0060-v3-1-release-readiness-and-documentation` (PASS),
      `git diff --check` (clean), `rg -n '```mermaid'` (only the documented exceptions above),
      scratch/temp file scan (`git status --porcelain` clean of anything unexpected).
- [x] Extended this Change's `change.md`/`spec.md`/`tasks.md`/`evidence.md`; kept the Change Closed.
- [x] No push, tag, release, or version bump; no new Change created.

## Sixth pass — new-project path parity and diagram determinism

- [x] Confirmed branch (`feat/v3.1`), HEAD, and a clean working tree before editing.
- [x] Delegated a fresh code/test audit (all commands, `--change` resolution, Adoption/Analysis/
      Delivery Change distinction, OpenSpec/SpecBoot/assistant-adapter integration, `changes/`/
      `knowledge/` reuse) to confirm the fifth pass's documented behavior still matches
      `cli/src/cli.js`/`cli/tests/cli.test.js` — no drift found.
- [x] Ran `rg -n '```mermaid'` — zero live hits in README/docs (only the same documented
      Change-0050 historical exception).
- [x] Ran `npm test` (737/737 PASS) and `node cli/bin/aief.js verify` (PASS) as a baseline before
      any edit.
- [x] Ran `scripts/diagrams/generate_all.py` twice and diffed `docs/images/` — found all eight
      PNGs (not just the new one) byte-differ between runs under this environment's ImageMagick
      renderer (`date:create`/`date:modify`/`date:timestamp` metadata), reproducing the exact
      non-determinism the fifth pass worked around by reverting rather than fixing. `-strip` alone
      removed the metadata but decoded-pixel comparison (Pillow) showed the compressed bytes still
      differed — ImageMagick's zlib filter/strategy selection isn't deterministic by default.
      Fixed at the root: added `-strip` plus pinned `png:compression-filter=0`,
      `png:compression-level=9`, `png:compression-strategy=0` to the ImageMagick invocation in
      `scripts/diagrams/generate_all.py`. Verified fix: three consecutive full regenerations of all
      eight PNGs now produce byte-identical output (`cmp` clean); confirmed no SVG output changed.
- [x] Scratch-tested a new-project skeleton (`aief bootstrap sample-app` in a temp parent
      directory, outside version control): confirmed the generated tree is exactly `README.md`, a
      minimal `AGENTS.md`, and empty `changes/`, `knowledge/`, `src/`, `tests/` — no application
      code, no `package.json`; `doctor`/`verify` both ran clean inside it.
- [x] Compared that scratch result against `docs/getting-started.md`'s new-project coverage:
      found it was two lines versus the existing-project path's full Q&A depth. Added a
      "### Starting a new project" subsection (skeleton contents, why `analyze` is optional there,
      a ten-step walkthrough to the first Delivery Change) and expanded `docs/cli.md`'s
      `aief bootstrap <name>` row with the exact files/dirs and its exit-1-on-collision behavior.
- [x] Added `docs/getting-started.md`'s "Multiple open Changes" and "Safe stopping points" as their
      own headings (previously only scattered inside the existing-project Q&A).
- [x] Scratch-tested the existing-project journey again end to end (synthetic repo with
      `package.json`, `src/`, `test/`, `.github/workflows/ci.yml`, a base commit; md5 checksums and
      `git log` before/after): confirmed `doctor` writes nothing, `bootstrap` preserves every
      existing file and the Git history, and a second `bootstrap` is idempotent — matches the
      fifth pass's findings exactly, no regression.
- [x] Reran the repo-wide contradiction search (`bootstrap|adopt|adoption|analyze|existing
      project|new project|greenfield|brownfield|never overwrite|no code edits|OpenSpec|SpecBoot|
      AGENTS.md|--change`) across README/docs/knowledge/changes — no contradictions found beyond
      the new-project thinness already fixed above.
- [x] Deleted both scratch projects (`sample-app`, the synthetic existing repo) from the session
      scratchpad — never created inside the tracked repository.
- [x] Ran full validation: `npm test` (737/737), `node cli/bin/aief.js verify` (PASS),
      `node cli/bin/aief.js verify --change 0060-v3-1-release-readiness-and-documentation` (PASS),
      `git diff --check` (clean), a third `generate_all.py` run confirming `git diff --exit-code --
      docs/images` reports no further changes after the fix is committed.
- [x] Extended this Change's `change.md`/`spec.md`/`tasks.md`/`evidence.md`; kept the Change Closed.
- [x] No push, tag, release, or version bump; no new Change created.

## Fifth pass — existing-project adoption clarity

- [x] Confirmed branch (`feat/v3.1`), HEAD, and a clean working tree before editing.
- [x] Read `doctor()`, `bootstrapHere()`/`runAdoption()`, `analyze()`, `verify()`/`verifyStructure`,
      and their helpers (`createStandards`, `createCiGate`, `configureSddProvider`,
      `analysisChangeFiles`, `genericChangeFiles`, `adoptionEvidence`) end to end in `cli/src/cli.js`.
- [x] Read `cli/tests/cli.test.js`'s bootstrap/analyze/doctor tests to confirm documented behavior
      (idempotency, no-overwrite, stack-matched standards, no application-file writes) is actually
      test-covered, not just implied by comments.
- [x] Added README.md's "Adopt AIEF in an existing project" section.
- [x] Added `docs/getting-started.md`'s "Adopting an existing project" subsection (14 questions +
      asset table) and the new adoption diagram.
- [x] Added `docs/concepts.md`'s Adoption/Analysis/Delivery Change subsection.
- [x] Added small, additive notes to `docs/cli.md`'s bootstrap/analyze/doctor rows only.
- [x] Added `docs/examples.md`'s "Adopting AIEF into an existing repository" example.
- [x] Built `scripts/diagrams/generate_adoption_workflow.py`, registered it in
      `scripts/diagrams/generate_all.py` and `cli/tests/diagrams.test.js`, generated
      `docs/images/adoption-workflow.svg`/`.png`.
- [x] Ran a real scratch-project test: created `src/`, `test/`, `package.json`,
      `.github/workflows/ci.yml`, `README.md`; recorded md5 checksums; ran `doctor` (confirmed zero
      writes via `find`/checksum diff), `bootstrap` (confirmed exact artifact set, application files
      unchanged), a second `bootstrap` (confirmed idempotent — "already exists" for every artifact,
      no new `adopt-aief` Change), `verify` (PASS), `analyze` (confirmed exactly one new Change);
      re-checked original file checksums unchanged after all four commands.
- [x] Ran a consistency check (`grep`/`rg`) across README/getting-started/concepts/cli/examples for
      contradictions on adopt/adoption/bootstrap/analyze/existing project/new project/never
      overwrite/no code edits/SDD provider/OpenSpec/SpecBoot/assistant-specific files — none found.
- [x] Reverted the incidental PNG byte-diffs `generate_all.py` produced for the six pre-existing
      diagrams (ImageMagick re-encoding is not byte-deterministic across runs; their SVGs were
      unchanged, confirmed via `git diff` before reverting) — kept the diff limited to the new
      diagram and the documentation edits.
- [x] Ran full validation: `npm test` (737/737), `node cli/bin/aief.js verify` (PASS),
      `node cli/bin/aief.js verify --change 0060-v3-1-release-readiness-and-documentation` (PASS),
      `git diff --check` (clean), `rg -n '```mermaid'` (only the documented Change-0050 exception),
      `node --test cli/tests/diagrams.test.js` (9/9, including the new diagram in every check).
- [x] Extended this Change's `change.md`/`spec.md`/`tasks.md`/`evidence.md`; kept the Change Closed.
- [x] No push, tag, release, or version bump; no new Change created.
