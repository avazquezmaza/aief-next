# Specification

## Goal

Active AIEF product documentation — prose and rendered diagrams alike — accurately represents
AIEF 3.2.0, with no misleading "3.1" labels; historical documentation and Change evidence are
untouched; and all remote branches are audited with only independently-proven-safe ones deleted.

## Requirements

- Every file under `docs/images/` must be inventoried: referencing doc, current vs historical,
  version-specific text, whether it shows an Analysis-only or existing-project-only model, whether
  it's affected by Definition, and whether it requires an update.
- SVG embedded text (`<title>`, `<desc>`, `<text>` elements) must be inspected directly — grepping
  the referencing Markdown alone is insufficient.
- Any stale "AIEF Core 3.1" (or equivalent) label in an active diagram or active README passage
  must be corrected without redesigning the diagram's layout or erasing its documented purpose.
- Diagram regeneration must go through the existing, reproducible mechanism
  (`scripts/diagrams/generate_all.py`) — never a hand-edited SVG/PNG or an invented pipeline.
- Every current remote branch must be audited (`git branch -r --merged/--no-merged origin/main`);
  every branch considered for deletion must be independently proven via
  `git merge-base --is-ancestor` AND zero unique commits via `git log origin/main..<branch>`.
- No branch may be deleted without explicit human confirmation (destructive Git operation).
- Historical documentation, Change evidence, and ADRs must not be altered.
- `npm test`, `node cli/bin/aief.js verify`, `git diff --check` must all pass before this Change
  closes.

## Acceptance Criteria

- [x] All 8 SVG/PNG pairs under `docs/images/` inventoried with referencing doc and classification.
- [x] All 7 diagrams' embedded "AIEF Core 3.1" text found and corrected at generator source.
- [x] Diagrams regenerated via `python3 scripts/diagrams/generate_all.py`; diagram determinism
      test (`cli/tests/diagrams.test.js`) passes.
- [x] README.md's product-workflow alt text and "## Status" section corrected.
- [x] No diagram shows Definition generating application code, or implies Analysis is the only
      path.
- [x] `adoption-workflow.svg` confirmed intentionally Analysis/existing-project-scoped (its
      documented purpose) — not treated as a defect.
- [x] All 6 remaining remote branches audited; each independently proven merged with zero unique
      commits; deleted only after explicit confirmation.
- [x] Local branch state confirmed: `* main` only, nothing unmerged.
- [x] `npm test` (907/907), `node cli/bin/aief.js verify` (PASS), `git diff --check` (clean).
