# Specification

## Goal

After this Change: AIEF v3.1 (Changes 0052–0059) is audited end-to-end, documented coherently,
free of the small inconsistencies the audit found, confirmed backward-compatible, and has
reproducible evidence — ready for human review and merge. No new subsystem exists that didn't
before.

## Audit method

Every flow below was checked two ways: (1) reading the implementing code in `cli/src/cli.js`
against its own ADR in `knowledge/decisions.md` and its docs in `docs/*.md`; (2) exercising the
real command in a throwaway scratch project (`git init` + `aief bootstrap` in an empty directory
outside this repo) and comparing actual output to documented output. See `evidence.md` for the
transcripts.

## Findings

### F1 — `--graph` undocumented in `--help` and `aief help status` (fixed)

`cli.js`'s top-level usage banner listed `aief status [--change change-id] [--next]` — no
`--graph`, even though the flag has existed since Change 0058/ADR-028 and is documented in
`docs/cli.md`. `aief help status` (`COMMAND_HELP.status`) had the same gap, and also never
mentioned that `--next` behaves differently with 2+ open Changes (Change 0059). A first-time user
running `aief --help` or `aief help status` would not discover either flag.

**Fix:** both strings updated to list `--graph` and to summarize `--next`'s multi-open-Change
behavior in one sentence. No flag parsing changed — `--graph` already worked; only its
discoverability was fixed.

### F2 — `docs/cli.md`'s introductory sentence contradicted its own table (fixed)

Line 8 read: "No command below is new for AIEF Core 3.0 — Core 3.0 landed entirely as additive,
opt-in flags on existing commands (`status --change`/`--next`, `prompt --skill`/`--list-skills`,
`verify --requirements`)." Two lines later, the same file labels `aief bootstrap` "AIEF 3.1,
Change 0052," and further down the table cites `status --graph` (0058/ADR-028), `status --next`'s
smart selection (0059/ADR-029), and `doctor --verbose`'s Harness/Loop sections (0056/ADR-026,
0057/ADR-027) — all genuinely new since Core 3.0, all correctly attributed at the row level. The
umbrella sentence was written for Core 3.0 and never updated as 3.1 rows were added beneath it.

**Fix:** reworded to the claim that is actually true and matches every row: no *top-level command*
is new — every Core 3.0 and 3.1 addition is an additive, opt-in *flag* on an existing command —
without asserting a release boundary the table itself contradicts.

### F3 — AGENTS.md is the project template, not this repo's own dev guide (no fix needed — documented finding)

`AGENTS.md` at the repo root is byte-identical to `cli/templates/agents/AGENTS.md` — the exact
file `aief bootstrap` writes into every adopted project (confirmed: `diff AGENTS.md
cli/templates/agents/AGENTS.md` → no output). It is deliberately generic (Prime Directive,
Change/spec/tasks discipline, human-approval gates) because it ships to projects that are not
AIEF-next itself and may not even use Node or npm. This repo's own contributor rules — validation
commands, Git discipline, "reuse existing domain services" — already live in `docs/maintainer.md`,
referenced from `CLAUDE.md`. This is by design (see `docs/maintainer.md` "Documentation rules":
one document per concept) — confirmed correct, not a defect. `CLAUDE.md` and `docs/maintainer.md`
were extended (not AGENTS.md) with the specific items the commissioning instruction asked for that
were genuinely missing: an explicit no-automatic-push rule and a no-destructive-operations rule.
See "AGENTS.md / CLAUDE.md" below.

### F4 — No prior finding required a code fix beyond F1/F2

The rest of the audited surface (Skills/Standards precedence, Harness/Loop opt-in and non-blocking
behavior, Graph read-only construction, `status --next`'s eligibility rule, legacy/manifest-less
Change handling, invalid-manifest reporting) matched its documentation and its ADR exactly, live,
in the scratch-project runs recorded in `evidence.md`. No regression, no silent write, no
undocumented blocking authority was found.

