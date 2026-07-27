# Change

## ID

`0051-core3-documentation-rebuild`

## Type

General

## Objective

Prepare the documentation that should ship with the public release of AIEF Core 3.0: a small,
professional, learnable documentation set describing the product as it exists today (implemented
CLI, Changes 0043–0049, accepted ADRs) — not the repository, not its development history, not a
migration of a prior documentation architecture.

This supersedes a prior, more conservative attempt (a 12-document canonical matrix with no
deletion allowed) left uncommitted in this working tree. That attempt was discarded in full and
this Change rebuilt the documentation set from the actual product ground truth, per an explicit
commissioning brief that authorized deletion and rejected the prior architecture's constraints.

## Scope

### In scope

- README.md rewritten as the project's landing page, including the mandatory high-level Mermaid
  diagram of the product workflow.
- A small `docs/` set (getting-started, concepts, workflow, architecture, cli, configuration,
  examples, maintainer) rewritten or created from the implemented source
  (`cli/src/cli.js`, `cli/src/core/domain/*`, `cli/src/core/services/*`), Changes 0043–0049, and
  `knowledge/decisions.md`.
- Historical/superseded material consolidated under `docs/history/`.
- Obsolete/duplicated documentation deleted outright.
- Every internal Markdown link touched or left dangling by the above fixed.

### Out of scope

- `changes/*` — immutable project history, untouched.
- `knowledge/decisions.md` (the ADR log itself) — untouched, per instruction; only two other files'
  links to it were checked, not its content.
- CLI behavior — this is a documentation-only Change.

## Status

**Closed (2026-07-27).**

## Final Report

### Created documents

- `docs/getting-started.md` — install, bootstrap, first Change walkthrough (~15 minutes).
- `docs/concepts.md` — the vocabulary: Change, Change Manifest, Track/Stage/Gate, SDD Provider,
  Requirement Source, Skill, Hook, Verification Rule, Evidence.
- `docs/workflow.md` — full Core 3.0 lifecycle: three levels, tracks, Requirement Sources, Skills
  Runtime, Hooks Runtime, Verification (structural + requirement), responsibilities.
- `docs/configuration.md` — every configuration file AIEF reads: `manifest.json`, workflow track
  JSON files, `knowledge/standards/`, `knowledge/skills.md`, assistant files, profiles, Requirement
  Source providers, the CI gate.
- `docs/examples.md` — the Todo App example plus four worked command-line walkthroughs (plain
  Change, tracked Change, Requirement Source, Requirement Verification).
- `docs/maintainer.md` — how to extend a registry (Skill/Hook/Verification Rule/SDD
  provider/Requirement provider), how to contribute a Change to AIEF itself, documentation rules,
  testing, releasing.
- `docs/history/README.md` — index and one-paragraph summary of every relocated historical document.

### Updated documents

- `README.md` — completely rewritten: what AIEF is, the problem it solves, the product-workflow
  Mermaid diagram, install, use, extend, a documentation index, ecosystem table, contributing,
  status, license. No project history, no Change numbers, no ADR narrative in the body.
- `docs/architecture.md` — completely rewritten as the current implemented architecture (layers:
  CLI dispatcher / domain models / services / registries), covering the Workflow Engine, SDD
  Provider, Skills Runtime, Hooks Runtime, and Verification Engine as they exist today, with no
  Entrega/Change narrative.
- `docs/cli.md` — completely rewritten: full command/flag reference including every Core 3.0 flag
  (`status --change`/`--next`, `prompt --skill`/`--list-skills`, `verify --requirements`),
  cross-checked against `cli.js`'s actual `parseArgs()` handling.
- `AGENTS.md` and `cli/templates/agents/AGENTS.md` — one link fixed to the relocated governance
  conventions document (both edited together to keep the two files byte-identical, which
  `cli/tests/agents-canonical.test.js` enforces).
- `NAVIGATOR.md`, `CHANGELOG.md`, `cli/README.md`, `adapters/openspec/README.md`,
  `adapters/openspec/workflow.md`, `knowledge/backlog.md` — links updated to the new document names
  and locations; `CHANGELOG.md` also gained a note that it is not maintained past Change 0031,
  pointing to `changes/` for everything since.

### Removed documents

