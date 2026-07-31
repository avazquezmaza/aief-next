# Change

## ID

`0060-v3-1-release-readiness-and-documentation`

## Type

General (consolidation — no new subsystem)

## Objective

Consolidate AIEF v3.1 (Changes 0052–0059) for review, merge and release: audit the shipped
functionality end-to-end against its own ADRs and documentation, fix small in-scope
inconsistencies the audit surfaces, confirm and document backward compatibility, and produce
reproducible evidence of release readiness — without introducing a new subsystem or expanding
scope beyond consolidation.

## Inventory of what already exists (read before touching anything)

v3.1 is eight Changes, each already closed with its own evidence and ADR:

- **0052 — Bootstrap** (`aief bootstrap` replaces `init`/`adopt`).
- **0053 — LIDR Discovery** (`ai-specs/` presence detection, unwired foundation).
- **0054 — Skills** (project `ai-specs/skills/*.md` resolved alongside built-ins, project wins on
  id collision — ADR-024).
- **0055 — Standards** (same precedence rule for `ai-specs/standards/`, `aief prompt` is the
  primary consumer — ADR-025).
- **0056 — Harness / Hooks visibility** (`manifest.harness`, opt-in per Change, non-blocking,
  visible `hooks.md` log only when `harness.log: true` — ADR-026).
- **0057 — Loop verify feedback/retry** (`manifest.loop.verify`, opt-in per Change, `loop.md`
  attempt log, retry is always a manual re-invocation, never automatic — ADR-027).
- **0058 — Change dependency Graph** (`manifest.dependsOn`, `buildGraph()` pure/derived/read-only,
  `status --graph`, non-blocking — ADR-028).
