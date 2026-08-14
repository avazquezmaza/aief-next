# Evidence

## Summary

`main` was confirmed to fully and safely integrate the Pre-Implementation Definition program
(Changes 0073–0086): all fourteen Changes are closed and reachable, and the maturity-detection,
Definition-Change, enrichment-marker, maturity-aware-standards, `verify --strict`, and
close-protection functionality all behave as documented. Seven stale, fully-merged local branches
(and six of their remote counterparts) were safely deleted. Documentation was audited end to end;
most of the Definition/maturity surface was already accurate and complete from Changes 0079–0086's
own scope — the real gap was `README.md`, which never mentioned Definition at all, plus two small
gaps in `docs/cheat-sheet.md` and `docs/concepts.md`. All three were fixed.

## Activities Performed

1. **Repository validation** — `git status`, `git branch --show-current`, `git remote -v`, `git
   fetch --all --prune --tags`, `git branch -vv`, `git rev-parse main`/`origin/main`, `git
   rev-list --left-right --count origin/main...main`. Result: branch `main`, working tree clean,
   `main == origin/main`, ahead/behind `0 0`. Matched expected starting state exactly.
2. **Integration verification** — confirmed `changes/0073-*` through `changes/0086-*` exist,
   are each closed (`node cli/bin/aief.js verify` shows `✓ ... (closed)` for all fourteen), and are
   reachable from `main` via `git log --oneline main -- changes/<id>`.
3. **Baseline** — `npm test` → 907/907 PASS, 0 fail, 0 skipped. `node cli/bin/aief.js verify` →
   `Result: PASS` (21 historical open Changes reported, correctly not treated as a blocker).
   `git diff --check` → clean.
4. **Branch validation** — `git branch --merged main` listed all 7 candidate branches (`core3`,
   `feat/bump-v3.1.0`, `feat/findings-status-tracking`, `feat/v3.1`,
   `feature/pre-implementation-definition`, `feature/workflow-cohesion-governance-conventions`,
   `remediation/audit-fixes-2026-08`); `git branch --no-merged main` returned nothing. Confirmed
   individually with `git merge-base --is-ancestor <branch> main` (all 7 passed) and
   `git merge-base --is-ancestor origin/<branch> origin/main` for the 6 with remote counterparts
   (all 6 passed; `remediation/audit-fixes-2026-08` has no remote counterpart).
5. **Branch cleanup** (destructive Git operation — user explicitly confirmed before running) —
   `git branch -d` for all 7 local branches; `git push origin --delete` for the 6 remote
   counterparts; `git fetch origin --prune`. Final local state: `* main` only. Six additional
   remote branches (`docs/0066-cheat-sheet-and-glossary`, `feat/0067-status-surfaces-next-
   recommendation`, `feat/0068-bootstrap-interactive-wizard`, `feat/0069-prompt-skills-ai-specs-
   aware`, `feat/0072-skill-recommendation-confidence`, `refactor/0070-shared-process-utils-
   openspec-consolidation`) were found merged into `origin/main` but were **not** part of this
   Change's explicitly-reviewed set, so they were left untouched, per the prompt's own rule.
6. **Release convention study** — read `changes/0060-*`, `0061-*`, `0062-*` in full. Found: 3.1's
   readiness Change (0060) explicitly excluded version bump/tag/release-notes from its own scope;
   version bump was a separate, minimal Change (0062); `git tag --list --sort=version:refname`
   shows only `aief-2.0-baseline` and `v3.0.0` — **no `v3.1.0` tag exists**; `ls releases/` shows
   only `v0.1.0.md`/`v0.2.0-readme-cli-v2.md`/`v1.0.0.md` — **neither 3.0.0 nor 3.1.0 has a
   `releases/` file**, despite `aief release <version>` existing; `CHANGELOG.md` states it is
   unmaintained past Change 0031; `gh` is not installed and no evidence of any prior GitHub
   Release was found. This contradicted the mission brief's assumption that tag/GitHub-Release
   conventions would be established — presented to the user, who chose to match 3.1's actual
   practice exactly: version-bump-only Change, no tag, no `releases/` file, no GitHub Release.