### F5 — The workflow diagram still described AIEF Core 3.0 (fixed, second audit pass)

`scripts/generate_workflow_diagram.py` — the diagram's own declared canonical source — still
rendered a header reading "AIEF CORE 3.0 WORKFLOW LIFECYCLE," a Level 1 card literally labeled
`aief init / adopt` (that command pair was replaced by `aief bootstrap` in Change 0052/ADR-022+),
and covered none of the eight capabilities Changes 0053–0059 shipped (LIDR Discovery, Skills,
Standards, Harness/Hooks, Loop, the Change Graph, Smart Workflow). `docs/images/workflow.svg` and
`docs/images/workflow.png` — both generated/derived from that script — inherited the same drift.
`docs/workflow.md`'s Level-1 Mermaid subgraph and one sentence in `docs/architecture.md`
("`doctor`/`adopt`/`analyze`'s project detection") had the same `init / adopt` residue.

**Fix:** rewrote `scripts/generate_workflow_diagram.py` for AIEF Core 3.1 — updated header, renamed
the Level 1 card to `aief bootstrap`, added an assistant-agnostic Level 2 card listing Claude Code /
Gemini CLI / Codex CLI / Cursor / OpenCode / "others via portable prompt," relabeled the fail
loopback "fail — human fixes, re-prompts" (never implying automatic retry) and the next-Change
loopback "recommends next (not automatic)" (never implying automatic execution), and added a
cross-cutting capabilities sidebar (LIDR Discovery, Skills & Standards, Harness/Hooks, Loop, Change
Graph, Smart Workflow) so Level 3 doesn't have to cram every capability into three fixed cards.
Regenerated `docs/images/workflow.svg` from the script and `docs/images/workflow.png` from the SVG
(see `docs/maintainer.md` "Regenerating the workflow diagram," added by this pass). Fixed the
`init / adopt` residue in `docs/workflow.md` and `docs/architecture.md`. Updated the README's
Mermaid source to stay semantically equivalent to the regenerated SVG (same commands, same three
levels, same opt-in/non-blocking framing) — not required to be visually identical.

### F6 — The assistant-agnostic promise had no reproducible, categorized evidence (fixed, second audit pass)

The code's assistant-agnostic behavior was already correct — `aief prompt`'s output always opens
"Use AGENTS.md." regardless of assistant, `aief bootstrap` never creates any of
`CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md`, and there is no per-assistant branch anywhere in
the engine beyond `ASSISTANT_FILES`' filename lookup — but no document had ever run a live smoke
test across the five commissioned assistants, and no document distinguished a Native target
(`claude`/`gemini`/`codex`/`cursor` — recognized `aief prompt` values) from a Generic prompt
compatible one (OpenCode: `aief prompt opencode` is a hard "unknown assistant" error; `aief prompt`
with no name is the assistant-neutral form OpenCode actually consumes). Separately, `aief help
prompt`'s purpose string named "ChatGPT" — not a recognized `ASSISTANT_FILES` entry — while the
top-level `--help` banner two lines away correctly listed only `claude|gemini|codex|cursor`, the
same self-contradiction shape as F2.

**Fix:** ran `aief prompt claude|gemini|codex|cursor|opencode|chatgpt --change <id>` plus the
no-name generic form in a from-scratch scratch project (transcripts in `evidence.md`); confirmed
Native-target behavior for the first four, the documented "unknown assistant" error for
`opencode`/`chatgpt`, and a complete, AGENTS.md-first generic prompt with no assistant named.
Confirmed project-over-built-in Standards precedence still holds with an assistant named (same
mechanism ADR-024/025 already cover — re-verified, not re-designed). Added README.md "Assistant
compatibility" (a full matrix: assistant, level, mechanism, instruction file, recommended command,
limitations) and expanded `docs/cli.md` "Assistants" with the same three category labels. Fixed
`cli.js`'s `aief help prompt` purpose string to match `ASSISTANT_FILES` exactly. Added ADR-030
formalizing the three category labels and reconfirming `AGENTS.md`'s role (extends ADR-004,
supersedes nothing).

