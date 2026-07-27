# Verification — Documentation Architecture and System Map (AIEF Core 3.0)

This Change is planning/analysis only. Every scenario below was run against the *real* repository
state (inspection, grep, and compatibility checks) — nothing here required implementing code, since
no code was touched.

## Scenarios and results

| # | Scenario | DOC-R | Result |
|---|---|---|---|
| 1 | Every Markdown file is inventoried | DOC-R1 | 382 files counted via `find`, broken down by 13 top-level locations (`design.md` §2.1) — PASS |
| 2 | Every Markdown file has one primary category | DOC-R3 | All 382 accounted for by explicit category (individually for ~50 Layer-1/candidate files, by bulk-category accounting for uniformly-structured `changes/`/`templates/`/`starter-project/` files) — PASS |
| 3 | Every entry-point document has a defined audience | DOC-R10 | `README.md`/System Map/`docs/navigator/` each assigned an audience in `design.md` §9 — PASS |
| 4 | Every main document has a single responsibility | DOC-R8/R27 | Layer 1 table (`design.md` §4/§13) assigns one owner per document; overlaps (three onboarding docs, two roadmaps) explicitly flagged as needing a merge, not left ambiguous — PASS |
| 5 | No Change evidence is deleted | DOC-R20 | Zero deletions recommended anywhere in `design.md`/`tasks.md`; every disposition for Historical Evidence is `keep as historical` — PASS |
| 6 | No ADR is deleted | DOC-R22 | ADR index designed as a new summary table; `knowledge/decisions.md` itself untouched, no deletion proposed — PASS |
| 7 | Historical documentation remains accessible | DOC-R23/R24 | Change index + ADR index (`design.md` §10/§11) make every historical file reachable from Layer 1 without requiring it as onboarding reading — PASS |
| 8 | New users have one clear starting point | DOC-R9 | `README.md` designated primary; every competing candidate's relationship stated explicitly (`design.md` §2.4) — PASS |
| 9 | The complete Change lifecycle is represented visually | DOC-R15 | Workflow diagram (`design.md` §6) covers request → close, with the FAIL/INCOMPLETE → correct → re-verify loop — PASS |
| 10 | Workflow and Verification are visibly distinct | DOC-R17 | Authority diagram (`design.md` §8): "Can this advance?" vs. "Does verifiable evidence exist?" — PASS |
| 11 | Structural and Requirement Verification are visibly distinct | DOC-R17 | Component diagram (`design.md` §7) lists them as two separate entries with distinct receives/produces/cannot statements — PASS |
| 12 | Review is marked as future work | DOC-R13/R15/R16 | Workflow diagram shows Review in a dashed/labeled "NOT BUILT — Entrega 8" node; delivery-status table marks it "Not started" — PASS |
| 13 | Human approval is represented explicitly | DOC-R17 | Authority diagram's fourth row: "Is this accepted? — always a human, never automatic" — PASS |
| 14 | Close is not shown as automatic verification | DOC-R17 | Authority diagram's fifth row is distinct from both Verification rows; component diagram never conflates them — PASS |
| 15 | Every main component has one responsibility statement | DOC-R16 | Component diagram, one "produces" line per component — PASS |
| 16 | Every main component has a non-responsibility statement | DOC-R16 | Same diagram, one "cannot" line per component — PASS |
| 17 | A reading path exists for CLI users | DOC-R18 | `design.md` §9 row 2 — PASS |
| 18 | A reading path exists for implementers | DOC-R18 | `design.md` §9 row 6 + audience list — PASS |
| 19 | A reading path exists for architects | DOC-R18 | `design.md` §9 row 4 + audience list — PASS |
| 20 | A reading path exists for reviewers | DOC-R18 | `design.md` §9 row 7 + audience list — PASS |
| 21 | A reading path exists for auditors | DOC-R18 | `design.md` §9 row 8 + audience list — PASS |
| 22 | Duplicate documentation is identified | DOC-R5 | `design.md` §2.4 — six concrete findings, each with cited evidence — PASS |
| 23 | Obsolete documentation is identified | DOC-R6 | `design.md` §3 — five concrete, cited findings (not impressionistic) — PASS |
| 24 | Broken internal links are identified | DOC-R25 | Checked for every link inside the ~50 individually-read files (`design.md` §2.2/§2.3); no broken link found among them — all cross-references (`VISION.md`↔`principles.md`, `ecosystem.md`↔`tooling.md`, `lifecycle.md`↔`project-lifecycle.md`, `index.md`'s own link set) resolved to existing files. Full-repository link validation (all 382 files' outbound links) is deferred to the future implementation stage's own review pass, noted as a risk (`design.md`, `evidence.md` Risks) — PARTIAL, scope stated explicitly. |
| 25 | Orphan documents are identified | DOC-R26 | Among individually-read files: none of `docs/architecture.md`/`domain-model.md`/`index.md`/`README.md`/`Workflow.md`/`lifecycle.md` are orphaned (each is linked from at least one other); `docs/aief-2.0/`'s internal files are linked from its own `README.md` but not from top-level `docs/index.md` (a real, cited orphan-from-the-index finding, distinct from "unlinked entirely"). Full orphan sweep across all 382 files deferred to the future stage, same reasoning as #24. |
| 26 | No implementation file is modified | DOC-R29 | `git status --porcelain` shows only this Change's own 7 new files under `changes/0050-.../` — zero lines touched in `cli/src/`, `cli/tests/`, `cli/bin/` — PASS |
| 27 | No CLI output changes | DOC-R30 | No command was run against modified code (none exists); `aief verify` re-run below shows unchanged behavior — PASS |
| 28 | All 534 tests continue passing | DOC-R31 | `cd cli && npm test` — 534/534 pass, identical to the Entrega 7 baseline — PASS |
| 29 | `aief verify` continues passing | — | `node cli/bin/aief.js verify` — PASS, reports Change 0050 as an open, in-progress Change (evidence not yet completed) exactly as every prior planning-stage Change did — PASS |
| 30 | The repository remains clean after planning | DOC-R32 | `git status --porcelain` clean except this Change's own new files — PASS |

## Evidence

```
cd cli && npm test
# 534/534 pass, 0 fail — unchanged from Entrega 7's own closing state

node ../cli/bin/aief.js verify
# PASS — Change 0050 reported open/in-progress, identical rendering to every prior planning Change

git status --porcelain
# only changes/0050-core3-documentation-architecture/*.md (new, untracked) — no other file touched
```

## Acceptance criteria (standalone pass)

- [x] Every scenario above has a corresponding, explicit check (30/30).
- [x] No Change artifact or ADR is recommended for deletion anywhere in this Change's own artifacts.
- [x] `docs/core3-system-map.md`'s drafted content (`design.md` §5.3) stays within its own 200-line
      cap and contains no reproduced spec requirement list or ADR full text.
- [x] Zero code/CLI/test diff; 534/534 tests pass; `aief verify` PASS; repository clean except this
      Change's own new files.
