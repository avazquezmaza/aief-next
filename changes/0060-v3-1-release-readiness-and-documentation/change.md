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

## Status

Closed (2026-07-30)