7. **Documentation audit** — read README.md, docs/concepts.md, docs/getting-started.md,
   docs/cli.md, docs/cheat-sheet.md, docs/architecture.md, docs/configuration.md, AGENTS.md, and
   `cli/templates/standards/*.md`. Grepped for `definition`, `maturity`, `analyze`, `verify`,
   `strict`, `human`, `decision`, `standards`, `skills`. Found:
   - `README.md` never mentioned "Definition" at all — the primary gap.
   - `docs/getting-started.md` "Starting from a PRD (no code yet)" section already thoroughly and
     accurately covers the pre-implementation flow (maturity detection output, marker convention,
     `status --change`, `verify --strict` vs default `verify`, `Decision (human)`/human-approval
     boundary, the `knowledge/decisions.md` ledger) — no false claim that bootstrap pre-creates it.
   - `docs/concepts.md` already documents Change types (including Definition) and Project Maturity
     accurately, but had no mention of maturity-aware standards.
   - `docs/cli.md` already documents `new-change --type definition`, `analyze --maturity`, and
     `verify --strict` accurately, including their exact behavior and exit codes.
   - `docs/cheat-sheet.md`'s glossary had no "Project Maturity" or "Definition Change" entry, and
     its canonical-flow step 2 only described the Implemented path.
   - `cli/templates/standards/base-standards.md`, `testing-standards.md`, `security-standards.md`
     each have real "Applies now" / "Applies once implementation starts" sections; `frontend-`,
     `backend-`, and `documentation-standards.md` do not — undocumented anywhere.
   - No documentation, anywhere, claims Architecture/Security/Data Definition Skills or Definition
     Expert Enrichment exist.
   - `docs/history/*` correctly retain old terminology as historical record — left untouched.
8. **Documentation changes**:
   - `README.md` — rewrote the opening tagline and "Why AIEF exists" to name definition alongside
     implementation/verification/change-lifecycle governance; added "## Definition and Analysis:
     two starting points" (maturity routing table) after "The core workflow"; added "## Start a
     software initiative before code exists" mirroring the existing-project section; added a
     pre-implementation-governance bullet to "What AIEF adds"; added two Documentation-table rows
     (PRD starting point, Project Maturity in the vocabulary row).
   - `docs/cheat-sheet.md` — added "Project Maturity" and "Definition Change" glossary rows;
     expanded canonical-flow step 2 to name both maturity paths.
   - `docs/concepts.md` — added a paragraph under "Project Maturity" naming which three standards
     are maturity-split and which are not.
9. **CLI validation** — `aief help analyze`, `aief help new-change`, `grep -- "--maturity"
   cli/src/cli.js`, `node cli/bin/aief.js verify` output cross-checked line-by-line against
   `docs/cli.md`'s `verify --strict` row. All documented flags/behavior confirmed to exist and
   match.
10. **Consistency search** — `grep -Rni` for `aief analyze`, `aief verify`, `Definition`,
    `existing.*implementation`, `existing.*code` across `README.md docs AGENTS.md`. No stale
    contradictory statement found; the `existing.*code` hits are accurate descriptions of the
    existing-project adoption path, not universal claims.

## Verification

```text
npm test
  # tests 907
  # pass 907
  # fail 0
  # skipped 0

node cli/bin/aief.js verify
  Result: PASS
  Next: 21 open Changes — select explicitly

git diff --check
  (clean, exit 0)
```

## Findings

- README.md's product positioning had drifted behind the CLI's actual capability — this is the one
  real documentation gap 3.2.0 needed to close, and it's fixed.
- The mission brief's assumption that AIEF has an established tag/GitHub-Release convention for
  minor releases does not hold: 3.1.0 shipped with neither. 3.2.0 follows the actual precedent.
- Six remote branches, already merged into `origin/main`, exist outside this Change's reviewed set
  and were correctly left alone.

## Risks

- None identified that block this Change. The known gap that `aief bootstrap` does not pre-create
  `knowledge/decisions.md` remains true and is accurately documented, not silently claimed fixed.

## Recommendations

- Proceed to Change 0088 (version bump only), then the human-confirmed push, per the confirmed
  3.1-matching release plan.

## Artifacts Produced

- `changes/0087-aief-3-2-0-release-readiness-and-documentation/{change.md,spec.md,tasks.md,
  evidence.md}`
- `README.md`, `docs/cheat-sheet.md`, `docs/concepts.md` (documentation edits)
- 7 local branches and 6 remote branches deleted (see Activities Performed §4–5)

## Lessons Learned

- Most of the Definition/maturity documentation work was already done as part of Changes
  0079–0086's own scope (each closed Change updated the docs it touched) — the release-readiness
  pass found a real but narrow gap (README positioning + two small doc gaps) rather than a wide one.
- The repository's actual release convention for minor versions is lighter than the mission brief
  assumed (no tag, no release-notes file for 3.1.0); following documented process meant querying
  the user rather than inventing a convention.

## Next Change

`0088-bump-version-3-2-0` — version bump only, mirroring the 0062 precedent.
