# Specification

## Goal

After this Change: AIEF v3.1 (Changes 0052–0059) is audited end-to-end, documented coherently,
free of the small inconsistencies the audit found, confirmed backward-compatible, and has
reproducible evidence — ready for human review and merge. No new subsystem exists that didn't
before.

## Audit method

Every flow below was checked two ways: (1) reading the implementing code in `cli/src/cli.js`
against its own ADR in `knowledge/decisions.md` and its docs in `docs/*.md`; (2) exercising the
real command in a throwaway scratch project (`git init` + `aief bootstrap` in an empty directory
outside this repo) and comparing actual output to documented output. See `evidence.md` for the
transcripts.

## Findings

### F1 — `--graph` undocumented in `--help` and `aief help status` (fixed)

`cli.js`'s top-level usage banner listed `aief status [--change change-id] [--next]` — no
`--graph`, even though the flag has existed since Change 0058/ADR-028 and is documented in
`docs/cli.md`. `aief help status` (`COMMAND_HELP.status`) had the same gap, and also never
mentioned that `--next` behaves differently with 2+ open Changes (Change 0059). A first-time user
running `aief --help` or `aief help status` would not discover either flag.

**Fix:** both strings updated to list `--graph` and to summarize `--next`'s multi-open-Change
behavior in one sentence. No flag parsing changed — `--graph` already worked; only its
discoverability was fixed.

### F2 — `docs/cli.md`'s introductory sentence contradicted its own table (fixed)

Line 8 read: "No command below is new for AIEF Core 3.0 — Core 3.0 landed entirely as additive,
opt-in flags on existing commands (`status --change`/`--next`, `prompt --skill`/`--list-skills`,
`verify --requirements`)." Two lines later, the same file labels `aief bootstrap` "AIEF 3.1,
Change 0052," and further down the table cites `status --graph` (0058/ADR-028), `status --next`'s
smart selection (0059/ADR-029), and `doctor --verbose`'s Harness/Loop sections (0056/ADR-026,
0057/ADR-027) — all genuinely new since Core 3.0, all correctly attributed at the row level. The
umbrella sentence was written for Core 3.0 and never updated as 3.1 rows were added beneath it.

**Fix:** reworded to the claim that is actually true and matches every row: no *top-level command*
is new — every Core 3.0 and 3.1 addition is an additive, opt-in *flag* on an existing command —
without asserting a release boundary the table itself contradicts.

### F3 — AGENTS.md is the project template, not this repo's own dev guide (no fix needed — documented finding)

`AGENTS.md` at the repo root is byte-identical to `cli/templates/agents/AGENTS.md` — the exact
file `aief bootstrap` writes into every adopted project (confirmed: `diff AGENTS.md
cli/templates/agents/AGENTS.md` → no output). It is deliberately generic (Prime Directive,
Change/spec/tasks discipline, human-approval gates) because it ships to projects that are not
AIEF-next itself and may not even use Node or npm. This repo's own contributor rules — validation
commands, Git discipline, "reuse existing domain services" — already live in `docs/maintainer.md`,
referenced from `CLAUDE.md`. This is by design (see `docs/maintainer.md` "Documentation rules":
one document per concept) — confirmed correct, not a defect. `CLAUDE.md` and `docs/maintainer.md`
were extended (not AGENTS.md) with the specific items the commissioning instruction asked for that
were genuinely missing: an explicit no-automatic-push rule and a no-destructive-operations rule.
See "AGENTS.md / CLAUDE.md" below.

### F4 — No prior finding required a code fix beyond F1/F2

The rest of the audited surface (Skills/Standards precedence, Harness/Loop opt-in and non-blocking
behavior, Graph read-only construction, `status --next`'s eligibility rule, legacy/manifest-less
Change handling, invalid-manifest reporting) matched its documentation and its ADR exactly, live,
in the scratch-project runs recorded in `evidence.md`. No regression, no silent write, no
undocumented blocking authority was found.

## Architectural coherence vs. ADR-024–029 (checked, not assumed)

| ADR | Claim | Verified how |
|---|---|---|
| ADR-024 (Skills, project-over-builtin) | `aief doctor`/`--verbose` shows project `ai-specs/skills/*.md` alongside built-ins, project wins id collisions | Live run: `ai-specs/standards/custom-rule.md` appeared in `doctor --verbose` tagged `[project]`, `source: project` |
| ADR-025 (Standards, `prompt` primary consumer) | Same precedence for `ai-specs/standards/`; `doctor --verbose` reports it too | Same run as above |
| ADR-026 (Harness non-blocking, opt-in, per-Change) | `manifest.harness.log` opts a Change into a visible `hooks.md` log; Hooks never block `verify`/`close`; unknown Hook ids warn, never disable anything real | Live run: Change with `harness.log: true` produced `hooks.md`; `verify` still returned PASS; no Change without `manifest.harness` got a Harness section anywhere |
| ADR-027 (Loop opt-in, non-blocking, manual retry) | `manifest.loop.verify.maxRetries` opts a Change into an attempt-tracked `loop.md`; retry is always a manual re-invocation of `verify`, never automatic | Live run: `loop.md` recorded "Attempt 1 … Loop complete" after one `verify` call; nothing re-invoked verify on its own |
| ADR-028 (Graph derived, read-only, non-blocking) | `buildGraph()` is pure over `manifest.dependsOn`; `status --graph` is read-only; a Graph issue never blocks `verify`/`close` on its own | Live run: `status --graph` on a 3-node graph with one edge produced nodes/edges/topo-order/issues and wrote nothing (confirmed via `git status`-equivalent — a fresh scratch dir, no other writes appeared) |
| ADR-029 (`status --next` deterministic, 2+ open Changes) | Recommends the lowest-id eligible Change, explains why, lists other eligible ids and the tie-break rule; 0/1-open-Change paths untouched | Live run: two open Changes, no dependencies between them — recommended the lower id, listed the other as "Other eligible Change(s)" |

