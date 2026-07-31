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

## Third pass — public documentation clarity and diagram quality (F7/F8/F9)

Commissioned as a Technical Documentation Architect / Product Editor pass over the already-approved
v3.1 implementation: no behavior change, README and `docs/architecture.md` rewritten for a public
release audience, `docs/workflow.md` checked for contradictions only.

```
$ grep -rl "dependsOn" changes/*/manifest.json 2>/dev/null | wc -l
0
$ find changes -name manifest.json | wc -l
0
```

Confirms F7's architecture.md claim: zero manifest.json files exist anywhere in `changes/` at the
time of this pass, therefore zero Graph edges — no Change to date has used `dependsOn`. The rewrite
states this explicitly instead of implying historical dependency usage.

```
$ python3 - <<'PY'
import re
files = ["README.md", "docs/architecture.md", "docs/workflow.md"]
for f in files:
    text = open(f).read()
    blocks = re.findall(r"```mermaid\n(.*?)```", text, re.S)
    print(f, "->", len(blocks), "mermaid block(s)")
PY
README.md -> 1 mermaid block(s)
docs/architecture.md -> 4 mermaid block(s)
docs/workflow.md -> 1 mermaid block(s)

$ for f in <extracted blocks>; do npx -y @mermaid-js/mermaid-cli -i "$f" -o "$f.svg"; done
Generating single mermaid chart   # x6, no errors
```

All 6 diagrams parse and render. README's diagram viewBox was checked after rendering
(`grep -o 'viewBox="[^"]*"'`); the initial `flowchart LR` version rendered at `1627×283` — too wide
relative to height for a normal GitHub content column — so it was switched to `flowchart TD`,
re-rendered at `474×852`, and kept.

```
$ npm test
# tests 728
# pass 728
# fail 0

$ node cli/bin/aief.js verify
Result: PASS

$ git diff --check
(no output — clean)
```

```
$ grep -rn "aief init\|aief adopt\b\|Core 3\.0 subsystems plus\|CORE 3\.0" README.md docs/*.md
docs/cli.md:28:`aief bootstrap` (AIEF 3.1, Change 0052) replaces the former `aief init`/`aief adopt` commands —
```

The single hit is a legitimate historical mention (explaining what `bootstrap` replaced), left
unchanged — not drift.

**Files touched this pass:** `README.md`, `docs/architecture.md`, `docs/workflow.md` (Level-1
diagram fix only, F8), `docs/cli.md` (Assistants table detail restored, cross-reference fixed),
`docs/maintainer.md` ("Regenerating the workflow diagram" updated for F9), `knowledge/decisions.md`
(ADR-030 §3 amended in place, F9), this Change's `spec.md`/`tasks.md`/`evidence.md`. No `cli/src/`
file was touched; no test needed updating; test count unchanged at 728.

**Note on this addendum.** Added by a Technical Documentation Architect / Product Editor pass,
after the Change's second close (commit `9410e1c`). Scope was explicitly editorial per the
commissioning instruction: no CLI behavior, no new subsystem, no push. One accepted-ADR conflict
was found (ADR-030 §3's README/SVG parity requirement vs. the commissioned simplified README
diagram) and resolved by amending the ADR in place rather than silently deviating — see spec.md
F9.

## Fourth pass — Mermaid to SVG migration (2026-07-30)

**Commissioned as:** Documentation Visualization Engineer, after the Change's third close (commit
`f2844c1`). Scope: replace every Mermaid diagram with a professionally styled, generated,
reproducible SVG — content and semantics from the third pass unchanged.

**Pre-flight audit.**

```
$ git branch --show-current
feat/v3.1
$ git log -1 --oneline
f2844c1 docs(v3.1): improve README and architecture diagrams
$ git status --porcelain
(no output — clean)
$ rg -n '```mermaid' -g '*' .
README.md:26:```mermaid
docs/workflow.md:9:```mermaid
docs/architecture.md:27:```mermaid
docs/architecture.md:75:```mermaid
docs/architecture.md:135:```mermaid
docs/architecture.md:189:```mermaid
changes/0050-core3-documentation-architecture/design.md:330:```mermaid
```

