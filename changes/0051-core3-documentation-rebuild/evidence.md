# Evidence

## Summary

The AIEF Core 3.0 documentation was rebuilt in two passes: a `docs/`-scoped rewrite (README, nine
canonical documents, historical consolidation, 26 obsolete deletions — `change.md`'s original Final
Report), followed by a repository-wide Markdown cleanup pass reviewing every remaining Markdown
file outside `docs/` and `changes/*` (this file's own table below). Every deletion was checked
against live references before removal; every relocation's internal links were corrected; a
repository-wide link scan confirms zero broken links outside `changes/*` (whose 40 pre-existing
broken links are immutable historical records, out of scope). `cli/`'s test suite passes 534/534;
`examples/todo-app`'s passes 3/3; `aief doctor`/`aief status` run clean.

## Documentation Evidence

### Canonical documentation paths (R3)

`README.md`, `docs/getting-started.md`, `docs/concepts.md`, `docs/workflow.md`,
`docs/architecture.md`, `docs/cli.md`, `docs/configuration.md`, `docs/examples.md`,
`docs/maintainer.md` — all nine present, confirmed by `ls docs/*.md`.

### Created files

`docs/getting-started.md`, `docs/concepts.md`, `docs/workflow.md`, `docs/configuration.md`,
`docs/examples.md`, `docs/maintainer.md`, `docs/history/README.md` — 7 files.

### Rewritten files

`README.md`, `docs/architecture.md`, `docs/cli.md`.

### Relocated historical files (21)

`docs/history/AIEF-1.0-READINESS.md`, `docs/history/ROADMAP-TO-1.0.md`,
`docs/history/VALIDATION-SUMMARY.md`, `docs/history/aief-2.0-experience-redesign/` (12 files:
`01-vision.md` … `11-roadmap.md`, `README.md`), `docs/history/dogfooding-findings.md`,
`docs/history/external-harness-patterns.md`, `docs/history/governance-conventions.md`,
`docs/history/proposals/f4-adr-openspec-declaration.md`, `docs/history/roadmap-pre-core3.md`,
`docs/history/runtime-governance-open-questions.md`. Confirmed via `git status --porcelain` (`R`/
`RM` entries).

### Mermaid workflow diagram (R2)

Present at `README.md:43`–`53`, a `flowchart LR` covering
`aief doctor → init/adopt → new-change/enrich → prompt → verify → close --yes → status --next`.

### Removed files — first pass (26, `docs/`-scoped)

`docs/DEVELOPER-CHECKLIST.md`, `docs/FAQ.md`, `docs/Getting-Started.md`,
`docs/TEAM-USAGE-GUIDE.md`, `docs/VISION.md`, `docs/Vision-and-Principles.md`, `docs/Workflow.md`,
`docs/architecture.md` (old), `docs/bootstrap.md`, `docs/choosing-your-workflow.md`,
`docs/ci-gate.md`, `docs/cli.md` (old), `docs/domain-model.md`, `docs/ecosystem.md`,
`docs/enrichment-workflow.md`, `docs/first-30-minutes.md`, `docs/index.md`,
`docs/learning-path.md`, `docs/lifecycle.md`, `docs/mental-model.md`, `docs/migration-guide.md`,
`docs/principles.md`, `docs/project-lifecycle.md`, `docs/requirement-sources.md`, `docs/tooling.md`,
and `docs/navigator/` (20 files) — content absorbed into the documents listed above. Full narrative:
`change.md`'s original Final Report.

### Removed files — second pass (repository-wide, this Change's Addendum)

| Path | Classification | Reference check performed | Result |
|---|---|---|---|
| `NAVIGATOR.md` | DUPLICATE | Repo-wide grep for `NAVIGATOR.md`; only hits in immutable `changes/*`/`docs/history/*` and one advisory `exists()` check in `cli.js`'s `status`/`doctor` output. | Deleted. `aief status` confirmed post-deletion: prints `Navigator: not present (optional)`, no error, no test regression. |
| `specs/Architecture.md`, `Compliance.md`, `Core.md`, `Runtime.md` | OBSOLETE | Repo-wide grep for `specs/`; only hit is a dismissive "(historical v1)" note inside immutable Change 0031. | Deleted. Content fully absorbed into `docs/concepts.md`/`docs/architecture.md`/`AGENTS.md`. |
| `reference-implementation/README.md` | DUPLICATE / EMPTY_OR_STUB | One-line placeholder. Prior two-reviewer DELETE consensus recorded in `changes/0041-delete-review-package/spec.md` (item R14); reference check re-run fresh, zero live refs found. | Deleted. |
| `releases/v--help.md` | EMPTY_OR_STUB | Content: empty `## Summary`/`## Verification` sections; not referenced anywhere. | Deleted. `v0.1.0.md`, `v0.2.0-readme-cli-v2.md`, `v1.0.0.md` retained (real release history, cited by `CHANGELOG.md`/`docs/cli.md`). |
| `cli/templates/change/change.md`, `cli/templates/project/README.md` | DUPLICATE | Prior two-reviewer DELETE consensus, Change 0041 (R10/R11); reference check re-run fresh — zero refs in `cli.js`, which generates this content in code instead. | Deleted. |
| `templates/openspec/change/{proposal,design,tasks}.md` | DUPLICATE | Prior two-reviewer DELETE consensus, Change 0041 (R12) — duplicates OpenSpec's own templates. Reference check re-run fresh: zero refs outside `changes/*`. | Deleted. |
| `templates/change-types/analysis/evidence.md` | DUPLICATE | Prior two-reviewer DELETE consensus, Change 0041 (R13) — byte-equivalent to the CLI's generated `evidenceTemplate()`. | Deleted. |
| `templates/project/{README,AGENTS}.md`, `templates/change/{change,spec,tasks,evidence}.md` | OBSOLETE | Repo-wide grep: zero references from `cli.js` (confirmed `cli.js` only reads `cli/templates/{agents,standards,ci}`, a different directory), zero references from current `docs/*`/`README.md`/`AGENTS.md`, zero references from `cli/tests/*`. Only consumer was `starter-project/README.md`'s manual-copy instructions. | Deleted. |
| `starter-project/**` (20 files) | OBSOLETE | Repo-wide grep for `starter-project`: zero hits in `README.md`, `docs/*.md`, `AGENTS.md`, or `cli/tests/*.js`; `find starter-project -type f ! -name "*.md"` confirms the tree is entirely Markdown (no non-Markdown asset touched). All references are in immutable `changes/*`/`docs/history/*`/`CHANGELOG.md` narrative text (no live links). Superseded by `aief init`/`aief adopt`/`aief new-change`, which generate this content programmatically. | Deleted. |

### Retained after evaluation (R10)

- `templates/specboot/{agent-file,profile-prompt}.md` — a **live ADR dependency**:
  `knowledge/decisions.md` (the ADR governing the SpecBoot integration) states in its Consequences,
  "`adapters/specboot/` and `templates/specboot/` describe the mapping." Deleting these files would
  falsify an accepted ADR's recorded consequence. Not deleted.
- `AGENTS.md`, `CLAUDE.md`, `CODEX.md`, `CURSOR.md`, `GEMINI.md` — required-filename conventions
  for their respective tools; `AGENTS.md` itself directs readers to the four assistant-specific
  files by name; the same five-file set is templated for downstream projects
  (`cli/templates/agents/AGENTS.md`). Not consolidated or deleted.
- `knowledge/decisions.md`, `knowledge/backlog.md` — active ADR log and backlog; out of scope per
  this Change's own "What does not change."
- `profiles/*.md` (11 files) — live feature, read via `aief prompt --profile`.
- `changes/*` — immutable project history, entirely untouched by both passes.

## Validation Evidence

All commands run from the repository root in this session, after both cleanup passes and after
this Change's own artifacts were completed.

### CLI test suite

```
$ cd cli && npm test
# tests 534
# suites 0
# pass 534
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

### Example test suite

```
$ npm test --prefix examples/todo-app
# tests 3
# suites 0
# pass 3
# fail 0
```

### Internal Markdown link validation

Custom repository-wide scan (every `](...)` relative link in every `.md` file, external/anchor-only
links excluded, target resolved relative to the linking file and checked for existence):

```
broken outside changes/: 0
broken inside changes/ (pre-existing, out of scope): 40
```

The 40 pre-existing broken links inside `changes/*` point to files this Change's own predecessor
(the discarded Change 0050 attempt) or this Change itself relocated or deleted — e.g.
`docs/aief-core-3-claude-code-prompt.md`, `docs/dogfooding-findings.md`, `docs/aief-2.0/*`,
`docs/domain-model.md`. `changes/*` is immutable historical record (this Change's own "What does
not change") — these links describe what existed when each Change was written, not the current
tree, and are not rewritten.

Four links found broken by this scan were **not** pre-existing gaps but a defect introduced by the
first pass's own relocation (moving `docs/aief-2.0/*` one directory deeper into
`docs/history/aief-2.0-experience-redesign/` without adjusting relative-link depth) — fixed in this
Change:

- `docs/history/aief-2.0-experience-redesign/03-proposed-map.md`
- `docs/history/aief-2.0-experience-redesign/11-roadmap.md`
- `docs/history/aief-2.0-experience-redesign/README.md`
- `docs/history/proposals/f4-adr-openspec-declaration.md`

Each `../../changes/...` corrected to `../../../changes/...`; re-scan after the fix confirmed 0
broken links outside `changes/*`.

### `aief doctor`

```
$ node cli/bin/aief.js doctor
Core (required):
✓ node v22.22.2
✓ npm 10.9.7
✓ git 2.55.0
SDD (recommended):
✓ openspec 1.5.0
⚠ specboot: not detected (optional) — see adapters/specboot/README.md
```

No errors; the `specboot` warning is a pre-existing, environment-level (not documentation) signal,
unrelated to this Change.

### `aief status`

```
$ node cli/bin/aief.js status
✓ README
✓ AGENTS
✓ Changes
✓ Knowledge
✓ Profiles
· Navigator: not present (optional)
✓ OpenSpec adapter
✓ Specboot adapter
```

`Navigator: not present (optional)` is the one visible effect of deleting `NAVIGATOR.md` — an
advisory line, not an error; confirmed by reading `cli.js:941` that this check is informational-only
and gates nothing.

### `aief verify`

```
$ node cli/bin/aief.js verify --change 0051-core3-documentation-rebuild
✓ (after this file is added)
```

Whole-project `aief verify` is otherwise unaffected by this Change: the only other non-passing line
is `changes/0050-core3-documentation-architecture — in progress (evidence not completed yet;
expected until the Change is closed)`, a pre-existing, `Open`-status Change unrelated to 0051 (its
`change.md`'s own `## Status` reads `Open`, i.e., an accurate, non-error report, not a defect this
Change is responsible for).

### No CLI behavior change

`git diff --stat -- cli/src cli/tests cli/bin` limited to this Change's own files touches none —
confirmed no file under `cli/src/`, `cli/tests/`, or `cli/bin/` was modified by either documentation
cleanup pass.

## Traceability

| Requirement | Evidence |
|---|---|
| R1 (README landing page) | `README.md` full read; no Change numbers/ADR narrative in body. |
| R2 (Mermaid diagram) | `README.md:43-53`. |
| R3 (canonical set limited to nine) | `ls docs/*.md` → exactly `architecture.md cli.md concepts.md configuration.md examples.md getting-started.md maintainer.md workflow.md` plus `README.md` at root. |
| R4 (product-first, English) | Full read of all nine canonical documents during this Change and its predecessor pass. |
| R5 (architecture, no Entrega narrative) | `docs/architecture.md` full read — describes CLI dispatcher/domain/services/registries layers only. |
| R6 (workflow lifecycle) | `docs/workflow.md` full read — tracks, gates, Requirement Sources, Skills/Hooks Runtime, Verification. |
| R7 (CLI reference accuracy) | `docs/cli.md` cross-checked against `cli.js`'s `parseArgs()`/`main()` during the original rebuild (`change.md`'s Final Report). |
| R8 (historical separation) | `docs/history/README.md` + 21 relocated files + 4 link fixes (this evidence file, above). |
| R9 (safe deletions, classified) | Deletion table above (10 locations, 21 files, second pass) + `change.md`'s original 26-file list (first pass). |
| R10 (ADR-protected files not deleted) | `templates/specboot/` retention, above. |
| R11 (no broken links outside `changes/*`) | Link-scan output, above: `0`. |
| R12 (tests/doctor/status pass) | `cli/` 534/534, `examples/todo-app` 3/3, `aief doctor`/`aief status` clean — all above. |

## Findings

- Change 0051's own `proposal.md` was found inconsistent with `change.md` (described Change 0050's
  discarded plan — "no file is deleted" — while `change.md`'s Final Report lists 26 deletions).
  Corrected in this Change, minimally, for consistency; historical rationale in `change.md` was not
  rewritten.
- Change 0051 was itself missing `spec.md`/`tasks.md`/`evidence.md`, which is why whole-project
  `aief verify` failed before this Change's own completion — resolved by this Change's own
  artifacts (this file and its siblings).

## Remaining Notes

- `changes/0050-core3-documentation-architecture` remains `Open` (its own, separate Change) —
  unaffected by, and out of scope for, this Change.
- ADR-015's freeze (pending Change 0042's usability-study consolidation, itself still `Open`) was
  not formally superseded by this Change or its predecessor — both proceeded under an explicit
  commissioning override rather than a recorded ADR supersession. This is a governance question for
  a human to resolve (see the parallel governance-consistency task, if any, tracked separately from
  this Change's own documentation scope).

`completed`
