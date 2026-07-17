# Specification — DELETE review package

## Goal

An independent reviewer can accept or reject every deletion **without re-deriving the analysis**, and no deletion proceeds on the map author's word alone.

## Method

```bash
EX='--exclude-dir=.git --exclude-dir=node_modules --exclude-dir=graphify-out'
grep -rn $EX -- "<term>" .          # recursive, whole repo, every file type
```

Nine surfaces searched per item: **code · tests · documentation · templates · CLI · examples · workflows · ADRs · Changes**.

**Reference classes** — the distinction decides the verdict:

- **LIVE** — an active file points here. Must be re-pointed before removal.
- **CODE** — `cli/src` or `cli/tests` depends on it. Removal is a code change.
- **HISTORICAL** — a closed Change records it. **Never rewritten** (Change 0038 rule 2); not a blocker.
- **SELF** — the study documents that describe the item.

## Verdict summary

| # | Item | Map said | **Review says** | Why it changed |
|---|---|:-:|:-:|---|
| 1 | `aief propose` | DELETE | **KEEP** | ADR-002 mandates it; Change 0030 made it the enrichment continuation path; 8 tests |
| 2 | `docs/navigator/` (22 files) | DELETE | **ARCHIVE** | 931 lines; OS-specific deltas; Change 0026 declared its deletion out of scope |
| 3 | `starter-project/` (20 files) | DELETE | **ARCHIVE** | Contains artifacts `adopt` never generates |
| 4 | `NAVIGATOR.md` | DELETE | **ARCHIVE** | Coupled to item 2 |
| 5 | `docs/index.md` | DELETE | **MERGE** | Real navigational content; sole live pointer to `specs/` |
| 6 | 3 tombstones | DELETE | **KEEP** | Their stated purpose *is* link preservation; deleting reverses Change 0026 |
| 7 | `use-profile` | DELETE | **ARCHIVE** | Doubt → ARCHIVE |
| 8 | `release` | DELETE | **ARCHIVE** | Doubt → ARCHIVE |
| 9 | `Understand → Plan → Build` | DELETE | **MERGE** | It is an AGENTS.md edit, not a file deletion |
| 10 | `cli/templates/change/change.md` | DELETE | **DELETE** ✓ | 0 refs, dead |
| 11 | `cli/templates/project/README.md` | DELETE | **DELETE** ✓ | 0 refs, dead |
| 12 | `templates/openspec/change/*` (3) | DELETE | **DELETE** ✓ | 0 live refs; duplicates OpenSpec's own |
| 13 | `templates/change-types/analysis/evidence.md` | DELETE | **DELETE** ✓ | 0 live refs; verified byte-equivalent to `evidenceTemplate()` |
| 14 | `reference-implementation/` | DELETE | **DELETE** ✓ | 0 refs anywhere; 1-line placeholder |

**7 of 54 files survive as DELETE (13%).** 11 of 16 verdicts overturned.

---

## Records

### R1 · `aief propose` — **KEEP** *(the map was wrong)*

- **Path:** `cli/src/cli.js:806-830`, help at `:208-215`
- **Type:** CLI command
- **Map's reason:** 0 uses on Flux Portal; contradicts "AIEF references contracts, never wraps OpenSpec's CLI".
- **References found:**
  - **CODE:** `cli/src/cli.js:806` (impl), `:854` (dispatch), `:208-215` (help)
  - **TESTS:** `cli/tests/cli.test.js:351,362,376,378,385,393,404,414` · `cli/tests/change-selection.test.js:171` — **9 tests**
  - **ADRs:** `knowledge/decisions.md:104` — **ADR-002: "AIEF delegates to it when available (`aief propose`)"**
  - **LIVE docs:** `README.md:136,167` · `docs/Workflow.md:119,134,152` · `docs/enrichment-workflow.md:61` · `docs/ecosystem.md:24` · `docs/DEVELOPER-CHECKLIST.md:21` · `docs/TEAM-USAGE-GUIDE.md:121` · `adapters/openspec/README.md:55,59,79` · `cli/README.md:53,71`
  - **Changes:** 0030 (spec/tasks/evidence — a delivered fix), 0011, 0014