All six held. No doc overstates any of them (e.g. no doc implies Hooks, Loop or the Graph can
block `verify`/`close`; no doc implies any of the six is on by default).

## Backward compatibility (confirmed, not asserted)

- **Manifest-less Changes** (no `manifest.json` at all — the shape every Change in *this* repo
  actually uses) continue to report "Workflow: no track declared (legacy readiness only)" and
  behave exactly as before v3.1. Confirmed live (`status --change` on a manifest-less Change).
- **A Change with an invalid manifest** (missing required fields) is reported as a distinct,
  visible "invalid manifest" state by `status` — never silently treated as "no manifest," never
  guessed. Confirmed live (a hand-written manifest missing `schema`/`id`/`slug`/`title`/`status`
  was reported field-by-field, exactly as `docs/configuration.md` describes).
- **No opt-in field configured** (no `harness`, `loop`, or `dependsOn` in any Change's manifest,
  no `ai-specs/` directory in the project): `doctor --verbose` shows no Harness/Loop section for
  that Change, `status`/`status --graph` show no Dependency Graph section, `doctor` shows no
  Standards section beyond the built-ins — all confirmed live in a project with zero v3.1
  configuration.
- **No migration is required.** Every v3.1 field is additive and optional; a v3.0-era project's
  `manifest.json` files (if any) remain valid as-is.
- **No hidden storage.** Every write observed across every scenario above landed in an already-
  documented, visible location (`AGENTS.md`, `knowledge/standards/*.md`, `knowledge/skills.md`,
  `changes/<id>/manifest.json` when the user writes one themselves, `changes/<id>/hooks.md`,
  `changes/<id>/loop.md`) — never a dotfile, never outside the Change directory or project root.
- **No external dependency is required.** LIDR/Skills/Standards discovery reads local
  `ai-specs/` files only; no network call was observed or is present in the reviewed code paths.

## Breaking changes and migration

**What changed:** `aief status --next` (no `--change`) with **more than one** open Change no
longer errors with "Multiple open Changes … not selecting one implicitly, exit 1." It now either
recommends one eligible Change (exit 0) or reports that none are eligible with a per-Change reason
(exit 0).

**Under what conditions:** only when a project has 2 or more *open* Changes at once and the user
runs `aief status --next` without `--change`. A project with 0 or 1 open Changes is unaffected —
confirmed byte-identical in both this audit's live runs and the unmodified pre-existing tests for
those two cases.

**Why:** commissioned explicitly (Change 0059) to replace an unhelpful hard stop with an
actionable, deterministic answer, reusing only already-official facts (Graph edges/issues,
Workflow gate blockers) — never inferring from Change id, folder name, or date. Recorded in
ADR-029 and `changes/0059-*/change.md` "Deliberate, documented behavior change."

**Impact:** any script or human workflow that relied on the old hard error (e.g., to force
explicit `--change` selection, or that parsed exit code `1` as "ambiguous") will now see exit `0`
and a recommendation or a "no eligible Change" report instead. `aief status --change <id> --next`
(explicit selection) is completely unaffected — it never had this ambiguity.

**Mitigation:** none required for interactive use (the new output is strictly more informative).
A script depending on the old exit-`1`/error-text contract should switch to reading the
`Next Change: <id>` line, or continue passing `--change <id>` explicitly, which was always the
byte-identical path.

## Post-v3.1 candidates (out of scope here — documented, not implemented)

Nothing found during this audit required a new subsystem or a substantial redesign. For the
avoidance of doubt: [AIEF 2.0-era DELETE/Type-Track/onboarding-simplification work remains frozen
per ADR-015](../../knowledge/decisions.md) pending its own usability-study consolidation, unrelated
to and unaffected by this Change.

## Requirements

- **R1 — Every audited flow is checked against real command output**, not just against its own
  documentation (a doc and its code can drift together and still be self-consistent while wrong).
- **R2 — Every fix is minimal and additive.** No existing documented flag, message, or exit code
  changes; `--help`/`aief help status`/`docs/cli.md` gain accurate detail, nothing is removed.
- **R3 — ADR-024–029 are each independently re-verified**, not summarized from memory of the
  Change that introduced them.
- **R4 — Backward compatibility is demonstrated with a real, from-scratch project**, not inferred
  from reading code alone.
- **R5 — The one intentional behavior change is fully disclosed**: condition, reason, impact,
  mitigation — per the commissioning instruction's explicit requirement to never declare "no
  breaking changes" without verifying it.
- **R6 — This Change adds no new command, flag, manifest field, or file format.**

## Acceptance Criteria

- [x] `--help` and `aief help status` document `--graph` and `--next`'s multi-open-Change
      behavior.
- [x] `docs/cli.md`'s introductory sentence no longer contradicts its own table.
- [x] ADR-024 through ADR-029 each re-verified against live command output (table above).
- [x] Backward compatibility demonstrated live: manifest-less Changes, invalid manifests, and
      zero-opt-in projects all behave as documented.
- [x] The `status --next` 2+-open-Changes behavior change is documented with condition, reason,
      impact and mitigation.
- [x] No new subsystem, command, flag, or manifest field was introduced.
- [x] Full test suite passes (728/728 baseline maintained or increased).
- [x] `aief verify` passes for this Change and for the repository.
- [x] `git diff --check` is clean (no whitespace errors).
- [x] Working tree is clean after the commit; no push performed.
