# Evidence

## Summary

Independent-review package for all 16 DELETE verdicts in Change 0038. **The review overturned 11 of them. 7 of 54 files (13%) survive as DELETE** — all with zero recursive references, all dead or verified duplicates.

**The map's most serious error: `aief propose`.** It is mandated by accepted **ADR-002**, was extended by **Change 0030** as the documented continuation path for an **enriched Change after Human Review**, and carries **9 tests**. Deleting it would have broken the Enrichment workflow and the human gate the approved direction explicitly protects — the exact outcome the "Track cannot weaken a gate" rule exists to prevent, arriving through a different door.

**Nothing was deleted, renamed, archived or moved.**

## Verification — commands used

```bash
EX='--exclude-dir=.git --exclude-dir=node_modules --exclude-dir=graphify-out'

# Recursive reference scan, per item, all nine surfaces
grep -rn $EX -- "NAVIGATOR" .
grep -rn $EX -- "docs/index" .
grep -rn $EX -- "Vision-and-Principles" .
grep -rn $EX -- "project-lifecycle" .
grep -rn $EX -- "docs/tooling" .
grep -rn $EX -- "navigator" .
grep -rn $EX -- "starter-project" .
grep -rn $EX -- "reference-implementation" .
grep -rn $EX -- "templates/openspec" .
grep -rn $EX -- "change-types" .
grep -rn $EX -- "cli/templates/change" .
grep -rn $EX -- "cli/templates/project" .
grep -rn $EX -- "use-profile" .
grep -rn $EX -E '"propose"|aief propose|case "propose"|propose\(' .
grep -rn $EX -E '"release"|aief release|case "release"' .

# Decisive checks
grep -n "propose" knowledge/decisions.md                     # -> :104  ADR-002 names `aief propose`
grep -n "propose" changes/0030-*/spec.md                     # -> enrichment continuation, delivered
grep -c "pull_request_template\|ISSUE_TEMPLATE" cli/src/cli.js  # -> 0   adopt generates neither
grep -n readFileSync cli/src/cli.js                          # -> standards, ci, package.json only
grep -n "Navigator" cli/src/cli.js                           # -> :692  status is coupled to it
grep -rn "out of scope" changes/0026-*/change.md             # -> "Deleting starter-project/, specs/ or navigator"

node cli/bin/aief.js verify --change 0041-delete-review-package   # -> PASS
git status --short | grep -E "^ ?D|^ ?R" | wc -l                  # -> 0   nothing deleted or renamed
```

## Findings

| # | Finding | Consequence |
|---|---|---|
| **E1** | **`propose` is load-bearing.** ADR-002 mandates it; Change 0030 made `propose --change` the enrichment continuation path; 9 tests cover it | The map reasoned *0 uses → no dependency*. **Absence of use is not absence of dependency.** Flux never used Enrichment either |
| **E2** | **`starter-project/` holds artifacts no adoption path delivers**: a PR template, an issue template, three knowledge samples. `adopt` generates none | Deleting would make a delivery gap permanent instead of fixing it — [Change 0040](../0040-agents-md-canonical-source/evidence.md)'s D2 pattern, again |
| **E3** | **The tombstones exist to keep old links working** — and the three canonical docs back-reference them | Deleting them performs exactly the breakage they prevent, and reverses Change 0026 |
| **E4** | **Change 0026 already decided** that deleting `starter-project/`, `specs/` and navigator was out of scope | The map re-proposed a deletion a prior Change deliberately declined. Neither the map nor this review may overturn that alone |
| **E5** | **`navigator/install/windows.md` has PowerShell-specific content** absent from `bootstrap.md`; it self-declares as a delta | ARCHIVE, not DELETE. Windows users would lose real guidance |
| **E6** | **`docs/index.md` is the sole live pointer to `specs/`** and the only text explaining they are superseded | Delete it and `specs/` becomes unreachable *and* unexplained |
| **E7** | **Only 5 items are unambiguously dead** — all templates the CLI never reads plus a 1-line placeholder. `templates/change-types/analysis/evidence.md` verified as a duplicate of `evidenceTemplate()` | The real dead surface is ~7 files, not 54 |
| **E8** | **Deleting docs requires code changes** in two places (`cli.js:692`) | Documentation and code are coupled where nobody would look |

## Risks

| Risk | Severity | Mitigation |
|---|:-:|---|
| **`propose` gets deleted on the map's authority** | **High** | R1 documents ADR-002 + Change 0030 + 9 tests. Requires an ADR to overturn, not a verdict |
| **Cluster execution follows the map instead of this review** | **High** | The review supersedes the map's DELETE column. Any execution Change must cite R1–R14, not 0038 §5 |
| **ARCHIVE becomes a graveyard** — `docs/archive/` grows and nothing is ever decided | Med | Archive with an expiry review; archived ≠ decided |
| starter-project's unique artifacts are archived and forgotten (E2) | Med | R3 recommends a separate Change to merge them into `adopt` **before** archiving |
| The reviewer rubber-stamps 14 records | Med | The 5 unambiguous DELETEs are separable; review those first, cheaply, and spend attention on R1–R6 |
| This review is also authored by the map's author | **High** | **Unresolved by construction.** It narrows what a human must check; it does not replace the human |