## Architectural coherence vs. ADR-024–029 (checked, not assumed)

| ADR | Claim | Verified how |
|---|---|---|
| ADR-024 (Skills, project-over-builtin) | `aief doctor`/`--verbose` shows project `ai-specs/skills/*.md` alongside built-ins, project wins id collisions | Live run: `ai-specs/standards/custom-rule.md` appeared in `doctor --verbose` tagged `[project]`, `source: project` |
| ADR-025 (Standards, `prompt` primary consumer) | Same precedence for `ai-specs/standards/`; `doctor --verbose` reports it too | Same run as above |
| ADR-026 (Harness non-blocking, opt-in, per-Change) | `manifest.harness.log` opts a Change into a visible `hooks.md` log; Hooks never block `verify`/`close`; unknown Hook ids warn, never disable anything real | Live run: Change with `harness.log: true` produced `hooks.md`; `verify` still returned PASS; no Change without `manifest.harness` got a Harness section anywhere |
| ADR-027 (Loop opt-in, non-blocking, manual retry) | `manifest.loop.verify.maxRetries` opts a Change into an attempt-tracked `loop.md`; retry is always a manual re-invocation of `verify`, never automatic | Live run: `loop.md` recorded "Attempt 1 … Loop complete" after one `verify` call; nothing re-invoked verify on its own |
| ADR-028 (Graph derived, read-only, non-blocking) | `buildGraph()` is pure over `manifest.dependsOn`; `status --graph` is read-only; a Graph issue never blocks `verify`/`close` on its own | Live run: `status --graph` on a 3-node graph with one edge produced nodes/edges/topo-order/issues and wrote nothing (confirmed via `git status`-equivalent — a fresh scratch dir, no other writes appeared) |
| ADR-029 (`status --next` deterministic, 2+ open Changes) | Recommends the lowest-id eligible Change, explains why, lists other eligible ids and the tie-break rule; 0/1-open-Change paths untouched | Live run: two open Changes, no dependencies between them — recommended the lower id, listed the other as "Other eligible Change(s)" |

All six held. No doc overstates any of them (e.g. no doc implies Hooks, Loop or the Graph can
block `verify`/`close`; no doc implies any of the six is on by default).

## Backward compatibility (confirmed, not asserted)

- **Manifest-less Changes** (no `manifest.json` at all — the shape every Change in *this* repo
  actually uses) continue to report "Workflow: no track declared (legacy readiness only)" and
  behave exactly as before v3.1. Confirmed live (`status --change` on a manifest-less Change).
- **A Change with an invalid manifest** (missing required fields) is reported as a distinct,
  visible "invalid manifest" state by `status` — never silently treated as "no manifest," never
  guessed. Confirmed live (a hand-written manifest missing `schema`/`id`/`slug`/`title`/`status`
  was reported field-by-field, exactly as `docs/configuration.md` describes).
- **No opt-in field configured** (no `harness`, `loop`, or `dependsOn` in any Change's manifest,
  no `ai-specs/` directory in the project): `doctor --verbose` shows no Harness/Loop section for
  that Change, `status`/`status --graph` show no Dependency Graph section, `doctor` shows no
  Standards section beyond the built-ins — all confirmed live in a project with zero v3.1
  configuration.
- **No migration is required.** Every v3.1 field is additive and optional; a v3.0-era project's
  `manifest.json` files (if any) remain valid as-is.
- **No hidden storage.** Every write observed across every scenario above landed in an already-
  documented, visible location (`AGENTS.md`, `knowledge/standards/*.md`, `knowledge/skills.md`,
  `changes/<id>/manifest.json` when the user writes one themselves, `changes/<id>/hooks.md`,
  `changes/<id>/loop.md`) — never a dotfile, never outside the Change directory or project root.
