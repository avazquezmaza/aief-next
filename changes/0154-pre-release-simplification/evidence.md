# Evidence

## Summary

The core loop works and is used: 93 Changes across 11 local projects, only 2 with empty evidence,
and evidence of high quality (before/after tables, test counts, `terraform plan` results). The
opt-in engine built in Changes 0043–0059 is not used anywhere. That includes this repository,
which has no `manifest.json`. Half of that engine is unneeded or redundant. One part
(dependencies) meets a real need but is hard to reach. Four bugs were confirmed. Three are minor
and sit in unused or edge paths. The fourth (B4) is a governance gap in the core: `close` does not
read `spec.md` Acceptance Criteria.

Real use also shows two needs AIEF does not cover. Most projects keep AIEF files out of git, and
one team built its own ticket system next to AIEF.

Recommendation: release a smaller AIEF. Remove loop, harness log, tracks, the manifest, the SDD
providers and `ai-specs`. Move dependencies into `change.md`. Then integrate natively with the
assistants and support private and team use. No deprecation cycle is needed, because AIEF has no
users outside this machine.

## Activities Performed

1. Measured this repository: 70 source files and 8,946 lines in `cli/src`, 64 test files and
   12,699 lines, 154 Changes and 48,594 lines of Change documents, 37 ADRs.
2. Ran the suite (`npm test` in `cli/`): 1,141 tests, 0 failures, 70 s. `eslint src bin` was clean.
3. Surveyed 11 projects that use AIEF (`GC_China`, `GC_China/portal_review`,
   `GC_China/trk-fluye-insights`, `THINGS/pcia`, `THINGS/cotorro`, `THINGS/neto`,
   `THINGS/Workspace-claro/atomic-consulta-saldo`, `THINGS/Workspace-claro/adapter-consulta-saldo`,
   `claude-code/POC/geolibre_visualization`, `bitbucket_code/iqgeo/trk-iqgeo-create-shape`,
   `bitbucket_code/bot/trk-herbie-bot`). Surveyed Changes, evidence, `(human)` tasks,
   `knowledge/`, standards, `.gitignore` and git history.
4. Built a disposable project (`aief bootstrap`, two Changes, one hand-written `manifest.json` with
   `track`, `dependsOn`, `loop` and `harness`). Ran `status`, `status --change`, `--graph`,
   `--next`, `verify` three times, and `close` with the gate unchecked, then checked. Repeated
   `close` with a plain `(review)` label and no manifest.
5. Read ECC v2.2.3 (rules, agents, skills, hooks, install profiles, `ecc2`) for ideas.

## Verification

### R1: Usage

| Signal | Value |
|---|---|
| Changes in the 11 projects | 93 |
| Changes with `evidence.md` still `Pending.` | 2 |
| `(human)` tasks / checked | 108 / 78 |
| `manifest.json` files (projects + this repo) | 0 |
| `hooks.md`, `loop.md`, `openspec/`, `ai-specs/` | 0 |
| Repos (of 9 with git) not versioning `changes/` | 6 (ignored in `neto`, `adapter-consulta-saldo`, `trk-herbie-bot`; untracked in `GC_China`, `pcia`, `atomic-consulta-saldo`) |
| Standards with `(adapt)` lines still unedited | `neto` 10, `cotorro` 9, `geolibre` 9 |
| Skill catalog | 47 detectors, 12 Skills. Projects get 1 Skill. 2 of 7 sampled say "No operational content yet" |
| Changes naming a dependency on another Change in prose | 12 of 92 |
| Open Changes at once | up to 9 (`trk-fluye-insights`) |
| `Type` values seen | free text: "Definición", "Build", "Design", "Research → Implementation" |

Observed practices outside AIEF:

- `neto` stopped versioning `changes/`, `knowledge/`, `AGENTS.md`, `.claude/` and `.kiro/`, and
  removed AIEF references from its README.
- `trk-herbie-bot` (two people) runs a versioned `tickets/` system. It has a generated
  `INDEX.md` (`scripts/tickets.py --check` for CI), status taken from append-only log entries to
  avoid merge conflicts, one branch per release unit ("una rama = lo que se lanza junto"), and a
  short PR template. AIEF Changes stay private next to it.
- `neto/.claude/settings.json` has a hand-written `deny` list for secrets (`~/.aws`, `.env*`,
  `*.tfstate`, `*.tfvars`, `*.pem`, `*.key`).

Process weight in this repository (lines added, from the merge commits):

| Change | `cli/src` | tests | Change docs |
|---|---|---|---|
| 0141 | 1 | 35 | 136 |
| 0109 | 6 | 18 | 135 |
| 0137 | 14 | 22 | 149 |
| 0150 | 56 | 140 | 279 |