## Recommendations

1. **Confirm R1 first.** `propose` = KEEP is the highest-stakes correction; everything else is documentation.
2. **Execute only R10–R14** (7 dead files, 0 references) once approved. Cheap, safe, reversible, and it removes the templates that currently make the docs lie about what the tool produces.
3. **Do not touch navigator or starter-project until R3's merge question is answered.** Archiving first would bury the PR/issue templates rather than deliver them.
4. **Decide R6 explicitly.** Keeping 18 lines of redirect is not a defeat; deleting them without deciding is.
5. **Get a second reader for R1–R6.** R7–R14 are mechanical. R1–R6 are judgement, and this package's author already got 11 of 16 wrong once.

## Artifacts Produced

| Artifact | Location |
|---|---|
| The 14 review records | [`spec.md`](spec.md) |
| Verdict summary + method | [`spec.md`](spec.md) · [`change.md`](change.md) |

## Lessons Learned

1. **The review overturned 11 of 16 of my own verdicts.** The independent-review requirement was not process theater — it was the control that caught a deletion which would have broken an accepted ADR, a delivered fix and a human gate.
2. **"0 uses" and "0 references" are different measurements, and I conflated them.** Flux Portal's usage told me nothing about ADR-002, Change 0030, or 9 tests. Usage data is about a project; dependency data is about the repository.
3. **A non-recursive glob undercounted the navigator by 3×**; a naive grep confused a *mention* with a *declaration* (Change 0030); a line count (8%) overstated a rule gap that is really ~18%. **Three measurement errors in one map** — each plausible, each confidently reported. This is the failure this whole programme is about, and the author is not exempt.
4. **Deleting an artifact can make a gap permanent.** `starter-project/` holds templates adopters never receive. The map read that as redundancy. It is an undelivered capability, and deletion would settle the question the wrong way, forever.
5. **Two prior decisions were re-proposed without noticing**: Change 0026 declined these deletions; the tombstones exist by decision. A map that does not read the decisions it reverses is a proposal to repeat an argument nobody remembers having.

## Second reader — independent review (2026-07-17)

An independent reviewer re-derived R1–R6 from the repository, **without access** to this package, Change 0038, Change 0037 or `docs/aief-2.0/` (those paths were forbidden to it). It ran its own recursive reference searches.

### Combined matrix — the required deliverable

Reconciliation rule (per the approved direction): **any disagreement keeps the artifact; doubt favors KEEP or ARCHIVE; DELETE requires consensus plus positive evidence.**

