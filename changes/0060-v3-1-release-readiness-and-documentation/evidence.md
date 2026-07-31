# Evidence

## Summary

AIEF v3.1 (Changes 0052–0059) was audited end-to-end against its own ADRs (024–029) and
documentation, both by reading and by exercising real commands in a from-scratch scratch project.
Two small documentation/discoverability gaps were found and fixed (`--graph` missing from
`--help`/`aief help status`; a stale "Core 3.0" claim in `docs/cli.md` contradicting its own
table). No regression, no undocumented blocking authority, and no backward-compatibility break was
found. The repository's own governance docs (`CLAUDE.md`, `docs/maintainer.md`) were extended with
two items the audit found genuinely missing (explicit no-push, no-destructive-operations rules);
the `AGENTS.md` template was deliberately left untouched (it is shipped verbatim to every adopted
project, not this repo's own dev guide). The full suite passes at 728/728, unchanged in count from
the pre-Change baseline (two changed strings, one changed sentence — no test needed updating).

## Activities Performed

1. Read `changes/0052-*` through `changes/0059-*` (`change.md`/`spec.md`) and their ADRs
   (`knowledge/decisions.md` ADR-024–029).
2. Read `cli/src/cli.js` end to end for the audited command surfaces (`doctor`, `status`,
   `prompt`, `verify`, `close`, `bootstrap`) and cross-checked against `docs/cli.md`,
   `docs/configuration.md`, `docs/workflow.md`, `docs/architecture.md`, `docs/concepts.md`,
   `docs/getting-started.md`, `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/maintainer.md`.
3. Ran the onboarding path and every opt-in feature live in a throwaway scratch project outside
   this repository (created and deleted within this Change's session; not part of the commit).
4. Fixed the two findings in `cli/src/cli.js` and `docs/cli.md`.
5. Extended `CLAUDE.md` and `docs/maintainer.md` with the governance items found missing.
6. Wrote this Change's `change.md`, `spec.md`, `tasks.md`.
7. Ran the full validation suite (below) before closing.

## Verification

### Full test suite

```
$ npm test   # from repo root
...
1..728
# tests 728
# suites 0
# pass 728
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

728/728 PASS — matches the 728/728 baseline stated in the commissioning instruction; unchanged by
this Change's fixes (help text and a doc sentence, no test-covered behavior changed).

### `aief verify` (this repository)

```
$ node cli/bin/aief.js verify
...
✓ changes/0059-smart-workflow-next-change-selection (closed)
○ changes/0060-v3-1-release-readiness-and-documentation — in progress (evidence not completed yet; expected until the Change is closed)

Result: PASS
```

PASS (0060 correctly shown "in progress" before its own close — expected, matches the documented
behavior of every other Change until closed).

### `git diff --check`

```
$ git diff --check
(no output, exit 0)
```

Clean — no whitespace errors in any changed file.

### Onboarding path (scratch project, `git init` + fresh directory)

```
$ aief doctor            # zero writes — confirmed no files appeared afterward
$ aief bootstrap          # created AGENTS.md, knowledge/standards/*, knowledge/skills.md,
                          # .github/workflows/aief-verify.yml, changes/0001-adopt-aief — all
                          # visible, all documented, nothing hidden
$ aief new-change "hello world feature"
Created Change: changes/0002-hello-world-feature
$ aief prompt claude --change 0002-hello-world-feature
...(prompt referencing change.md/spec.md/tasks.md, knowledge/skills.md, standards — matches
docs/workflow.md exactly)
$ aief verify --change 0002-hello-world-feature
Result: PASS
$ aief close --yes --change 0002-hello-world-feature   # first attempt, before completing
                                                        # evidence/tasks: correctly refused
○ evidence.md has not been completed yet
○ 4 unchecked task(s) in tasks.md
Not closed: resolve the items above first.
$ # ...completed evidence.md/tasks.md...
$ aief close --yes --change 0002-hello-world-feature
✓ All readiness checks passed.
✓ Closed changes/0002-hello-world-feature.
```

Matches `docs/getting-started.md` and `docs/workflow.md` exactly — no drift found.

### Opt-in features (scratch project, live)

- **LIDR / Standards precedence (ADR-025):** created `ai-specs/standards/custom-rule.md`; `aief
  doctor --verbose` listed it as `custom-rule [project]: ... source: project` alongside the
  built-in standards — project-over-built-in precedence confirmed.
- **Harness (ADR-026):** Change manifest with `"harness": {"log": true}`; `status --change`
  showed `Harness: configured (log on)`; `aief verify --change` appended one entry to
  `changes/<id>/hooks.md` (visible, append-only, no raw command output); `verify` result was
  still `PASS` — Harness did not gate anything.
- **Loop (ADR-027):** same Change with `"loop": {"verify": {"maxRetries": 2}}`; one `aief verify`
  call wrote `changes/<id>/loop.md` with `Attempt 1 ... PASS ... Loop complete.` — no automatic
  re-invocation of `verify` was observed.
- **Graph (ADR-028):** `"dependsOn": ["0001-adopt-aief"]` on a second Change; `aief status`
  printed a "Dependency Graph: 1 Change(s) declare dependencies" section; `aief status --graph`
  printed nodes/edges/topological order/issues; both read-only (no new file appeared from either
  command).
- **`status --next`, 2+ open Changes (ADR-029):** with two open, independent Changes, `aief
  status --next` recommended the lower id, explained "Ready because: status open / dependencies:
  none declared / graph: valid / workflow: no blocking gates", and listed the other Change under
  "Other eligible Change(s)" — matches `docs/workflow.md`'s documented behavior exactly.

### Legacy / error paths (scratch project, live)

- **Manifest-less Change** (this repository's own actual shape — no `changes/*/manifest.json`
  exists anywhere in this repo): `aief status --change` reported `Workflow: no track declared
  (legacy readiness only)` — unchanged, pre-v3.1 behavior.
- **Invalid manifest** (hand-written `manifest.json` missing `schema`/`id`/`slug`/`title`/
  `status`): `aief status` reported it as "Changes with an invalid manifest.json," field by
  field — never silently treated as absent, matching `docs/configuration.md`'s documented
  contract exactly.

### Files touched by this Change (`git status --short`)

```
 M CLAUDE.md
 M cli/src/cli.js
 M docs/cli.md
 M docs/maintainer.md
?? changes/0060-v3-1-release-readiness-and-documentation/
```

No unrelated files. No NUL bytes in any modified/new file (checked directly). No secret-shaped
strings (`api_key`/`secret`/`password`/`token` followed by a literal value) in any modified/new
file.

## Findings

See `spec.md` "Findings" (F1–F4) and "Architectural coherence vs. ADR-024–029" for the full,
per-ADR verification table. Summary: two small doc/discoverability gaps fixed; zero code-behavior
regressions; zero undocumented blocking authority; zero backward-compatibility breaks.

## Risks

- **`status --next`'s 2+-open-Changes behavior change** (documented in `spec.md` "Breaking changes
  and migration") could surprise a script that parsed the old hard-error's exit code `1`. Mitigated
  by full disclosure here and in `changes/0059-*`/ADR-029; no such script exists inside this
  repository.
- **`package.json` still reports `"version": "3.0.0"`** while the docs already refer to "AIEF
  3.1" for Changes 0052+. This Change deliberately does not bump it — see `change.md` "Out of
  scope" — because `aief release <version>` is a separate, human-triggered step per
  `docs/maintainer.md` "Releasing," and this Change is readiness review, not the release itself.
  Flagged here so the human release step doesn't miss it.

## Recommendations

- When `aief release 3.1.0` (or the chosen version) is run, verify `package.json`'s version is
  bumped as part of that step, and that `releases/v3.1.0.md` is filled in with a link back to this
  Change.
- No further v3.1 consolidation work is needed before merge, per this audit.

## Artifacts Produced

- `changes/0060-v3-1-release-readiness-and-documentation/` (this Change).
- `cli/src/cli.js` — `--graph` added to `--help` and `aief help status`.
- `docs/cli.md` — corrected introductory sentence.
- `CLAUDE.md` — added maintainer-guide cross-reference, validation-command reminder, no-push and
  no-destructive-operations rules.
- `docs/maintainer.md` — added `git diff --check` to the Testing block and a new "Git discipline"
  section.

## Lessons Learned

- This codebase's ADR-driven documentation discipline (every doc row cites the Change/ADR that
  introduced it) held up well under audit — the only drift found was an umbrella sentence written
  before later rows were added beneath it, not a per-row inaccuracy.
- `AGENTS.md` serving double duty as both this repo's own Prime Directive file and the literal
  template shipped to every adopted project is a real, load-bearing distinction — repo-specific
  operational rules belong in `CLAUDE.md`/`docs/maintainer.md`, never in `AGENTS.md` itself.

## Next Change

None required by this audit. Any future v3.1-adjacent work (e.g. the actual `aief release 3.1.0`
step, or any post-v3.1 idea surfaced but out of scope here) starts as its own Change, per
`AGENTS.md`.
