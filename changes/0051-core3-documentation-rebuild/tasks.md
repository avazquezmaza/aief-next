# Tasks

**Executed.** Reconstructed from the completed work — `change.md`'s Final Report and Addendum, and
`evidence.md`'s per-file classification — after both were already implemented. No task below
represents new or future work.

## 1. README rewrite

- [x] Rewrite `README.md` as the sole product landing page: what AIEF is, the problem it solves,
      install, use, extend, documentation index, ecosystem table, contributing, status, license.
- [x] Add the mandatory high-level Mermaid diagram of the product workflow.
- [x] Remove Change-number and ADR-narrative content from the body.

## 2. Canonical docs

- [x] Create `docs/getting-started.md` from the implemented CLI flow.
- [x] Create `docs/concepts.md` (Change, Change Manifest, Track/Stage/Gate, SDD Provider,
      Requirement Source, Skill, Hook, Verification Rule, Evidence).
- [x] Create `docs/workflow.md` (full lifecycle, tracks, Requirement Sources, Skills Runtime,
      Hooks Runtime, Verification).
- [x] Rewrite `docs/architecture.md` as the current implemented architecture, no Entrega narrative.
- [x] Rewrite `docs/cli.md`, cross-checked against `cli.js`'s `parseArgs()`.
- [x] Create `docs/configuration.md` (every configuration file AIEF reads).
- [x] Create `docs/examples.md` (Todo App plus worked CLI walkthroughs).
- [x] Create `docs/maintainer.md` (extension points, contribution workflow, documentation rules).

## 3. History consolidation

- [x] Create `docs/history/README.md` as the index of relocated material.
- [x] Relocate 21 files to `docs/history/` (the "Experience Redesign" study, pre-Core-3.0 roadmap
      documents, validation summary, dogfooding findings, governance conventions, runtime
      governance open questions, external harness patterns, one pre-ADR proposal file).
- [x] Correct internal links inside every relocated file for its new depth.

## 4. First-pass cleanup (docs/-scoped)

- [x] Delete 26 obsolete/superseded files under `docs/` whose content was absorbed into the
      documents above (see `change.md`'s Final Report for the full list).
- [x] Delete the entire `docs/navigator/` tree (20 files), absorbed into
      `docs/getting-started.md`/`docs/workflow.md`.
- [x] Delete `docs/index.md` — README's own Documentation table replaces it.
- [x] Update links in `AGENTS.md`, `cli/templates/agents/AGENTS.md`, `NAVIGATOR.md`,
      `CHANGELOG.md`, `cli/README.md`, `adapters/openspec/README.md`,
      `adapters/openspec/workflow.md`, `knowledge/backlog.md`.

## 5. Second-pass cleanup (repository-wide)

- [x] Review every remaining Markdown file outside `docs/` and `changes/*` against the deletion
      criteria (canonical doc / tool-required / standard OSS file / historical record / unique
      content / live references).
- [x] Delete `NAVIGATOR.md` — redundant with README's Documentation table; confirmed the CLI's
      `Navigator` status check is advisory-only before deleting.
- [x] Delete `specs/` (4 files) — pre-CLI conceptual sketch, fully absorbed into
      `docs/concepts.md`/`docs/architecture.md`.
- [x] Delete `reference-implementation/README.md` — one-line stub, prior two-reviewer DELETE
      consensus (Change 0041).
- [x] Delete `releases/v--help.md` — empty accidental artifact; retained real release records
      (`v0.1.0.md`, `v0.2.0-readme-cli-v2.md`, `v1.0.0.md`).
- [x] Delete `cli/templates/change/change.md`, `cli/templates/project/README.md`,
      `templates/openspec/change/*`, `templates/change-types/analysis/evidence.md` — prior
      two-reviewer DELETE consensus (Change 0041), re-confirmed with a fresh reference check.
- [x] Delete `templates/project/*`, `templates/change/*` — orphaned pre-CLI scaffolding, superseded
      by `aief init`/`aief new-change`.
- [x] Delete `starter-project/` (20 files) — pre-CLI manual-copy scaffold, superseded by
      `aief init`/`aief adopt`, zero references in current docs/tests/CLI.
- [x] Evaluate `templates/specboot/` for deletion; retained — named as a dependency in an accepted
      ADR's Consequences (`knowledge/decisions.md`).
- [x] Evaluate `AGENTS.md`/`CLAUDE.md`/`CODEX.md`/`CURSOR.md`/`GEMINI.md` for consolidation;
      retained in full — required-filename conventions, referenced by `AGENTS.md` itself.

## 6. Link validation

- [x] Run a repository-wide relative-Markdown-link scan after the first-pass cleanup.
- [x] Run a repository-wide relative-Markdown-link scan after the second-pass cleanup.
- [x] Fix 4 dangling links found in `docs/history/aief-2.0-experience-redesign/` and
      `docs/history/proposals/` (relocation left them one directory level too shallow).
- [x] Confirm remaining broken links exist only inside `changes/*` (pre-existing, immutable
      historical records, out of scope).

## 7. Verification

- [x] Run `cd cli && npm test` — 534/534 pass.
- [x] Run `npm test --prefix examples/todo-app` — 3/3 pass.
- [x] Run `aief doctor` — clean, no errors.
- [x] Run `aief status` — clean; `Navigator: not present (optional)` confirmed advisory-only.
- [x] Run `aief verify` — confirmed the only remaining failure is this Change's own then-missing
      `spec.md`/`tasks.md`/`evidence.md` (addressed by task 8).

## 8. Change completion

- [x] Correct `proposal.md`, which described Change 0050's discarded plan rather than this
      Change's actual scope — updated for consistency with `change.md`'s Final Report.
- [x] Add an Addendum to `change.md`'s Final Report documenting the second, repository-wide
      cleanup pass.
- [x] Write `spec.md`, `tasks.md`, `evidence.md` (this file and its siblings) from the completed
      work.
- [x] Re-run `aief verify` after completing this Change's own artifacts.
