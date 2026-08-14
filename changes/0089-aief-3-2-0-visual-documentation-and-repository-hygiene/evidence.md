# Evidence

## Summary

All 7 generated diagrams under `docs/images/` had "AIEF Core 3.1" hardcoded into their visible
title text — a genuine, provable staleness bug (the exact "package = 3.2.0, diagram = 3.1.0"
contradiction this Change was commissioned to find). Fixed at the source (the Python generators)
with a version-neutral "AIEF" label so this class of bug does not recur at the next bump, then
regenerated every SVG/PNG through the existing canonical mechanism. Two README passages Change
0087 missed (the product-workflow image's alt text, and the "## Status" section) were also fixed.
No diagram's *content* needed correction — none showed an Analysis-only or existing-only mental
model, and none implied Definition generates application code. All 6 remote branches Change 0087
had flagged but left out of scope were independently proven merged with zero unique commits and
deleted after explicit confirmation.

## Activities Performed

1. **Baseline** — `git status`/`branch --show-current`/`fetch --all --prune --tags` confirmed
   branch `main`, working tree clean, `main == origin/main`, `0 0` ahead/behind, version 3.2.0/
   3.2.0/`aief 3.2.0`. `npm test` → 907/907 PASS. `node cli/bin/aief.js verify` → PASS. `git diff
   --check` → clean.
2. **Visual inventory** — `find docs -type f \( -name '*.svg' -o -name '*.png' -o ... \)` found 8
   pairs (16 files): `adoption-workflow`, `core-runtime`, `graph-engineering`, `product-workflow`,
   `prompt-composition`, `system-context`, `workflow-lifecycle`, `workflow` (the last is a
   byte-identical standalone-export alias of `workflow-lifecycle`, per ADR-030 §3/Change 0060).
   Cross-referenced against README.md/docs/*.md via grep for `docs/images/...` and relative
   `images/...` paths — every image has exactly one referencing doc (`adoption-workflow` ←
   getting-started.md, `system-context`/`core-runtime`/`prompt-composition`/`graph-engineering` ←
   architecture.md, `product-workflow` ← README.md (+ maintainer.md's regeneration doc),
   `workflow-lifecycle` ← workflow.md, `workflow` ← maintainer.md only, as its documented
   deck/non-GitHub export role).
3. **Embedded-text inspection** — extracted every `<text>`/`<title>`/`<desc>` element from each
   SVG directly (not Markdown grep). Found: all 7 diagrams' visible title read "AIEF Core 3.1 —
   <name>"; none of the 7 mentioned "Analysis" or "Definition" by name except
   `adoption-workflow.svg`, whose `<desc>` and body correctly describe the existing-project
   adoption flow (its documented, intentional scope — paired with README's separate "Start a
   software initiative before code exists" section from Change 0087, not a claim to be the only
   path). No diagram implies Definition generates code or that Analysis is the only entry point.
4. **Fix at source** — `grep -rn "AIEF Core 3.1" scripts/diagrams/*.py
   scripts/generate_workflow_diagram.py` found the hardcoded string in 10 files (every generator +
   `common.py`'s docstring + `generate_all.py`'s docstring + the `workflow.svg` compatibility
   wrapper). Replaced `AIEF Core 3.1` → `AIEF` throughout (both visible heading text and
   docstrings) — a deliberate version-neutral choice per the mission's own guidance ("prefer
   version-neutral diagrams where hardcoding 3.2.0 adds no value"), since a hardcoded version
   number is exactly what caused this staleness.
5. **Regeneration** — confirmed `imagemagick` (`magick`/`convert`) available, no `rsvg-convert`.
   Ran `python3 scripts/diagrams/generate_all.py` — regenerated all 8 SVG/PNG pairs cleanly, "no
   stray output files" reported. `grep -rl "3\.1" docs/images/*.svg` → no matches. Ran
   `node --test cli/tests/diagrams.test.js` → 9/9 pass, including "regenerating every diagram is a
   no-op (deterministic output)".
6. **README fixes** — product-workflow image alt text: `AIEF Core 3.1 product workflow` → `AIEF
   product workflow`. `## Status` section: rewrote from a 3.1-only capability list to a
   version-neutral framing that also names the 3.2.0 Definition capability (project maturity
   detection, Definition Changes, human decision gating, `verify --strict`).
7. **3.1 reference sweep** — `grep -RniE '3\.1\.0|v3\.1\.0|3\.1|v3\.1' README.md docs AGENTS.md
   cli/templates`. Remaining matches are all in `docs/cli.md` (4 rows: bootstrap history line,
   `--interactive`, `verify --strict`, `--evidence-from`), each reading `AIEF 3.1, Change 00NN` —
   correctly historical attribution (which release introduced a flag), matching every other row's
   convention in that same table. `cli/templates` — zero matches. No active/current claim of "the
   product is 3.1" survived.
8. **Mental-model sweep** — `grep -RniE 'existing project|existing implementation|existing code|
   Analysis|Definition|maturity|Implemented|Ambiguous|PRD|requirements'` across README/docs/
   AGENTS.md/cli/templates. Every match is a legitimate, correctly-scoped reference: the
   existing-project sections (README, getting-started.md, cli.md, examples.md) describe one of two
   documented paths, not the only one; `docs/history/*` retains old terminology as historical
   record, correctly untouched.
9. **Remote branch audit** — `git fetch origin --prune`; `git branch -r` showed 6 branches beyond
   `origin/HEAD`/`origin/main`: `docs/0066-cheat-sheet-and-glossary`,
   `feat/0067-status-surfaces-next-recommendation`, `feat/0068-bootstrap-interactive-wizard`,
   `feat/0069-prompt-skills-ai-specs-aware`, `feat/0072-skill-recommendation-confidence`,
   `refactor/0070-shared-process-utils-openspec-consolidation`. `git branch -r --merged
   origin/main` listed all 6; `--no-merged origin/main` returned nothing. Independently proved each
   with `git merge-base --is-ancestor origin/<branch> origin/main` (all exit 0/YES) and
   `git log --oneline origin/main..origin/<branch>` (all 0 unique commits).
10. **Deletion** — user explicitly confirmed (destructive Git operation). Ran `git push origin
    --delete <branch>` individually for each of the 6 — all succeeded, no permission/protection
    failures. `git fetch origin --prune` afterward: `git branch -r` shows only `origin/HEAD ->
    origin/main` and `origin/main`.
11. **Local hygiene** — `git branch` → `* main` only. `git branch --merged main` → `main` only.
    `git branch --no-merged main` → empty.
12. **Scope guard** — `git status --short`/`git diff --stat`/`git diff --name-status` reviewed:
    changes limited to `README.md`, `docs/images/*` (16 files, binary PNG diffs from
    non-deterministic ImageMagick-vs-current-run metadata are irrelevant — content is deterministic
    per the diagrams test), `scripts/diagrams/*.py`, `scripts/generate_workflow_diagram.py`, and
    this Change's own directory. No `cli/src/*` runtime file touched.
13. **Final regression** — `npm test` → 907/907 PASS. `node cli/bin/aief.js verify` → PASS.
    `git diff --check` → clean.

## Verification

```text
npm test
  # tests 907
  # pass 907
  # fail 0

node cli/bin/aief.js verify
  Result: PASS

git diff --check
  (clean, exit 0)

node --test cli/tests/diagrams.test.js
  # tests 9
  # pass 9
  # fail 0
```

## Findings

- All 7 generated diagrams had a real, provable staleness bug (hardcoded "AIEF Core 3.1" title) —
  now fixed at the source with a version-neutral label, which also prevents recurrence at the next
  version bump.
- No diagram's *content* (as opposed to its version label) was stale or misleading — the
  Definition-vs-Analysis distinction is carried by README/concepts.md prose (Change 0087), and no
  diagram contradicts it.
- Change 0087's own evidence had already flagged the 6 remote branches now deleted, correctly as
  out-of-scope for that Change; this Change completes that follow-up.

## Risks

None identified that block this Change.

## Recommendations

None — this closes the AIEF 3.2.0 release-hygiene program. Next work starts a new, independent
program from this baseline.

## Artifacts Produced

- `changes/0089-aief-3-2-0-visual-documentation-and-repository-hygiene/{change.md,spec.md,
  tasks.md,evidence.md}`
- `README.md` (alt text + Status section)
- `docs/images/*.svg`/`.png` (8 pairs, regenerated)
- `scripts/diagrams/*.py`, `scripts/generate_workflow_diagram.py` (version-neutral label fix)
- 6 remote branches deleted (see Activities Performed §9–10)

## Lessons Learned

- Markdown-level grep alone would have missed this Change's real finding entirely — the stale
  version text lived only inside generated SVG `<text>` elements, never in any `.md` file.
- Hardcoding a version string into a diagram generator recreates the exact staleness problem at
  every future release; a version-neutral label is the more durable fix for diagrams whose content
  doesn't actually depend on the version number.

## Next Change

None — this is the final Change of the AIEF 3.2.0 release program. The next program (Definition
Expert Enrichment / Architecture Definition Skills) starts fresh from this baseline.