- **No external dependency is required.** LIDR/Skills/Standards discovery reads local
  `ai-specs/` files only; no network call was observed or is present in the reviewed code paths.

## Breaking changes and migration

**What changed:** `aief status --next` (no `--change`) with **more than one** open Change no
longer errors with "Multiple open Changes … not selecting one implicitly, exit 1." It now either
recommends one eligible Change (exit 0) or reports that none are eligible with a per-Change reason
(exit 0).

**Under what conditions:** only when a project has 2 or more *open* Changes at once and the user
runs `aief status --next` without `--change`. A project with 0 or 1 open Changes is unaffected —
confirmed byte-identical in both this audit's live runs and the unmodified pre-existing tests for
those two cases.

**Why:** commissioned explicitly (Change 0059) to replace an unhelpful hard stop with an
actionable, deterministic answer, reusing only already-official facts (Graph edges/issues,
Workflow gate blockers) — never inferring from Change id, folder name, or date. Recorded in
ADR-029 and `changes/0059-*/change.md` "Deliberate, documented behavior change."

**Impact:** any script or human workflow that relied on the old hard error (e.g., to force
explicit `--change` selection, or that parsed exit code `1` as "ambiguous") will now see exit `0`
and a recommendation or a "no eligible Change" report instead. `aief status --change <id> --next`
(explicit selection) is completely unaffected — it never had this ambiguity.

**Mitigation:** none required for interactive use (the new output is strictly more informative).
A script depending on the old exit-`1`/error-text contract should switch to reading the
`Next Change: <id>` line, or continue passing `--change <id>` explicitly, which was always the
byte-identical path.

### F7 — README and `docs/architecture.md` were technically accurate but did not communicate AIEF 3.1 clearly for a public release (fixed, third audit pass)

`README.md` opened by enumerating OpenSpec/SpecBoot/assistants rather than presenting AIEF as one
integrated system, mixed product pitch with reference-level detail (a five-column assistant
compatibility table, full subsystem inventory in "Status"), and used the narrative formula "Core
3.0 subsystems plus 3.1 additions" that reads as two products rather than one coherent 3.1 release.
`docs/architecture.md` led with a file-and-module diagram before any architectural narrative, so a
new reader met filenames before concepts.

**Fix:** rewrote `README.md` to the structure: value proposition, why AIEF exists, one core-workflow
diagram (with opt-in capabilities as a secondary band, not enumerated in the main flow), quick
start, what AIEF adds, how it fits the surrounding toolchain (one small responsibility table), a
three-column assistant table (detail moved to `docs/cli.md`), documentation index, and a Status
section describing 3.1 as one coherent release. Rewrote `docs/architecture.md` around ten sections
(principles → system context → runtime layers → Change lifecycle → prompt composition →
verification → Graph Engineering → extension model → deliberate boundaries → implementation map),
moving every filename into the final "Implementation map" table instead of the first diagram. Four
diagrams were added or redesigned (System Context, Core Runtime layers, Prompt Composition groups,
Graph Engineering); all six Mermaid blocks across README/architecture/workflow were rendered with
`@mermaid-js/mermaid-cli` to confirm valid syntax (see `evidence.md`).

### F8 — `docs/workflow.md`'s Level-1 diagram placed `verify` before Change creation, unlabeled (fixed, third audit pass)

The "Level 1: Context" subgraph read `doctor → bootstrap → verify → analyze/new-change/enrich →
prompt` — an unlabeled `verify` node sitting between project bootstrap and the first Change even
existing. A reader could not tell this was environment/project readiness (there is no such
standalone step; `doctor` already covers it) rather than a forward reference to `aief verify`,
which only ever targets an existing Change and belongs in Level 3.