26 files deleted outright — content was either absorbed into one of the documents above, or was
purely repository/process narrative with no place in product documentation:
`docs/DEVELOPER-CHECKLIST.md`, `docs/FAQ.md`, `docs/Getting-Started.md`, `docs/TEAM-USAGE-GUIDE.md`,
`docs/VISION.md`, `docs/Vision-and-Principles.md`, `docs/Workflow.md`, `docs/architecture.md` (old),
`docs/bootstrap.md`, `docs/choosing-your-workflow.md`, `docs/ci-gate.md`, `docs/cli.md` (old),
`docs/domain-model.md`, `docs/ecosystem.md`, `docs/enrichment-workflow.md`,
`docs/first-30-minutes.md`, `docs/index.md`, `docs/learning-path.md`, `docs/lifecycle.md`,
`docs/mental-model.md`, `docs/migration-guide.md`, `docs/principles.md`,
`docs/project-lifecycle.md`, `docs/requirement-sources.md`, `docs/tooling.md`, and the entire
`docs/navigator/` tree (20 files: the install/decision-tree/paths ladder and its diagrams) —
absorbed into `docs/getting-started.md` and `docs/workflow.md`.

One additional file, `docs/aief-core-3-claude-code-prompt.md` (the original Spanish commissioning
brief for Core 3.0, referenced by Changes 0043–0049 as background), was found already reduced to a
redirect stub with no real content anywhere in git history or the working tree — the actual prose
was lost by the prior, discarded attempt before this Change began. It has been deleted; there is
nothing left to relocate. See Remaining blockers.

### Relocated documents (to `docs/history/`)

21 files, all internal links inside them corrected for the new depth: the "Experience Redesign"
UX study (`docs/aief-2.0/*`, 12 files, now `docs/history/aief-2.0-experience-redesign/`), three
pre-Core-3.0 roadmap documents, `VALIDATION-SUMMARY.md`, `dogfooding-findings.md`,
`governance-conventions.md`, `runtime-governance-open-questions.md`,
`external-harness-patterns.md`, and one pre-ADR proposal file.

### Major decisions made during documentation

1. **Discarded the entire prior attempt** (Change 0050's 12-document canonical-matrix plan and its
   partial implementation) rather than reconciling it with the new brief — the two approaches
   (no-deletion vs. deletion-allowed; elaborate ownership matrix vs. "keep it intentionally small")
   are structurally incompatible, and the new brief explicitly authorized discarding it.
2. **Single historical location**: consolidated everything historical under `docs/history/`
   (not `docs/historical/`, which the discarded attempt had used) — one clear location, as
   instructed, rather than two competing names.
3. **`docs/index.md` deleted, not rebuilt**: the README's own Documentation table now serves as the
   site index; a second index document would have duplicated it.
4. **Requirement Sources and Enrichment content merged into `docs/workflow.md`** rather than kept
   as standalone documents — the concept is one part of the Change lifecycle, not a separate
   subsystem needing its own page.
5. **`docs/aief-core-3-claude-code-prompt.md` deleted rather than restored** — its content was
   already unrecoverable (see Removed documents); keeping an empty redirect stub around serves no
   reader.

### Remaining blockers

None that block release. One informational note: the original Spanish commissioning prompt for
Core 3.0 (`docs/aief-core-3-claude-code-prompt.md`) is permanently lost — it was already replaced
by a content-free redirect stub before this Change's own work began, by the prior discarded
attempt, and no other copy exists in git history, `changes/`, or elsewhere in the repository. This
does not affect product documentation accuracy: Changes 0043–0049's own `proposal.md`/`design.md`
files independently describe what was actually built, and `docs/architecture.md`/`docs/workflow.md`
describe the as-built system directly from source, not from that brief.

### Addendum — repository-wide Markdown cleanup (second pass)

After the `docs/`-scoped rebuild above, a second, repository-wide pass reviewed every remaining
Markdown file outside `docs/` and `changes/*` against the same "does it still have a clear purpose
in Core 3.0" test. Full per-file classification, reference checks, and rationale: `evidence.md`.
Summary:

- **Removed** (10 locations, 21 files): `NAVIGATOR.md`; `specs/` (4 files, pre-CLI conceptual
  sketch); `reference-implementation/README.md`; `releases/v--help.md` (empty stub); `cli/templates/
  change/change.md` and `cli/templates/project/README.md`; `templates/openspec/change/` (3 files);
  `templates/change-types/` (1 file); `templates/project/` (2 files); `templates/change/` (4 files);
  `starter-project/` (20 files, pre-CLI manual-copy scaffold).
- **Kept after evaluation**: `templates/specboot/` — named explicitly in an accepted ADR's
  Consequences (`knowledge/decisions.md`) as describing a mapping alongside `adapters/specboot/`;
  deleting it would falsify that ADR. `AGENTS.md`/`CLAUDE.md`/`CODEX.md`/`CURSOR.md`/`GEMINI.md` —
  required-filename conventions, kept in full.
- **Fixed**: four dangling links inside `docs/history/aief-2.0-experience-redesign/` and
  `docs/history/proposals/` left one directory level too shallow by the original relocation above
  (`../../changes/...` → `../../../changes/...`).

`completed`
