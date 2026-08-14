# Tasks

## Baseline

- [x] Validate starting state: `git status`, `git branch --show-current`, `git fetch --all --prune
      --tags`, `git rev-parse main`/`origin/main`, `git rev-list --left-right --count
      origin/main...main` (0 0), versions (3.2.0/3.2.0/`aief 3.2.0`).
- [x] `npm test` (907/907 PASS), `node cli/bin/aief.js verify` (PASS), `git diff --check` (clean).

## Visual Asset Audit

- [x] `find docs -type f \( -name '*.svg' -o ... \)` — 8 SVG/PNG pairs found.
- [x] Cross-reference every image against README.md/docs/*.md/AGENTS.md to find its referencing
      doc(s).
- [x] Inspect embedded `<text>`/`<title>`/`<desc>` in every SVG directly (not just Markdown grep)
      for stale version text and Analysis-only/existing-only mental-model bias.
- [x] Classify each: all 7 diagrams other than `adoption-workflow.svg` are Change-type-agnostic or
      architecture-level (no Analysis/Definition bias); `adoption-workflow.svg` is intentionally
      Analysis/existing-project-scoped, matching its documented purpose and README's paired
      "Adopt AIEF in an existing project" section.
- [x] Finding: all 7 diagrams (all except none — every one) had "AIEF Core 3.1" hardcoded in their
      visible title text.

## Fix Stale Labels

- [x] Located source of truth: `scripts/diagrams/*.py` + `scripts/generate_workflow_diagram.py`.
- [x] Replaced "AIEF Core 3.1" with version-neutral "AIEF" in every generator's heading text and
      docstrings (10 files).
- [x] Regenerated every SVG/PNG via `python3 scripts/diagrams/generate_all.py` (canonical
      mechanism — imagemagick renderer available, used).
- [x] Confirmed zero "3.1" strings remain in `docs/images/*.svg`.
- [x] Ran `cli/tests/diagrams.test.js` — all 9 tests pass, including the byte-for-byte
      regeneration-is-a-no-op determinism check.
- [x] Fixed README.md's product-workflow alt text (dropped "Core 3.1").
- [x] Fixed README.md's "## Status" section — was 3.1-only capability list; now version-neutral
      framing that also names the 3.2.0 Definition capability.

## 3.1 Reference Audit

- [x] `grep -RniE '3\.1\.0|v3\.1\.0|3\.1|v3\.1' README.md docs AGENTS.md cli/templates` — remaining
      matches are all in `docs/cli.md`, correctly historical/attribution ("AIEF 3.1, Change 00NN"
      citing which release introduced a flag) — retained, not misleading.
- [x] `cli/templates` — zero matches.

## Mental-Model Audit

- [x] `grep -RniE 'existing project|existing implementation|existing code|Analysis|Definition|...'`
      across README/docs/AGENTS.md/cli/templates — all matches are legitimate, scoped references
      (the existing-project path is documented as one of two paths, paired with Change 0087's
      Definition-path section; `docs/history/*` correctly retains old terminology).

## Remote Branch Audit

- [x] `git fetch origin --prune`; `git branch -r` — 6 candidates beyond origin/HEAD/origin/main.
- [x] `git branch -r --merged origin/main` / `--no-merged origin/main` — all 6 merged, none
      unmerged.
- [x] For each: `git merge-base --is-ancestor origin/<branch> origin/main` (all YES) and
      `git log --oneline origin/main..origin/<branch>` (all 0 unique commits).
- [x] User confirmed deletion (destructive Git operation).
- [x] `git push origin --delete` each of the 6, individually.
- [x] `git fetch origin --prune`; confirmed `origin/main` is now the only remote branch.
- [x] Local: `git branch` (`* main` only), `git branch --no-merged main` (empty).

## Scope Guard

- [x] `git status --short` / `git diff --stat` / `git diff --name-status` reviewed — diff limited
      to Change 0089's own files, README.md, `docs/images/*`, and `scripts/diagrams/*` /
      `scripts/generate_workflow_diagram.py`. No runtime source (`cli/src/*`) touched.

## Verification

- [x] `npm test` — 907/907 PASS.
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.

## Evidence

- [x] Update evidence.md