**Fix:** removed the stray `verify` node from Level 1 (redundant with `doctor`) and labeled Level
3's `verify` node explicitly `"verify (Change verification)"`, with prose clarifying `doctor`
checks environment/project readiness while `verify` in Level 3 checks a specific Change.

### F9 — ADR-030 clause 3 required README's Mermaid to mirror the generated SVG's three-level shape; this pass's simplified README diagram conflicts with that (amended, third audit pass)

The commissioning instruction for this pass required README's diagram to be a single, simple linear
flow with an opt-in-capabilities band — structurally different from the three-level shape ADR-030
(§3, accepted as part of this same Change's second pass) mandated for semantic parity with
`docs/images/workflow.svg`. Silently shipping the new diagram would have contradicted an accepted
ADR without record.

**Fix:** amended ADR-030 §3 in place (`knowledge/decisions.md`, struck the superseded sentence,
added a dated 2026-07-30 amendment) rather than rewriting history: each of README/`workflow.md`/
`architecture.md` now explicitly answers a different question and is not required to match another
document's diagram shape. `docs/images/workflow.svg`/`.png` remain buildable from
`scripts/generate_workflow_diagram.py`, unchanged in content, and are documented in
`docs/maintainer.md` as a standalone illustrated export no longer embedded in any Markdown doc —
so no doc's prose stays coupled to that asset's exact shape.

## Post-v3.1 candidates (out of scope here — documented, not implemented)

Nothing found during this audit required a new subsystem or a substantial redesign. For the
avoidance of doubt: [AIEF 2.0-era DELETE/Type-Track/onboarding-simplification work remains frozen
per ADR-015](../../knowledge/decisions.md) pending its own usability-study consolidation, unrelated
to and unaffected by this Change.

## Requirements

- **R1 — Every audited flow is checked against real command output**, not just against its own
  documentation (a doc and its code can drift together and still be self-consistent while wrong).
- **R2 — Every fix is minimal and additive.** No existing documented flag, message, or exit code
  changes; `--help`/`aief help status`/`docs/cli.md` gain accurate detail, nothing is removed.
- **R3 — ADR-024–029 are each independently re-verified**, not summarized from memory of the
  Change that introduced them.
- **R4 — Backward compatibility is demonstrated with a real, from-scratch project**, not inferred
  from reading code alone.
- **R5 — The one intentional behavior change is fully disclosed**: condition, reason, impact,
  mitigation — per the commissioning instruction's explicit requirement to never declare "no
  breaking changes" without verifying it.
- **R6 — This Change adds no new command, flag, manifest field, or file format.**
- **R7 — The workflow diagram is regenerated from its own canonical script**, not hand-edited, and
  represents AIEF Core 3.1 (bootstrap, LIDR, Skills, Standards, Harness/Hooks, Loop, Graph, Smart
  Workflow) without implying any opt-in capability is blocking or automatic.
- **R8 — Every compatibility claim about an assistant is evidenced by a real `aief prompt`
  invocation** in this Change's `evidence.md`, categorized as Native target / Generic prompt
  compatible / Not currently supported — never a bare "supported."

## Acceptance Criteria

- [x] `--help` and `aief help status` document `--graph` and `--next`'s multi-open-Change
      behavior.
- [x] `docs/cli.md`'s introductory sentence no longer contradicts its own table.
- [x] ADR-024 through ADR-029 each re-verified against live command output (table above).
- [x] Backward compatibility demonstrated live: manifest-less Changes, invalid manifests, and
      zero-opt-in projects all behave as documented.
- [x] The `status --next` 2+-open-Changes behavior change is documented with condition, reason,
      impact and mitigation.
- [x] No new subsystem, command, flag, or manifest field was introduced.
- [x] Full test suite passes (728/728 baseline maintained or increased).
- [x] `aief verify` passes for this Change and for the repository.
- [x] `git diff --check` is clean (no whitespace errors).
- [x] Working tree is clean after the commit; no push performed.
- [x] `scripts/generate_workflow_diagram.py` renders AIEF Core 3.1 (three levels, cross-cutting
      capabilities sidebar, assistant-agnostic Level 2, no automatic-execution framing);
      `docs/images/workflow.svg`/`.png` were regenerated from it; the README's Mermaid source
      stays semantically equivalent.
- [x] `aief prompt` was smoke-tested live for `claude`, `gemini`, `codex`, `cursor`, `opencode`
      (error case), and the no-name generic form; results recorded in `evidence.md`.
- [x] README.md and `docs/cli.md` state three explicit compatibility categories and a matrix
      covering Claude Code, Gemini CLI, Codex CLI, Cursor, and OpenCode — no bare "supported."
- [x] `cli.js`'s `aief help prompt` purpose string matches `ASSISTANT_FILES` exactly (no "ChatGPT"
      claim).