### R2: Cause of non-use

No command creates `manifest.json`. It is documented only in `docs/workflow.md` and
`docs/configuration.md`, and it repeats `id`, `slug`, `title` and `status` from `change.md`.

| Component | Size | Need seen in real use | Behavior when exercised | Cause |
|---|---|---|---|---|
| Dependencies / graph / `--next` | ~190 lines + next-change service | Yes: 12 of 92 Changes, up to 9 open | Graph and order correct. `close` closed a Change whose dependency was still open, with no notice | Real need, hidden behind a hand-written JSON file |
| Tracks + `(gate:*)` | ~650 lines + 3 workflow files | Approvals yes (108 `(human)` tasks), already met by labels | Same outcome as a plain `(review)` label: "1 unchecked task", close refused | Redundant |
| Loop | ~90 lines | None | See B1 | Unneeded and wrong |
| Harness log | ~150 lines | None | Appends the same "next action" line to `hooks.md` on every verify | Unneeded |
| SDD providers / OpenSpec | ~480 lines | None locally | Not exercised | Unneeded for now |
| `ai-specs` | ~300 lines | None | Not exercised | Unneeded for now |
| Manifest | ~160 lines | Only as a container for the above | Status stays in sync (the 0130 split-brain bug is fixed), but there are two sources of truth | Goes away with the above |

### R3: Bugs

| ID | Bug | Reproduction | Reference | Severity |
|---|---|---|---|---|
| B1 | The loop keeps counting after a pass ("attempt 3 of 2") and prints "Loop complete — Change verified" while readiness fails | Manifest with `loop.verify.maxRetries: 2`, open tasks and pending evidence. Run `verify --change` three times | `cli/src/core/services/loop-service.js:49-69` | Low |
| B2 | The manifest example uses `"id": "0002-add-login"`, but the code expects `"0002"` and warns on the documented form | Copy the documented example | `docs/configuration.md` vs `cli/src/core/services/gate-evaluator.js:118` | Low |
| B3 | Detection walks into nested repositories. The project `~/PRS/THINGS/kiro/I5` is detected as `docker` because of a cloned `ECC/` inside it, and gets a container Skill | `aief status` in `~/PRS/THINGS/kiro/I5` | `cli/src/detect.js:34` (`WALK_SKIP_DIRS` has no nested-`.git` rule) | Medium |
| B4 | Unchecked Acceptance Criteria in `spec.md`, including `(human)` ones, block neither `close` nor `verify --strict`. Only `tasks.md` approval lines are read | This Change: with `spec.md`'s `(human)` criterion unchecked and `tasks.md`'s checked, `close` reported "All readiness checks passed" | `cli/src/core/services/change-verifier.js:112-141` | Medium |

Checked and not bugs:

- The duplicate `0122` is reported by `status` and `verify --strict` (Changes 0135/0137). It is
  historical. `main` passes `verify --strict`.
- The 0130 close split-brain is fixed: `close` writes `"status": "closed"` to the manifest.
- `close` ignoring open dependencies matches ADR-028. It is a design gap, not a bug.

## Findings

### Verdicts

| Component | Verdict |
|---|---|
| Change / spec / tasks / evidence, `verify`, `close`, `prompt`, `(human)`/`(review)` labels | Keep |
| Dependencies | Rescue: a `## Depends on` section in `change.md` (or `new-change --depends-on`), a notice in `close`, `--next` and `--graph` without JSON |
| Tracks + `(gate:*)` | Merge into `(human)`/`(review)` labels and remove tracks |
| Loop, harness log | Remove. Informational hooks (`prompt.prepared`, `verify.completed`) stay, without the log |
| SDD providers, OpenSpec, `ai-specs` | Remove from the core. Return as an adapter when a real project needs it |
| Manifest | Remove once the above are gone |
| `AGENTS.md` template | Cut tracks, gates and ADR references. Target: half its length |

ADRs a removal would supersede: ADR-016, ADR-017, ADR-023 to ADR-028, ADR-037, ADR-002, and the
framing of ADR-001 ("AIEF is a Workflow Engine").

### Additions justified by use