- **Replacement:** none exists.
- **Unique information — decisive:** `aief propose --change <id>` is **the documented path for continuing an enriched Change after Human Review** (`docs/enrichment-workflow.md:61`; Change 0030 spec §26). It adds `proposal.md` to an existing Change without touching `change.md`/`spec.md`/`tasks.md`. `new-change` cannot do this — it creates a new Change. The map's claim that "(b) *is* `new-change`" is **false**.
- **Risk:** **HIGH.** Deleting it (a) breaks the Enrichment continuation path — a human-gated workflow the approved direction explicitly protects; (b) contradicts **accepted ADR-002**, which outranks the map; (c) breaks 9 tests; (d) reverses a Workflow Cohesion fix delivered by Change 0030.
- **Recommendation:** **KEEP.**
- **Why the map was wrong:** it reasoned from *0 uses on one project* to *no dependency*. Flux Portal never used Enrichment either. **Absence of use is not absence of dependency** — and this is the exact error the map's own rules were written to prevent.

### R2 · `docs/navigator/` (22 files, 931 lines) — **ARCHIVE**

- **Type:** documentation tree (`install/` 3 · `paths/` 5 · `diagrams/` 7 · 7 root)
- **Map's reason:** 90 documented paths before writing code; contradicts progressive complexity.
- **References found:**
  - **CODE:** `cli/src/cli.js:692` — `status` reports Navigator as an adoption artifact ⚙
  - **LIVE:** `NAVIGATOR.md:16` · `docs/index.md:18,33,34` · `docs/migration-guide.md:60`
  - **HISTORICAL:** Changes 0008, 0019, 0026, 0027