- **0059 — Smart Workflow `status --next`** (deterministic recommendation when 2+ Changes are
  open, reusing 0058's Graph and the existing Workflow Engine gates only — ADR-029).

The base suite at the start of this Change is 728/728 tests PASS (`npm test`, repo root).

## Scope

### In scope

- End-to-end functional audit of the flows listed in the commissioning instruction (bootstrap,
  opt-in usage, LIDR, Skills, Standards, `doctor`/`doctor --verbose`, `prompt`, `verify`,
  Harness/Hooks, Loop, `status`/`--change`/`--graph`/`--next`, close, legacy manifests, config
  errors) — verified by reading the code and by exercising real commands in a scratch project
  (see `evidence.md`).
- Small, targeted fixes for gaps the audit actually found:
  - `cli.js`'s top-level `--help` usage text and `aief help status` were missing the `--graph`
    flag and understated `--next`'s multi-open-Change behavior (0059) — both silent, opt-in,
    additive; no output changed for any existing documented flag.
  - `docs/cli.md`'s introductory sentence claimed "no command below is new for AIEF Core 3.0"
    while the same table's own row citations attribute several rows (`status --graph`, `status
    --next`'s smart selection, `doctor --verbose`'s Harness/Loop sections) to AIEF 3.1 Changes
    0056–0059 — corrected to state the (true, still additive-only) claim without contradicting the
    table beneath it.
- Documentation consolidation: confirm `docs/*.md`, `README.md`, `AGENTS.md`/`CLAUDE.md`, and
  `knowledge/decisions.md` describe v3.1 as it actually behaves — cross-reference rather than
  duplicate.
- This Change's own `spec.md` (audit findings + acceptance criteria), `tasks.md`, `evidence.md`
  (reproducible commands and output), and this file.

### Out of scope

- Any new subsystem, command, or manifest field. Nothing here was found to need one — see
  `spec.md` "Post-v3.1 candidates" for anything bigger the audit surfaced.
- Rewriting or restructuring already-accurate documentation. The audit found the existing doc set
  (built up Change-by-Change with its own ADR citations) already coherent; fixes here are
  additive/corrective, not a rewrite.
- Bumping `package.json`'s version or creating a `releases/vX.Y.Z.md` entry — that is the
  `aief release <version>` step, a separate, human-triggered action per `docs/maintainer.md`
  ("Releasing"), not part of readiness review.
- Anything requiring `git push`, deleting files, or starting another Change.

## Deliberate, documented behavior change carried by v3.1 (audited here, not introduced here)

`aief status --next` with **more than one** open Change (Change 0059/ADR-029) replaced the prior
"Multiple open Changes … not selecting one implicitly" hard error with a deterministic
recommendation (or an honest "no eligible Change" report). This is the one intentional behavior
change in the whole v3.1 line — see `spec.md` "Breaking changes and migration" for the full audit
of conditions, impact and mitigation. The 0/1-open-Change paths, and every other command, are
byte-identical to pre-v3.1.

## Success Criteria

- The v3.1 experience is documented end-to-end and matches real command behavior (verified live,
  not just read).
- Onboarding stays simple: the basic path (bootstrap → new-change → prompt → verify → status →
  close) requires no advanced-feature knowledge.
- Every advanced feature (LIDR, Harness, Loop, Graph) is confirmed and documented opt-in, with no
  blocking authority beyond what its ADR grants.
- ADR-024 through ADR-029 match real behavior (checked, not assumed).
- Backward compatibility is confirmed, not just asserted: a project with no v3.1 configuration
  behaves exactly as before.
- The one intentional behavior change is identified, explained and has documented impact/
  mitigation.
- Full test suite, `aief verify`, and `git diff --check` all pass before commit.

## Reopened — final audit pass (2026-07-30)

The first close (2026-07-30, see `evidence.md`'s original transcript below) found and fixed two
discoverability gaps (F1/F2) but did not check the **visual** documentation or the
**assistant-agnostic promise** against live evidence — both were assumed correct rather than
verified. A second, final audit pass found:

- **F5 — the workflow diagram still described AIEF Core 3.0.** `scripts/generate_workflow_diagram.py`
  (the diagram's own canonical source), and therefore `docs/images/workflow.svg`/`.png`, still read
  "AIEF CORE 3.0 WORKFLOW LIFECYCLE," still showed `aief init / adopt` (renamed to `aief bootstrap`
  in Change 0052), and covered none of Changes 0053–0059 (LIDR, Skills, Standards, Harness/Hooks,
  Loop, Graph, Smart Workflow). `docs/workflow.md`'s and `docs/architecture.md`'s own Mermaid/prose
  had the same `init / adopt` residue in one place each.
- **F6 — the assistant-agnostic promise was true but never demonstrated with reproducible
  evidence, and never given official compatibility categories.** The code already behaved
  correctly (`AGENTS.md`-first prompts, no per-assistant branching, `aief bootstrap` creates no
  assistant file) — but no live smoke test existed for Claude/Gemini/Codex/Cursor/OpenCode, and
  no document distinguished "native target" from "generic prompt compatible," so a reader could not
  tell OpenCode's real status from a document alone.

**In scope for this pass** (additive to the original scope above, still no new subsystem):

- Rewrite `scripts/generate_workflow_diagram.py` for AIEF Core 3.1 (three levels, a cross-cutting
  capabilities sidebar for Harness/Hooks/Loop/Graph, an assistant-agnostic Level 2, no automatic
  retry/execution implied anywhere) and regenerate `docs/images/workflow.svg`/`.png` from it.
  Update the README's Mermaid source to stay semantically equivalent (not pixel-identical).
- Live smoke test `aief prompt <name>` for `claude`/`gemini`/`codex`/`cursor`/`opencode` (plus the
  no-name generic form) in a from-scratch scratch project; record the results.
- Document three official compatibility categories (Native target / Generic prompt compatible /
  Not currently supported) and a compatibility matrix covering Claude Code, Gemini CLI, Codex CLI,
  Cursor, OpenCode (README.md and docs/cli.md).
- Fix `cli.js`'s `aief help prompt` purpose string, which named "ChatGPT" — not a recognized
  `ASSISTANT_FILES` entry — while the top-level `--help` banner correctly listed only
  `claude|gemini|codex|cursor`.
- Fix the remaining `aief init / adopt` residue in `docs/workflow.md`/`docs/architecture.md`.
- Add `docs/maintainer.md` "Regenerating the workflow diagram" (a genuine, previously-missing gap:
  no document said how to regenerate the SVG/PNG, or which one is canonical).
- Add ADR-030 formalizing the three compatibility categories, reconfirming `AGENTS.md`'s
  universal-contract role for 3.1 (extending ADR-004), and naming
  `scripts/generate_workflow_diagram.py` the canonical diagram source.
- Extend this Change's `spec.md`/`tasks.md`/`evidence.md` with the new findings, fixes and
  reproducible evidence; re-close.

**Still out of scope:** any new subsystem, command, manifest field, or native adapter (e.g. an
`OPENCODE.md` template) — the audit found a documentation and evidence gap, not a functional one.
`package.json`'s version bump remains deferred to the human-triggered `aief release` step (see
`evidence.md` "Recommendations").

## Reopened — third pass, public documentation clarity (2026-07-30)

Implementation and tests for v3.1 were already approved; this pass is purely editorial. A
Technical Documentation Architect / Product Editor review found the README and
`docs/architecture.md` technically accurate but not presenting AIEF Core 3.1 clearly enough for a
public release — see `spec.md` F7 (README/architecture restructure and diagram redesign), F8
(`docs/workflow.md`'s Level-1 diagram placed an unlabeled `verify` before Change creation), and F9
(the commissioned simplified README diagram conflicted with ADR-030 §3's SVG-parity requirement;
resolved by amending that clause in place rather than silently deviating). No CLI behavior, command,
flag, or manifest field changed; no new Change was created; no push performed.

## Reopened — fourth pass, Mermaid to generated SVG (2026-07-30)

Purely a diagram-format migration. All six Mermaid blocks across the docs set (README's
product-workflow diagram, `docs/workflow.md`'s three-level lifecycle diagram, and
`docs/architecture.md`'s four structural diagrams — System Context, Core Runtime, Prompt
Composition, Graph Engineering) are replaced by professionally styled, accessible SVGs (with a
matching PNG each) generated from versioned Python scripts under the new `scripts/diagrams/`
package, following the visual language already established by
`scripts/generate_workflow_diagram.py`/`docs/images/workflow.svg`. The approved content and
semantics from the third pass are unchanged — same commands, same three levels, same non-blocking
opt-in capabilities, same factual claims (AIEF never executes an assistant/CI, Harness/Hooks never
gate, Loop retry is always manual, the Graph is read-only and has no hidden state, `status --next`
only recommends). `docs/images/workflow.svg`/`.png` remain the standalone illustrated export at
their original path; `scripts/generate_workflow_diagram.py` is now a thin wrapper around
`scripts/diagrams/generate_workflow_lifecycle.py`'s generator so the export and
`docs/workflow.md`'s embedded diagram share one source. `docs/maintainer.md` documents the new
`generate_all.py` canonical command; `knowledge/decisions.md` ADR-030 §3 carries a fourth amendment
recording the format change. `cli/tests/diagrams.test.js` guards against regressions (every
expected SVG/PNG exists and is well-formed, accessibility markup present, zero Mermaid fences
anywhere in the docs set, every image reference resolves, output stays confined to
`docs/images/`, and regeneration is a byte-for-byte no-op). No CLI behavior, command, flag, or
manifest field changed; no new Change was created; no push, tag, or release performed. Full detail
in `evidence.md` "Fourth pass — Mermaid to SVG migration."

## Reopened — fifth pass, existing-project adoption clarity (2026-07-30)

Commissioned as Release Documentation Engineer, after the Change's fourth close (commit
`828aa86`). The functional implementation is unchanged and approved; the Mermaid-to-SVG migration
(fourth pass) is complete. Scope: close the documentation gap around adopting AIEF in an existing
project — the primary use case — without restructuring the README or introducing any CLI behavior
change.

Audit of `doctor()`, `bootstrapHere()`/`runAdoption()`, `analyze()`, and `verify()` in
`cli/src/cli.js`, cross-checked against `cli/tests/cli.test.js`'s bootstrap/analyze/doctor tests and
confirmed live in a scratch project (see `evidence.md`), found the behavior itself already matched
what `docs/getting-started.md`'s existing "Bootstrap a project" section stated — no functional gap.
The gap was breadth and discoverability: README had no dedicated adoption section, getting-started's
existing-project coverage didn't answer several concrete questions (what happens if `AGENTS.md`
already exists, what OpenSpec/SpecBoot coexistence looks like, an asset-by-asset behavior table),
`docs/concepts.md` never named the Adoption/Analysis/Delivery Change distinction explicitly, and
`docs/examples.md` had no adoption walkthrough.

**In scope for this pass:**

- README.md: a new, ~90-word "Adopt AIEF in an existing project" section (before Quick start)
  linking to a detailed getting-started anchor.
- docs/getting-started.md: a new "Adopting an existing project" subsection answering the 14
  commissioned questions, plus an existing-project-asset behavior table, plus a new adoption
  diagram.
- docs/concepts.md: an explicit Adoption Change / Analysis Change / Delivery Change subsection
  under "Change" — verified against `analyze()`'s and `runAdoption()`'s actual `change.md` content
  in `cli.js`.
- docs/cli.md: small additive notes only — bootstrap's idempotency and exit code, analyze's exit
  code and a cross-reference to the new Change-type distinction, doctor's exit-code condition. No
  row rewritten beyond these additions.
- docs/examples.md: a new "Adopting AIEF into an existing repository" example with a realistic
  before/after file tree, verified against a live scratch-project run — not invented.
- A new diagram, `docs/images/adoption-workflow.svg`/`.png`, generated by
  `scripts/diagrams/generate_adoption_workflow.py` (registered in `scripts/diagrams/generate_all.py`
  and `cli/tests/diagrams.test.js`), answering "How is AIEF adopted into an existing repository?" —
  distinct from the existing Product Workflow diagram (Change lifecycle) by showing the
  preserved-vs-added split specific to adoption. Follows the established visual system in
  `scripts/diagrams/common.py`; no Mermaid.

**Still out of scope:** any CLI behavior, command, flag, or manifest field change; a new Change;
`package.json`'s version bump; `git push`, tag, or release.

## Reopened — sixth pass, new-project path parity and diagram determinism (2026-07-30)

Commissioned as Senior Documentation Engineer / Release Readiness Operator for a full onboarding
pass across both journeys (existing-project adoption and new-project start). Re-audited
`bootstrapHere()`/`initProject()`/`analyze()`/`verify()`/`status()`/`close()` in `cli/src/cli.js`
against `cli/tests/cli.test.js`, confirmed behavior live in two scratch projects (an
`aief bootstrap <name>` skeleton and a synthetic existing repository with its own `package.json`,
`src/`, `test/`, `.github/workflows/ci.yml`, and a base commit), and found the fifth pass's
existing-project coverage already accurate and thorough. Two real gaps remained:

1. **New-project path was asymmetric.** `docs/getting-started.md`'s "Bootstrap a project" section
   gave the new-project path two lines (`aief bootstrap my-project` / `cd my-project`) versus the
   existing-project path's full 14-question Q&A and asset table. Fixed by adding a "### Starting a
   new project" subsection with the same depth: what `bootstrap <name>` actually generates
   (confirmed live: `README.md`, a minimal `AGENTS.md`, empty `changes/`/`knowledge/`/`src/`/`tests/`
   — no application code, no `package.json`), why `analyze` is optional there, and a full
   ten-step walkthrough through the first Delivery Change. `docs/cli.md`'s
   `aief bootstrap <name>` row was also thin ("Nothing" / "`<name>/` project skeleton") — expanded
   to list the exact files/directories created and the exit-1-if-exists collision behavior.
2. **`docs/images/*.png` regeneration was non-deterministic.** Running `scripts/diagrams/generate_all.py`
   twice in this environment (ImageMagick renderer, no `rsvg-convert` installed) produced
   byte-different PNGs each time — ImageMagick embeds `date:create`/`date:modify`/`date:timestamp`
   metadata by default. This is exactly what the fourth pass's "regeneration is a byte-for-byte
   no-op" claim depends on, and it silently didn't hold under this renderer. `-strip` alone removed
   the metadata chunks but a second gap remained: decoded pixel content was confirmed identical
   run-to-run (byte-for-byte pixel comparison via Pillow), yet the compressed PNG bytes still
   differed — ImageMagick's default zlib filter/strategy selection is not deterministic across
   invocations. Fixed by pinning `png:compression-filter=0`, `png:compression-level=9`, and
   `png:compression-strategy=0` alongside `-strip` in the ImageMagick invocation in
   `scripts/diagrams/generate_all.py`; confirmed byte-identical output (`cmp`) across three
   consecutive full regenerations of all eight PNGs after the fix. SVGs were never affected (text
   output, no embedded timestamps, no compression) — only the ImageMagick PNG path had this gap.

Also added `docs/getting-started.md` "## Multiple open Changes" and "## Safe stopping points"
sections (present in the fifth pass only as scattered Q&A answers, not as their own headings), and
reran the full repo-wide contradiction search from `spec.md`'s F-list — no contradictions found
beyond the two gaps above.

**In scope for this pass:** `docs/getting-started.md` (new-project subsection, Multiple open
Changes, Safe stopping points), `docs/cli.md` (`bootstrap <name>` row), `scripts/diagrams/generate_all.py`
(`-strip` fix), regenerated `docs/images/*.png` (byte content only — no SVG changed, no new
diagram).

**Still out of scope:** any CLI behavior, command, flag, or manifest field change; a new Change;
`package.json`'s version bump; `git push`, tag, or release.

## Status

Closed (2026-07-30)