| ID | Addition | Evidence |
|---|---|---|
| A1 | Official private mode (`bootstrap --private`: `.gitignore`, docs, a backup story) | 6 of 9 repos keep `changes/` out of git |
| A2 | Initiatives: group Changes released together, generated index, status from append-only entries | `trk-herbie-bot` `tickets/`, backlog entry 1 |
| A3 | Native Claude Code skill, like the Kiro one, to replace copy-paste of `aief prompt` | Kiro already has `.kiro/skills/aief-change` |
| A4 | Guardrails as configuration: generated `deny` list for secrets. Optional assistant-side hook refusing edits that check `(human)`/`(review)` boxes | `neto/.claude/settings.json`; residual risk accepted in 0149 |
| A5 | Real Skill content for the stacks in use (Python/FastAPI, TS/React, Terraform/AWS, Java/Quarkus) | 47 detectors vs 12 Skills |
| A6 | "Impact investigated" section in `evidence.md` (files, importers, interfaces touched) | ECC fact-forcing gate, as evidence instead of blocking |
| A7 | Standards that fill `(adapt)` lines from detection or ask at bootstrap | Unedited `(adapt)` lines in 3 projects |
| A8 | `Type` as a closed list | Free-text values seen |

ECC use: ideas for A4 and A6. Starting material, with MIT attribution and rewritten to AIEF's
shape, for A4 (`scripts/hooks/config-protection.js`, `scripts/hooks/hook-input.js`, ~300 lines)
and A5 (`rules/<language>/`). Its runtime subsystems are not borrowed (blocking engine hooks,
automatic format/typecheck, proactive agents, `ecc2` daemon and database).

### Findings Status

| ID | Finding | Severity | Status |
|---|---|---|---|
| F1 | Opt-in engine unused in all projects and in this repo | High | Resolved: Change 0157 (removed, ADR-038) |
| F2 | Dependencies needed but only reachable through a hand-written manifest | Medium | Resolved: Change 0157 (`## Depends on`) |
| F3 | Gates duplicate approval labels | Medium | Resolved: Change 0157 (gates removed) |
| F4 | AIEF files kept out of git in 6 of 9 repos, with no supported private mode or backup | High | Open: wave 2 |
| F5 | Team use needs grouping and conflict-free status. Built outside AIEF in `trk-herbie-bot` | High | Open: wave 3 |
| F6 | Claude Code integration is copy-paste only | Medium | Open: wave 2 |
| F7 | Standards and Skills add little per project | Medium | Open: wave 3 |
| F8 | Process weight: one-line fixes carry 130+ lines of Change docs | Medium | Open: wave 1 (lighter Fix Changes) |
| B1 | Loop count and message | Low | Resolved: Change 0157 (Loop removed) |
| B2 | Manifest example vs identity rule | Low | Resolved: Change 0157 (manifest removed) |
| B3 | Detection walks into nested repositories | Medium | Resolved: Change 0155 |
| B4 | `spec.md` Acceptance Criteria, including `(human)`, not enforced by `close` or `--strict` | Medium | Resolved: Change 0155 |

## Risks

- Removing tracks, SDD and `ai-specs` gives up work aimed at future users (LIDR, OpenSpec). The
  history keeps it, and an adapter can bring it back when a real project asks.
- The usage data comes from one machine and one main user. It is the only data there is, and it
  is real.
- Private mode moves governance out of review by others. A2 and A4 are the counterweight for teams.

## Recommendations

1. Wave 1, clean up before release: fix B3 and B4. Release 4.0 with loop, harness log, tracks, manifest,
   SDD providers and `ai-specs` removed, dependencies in `change.md`, gates merged into labels,
   and a shorter `AGENTS.md`. Add a superseding ADR. Make `Fix` Changes lighter (one file with
   inline evidence) for this repository.
2. Wave 2, fit real use: A3 (Claude Code skill), A4 (guardrails as configuration), A1 (private
   mode).
3. Wave 3, new value: A2 (initiatives and team use), A5 (Skill content), A6, A7, A8.
4. New rule for this repository: a feature must be used in two real projects within six weeks of
   shipping, or it is removed.

Decision requested from the owner: approve or edit the verdicts and the three waves.

## Artifacts Produced

- This Change (`change.md`, `spec.md`, `tasks.md`, `evidence.md`).
- The disposable test project lived in the session scratchpad and is not part of the repository.

## Lessons Learned

- The tests verify what each spec says, but only real use shows when a message misleads ("Change
  verified") or a documented example fails. Features nobody uses hide their bugs.
- Analysis Changes about simplification (0038, 0041) removed nothing, and the largest feature
  block followed. A removal plan needs a removal Change right after it.
- AIEF's lasting value is the record of scope, evidence and human decisions. The assistants
  already supply workflow mechanics.

## Next Change

Wave 1, first Changes: fix B3 (nested repositories in detection) and B4 (enforce `spec.md`
Acceptance Criteria). Then the 4.0 removal Change with its superseding ADR.
