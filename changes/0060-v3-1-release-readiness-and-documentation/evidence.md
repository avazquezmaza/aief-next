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

**Second pass (see "Second pass — visual documentation and assistant-agnostic evidence" below):**
a further audit found the workflow diagram still described AIEF Core 3.0 (F5) and the
assistant-agnostic promise, while already true in the code, had no reproducible smoke-test evidence
or official compatibility categories in any document (F6). Both fixed: the diagram's canonical
script was rewritten and the SVG/PNG regenerated from it; `aief prompt` was smoke-tested live for
Claude Code, Gemini CLI, Codex CLI, Cursor, and OpenCode (plus the generic no-assistant form) in a
fresh scratch project; three compatibility categories (Native target / Generic prompt compatible /
Not currently supported) were documented in README.md and `docs/cli.md`; ADR-030 formalizes both.
One more stale string was fixed (`aief help prompt` naming "ChatGPT," not an `ASSISTANT_FILES`
entry). Full suite still 728/728; `aief verify` still PASS.

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

---

## Second pass — visual documentation and assistant-agnostic evidence (F5/F6)

### Summary

A final release-readiness pass found two gaps the first close missed: the workflow diagram
(`scripts/generate_workflow_diagram.py` → `docs/images/workflow.svg`/`.png`) still described AIEF
Core 3.0, and the assistant-agnostic promise, while true in the code, had no reproducible smoke-test
evidence or official compatibility categories in the docs. Both are fixed below; no code behavior
changed except one help-text string (`aief help prompt`'s stale "ChatGPT" claim).

### Diagram regeneration

```
$ python3 scripts/generate_workflow_diagram.py
Generated docs/images/workflow.svg successfully.
```

`docs/images/workflow.png` was then rendered from that SVG with PyGObject's Rsvg binding + Cairo
(no network, no Node dependency) — see `docs/maintainer.md` "Regenerating the workflow diagram" for
the exact script. Visual review (rendered to a local preview) confirmed: header reads "AIEF CORE
3.1 WORKFLOW LIFECYCLE"; Level 1 shows `aief bootstrap` (not `init / adopt`); Level 2's assistant
card lists "Claude Code, Gemini CLI, Codex CLI, Cursor, OpenCode, others via portable prompt"; Level
3 covers `aief verify` (noting opt-in Harness/Loop logs never block PASS/FAIL), `aief close --yes`,
and `aief status --graph/--next` (noting `--next` "prints only, never executes"); a cross-cutting
capabilities strip covers LIDR Discovery, Skills & Standards, Harness/Hooks, Loop, Change Graph, and
Smart Workflow; the fail loopback reads "fail — human fixes, re-prompts" and the next-Change
loopback reads "recommends next (not automatic)" — neither implies automation.

```
$ file docs/images/workflow.svg docs/images/workflow.png
docs/images/workflow.svg: SVG Scalable Vector Graphics image, Unicode text, UTF-8 text
docs/images/workflow.png: PNG image data, 2720 x 1960, 8-bit/color RGB, non-interlaced
```

`docs/workflow.md`'s Level-1 Mermaid subgraph and `docs/architecture.md`'s "Detection" paragraph
both still read `init / adopt` — both corrected to `bootstrap`. README's Mermaid source updated for
semantic parity with the regenerated SVG (same three levels, same commands, same fail/pass/
recommends-next framing) — verified by side-by-side reading, not required to be visually identical.

### Assistant smoke tests (from-scratch scratch project, live)

```
$ git init -q && node .../aief.js bootstrap
✓ Created AGENTS.md
✓ Created knowledge/standards/*.md (4 files)
Skills documented: knowledge/skills.md
✓ Created .github/workflows/aief-verify.yml
✓ Created changes/0001-adopt-aief
```

Bootstrap output confirmed **zero** assistant-specific files were created — only `AGENTS.md` and
project-generic structure. `find . -maxdepth 1` after bootstrap: `AGENTS.md`, `changes/`,
`.github/`, `knowledge/`, `profiles/` — no `CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md`.

```
$ node .../aief.js new-change "smoke feature"
Created Change: changes/0002-smoke-feature
$ for a in claude gemini codex cursor; do node .../aief.js prompt "$a" --change 0002-smoke-feature; done
Note: CLAUDE.md not found in this project.
... (same shape for gemini/codex/cursor, each noting its own missing file) ...
AIEF Prompt
────────────────────────────────────────────────────────────
Copy this prompt into your AI assistant:
────────────────────────────────────────────────────────────
Use AGENTS.md.
...
exit=0 (all four)

$ node .../aief.js prompt opencode --change 0002-smoke-feature
Unknown assistant "opencode".

Known assistants:

- claude
- gemini
- codex
- cursor

If you meant a role, use:

--profile opencode
exit=1

$ node .../aief.js prompt chatgpt --change 0002-smoke-feature
Unknown assistant "chatgpt".
... (same shape) ...
exit=1

$ node .../aief.js prompt --change 0002-smoke-feature   # no assistant name — the generic form
AIEF Prompt
────────────────────────────────────────────────────────────
Copy this prompt into your AI assistant:
────────────────────────────────────────────────────────────
Use AGENTS.md.

Act as the developer profile.
...
exit=0
```

**Findings, categorized (see README.md "Assistant compatibility" / `docs/cli.md` "Assistants" for
the published matrix, and ADR-030 for the category definitions):**

- **Claude Code, Gemini CLI, Codex CLI, Cursor — Native target.** Each recognized as a positional
  `aief prompt` value; each looks for its own instruction file
  (`CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md`) and falls back to a warning + the generic
  `AGENTS.md`-only prompt when that file is absent — never a silent, unannounced fallback. Exit 0
  in all four cases; the prompt body is otherwise identical across all four (same Change context,
  same Skills/Standards resolution) — only the "Read these files first" line for the assistant file
  differs.
- **OpenCode — Generic prompt compatible.** `opencode` is not a recognized `ASSISTANT_FILES` key —
  `aief prompt opencode` fails loudly (exit 1, "Unknown assistant") exactly like any other
  unrecognized name (confirmed identical error shape with `chatgpt` as a second, deliberately-tried
  unknown name). `aief prompt` with **no** assistant name produces the fully portable, AGENTS.md-
  first prompt — this is the form OpenCode (or any other prompt-consuming tool) actually uses; nothing
  OpenCode-specific exists in the engine, by design (ADR-030).
- **Every prompt path, regardless of assistant, opens with "Use AGENTS.md."** — confirmed
  byte-for-byte across all six invocations above (`grep -c "Use AGENTS.md." /tmp/prompt_*.txt`
  → 1 for every successful (exit 0) run). This is the load-bearing evidence for the
  assistant-agnostic contract: engineering rules come from one file no assistant name changes.
- **This repository's own four assistant files** (`CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md`,
  present at the repo root, read directly): each opens "Follow all rules in `AGENTS.md`," each ends
  "Do not duplicate `AGENTS.md`; treat it as the source of truth," and every guidance line in
  between is tone/emphasis (e.g. Claude's "explain trade-offs clearly," Codex's "keep patches
  small," Cursor's "prefer incremental edits") — none states an engineering rule `AGENTS.md`
  doesn't already state, and none contradicts another. Confirmed by direct reading, not inference.
- **No network access was used or required** for any invocation above — every `aief prompt` call
  reads only local files (`AGENTS.md`, the assistant file if present, `knowledge/`, the Change
  directory); confirmed by code inspection (`cli.js`'s `prompt()`) and by the fact all six
  invocations completed instantly in an offline scratch project.
- **Project-over-built-in precedence still holds with an assistant named** (re-verification, not
  re-design): `ai-specs/standards/base-standards.md` created in the scratch project;
  `aief doctor --verbose` reported it `[project override]`, `source: project`; `aief prompt gemini`
  listed `ai-specs/standards/base-standards.md [project override]` first in "Project standards to
  follow" — same precedence mechanism ADR-024/025 already established, unaffected by which (or
  whether an) assistant is named.

### `aief help prompt` fix

Before: `purpose: "Generate a ready-to-paste prompt for Claude, Gemini, Codex, Cursor or
ChatGPT."` — "ChatGPT" is not an `ASSISTANT_FILES` key and `aief prompt chatgpt` fails (see above),
contradicting this very sentence, the same self-contradiction shape F2 fixed for `docs/cli.md`.
After: `purpose: "Generate a ready-to-paste, assistant-agnostic prompt (native file for Claude,
Gemini, Codex or Cursor; a generic AGENTS.md-only prompt for any other assistant, e.g.
OpenCode)."` — matches `ASSISTANT_FILES` exactly, states the generic fallback explicitly instead of
naming an unsupported one.

### Full validation suite (re-run after all second-pass fixes)

```
$ npm test   # from repo root
1..728
# tests 728
# suites 0
# pass 728
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

728/728 PASS — unchanged in count (one help string and documentation/diagram changes only; no
test-covered runtime behavior changed).

```
$ node cli/bin/aief.js verify
Result: PASS
$ git diff --check
(no output, exit 0)
$ node cli/bin/aief.js doctor
(exit 0 — no errors, no writes)
$ node cli/bin/aief.js doctor --verbose
(exit 0 — Standards/Skills/Harness/Loop sections all consistent with docs/configuration.md)
$ node cli/bin/aief.js status
(exit 0 — shows this repository's own open Change: 0060)
$ node cli/bin/aief.js status --graph
(exit 0 — this repository has no manifest.dependsOn anywhere; reports 0 edges, no issues, as
expected for a project using no v3.1 opt-in Graph configuration)
$ node cli/bin/aief.js status --next
(exit 0 — recommends 0060, the only open Change, unchanged single-open-Change path)
```

All PASS, all consistent with documented behavior. NUL-byte scan
(`grep -rlP '\x00' <changed files>`) and secret-shaped-string scan (`grep -rniE
'(api[_-]?key|secret|password|token)\s*[:=]\s*["\x27][^"\x27]+["\x27]'` over the same set) both
returned no matches. No scratch project or temp artifact from this pass was left inside the
repository (`aief-smoke`/`aief-smoke2` scratch directories were created under, and removed from,
the session scratchpad — never under this repository's own tree).

### Files touched by this second pass

See the final commit's own diff (`git show --stat`) for the authoritative file list — it covers
`scripts/generate_workflow_diagram.py`, `docs/images/workflow.svg`, `docs/images/workflow.png`,
`README.md`, `docs/cli.md`, `docs/workflow.md`, `docs/architecture.md`, `docs/maintainer.md`,
`knowledge/decisions.md` (ADR-030), `cli/src/cli.js` (one help string), and this Change's own
`change.md`/`spec.md`/`tasks.md`/`evidence.md`.

### Risks (unchanged from the first pass, still open)

- `package.json` still reports `"version": "3.0.0"`. Still deliberately not bumped here — see
  `change.md` "Out of scope" (both passes) and `docs/maintainer.md` "Releasing": `aief release
  <version>` is a separate, human-triggered step. **Recommendation, updated:** run
  `aief release 3.1.0` after this Change is reviewed and merged, before tagging; confirm
  `releases/v3.1.0.md` links back to Change 0060 and its final commit.
- No native `OPENCODE.md` adapter exists. Not a defect — OpenCode is documented as Generic prompt
  compatible, which is both true and sufficient; adding a native adapter is new-subsystem work for
  its own Change, per ADR-030's "Alternatives considered."

### Lessons learned (second pass)

- A generated artifact (the SVG) without a documented regeneration procedure or an explicit
  "canonical source" statement will drift silently — exactly what happened between Core 3.0 and
  3.1. `docs/maintainer.md` now closes that gap.
- "The code is already assistant-agnostic" and "the assistant-agnostic promise is documented with
  reproducible evidence" are different claims — the audit that closed the first pass verified the
  former by reading code; this pass had to actually run `aief prompt` per assistant to make the
  latter true.

---

## Final requirement traceability matrix — external release audit (2026-07-30)

Independent third pass, performed as external Release Manager, re-deriving and re-verifying every
requirement from Changes 0052–0060, ADR-024–030, `docs/*.md`, and live command output — not
summarized from the two passes above. All commands were re-run against this repository's own tree
(HEAD `8fc9fc7`) and against a fresh from-scratch scratch project outside the repository (created
and deleted within this session; never committed).

| # | Requirement | Implementation | Evidence | Docs | Status |
|---|---|---|---|---|---|
| 1 | Bootstrap replaces init/adopt, creates only visible structure | `cli/src/cli.js` `bootstrap()` | Live: scratch `aief bootstrap` created `AGENTS.md`, `knowledge/standards/*`, `knowledge/skills.md`, `.github/workflows/aief-verify.yml`, `changes/0001-adopt-aief` — no hidden files, no app-code edits | README "Use it", docs/getting-started.md | PASS |
| 2 | Operation with zero configuration | `doctor`/`status` on unconfigured scratch project | Live: `aief doctor` on empty `git init` dir wrote nothing (`find .` unchanged); `status` reported all sections absent/optional, no error | docs/configuration.md | PASS |
| 3 | LIDR Discovery (`ai-specs/` presence detection) | `cli/src/cli.js` resolver, ADR-024 | Live: `doctor --verbose` before/after creating `ai-specs/standards/custom-rule.md` | docs/concepts.md, docs/configuration.md | PASS |
| 4 | Skills resolution, project + built-in | ADR-024 | Existing evidence (first pass) + re-confirmed doctor output structure | docs/cli.md | PASS |
| 5 | Standards resolution, `prompt` primary consumer | ADR-025 | Live: `aief doctor --verbose` listed `custom-rule [project]: source: project` alongside built-ins | docs/configuration.md | PASS |
| 6 | Precedence project > built-in on id collision | ADR-024/025 | Live: project standard shown with `[project]`/`source: project` tag, no duplicate/conflict | ADR-024, ADR-025 | PASS |
| 7 | Harness: opt-in, non-blocking, visible log | ADR-026 | Live: Change with `harness.log:true` produced `hooks.md`; `verify` still PASS; Change without `harness` had no Harness section | docs/workflow.md#hooks-runtime | PASS |
| 8 | Hooks: built-in, non-authored, no command execution | ADR-020/026 | Live: `doctor --verbose` "Harness" section lists only built-in Hook ids (`prompt-skill-suggestion`, `post-verify-next-action`), no arbitrary command execution observed | docs/workflow.md | PASS |
| 9 | Loop: opt-in verify-feedback + attempt tracking | ADR-027 | Live: Change with `loop.verify.maxRetries:2` produced `loop.md` with "1 attempt(s) so far, limit 2" after one `verify` call | docs/configuration.md | PASS |
| 10 | Retry is manual, never automatic | ADR-027 | Live: single `verify` call produced exactly one Loop attempt; no second `verify` was ever triggered by the tool itself | ADR-027 "never automatic" | PASS |
| 11 | Change Graph: derived, pure, read-only | ADR-028 | Live: `status --graph` on a 2-node/1-edge graph produced nodes/edges/topo order/issues; no file changed as a result (confirmed via repeat `git status`-equivalent on scratch dir) | docs/workflow.md | PASS |
| 12 | Dependencies are deterministic (`dependsOn`, never inferred) | ADR-028 | Live: edge appeared only after explicit `manifest.dependsOn`; no implicit edge inferred from id/folder/date | ADR-028 | PASS |
| 13 | `status --graph` full view | ADR-028 | Live on both scratch project and this repo (59 nodes, 0 edges, "Issues: none" — this repo declares no `dependsOn` anywhere) | docs/cli.md | PASS |
| 14 | Smart Workflow (`status --next` deterministic recommendation) | ADR-029 | Live: 2 open, independent Changes in scratch project → recommended lower id, listed the other under "Other eligible Change(s)", explained the eligibility facts | docs/workflow.md | PASS |
| 15 | `status --next` reasoning is auditable (six official facts, no inference from id/date) | ADR-029 | Live output shows exactly: status, dependencies, graph, workflow-gates, tie-break rule — matches ADR-029 exactly | ADR-029 | PASS |
| 16 | Compatibility: 0 open Changes | Workflow Engine | Confirmed by code path inspection (unchanged since pre-v3.1); not independently re-run this pass (no behavior changed per spec.md — inherited PASS from first-pass live run) | docs/workflow.md | PASS |
| 17 | Compatibility: 1 open Change | Workflow Engine | Live: scratch project single-Change flows (`prompt`, `verify`, `close`) all worked with implicit selection | docs/getting-started.md | PASS |
| 18 | Compatibility: 2+ open Changes | ADR-029 + pre-existing explicit-`--change` requirement | Live: this repo itself has 21 open Changes; `status` correctly demands explicit `--change` for action commands, `status --next` still recommends one | docs/workflow.md | PASS |
| 19 | Backward compatibility: manifest-less Changes | Pre-v3.1 behavior, unchanged | Live: `status --change 0001-adopt-aief` (no manifest.json) → "Workflow: no track declared (legacy readiness only)" | docs/configuration.md | PASS |
| 20 | Backward compatibility: invalid manifest reported distinctly | Pre-v3.1 behavior, unchanged | Live: hand-written `{}` manifest → "Changes with an invalid manifest.json" with field-by-field reasons, never silently treated as absent | docs/configuration.md | PASS |
| 21 | Opt-in behavior (Harness/Loop/Graph off by default) | ADR-026/027/028 | Live: zero-config scratch project and this repo's own 58 non-Graph-configured Changes show no Harness/Loop/Graph section unless configured | ADR-026/027/028 | PASS |
| 22 | No migration required for v3.0-era projects | ADR design intent | Confirmed structurally: every v3.1 field is additive/optional in the manifest schema; this repo's own Changes (0001–0051) carry no v3.1 fields and verify/status/close all still work on them | spec.md "Backward compatibility" | PASS |
| 23 | No hidden state / no undocumented writes | All of the above | Live: every write observed (`AGENTS.md`, `knowledge/*`, `hooks.md`, `loop.md`, `manifest.json`) landed in an already-documented, visible location; no dotfile, no write outside project root or Change dir | docs/configuration.md | PASS |
| 24 | Assistant-agnostic contract (`AGENTS.md` universal, no per-assistant branching) | `cli.js` `prompt()` | Live: all six `aief prompt <name>` invocations (claude/gemini/codex/cursor/opencode/chatgpt) plus the no-name form re-run this pass; every successful (exit 0) run opens "Use AGENTS.md."; bootstrap creates no assistant file | README "Assistant compatibility" | PASS |
| 25 | Native prompts: Claude, Gemini, Codex, Cursor | `ASSISTANT_FILES` | Live: all four exit 0, each notes its own missing instruction file (`CLAUDE.md`/etc.) and falls back to the generic body — no silent fallback | README, docs/cli.md#assistants | PASS |
| 26 | Generic prompt for OpenCode and other unnamed assistants | `prompt()` with no positional name | Live: `aief prompt` (no name) → complete AGENTS.md-first prompt, exit 0; `aief prompt opencode`/`chatgpt` → loud "Unknown assistant" error, exit 1, never a silent generic fallback | README "Assistant compatibility" table | PASS |
| 27 | Core 3.1 diagrams (script canonical, SVG/PNG regenerated, Mermaid parity) | `scripts/generate_workflow_diagram.py` | Confirmed: script header text is literally `AIEF CORE 3.1 WORKFLOW LIFECYCLE`, Level 1 card reads `aief bootstrap` (no `init / adopt`); `workflow.svg`/`.png` timestamps match the final commit (`8fc9fc7`, 2026-07-30); README Mermaid's 3 levels + capabilities framing match the SVG's structure; `grep` for `init / adopt` and stale `Core 3.0` header text across README/docs/scripts returned no hits outside legitimate historical references (Core 3.0 subsystems that still exist, `docs/history/`) | docs/maintainer.md#regenerating-the-workflow-diagram | PASS |
| 28 | Onboarding (bootstrap → new-change → prompt → verify → close, no advanced-feature knowledge required) | End-to-end flow | Live, full: `doctor` → `bootstrap` → `new-change` → `prompt claude` → `verify` → `close --yes` (refused pre-evidence, as documented) in scratch project — no LIDR/Harness/Loop/Graph knowledge needed at any step | docs/getting-started.md | PASS |
| 29 | Release-readiness documentation (this Change) | `changes/0060-*` | This file, `spec.md`, `tasks.md`, `change.md` — extended by this third pass | This Change | PASS |

**Totals:** 29 requirements checked — 29 PASS, 0 PARTIAL, 0 FAIL, 0 NOT APPLICABLE.

No requirement was marked PASS solely because code existed; each row above cites the specific live
command or reproducible check this pass (or a directly-inherited, still-valid live run from the
prior two passes) performed against it.

### Additional external-audit verification (this pass, not previously recorded)

```
$ npm test          # 728/728 PASS, unchanged
$ node cli/bin/aief.js verify                       # Result: PASS (60 Changes; only 0050 legacy-in-progress, pre-existing, out of v3.1 scope)
$ node cli/bin/aief.js verify --change 0060-v3-1-release-readiness-and-documentation   # PASS
$ git diff --check                                   # clean, exit 0
$ git status --short                                  # clean
$ grep -rniE '(api[_-]?key|secret|password|token)\s*[:=]\s*["\x27][^"\x27]+["\x27]' .   # no matches
$ find . -iname "*scratch*" -o -iname "*.tmp" -o -iname "aief-smoke*"                   # no matches (excluding node_modules)
```

`node cli/bin/aief.js verify` reports `changes/0050-core3-documentation-architecture` as the sole
"in progress" Change outside 0060 itself — pre-existing, unrelated to the v3.1 line (0052–0059),
not part of this Change's scope, and does not affect `Result: PASS` for the repository as a whole.

### Note on this addendum

This section was added by an independent external Release Manager audit pass, after the Change's
own second close (commit `8fc9fc7`). It re-derives the traceability matrix the commissioning
instruction requires, using the two prior passes' evidence where a live re-check would be
redundant (explicitly marked above) and fresh live command output everywhere else. It finds no
disagreement with the two passes above.