**Mermaid inventory (6 live blocks, 1 documented exception).**

| # | File | Section | Purpose | Replacement |
|---|---|---|---|---|
| 1 | README.md:26 | The core workflow | Product workflow — how AIEF works | `docs/images/product-workflow.svg` |
| 2 | docs/architecture.md:27 | System context | Where AIEF sits in the engineering system | `docs/images/system-context.svg` |
| 3 | docs/architecture.md:75 | Core runtime architecture | How AIEF is implemented internally | `docs/images/core-runtime.svg` |
| 4 | docs/architecture.md:135 | Prompt composition | What goes into an AIEF prompt | `docs/images/prompt-composition.svg` |
| 5 | docs/architecture.md:189 | Graph Engineering | How dependsOn shapes eligibility | `docs/images/graph-engineering.svg` |
| 6 | docs/workflow.md:9 | The three levels | Detailed Change lifecycle | `docs/images/workflow-lifecycle.svg` |

**Exception (kept, documented, not replaced).** `changes/0050-core3-documentation-architecture/
design.md:330` — Change 0050's own design doc states its own file tree section (which the Mermaid
block sits directly beneath) is "unmoved, unedited" as an explicit rule for how that historical
Change's archive is treated; every `changes/*` directory before this Change is historical record,
not live documentation, and Change 0050 specifically calls out its own immutability. Left as-is.
No other exception was needed or found — the two other `mermaid` string matches
(`.claude/settings.json`'s permission allowlist entry, and a `re.findall(r"```mermaid...")` regex
literal inside this Change's own third-pass evidence log) are not Mermaid fences.

**Diagram inventory.**

| Diagram | Question answered | Canonical source | SVG | PNG | Consumer |
|---|---|---|---|---|---|
| Product Workflow | How does AIEF work? | `scripts/diagrams/generate_product_workflow.py` | `docs/images/product-workflow.svg` | `.png` | README.md |
| System Context | Where does AIEF sit in the engineering system? | `scripts/diagrams/generate_system_context.py` | `docs/images/system-context.svg` | `.png` | docs/architecture.md |
| Core Runtime | How is AIEF implemented internally? | `scripts/diagrams/generate_core_runtime.py` | `docs/images/core-runtime.svg` | `.png` | docs/architecture.md |
| Prompt Composition | What goes into an AIEF prompt? | `scripts/diagrams/generate_prompt_composition.py` | `docs/images/prompt-composition.svg` | `.png` | docs/architecture.md |
| Graph Engineering | How does Graph Engineering affect work selection? | `scripts/diagrams/generate_graph_engineering.py` | `docs/images/graph-engineering.svg` | `.png` | docs/architecture.md |
| Workflow Lifecycle | What is the detailed lifecycle of a Change? | `scripts/diagrams/generate_workflow_lifecycle.py` | `docs/images/workflow-lifecycle.svg` | `.png` | docs/workflow.md |

**Visual system.** Palette: slate (structure/text), blue (AIEF Core), violet (AI assistants), green
(repository/evidence/success), amber (opt-in/advisory/waiting), red (errors/cycles/blocked), gray
(external tools) — defined once in `scripts/diagrams/common.py`'s `PALETTE`. Typography: system
sans-serif stack, 19px diagram titles, 12–13.5px card content, 10.5–11.5px labels/badges (nothing
below 11px). Shared components: rounded card with a dark header strip, group box, badge, arrow with
color-matched marker, drop-shadow filter. Accessibility: every SVG has `role="img"`,
`<title id>`/`<desc id>` pair, `aria-labelledby` referencing both, a `viewBox`, and text-only
information (color is never the sole signal — every state also has a text label).

**Existing workflow asset.** Decision: **B** (adapted) — `docs/images/workflow.svg`/`.png` are now
generated from the same source as `docs/images/workflow-lifecycle.svg`
(`scripts/diagrams/generate_workflow_lifecycle.py`'s `generate()` function), reached through
`scripts/generate_workflow_diagram.py`, rewritten as a thin wrapper. This keeps the documented
command (`python3 scripts/generate_workflow_diagram.py`) and path (`docs/images/workflow.svg`)
working unchanged while eliminating a second, independently-drifting "what is the Change lifecycle"
diagram. Verified: `diff docs/images/workflow.svg docs/images/workflow-lifecycle.svg` — no
difference.

**Graph Engineering representation.** Pipeline: Change manifests (dependsOn) → Graph builder →
Validation (missing/duplicate/self dependency, cycle detection) → deterministic topological order →
eligibility evaluation (open, dependencies completed, no workflow blocker, deterministic order) →
Smart Workflow → `status --graph`/`status --next`. Example box: Change B declares `dependsOn:
["Change A"]` — State 1 (A open): A eligible, B waiting; State 2 (A closed): B eligible. Confirmed
again this pass (`rg -n '"dependsOn"' changes/*/manifest.json` — no manifests exist at all in this
repository's `changes/`) that zero historical `dependsOn` edges exist; the diagram's example is
generic, not drawn from this repository's own Change history, matching the third pass's finding.

**Factual validation.** Re-checked every claim rendered into SVG text against the codebase/ADRs
before writing it: AIEF never executes an assistant, test, or CI job (System Context, Product
Workflow); Harness/Hooks only append visible, non-blocking notes (Workflow Lifecycle); Loop retry
is always a manual re-run (Workflow Lifecycle); the Graph is rebuilt from disk every command with
no separate persisted state and never mutates a Change (Graph Engineering); `status --graph` is
read-only and `status --next` only recommends, never executes (Graph Engineering, Product
Workflow); `AGENTS.md` opens every generated prompt (Prompt Composition). No claim contradicts the
third pass's corrections; no new claim was introduced beyond what the approved Mermaid content
already said.

**Validation.**

```
$ python3 scripts/diagrams/generate_all.py
Using renderer: imagemagick
Generated files:
  docs/images/product-workflow.svg / .png
  docs/images/system-context.svg / .png
  docs/images/core-runtime.svg / .png
  docs/images/prompt-composition.svg / .png
  docs/images/graph-engineering.svg / .png
  docs/images/workflow-lifecycle.svg / .png
  docs/images/workflow.svg / .png
```

Determinism: ran `generate_all.py` twice into separate copies, `diff -rq` on the SVGs — identical.
Each SVG parses as well-formed XML (`xml.dom.minidom.parseString`, called by `common.write_svg`
before every write, plus re-verified by `cli/tests/diagrams.test.js`'s tag-balance check).
Accessibility: every SVG has `role="img"`, `<title id>`, `<desc id>`, `aria-labelledby`, `viewBox`
(automated test + manual read of each SVG's `<defs>`/header). PNG: all 7 render at 2031px width
(150dpi from a ~1300px viewBox), verified with `identify` and by reading each PNG directly — no
clipped text, no card overflow, consistent palette across all 6 diagram families. Links: every
Markdown `![...](....svg)` reference resolves (automated test); alt text is specific per image, not
"diagram". Mermaid remaining: `rg -n '```mermaid'` — zero hits in README.md, docs/architecture.md,
docs/workflow.md; the one documented exception in `changes/0050-.../design.md` untouched. Tests:
`npm test` — 737/737 passed (728 baseline + 9 new in `cli/tests/diagrams.test.js`). Verify:
`node cli/bin/aief.js verify` — PASS (whole project); `node cli/bin/aief.js verify --change
0060-v3-1-release-readiness-and-documentation` — PASS. `git diff --check` — clean.

**Files touched this pass:** `README.md`, `docs/architecture.md`, `docs/workflow.md` (image
references replacing Mermaid fences), `docs/maintainer.md` ("Regenerating the diagrams" section
rewritten), `knowledge/decisions.md` (ADR-030 §3 fourth amendment), `scripts/generate_workflow_diagram.py`
(rewritten as a compatibility wrapper), `scripts/diagrams/` (new: `__init__.py`, `common.py`,
`generate_all.py`, `generate_product_workflow.py`, `generate_system_context.py`,
`generate_core_runtime.py`, `generate_prompt_composition.py`, `generate_graph_engineering.py`,
`generate_workflow_lifecycle.py`), `docs/images/*.svg`/`*.png` (7 pairs, 6 new + `workflow`
regenerated from the new shared source), `cli/tests/diagrams.test.js` (new), `cli/package.json`
(test script extended), this Change's `change.md`/`spec.md`/`tasks.md`/`evidence.md`. No `cli/src/`
file was touched; no CLI command, flag, or manifest field changed.

**Confirmation.** No push. No tag. No release. No version bump. No new Change created — Change 0060
reused and kept Closed.

## Fifth pass — existing-project adoption clarity (2026-07-30)

**Commissioned as:** Release Documentation Engineer, after the Change's fourth close (commit
`828aa86`). Scope: close the documentation gap on adopting AIEF into an existing project — the
primary use case — with no CLI behavior change.

### Pre-flight validation

```
$ git branch --show-current
feat/v3.1
$ git rev-parse HEAD
828aa868e7af790b552f918c901b702f5eadbb51
$ git status --short
(no output — clean)
```

### Real scratch-project test

Created a representative existing project outside this repository (scratch, deleted after this
pass) with application code, tests, package metadata, and CI configuration:

```
$ find . -type f -not -path './.git/*' | sort | xargs md5sum
32963c020ab18b99a39aabc93ec835ea  ./.github/workflows/ci.yml
88bba215a775f20213315cdf17bd1661  ./package.json
16706a70c314b5318654c25ee7b8b059  ./README.md
d0da5574e9ec939fa12caeba50280652  ./src/app.js
15d11c58756d783fc6232e9904b45759  ./test/app.test.js
```

```
$ node .../aief.js doctor
... (environment + project readiness report)
Next:
  aief bootstrap
$ find . -type f -not -path './.git/*' | sort
./.github/workflows/ci.yml
./package.json
./README.md
./src/app.js
./test/app.test.js
```

Doctor produced **zero writes** — file list and checksums unchanged.

```
$ node .../aief.js bootstrap </dev/null
✓ Created AGENTS.md
✓ Created knowledge/standards/base-standards.md
✓ Created knowledge/standards/documentation-standards.md
✓ Created knowledge/standards/testing-standards.md
✓ Created knowledge/standards/security-standards.md
Skills documented: knowledge/skills.md
✓ Created .github/workflows/aief-verify.yml — CI gate: runs aief verify on every push/PR
✓ Created changes/0001-adopt-aief (evidence generated automatically)
SDD Provider:
  local (default)
Bootstrap complete — created 10 new artifact(s) (see above).
```

```
$ md5sum src/app.js test/app.test.js package.json README.md .github/workflows/ci.yml
d0da5574e9ec939fa12caeba50280652  src/app.js
15d11c58756d783fc6232e9904b45759  test/app.test.js
88bba215a775f20213315cdf17bd1661  package.json
16706a70c314b5318654c25ee7b8b059  README.md
32963c020ab18b99a39aabc93ec835ea  .github/workflows/ci.yml
```

All five pre-existing files unchanged (checksums identical to the pre-bootstrap baseline).
Application code, tests, CI configuration, and package metadata were not touched.

```
$ node .../aief.js bootstrap </dev/null   # second run — idempotency
✓ AGENTS.md already exists
✓ knowledge/standards/ already present (nothing overwritten)
Skills documentation already exists: knowledge/skills.md
✓ CI gate already present (nothing overwritten): .github/workflows/aief-verify.yml
✓ Adoption Change already exists
Bootstrap complete — this directory was already bootstrapped, nothing new to create.
```

No new `adopt-aief` Change appeared; every artifact reported "already exists" — confirms
idempotency and no-overwrite behavior exactly as documented.

```
$ node .../aief.js verify
✓ README.md
✓ AGENTS.md
✓ changes
✓ knowledge/
✓ changes/0001-adopt-aief
Result: PASS
```

```
$ node .../aief.js analyze
Created Change: changes/0002-analyze-current-architecture
Seeded change.md with 1 detected signal(s), 1 skill(s) and 4 standard(s).
```

```
$ find . -type f -not -path './.git/*' | sort
./AGENTS.md
./changes/0001-adopt-aief/change.md
./changes/0001-adopt-aief/evidence.md
./changes/0001-adopt-aief/spec.md
./changes/0001-adopt-aief/tasks.md
./changes/0002-analyze-current-architecture/change.md
./changes/0002-analyze-current-architecture/evidence.md
./changes/0002-analyze-current-architecture/spec.md
./changes/0002-analyze-current-architecture/tasks.md
./.github/workflows/aief-verify.yml
./.github/workflows/ci.yml
./knowledge/README.md
./knowledge/skills.md
./knowledge/standards/base-standards.md
./knowledge/standards/documentation-standards.md
./knowledge/standards/security-standards.md
./knowledge/standards/testing-standards.md
./package.json
./profiles/README.md
./README.md
./src/app.js
./test/app.test.js
```

Exactly two Changes open (`0001-adopt-aief`, `0002-analyze-current-architecture`), `analyze`
created exactly one new Change directory, and the original five files (`src/app.js`,
`test/app.test.js`, `package.json`, `README.md`, `.github/workflows/ci.yml`) remained present and
unmodified throughout the whole sequence — matches `docs/getting-started.md`'s and
`docs/examples.md`'s new adoption content exactly. This transcript is also the source for the
"Adopting AIEF into an existing repository" example added to `docs/examples.md`. The scratch
directory was created under, and removed from, the session scratchpad — never committed to this
repository.

### Consistency check

```
$ grep -rn "never overwrite\|no code edit\|assistant.specific" README.md docs/getting-started.md docs/cli.md
docs/cli.md: - `init`/`adopt`/`analyze` never modify application code and never overwrite an existing file.
docs/getting-started.md: **Does AIEF create assistant-specific files?** No. `bootstrap` never creates `CLAUDE.md`, ...
docs/cli.md: `aief bootstrap` never creates any of `CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md` ...
```

No contradiction found across README/getting-started/concepts/cli/examples on adopt/adoption/
bootstrap/analyze/existing project/new project/never overwrite/no code edits/SDD provider/
OpenSpec/SpecBoot/assistant-specific files — same vocabulary and sequence throughout.

### Diagram

```
$ python3 scripts/diagrams/generate_adoption_workflow.py
Generated docs/images/adoption-workflow.svg
$ python3 scripts/diagrams/generate_all.py
Using renderer: imagemagick
Generated files:
  ... (7 existing pairs) ...
  docs/images/adoption-workflow.svg
  docs/images/adoption-workflow.png
```

Visual review (rendered PNG): 6-step pipeline (Existing repository -> doctor -> bootstrap -> verify
-> analyze -> first delivery Change) with two side-by-side boxes ("Preserved," green; "Added or
reused," blue) matching the commissioned content exactly, plus five clarifying notes. Distinct from
the Product Workflow diagram (Change lifecycle, not adoption-specific) — not a duplicate.

`docs/images/*.png` for the six pre-existing diagrams were regenerated as an unavoidable
side-effect of running `generate_all.py` (their SVGs are unchanged and still pass the determinism
test) but re-encode to different PNG bytes each run (ImageMagick is not byte-deterministic); those
six PNGs were reverted with `git checkout --` after generation to keep this pass's diff limited to
the new diagram plus the documentation edits — confirmed no SVG content differs (`git diff` showed
no hunks for any pre-existing `.svg` file at any point in this pass).

### Full validation suite (re-run after all fifth-pass edits)

```
$ npm test
1..737
# tests 737
# pass 737
# fail 0

$ node cli/bin/aief.js verify
Result: PASS

$ node cli/bin/aief.js verify --change 0060-v3-1-release-readiness-and-documentation
Result: PASS

$ git diff --check
(no output — clean)

$ node --test cli/tests/diagrams.test.js
1..9
# pass 9
# fail 0

$ rg -n '```mermaid' -g '*' .
changes/0050-core3-documentation-architecture/design.md:330:```mermaid
```

The single hit is the same documented, unchanged historical exception from the fourth pass — no
Mermaid anywhere in README/docs.

```
$ git status --short
 M README.md
 M cli/tests/diagrams.test.js
 M docs/cli.md
 M docs/concepts.md
 M docs/examples.md
 M docs/getting-started.md
 M scripts/diagrams/generate_all.py
?? changes/0060-v3-1-release-readiness-and-documentation/  (this Change's own files)
?? docs/images/adoption-workflow.png
?? docs/images/adoption-workflow.svg
?? scripts/diagrams/generate_adoption_workflow.py
```

737/737 PASS — unchanged in count (documentation, one new diagram generator wired into the
existing diagram test list, no `cli/src/` behavior changed). `aief verify` PASS at both project and
Change scope. `git diff --check` clean. No unrelated files.

### Files touched this pass

`README.md`, `docs/getting-started.md`, `docs/concepts.md`, `docs/cli.md`, `docs/examples.md`,
`scripts/diagrams/generate_adoption_workflow.py` (new), `scripts/diagrams/generate_all.py`,
`docs/images/adoption-workflow.svg`/`.png` (new), `cli/tests/diagrams.test.js`, this Change's own
`change.md`/`spec.md`/`tasks.md`/`evidence.md`. No `cli/src/` file was touched; no CLI command,
flag, or manifest field changed; no test needed updating beyond the new diagram registration.

**Confirmation.** No push. No tag. No release. No version bump. No new Change created — Change
0060 reused and kept Closed.

## Sixth pass — new-project path parity and diagram determinism

### Code/test audit (subagent, foreground)

Re-confirmed, with `file:line` citations against `cli/src/cli.js`/`cli/tests/cli.test.js`, that the
fifth pass's documented behavior for `doctor`/`bootstrap`/`bootstrap <name>`/`verify`/`analyze`/
`new-change`/`enrich`/`prompt`/`status`/`close`/`--change` resolution had not drifted. Confirmed
`bootstrap <name>` generates only `README.md`, a minimal `AGENTS.md`, and empty `changes/`,
`knowledge/`, `src/`, `tests/` — no application code — and fails with exit 1 if `<name>/` already
exists. Confirmed there is no code-level Change "type" enum distinguishing Adoption/Analysis/
Delivery (naming convention only, per `docs/concepts.md`). Confirmed OpenSpec/SpecBoot are optional,
never hard dependencies.

### Baseline before edits

```
$ git branch --show-current
feat/v3.1
$ git status --short
(clean)
$ git remote -v
origin  git@github.com:avazquezmaza/aief-next.git (fetch/push)
$ rg -n '```mermaid' . --glob '*.md' --glob '!node_modules/**' --glob '!.git/**'
changes/0060-.../evidence.md (historical mentions only)
changes/0050-core3-documentation-architecture/design.md:330:```mermaid   (documented exception)
$ npm test
1..737 / pass 737 / fail 0
$ tail -8 changes/0060-.../change.md
Closed (2026-07-30)
```

### Scratch test — new project (outside the repository, in the session scratchpad)

```
$ cd $SCRATCHPAD && node <repo>/cli/bin/aief.js bootstrap sample-app
Created AIEF project: .../sample-app
$ find sample-app -mindepth 1
sample-app/AGENTS.md
sample-app/changes
sample-app/knowledge
sample-app/README.md
sample-app/src
sample-app/tests
$ cat sample-app/AGENTS.md
# Project Agent Instructions

AI assists. Humans decide.
$ cd sample-app && node <repo>/cli/bin/aief.js doctor    # 0 Changes, "No strong signals detected", Next: aief analyze
$ node <repo>/cli/bin/aief.js verify
✓ README.md / ✓ AGENTS.md / ✓ changes / ✓ knowledge/
Result: PASS
Next: no open Change — aief new-change <name> or aief analyze
```

Confirms: no application code or `package.json` generated; `doctor`'s generic "Next: aief analyze"
hint is a context-free suggestion, not a requirement (nothing gates on it); `verify` passes on a
freshly generated skeleton. `sample-app` deleted after the check — never part of the tracked repo.

### Scratch test — existing project (re-run of the fifth pass's checks, to catch regressions)

```
$ mkdir existing-svc && cd existing-svc && git init -q
$ create src/index.js, test/index.test.js, package.json, .github/workflows/ci.yml, README.md
$ git add -A && git commit -qm base
$ md5sum package.json src/index.js test/index.test.js .github/workflows/ci.yml   # recorded
$ node <repo>/cli/bin/aief.js doctor      # git status --short: (clean) -> doctor writes nothing
$ node <repo>/cli/bin/aief.js bootstrap
$ git status --short
?? .github/workflows/aief-verify.yml
?? AGENTS.md
?? changes/
?? knowledge/
?? profiles/
$ node <repo>/cli/bin/aief.js bootstrap    # second run
Bootstrap complete — this directory was already bootstrapped, nothing new to create.
$ md5sum (recheck all four original files)   # all four unchanged
$ git log --oneline    # unchanged (1 commit, "base")
```

Confirms: `doctor` never writes; `bootstrap` preserves `package.json`, application source, tests,
CI config, and Git history byte-for-byte; only the documented governance artifacts are created;
second `bootstrap` is idempotent. `existing-svc` deleted after the check.

### Gap 1 — new-project path was thin relative to existing-project path

`docs/getting-started.md`'s "Bootstrap a project" section gave the new-project case two lines
versus the existing-project case's full 14-question Q&A plus asset table. Added a "### Starting a
new project" subsection: skeleton contents (verified against the scratch test above), why `analyze`
doesn't apply to a project with no existing architecture (optional, not part of this path), and a
ten-step walkthrough from `bootstrap <name>` through the first Delivery Change's `close --yes`.
Expanded `docs/cli.md`'s `aief bootstrap <name>` row from "Nothing" / "`<name>/` project skeleton"
to the exact file/directory list and the exit-1-on-collision behavior (confirmed live: bootstrapping
an already-existing directory name fails immediately, nothing written).

Also added `docs/getting-started.md` "## Multiple open Changes" (explicit `--change` examples: id
formats accepted, implicit-selection-only-with-one-open-Change behavior, `status --next`'s
recommend-don't-execute exception) and "## Safe stopping points" (five concrete pause points) as
their own headings — previously these facts existed only as scattered answers inside the
existing-project Q&A, not as a New-project-applicable reference.

### Gap 2 — `docs/images/*.png` regeneration was not byte-deterministic

```
$ python3 scripts/diagrams/generate_all.py; cp docs/images/*.png /tmp/run1/
$ python3 scripts/diagrams/generate_all.py
$ git status --short docs/images
 M docs/images/adoption-workflow.png   (and all 7 other PNGs)
$ which rsvg-convert
(not found)
$ identify -verbose docs/images/workflow.png | grep date
date:create / date:modify / date:timestamp   (ImageMagick default metadata)
```

Root-caused to two independent issues in the ImageMagick PNG-rendering branch of
`scripts/diagrams/generate_all.py`'s `render_png()`:

1. ImageMagick embeds `date:create`/`date:modify`/`date:timestamp` metadata in every PNG by
   default — fixed by adding `-strip`.
2. Even with metadata stripped, a Pillow pixel-by-pixel comparison (`Image.open(...).getdata()`)
   confirmed the *decoded image content* was already identical run-to-run — the remaining byte
   difference was purely in zlib compression (filter/strategy selection is not pinned by default).
   Fixed by pinning `-define png:compression-filter=0 -define png:compression-level=9
   -define png:compression-strategy=0` alongside `-strip`.

```
$ python3 scripts/diagrams/generate_all.py; cp docs/images/workflow.png /tmp/a.png
$ python3 scripts/diagrams/generate_all.py; cmp /tmp/a.png docs/images/workflow.png   # clean
$ python3 scripts/diagrams/generate_all.py; cmp (repeat once more)                     # clean
```

Confirmed deterministic across three consecutive full regenerations, for all eight PNGs. No SVG
byte changed (SVGs are plain text with no embedded timestamps or compression, so they were never
affected). The fifth pass had hit this same non-determinism and worked around it by reverting the
incidental diffs rather than fixing the renderer invocation (see its `tasks.md` entry) — this pass
fixes it at the root so future regenerations in this environment are safe to commit directly.

### Contradiction search (re-run)

```
$ rg -n 'bootstrap|adopt|adoption|analyze|existing project|new project|greenfield|brownfield|never overwrite|no code edits|OpenSpec|SpecBoot|AGENTS.md|--change' README.md docs knowledge changes
```

Reviewed every relevant hit in README/docs. No claims found that `analyze` is mandatory, that
`bootstrap` writes application code, that `bootstrap` overwrites `AGENTS.md`, or that OpenSpec/
SpecBoot are required. Every `prompt`/`verify`/`close` example without `--change` is a context where
exactly one Change is open at that point in the tutorial (confirmed by re-reading each surrounding
section) — consistent with `prompt`/`close`'s actual implicit-selection rule. `docs/workflow.md` and
`docs/architecture.md` position `analyze` alongside `new-change`/`enrich` as one of several
Change-creation options at Level 1, not a gate — consistent with README/getting-started.

### Full validation suite (final, after all sixth-pass edits)

```
$ npm test
1..737 / pass 737 / fail 0

$ node cli/bin/aief.js verify
Result: PASS

$ node cli/bin/aief.js verify --change 0060-v3-1-release-readiness-and-documentation
Result: PASS

$ git diff --check
(clean)

$ rg -n '```mermaid' . --glob '*.md' --glob '!node_modules/**' --glob '!.git/**'
changes/0060-.../evidence.md and tasks.md (historical text only)
changes/0050-core3-documentation-architecture/design.md:330 (documented, unchanged exception)

$ python3 scripts/diagrams/generate_all.py   # fourth consecutive run
$ cmp <previous-run-copy> docs/images/workflow.png   # clean, deterministic
```

### Files touched this pass

`docs/getting-started.md`, `docs/cli.md`, `scripts/diagrams/generate_all.py`, all eight
`docs/images/*.png` (byte content only — regenerated with the deterministic renderer invocation; no
SVG changed, no new diagram), this Change's own `change.md`/`tasks.md`/`evidence.md`. No `cli/src/`
file was touched; no CLI command, flag, or manifest field changed.

**Confirmation.** No push. No tag. No release. No version bump. No new Change created — Change
0060 reused and kept Closed.