- [x] `docs/workflow.md`/`docs/architecture.md`'s remaining `init / adopt` residue is corrected to
      `bootstrap`.
- [x] `docs/maintainer.md` documents how to regenerate the diagram and which artifact is canonical.
- [x] ADR-030 records the three compatibility categories, reconfirms `AGENTS.md`'s role for 3.1,
      and names the diagram script canonical.

## Fourth pass — Mermaid to generated SVG (2026-07-30)

**F10.** All 6 Mermaid blocks across the docs set (README ×1, `docs/architecture.md` ×4,
`docs/workflow.md` ×1) are replaced by generated SVGs, each with a matching PNG, following the
visual language `scripts/generate_workflow_diagram.py` already established. Content and semantics
approved in the third pass are unchanged — this is a rendering-technology change only.

- [x] `scripts/diagrams/` package created: `common.py` (shared palette, fonts, arrow markers,
      card/group-box/badge helpers, XML escaping, deterministic file writer — nothing beyond what
      every diagram actually shares), one `generate_<diagram>.py` module per diagram, and
      `generate_all.py` as the single canonical command.
- [x] `scripts/generate_workflow_diagram.py` still writes `docs/images/workflow.svg`/`.png` under
      its original documented command, now as a thin wrapper around
      `scripts/diagrams/generate_workflow_lifecycle.py`'s `generate()` — one source, not two
      independently-drifting diagrams.
- [x] Every generated SVG carries `role="img"`, a `<title id="...">`, a `<desc id="...">`,
      `aria-labelledby` referencing both ids, a `viewBox`, and text contrast/sizing within the
      13–22px range specified — verified by both automated checks and direct visual inspection of
      every rendered PNG.
- [x] No SVG/PNG generator writes outside `docs/images/`; a second run of `generate_all.py`
      produces byte-identical SVGs (no timestamps or non-deterministic data embedded).
- [x] `docs/maintainer.md` "Regenerating the diagrams" documents the full command, the per-diagram
      commands, the `workflow.svg` wrapper relationship, PNG rendering dependencies (tried in
      order: `rsvg-convert`, ImageMagick's librsvg delegate, Inkscape, `cairosvg`), and the
      no-manual-edit rule.
- [x] ADR-030 §3 carries a fourth, dated amendment recording the Mermaid-to-SVG migration without
      reverting the third pass's per-document semantic-independence rule.
- [x] `cli/tests/diagrams.test.js` added to the suite: every expected SVG/PNG exists, is
      well-formed with the required accessibility markup, zero Mermaid fences remain in
      README/`docs/architecture.md`/`docs/workflow.md`, every Markdown image reference resolves,
      alt text is specific (not a generic "diagram"), output stays confined to `docs/images/`, and
      regeneration (when `python3` is available) is a no-op.
- [x] No new subsystem, command, flag, or manifest field introduced; no factual claim changed from
      the third pass (AIEF never executes an assistant/CI, Harness/Hooks/Loop are non-blocking, the
      Graph is read-only with no hidden state, `status --next` only recommends, zero historical
      `dependsOn` edges exist in this repository's own `changes/`).
