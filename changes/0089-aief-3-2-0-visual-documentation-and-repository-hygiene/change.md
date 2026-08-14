# Change

## ID

`0089-aief-3-2-0-visual-documentation-and-repository-hygiene`

## Type

General (documentation/repository hygiene — no new subsystem)

## Objective

Complete the remaining AIEF 3.2.0 release hygiene: correct stale "AIEF Core 3.1" labels baked into
active product diagrams (SVG source + rendered PNG) and two README passages Change 0087 missed,
and finish auditing/cleaning remote branches — without changing runtime semantics, starting a new
feature program, or bumping the version past 3.2.0.

## Inventory of what already exists (read before touching anything)

Change 0087 (closed) already brought README/docs/concepts.md/cheat-sheet.md's *prose* in line with
3.2.0 and cleaned 7 branches proven merged from an explicitly-reviewed list. Its own evidence
flagged, but explicitly left untouched as out-of-scope, 6 further remote branches merged into
`origin/main` outside that reviewed set. Neither 0087 nor any earlier Change inspected the
*rendered diagrams* — `docs/images/*.svg`/`.png` — for embedded stale text; all seven are generated
by `scripts/diagrams/generate_*.py` (source of truth) via the canonical
`python3 scripts/diagrams/generate_all.py` (Change 0060, fourth pass), and every one of them had
"AIEF Core 3.1" hardcoded into its visible title.

## Scope

### In scope

- Inventory every file under `docs/images/` (svg + png), its referencing doc, and whether its
  embedded text is current or stale.
- Fix hardcoded "AIEF Core 3.1" text at its source (`scripts/diagrams/*.py`,
  `scripts/generate_workflow_diagram.py`) — replaced with a version-neutral "AIEF" label so this
  class of staleness does not recur at the next version bump — then regenerate every SVG/PNG
  through the existing canonical mechanism (`python3 scripts/diagrams/generate_all.py`), never
  hand-edited.
- Fix the two remaining stale/incomplete passages in `README.md` that Change 0087 missed: the
  product-workflow image's alt text ("AIEF Core 3.1 product workflow" → version-neutral) and the
  "## Status" section (named only 3.1-era capabilities; now also names the 3.2.0 Definition
  capability, version-neutral framing).
- Audit every current remote branch (`git branch -r`, `git branch -r --merged/--no-merged
  origin/main`); independently prove ancestry (`git merge-base --is-ancestor`) and zero unique
  commits (`git log origin/main..origin/<branch>`) for each candidate before any deletion.
- Delete only proven-safe remote branches, one at a time, after explicit human confirmation
  (destructive Git operation).
- Re-run the diagram determinism test (`cli/tests/diagrams.test.js`) and the full suite.
- This Change's own `spec.md`, `tasks.md`, `evidence.md`.

### Out of scope

- Any new subsystem, command, manifest field, or Definition functionality.
- Architecture/Security/Data Definition Skills, Definition Expert Enrichment.
- Version bump past 3.2.0, git tag, `releases/` file, GitHub Release.
- Redesigning any diagram's layout/content beyond the stale-label fix — each diagram's existing
  purpose and visual language are preserved; `adoption-workflow.svg` legitimately stays
  Analysis/existing-project-scoped (its documented purpose, paired with README's separate
  Definition-path section, not a claim to be the only path).
- Creating a brand-new Definition-specific diagram — audited and found unnecessary: no active
  diagram claims to be the complete product model while showing only Analysis; the two
  Change-type-agnostic diagrams (product-workflow, workflow-lifecycle) already describe the
  generic Change lifecycle that applies to Definition Changes too, and the Definition-vs-Analysis
  distinction itself is already covered by README prose/concepts.md from Change 0087.
- Deleting any branch not independently proven merged with zero unique commits.

## Success Criteria

- Every `docs/images/*.svg`/`.png` inventoried; embedded text inspected directly, not just
  Markdown grepped.
- No active diagram or active README passage displays a misleading "3.1" version label.
- No diagram implies Definition generates application code, or that Analysis is the only path.
- Every remote branch audited; every deletion independently proven; no unmerged/uncertain branch
  touched.
- `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass before commit.

## Status

Closed (2026-08-14)