- **Replacement:** README (entry) + `docs/cli.md` (commands) + `docs/bootstrap.md` (install).
- **Unique information — yes:** `install/windows.md` carries **PowerShell-specific** steps (Git for Windows, `git --version` verification) that `bootstrap.md` does not; it explicitly positions itself as a delta ("Canonical install reference: bootstrap.md"). `diagrams/` holds 7 mermaid diagrams not all reproduced in `Workflow.md`.
- **Risk:** **MEDIUM-HIGH.** 931 lines; Windows users lose OS-specific guidance; **Change 0026 explicitly declared "Deleting `starter-project/`, `specs/` or navigator" out of scope** — deleting reverses a prior scope decision.
- **Recommendation:** **ARCHIVE** → `docs/archive/navigator/`. Removes it from the path (the map's actual goal) without destroying the Windows delta. Requires `cli.js:692` + `README.md:200` + `docs/migration-guide.md:60` re-pointing.
- **Note:** archiving satisfies the design intent. The 90-path maze dies either way; only the recoverability differs.

### R3 · `starter-project/` (20 files, 392 lines) — **ARCHIVE** *(unique capability found)*

- **Type:** static sample project
- **Map's reason:** a snapshot of `aief init`'s output that has already drifted (`AGENTS.md`: 35 vs 14 vs 170).
- **References found:** **LIVE:** `CHANGELOG.md:8` · `docs/navigator/new-project.md:29` (`cp -R starter-project my-project`) · `starter-project/README.md:12` (self) · **HISTORICAL:** Changes 0002, 0013, 0018, 0026
- **Replacement:** `aief init` + `examples/todo-app` — **partial, not total.**
- **Unique information — YES, and this is a finding:**
  - `starter-project/.github/pull_request_template.md`
  - `starter-project/.github/ISSUE_TEMPLATE/change_request.md`
  - `starter-project/knowledge/{decisions,lessons-learned,constraints}.md`
  
  **`aief adopt` generates none of these** (`grep -c "pull_request_template\|ISSUE_TEMPLATE" cli/src/cli.js` → **0**). The drift argument is correct; the "`aief init` produces it live" claim is **not** — init produces a *subset*.
- **Risk:** **MEDIUM-HIGH.** Deleting loses a PR template, an issue template and three knowledge samples that no adoption path provides. Change 0026 declared its deletion out of scope.
- **Recommendation:** **ARCHIVE**, and open a **separate** Change to consider merging the PR/issue templates and knowledge samples into `adopt`.
- **The pattern:** this is [Change 0040](../0040-agents-md-canonical-source/evidence.md)'s finding D2 again — AIEF holds good artifacts that adopted projects never receive. Deleting the artifact would make the delivery gap permanent instead of fixing it.

### R4 · `NAVIGATOR.md` (16 lines) — **ARCHIVE**

- **Type:** root pointer
- **References:** **LIVE:** `README.md:200` · **CODE:** `cli/src/cli.js:692` ⚙ · **HISTORICAL:** Change 0009
- **Replacement:** README.
- **Unique information:** none — it points at `docs/navigator/README.md`.
- **Risk:** LOW on its own; **coupled to R2** — its verdict must follow the navigator's.
- **Recommendation:** **ARCHIVE** with R2. Requires `README.md:200` + `cli.js:692`.

### R5 · `docs/index.md` (54 lines) — **MERGE**

- **Type:** documentation index
- **References:** **LIVE:** links to navigator (×4) and `specs/` (×4) · **HISTORICAL:** Changes 0009, 0026
- **Replacement:** README.
- **Unique information — yes:** it is the **sole live pointer to `specs/`** and the only place labelling them "Historical Reference (v1 conceptual specs) — Superseded". Delete it and `specs/` becomes unreachable *and* unexplained.
- **Risk:** MEDIUM. Real navigational content, not a corpse.
- **Recommendation:** **MERGE → README** (or into `docs/archive/README.md` if `specs/` is archived). The map's "an index for 10 files is unnecessary" is a judgement; the content is not disposable.

### R6 · The three tombstones — **KEEP** *(the map was wrong)*

`docs/Vision-and-Principles.md` (8) · `docs/project-lifecycle.md` (5) · `docs/tooling.md` (5) — **18 lines total**

- **Type:** redirect stubs
- **References:** **LIVE:** `docs/VISION.md:3` · `docs/lifecycle.md:3` · `docs/ecosystem.md:3` — **the canonical documents point back at their own tombstones** · **HISTORICAL:** Changes 0005, 0026
- **Unique information:** none.
- **Risk:** **The map missed the point of the artifact.** Each says: *"This file remains only to keep old links working."* Their entire function is to be a redirect. Deleting them **executes exactly the breakage they exist to prevent**, and reverses an explicit decision from Change 0026. Archiving them is worse than useless — it breaks the link *and* keeps the file.
- **Recommendation:** **KEEP.** They cost 18 lines. The honest alternatives are KEEP, or a deliberate decision that old links may break — never a tidiness deletion. If deleted, the three canonical docs must drop their back-references too.

### R7 · `use-profile` — **ARCHIVE (demote)**

- **Path:** `cli/src/cli.js:848`, help `:258`
- **References:** **CODE:** `:848`, `:854` · **TESTS:** `cli/tests/cli.test.js:435` (help coverage) · **LIVE:** `docs/cli.md:47` · **HISTORICAL:** Changes 0007, 0014
- **Behavior:** prints 3 lines — `Use AGENTS.md. / Act as the <x> profile. / Work only on the active Change.`
- **Replacement:** `aief prompt --profile <role>` — **not equivalent.** `prompt` composes the full brief for a Change; `use-profile` prints a standalone header with no Change.
- **Unique information:** the only command that surfaces a **Role**, a concept the approved direction explicitly preserves.
- **Risk:** MEDIUM. Removing the only Role-facing command while Roles are being kept is incoherent.
- **Recommendation:** **ARCHIVE** — drop from the main `help` listing, keep working. Deleting requires editing the help-coverage test.

### R8 · `release` — **ARCHIVE (demote)**

- **Path:** `cli/src/cli.js:849`, help `:247`
- **References:** **CODE:** `:849`, `:854` · **TESTS:** `cli/tests/cli.test.js:523,525` (idempotence) + `:435` · **LIVE:** `README.md:171` · **HISTORICAL:** Change 0007
- **Replacement:** hand-written `releases/*.md` — 3 exist.
- **Unique information:** none; it writes a stub with an idempotence guarantee.
- **Risk:** LOW-MEDIUM. Evidence is only "0 uses on one project". **Doubt → ARCHIVE.**
- **Recommendation:** **ARCHIVE** — drop from main help, keep working. Confirm no release process calls it.

### R9 · `Understand → Plan → Build → Verify → Document` — **MERGE**

- **Path:** `AGENTS.md:35`, `starter-project/AGENTS.md:24`
- **Type:** concept (a workflow phrasing)
- **Reason:** a 5th phrasing contradicting ADR-011, in the file adopted projects read.
- **Unique information:** it is the **only workflow guidance an adopted project currently receives** — the canonical 3 levels live in `docs/Workflow.md`, which adopters do not get.
- **Risk:** MEDIUM. Deleting it without replacement leaves the adopted `AGENTS.md` with *no* workflow at all — a net loss.
- **Recommendation:** **MERGE** — replace with a reference to the canonical model in the same edit. **Not a file deletion**; it is an AGENTS.md content change belonging to Change 0038's concept cluster, sequenced **after** Change 0040.

### R10–R14 · The dead templates + placeholder — **DELETE** ✓

| Path | Refs (recursive, all 9 surfaces) | Unique info | Risk |
|---|---|---|---|
| `cli/templates/change/change.md` (3 lines) | **0** — contains `"Generated by AIEF CLI."`; never read (`grep -n readFileSync cli/src/cli.js` → standards/ci/package.json only) | none | **NONE** |
| `cli/templates/project/README.md` (3) | **0** | none | **NONE** |
| `templates/openspec/change/*.md` (3, 29 lines) | 0 live; HISTORICAL: Change 0004 | Duplicates OpenSpec's own templates — a fork ADR-003 forbids | **NONE** |
| `templates/change-types/analysis/evidence.md` (37) | 0 live; HISTORICAL: Change 0031 | **Verified**: identical in shape to `evidenceTemplate()`, which `analysisChangeFiles()` already calls (`cli/src/cli.js:336`). Not analysis-specific | **NONE** |
| `reference-implementation/README.md` (1) | **0 anywhere** except the 2.0 study | `"Reference implementation placeholder."` | **NONE** |

- **Recommendation:** **DELETE** all five. Zero references proven recursively; every one is dead or a verified duplicate. **This is the only cluster that should move first.**

---

## Acceptance Criteria

- [x] Every DELETE item has a record with all eight required fields.
- [x] Every reference search is recursive across all nine surfaces.
- [x] Commands recorded ([evidence.md](evidence.md)).
- [x] Every "0 references" claim proven recursively, not by glob.
- [x] Items with unique information downgraded from DELETE (R2, R3, R5, R7, R9).
- [x] Items with a live code/ADR/test dependency downgraded (R1).
- [x] Doubt resolved as ARCHIVE (R2, R3, R4, R7, R8).
- [x] Overturned verdicts explain what the map got wrong.
- [x] Nothing deleted, renamed, archived or moved.
- [ ] (human) Independent reviewer accepts or amends each record.
- [ ] (human) Confirm R1 (`propose` = KEEP) — the map's most serious error.
- [ ] (human) Decide R6: keep the tombstones, or accept that old links break.
- [-] Link validation on a temporary copy — **execution Change**; nothing has moved yet.