| ID | Item | Map (0038) | 1st reviewer (0041) | 2nd reviewer | Evidence | Risk | **Reconciled decision** |
|---|---|:-:|:-:|:-:|---|:-:|:-:|
| R1 | `aief propose` | DELETE | KEEP | **KEEP** | `cli.js:858` dispatch, `:810` impl; **ADR-002** `decisions.md:104`; ~20 test assertions | High | **KEEP** (consensus) |
| R2 | `docs/navigator/` | DELETE | ARCHIVE | **KEEP** | `docs/index.md:18,33,34` live links; `cli.js:696` **doctor** detects it; unique OS-install + decision-tree content | High | **KEEP** (disagreement → keep) |
| R3 | `starter-project/` | DELETE | ARCHIVE | **KEEP** | `docs/navigator/new-project.md:26,29` — live "Option B: `cp -R starter-project`" manual adoption path | Med-High | **KEEP** (disagreement → keep) |
| R4 | `NAVIGATOR.md` | DELETE | ARCHIVE | **KEEP/MERGE** | `README.md:200` live link; `cli.js:696` + `cli.test.js:151` doctor detection | Med | **KEEP** (disagreement → keep) |
| R5 | `docs/index.md` | DELETE | MERGE | **KEEP** | The only documentation table-of-contents; **no `docs/README.md` exists** to replace it | Med | **KEEP** (disagreement → keep) |
| R6 | 3 tombstones | DELETE | KEEP | **ARCHIVE** | Created by Change 0026 to preserve old links; replacements back-reference them (`VISION.md:3`, `lifecycle.md:3`, `ecosystem.md:3`) | Low | **KEEP** (doubt → keep; also human decision #2) |

**Result: 0 of 6 reach DELETE.** The map proposed 6 deletions in R1–R6; independent review confirms **none** should proceed.

### What the second reader found that the first missed

- **`aief doctor` also depends on the navigator** (`cli.js:696` + `cli.test.js:151`), not only `status` (`cli.js:692`). Two commands are coupled to `docs/navigator/`, not one — strengthening R2 and R4 from ARCHIVE toward KEEP.
- **`docs/navigator/new-project.md:26,29` documents copying `starter-project/` as a live "Option B"** manual adoption path. This is an *active workflow dependency* for R3, independent of the PR/issue-template capability finding — deleting the directory breaks a documented path, not just a sample.
- **`docs/index.md` has no replacement**: there is no `docs/README.md`. The first reviewer's MERGE→README assumed a target; the second reader found the index is the sole documentation hub, pushing it from MERGE to KEEP.

### Reviewer agreement

- **R1: full consensus** — both reviewers independently call the map's DELETE provably wrong (ADR-002 + tests).
- **R2–R5: the second reader is *more* conservative** than the first (KEEP where the first said ARCHIVE/MERGE). Under the reconciliation rule this only reinforces KEEP.
- **R6: the two disagree** (KEEP vs ARCHIVE) — which, by rule, resolves to KEEP.

**The independent review did its job:** a fresh reader with no sight of the analysis reached the same destination (nothing deletable in R1–R6) by a different, and in places stronger, path. The map author was not the sole approver.

### Still unreviewed: R10–R14 (the dead templates)

The 7 files the first review left as DELETE (dead `cli/templates/`, `templates/openspec/`, `templates/change-types/`, `reference-implementation/`) were **not** sent to the second reader — the mandate was R1–R6. They therefore **have no second-reader consensus yet** and remain non-executable. Before cluster D.1 (dead templates) runs, they need the same two-reader treatment. **No DELETE proceeds without it.**

## Second reader — R10–R14 (dead templates), independent review (2026-07-17)

A second independent reviewer re-derived R10–R14 with **no access** to the first reviewer's package (0038/0041/0037/0039 and `docs/aief-2.0/` forbidden). It answered the load-bearing question itself — *does the CLI read these files, or generate the artifacts from inline strings?*

**Independent finding:** the CLI generates every Change artifact from **inline strings** (`genericChangeFiles()` `cli.js:345`, `analysisChangeFiles()` `:337`, `evidenceTemplate()` `:298`, enrichment `:398`, init README `:774`). Every `readFileSync` in `cli.js` targets only `templates/standards/`, `templates/ci/`, `templates/agents/`, `package.json` — **never** `cli/templates/change/`, `cli/templates/project/`, `templates/openspec/`, or `templates/change-types/`.

### Combined matrix — R10–R14

Consensus applies ADR-014: `Candidate DELETE` requires both reviewers to agree *and* positive evidence; any doubt favors ARCHIVE/KEEP.

| ID | Path | 1st reviewer | 2nd reviewer | CLI reads it? | Unique content | **Reconciled** |
|---|---|:-:|:-:|:-:|---|:-:|
| R10 | `cli/templates/change/change.md` | DELETE | Candidate DELETE | No | none (3-line stub) | **Candidate DELETE** (consensus) |
| R11 | `cli/templates/project/README.md` | DELETE | Candidate DELETE | No (`init` writes inline `:774`) | none (3-line stub) | **Candidate DELETE** (consensus) |
| R12 | `templates/openspec/change/*` (3) | DELETE | Candidate DELETE / **ARCHIVE** | No | "mild unique wording", consumed by nothing | **ARCHIVE** (doubt → archive) |
| R13 | `templates/change-types/analysis/evidence.md` | DELETE | Candidate DELETE | No | **byte-identical to `evidenceTemplate()`** (`:298`, called at `:340`) | **Candidate DELETE** (consensus, strongest) |
| R14 | `reference-implementation/README.md` | DELETE | Candidate DELETE | No | none (1-line placeholder) | **Candidate DELETE** (consensus) |

**Result:** 4 of 5 reach two-reviewer **Candidate DELETE** consensus (R10, R11, R13, R14); R12 resolves to **ARCHIVE** because the second reviewer flagged unique wording — a doubt, which by ADR-014 favors ARCHIVE.

### What the second reviewer added

- **Proved R13 is a byte-identical duplicate** of the live inline `evidenceTemplate()` — not merely "similar in shape" as the first review claimed, but 257 == 257 bytes. The strongest deletion case in the whole map.
- **Confirmed the inline-generation mechanism from scratch**, citing every generator line. Two independent readers now agree the documented templates are not the tool's templates.

### Status of these five under ADR-014

Per the ratified flow — `Candidate DELETE → consensus → Approved DELETE → execution` — R10/R11/R13/R14 now have consensus and are eligible to become **Approved DELETE**; R12 is **ARCHIVE**. **Execution remains deferred by explicit instruction** ("No ejecutes todavía ningún DELETE"). Nothing was removed.

## Next Change

**None.** This package authorizes nothing; it prepares a human review.

Blocking sequence, per the approved order: (A) Change 0039 approved → (B) Change 0040 executed → (C) **this review accepted by someone other than its author** → (D) cluster execution, starting with R10–R14.
