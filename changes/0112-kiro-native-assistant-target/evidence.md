# Evidence

## What changed?

- `cli/src/core/domain/assistant-resolver.js`: registered `kiro: ".kiro/skills/aief-change/SKILL.md"`
  in `ASSISTANT_FILES` — the single source of truth every other surface (resolver, `prompt.js`,
  `doctor.js`, `misc.js`) reads from.
- `cli/src/commands/prompt.js`: removed the hardcoded `CLAUDE.md` fallback (previously: an
  assistant with no native file of its own silently included `CLAUDE.md` if it existed, at both
  the warning line and the actual prompt-composition line). Now every assistant with no native
  file present gets the generic, `AGENTS.md`-only prompt — matching what `docs/cli.md` already
  (incorrectly, before this fix) claimed was the behavior.
- `cli/src/commands/doctor.js`: the "Assistants (optional)" group now derives from
  `assistantIds()` instead of a second, separately maintained array.
- `cli/src/commands/misc.js`: help text's assistant list derives from `assistantIds()`.
- `.kiro/skills/aief-change/SKILL.md`: new file. Pure procedure (select a Change, read
  `change.md`/`spec.md`/`tasks.md`, work one increment, respect `(human)`/`(review)` gates, verify,
  update `evidence.md`) — no `AGENTS.md`, `spec.md`, or `tasks.md` content copied.
- `docs/cli.md`, `README.md`: added Kiro to the assistant tables.
- `cli/tests/assistant-resolver.test.js`, `cli/tests/cli-skills-and-maturity.test.js`: extended for
  `kiro` and the fallback fix.

## How was it verified?

- `npm test`: 1026/1026 pass (including the new/extended tests above).
- `node cli/bin/aief.js verify --change 0112-kiro-native-assistant-target --strict`: PASS.
- `git diff --check`: clean, no trailing-whitespace/conflict-marker issues.
- Manual check against this repository: `aief prompt kiro --change 0112-kiro-native-assistant-target`
  includes `.kiro/skills/aief-change/SKILL.md`, never mentions `CLAUDE.md`; `aief doctor` lists
  `kiro` under Assistants.
- Manual check against a fresh scratch project (`aief bootstrap` + `CLAUDE.md` present, no Kiro
  Skill): `aief prompt kiro` prints `Note: .kiro/skills/aief-change/SKILL.md not found in this
  project; using the generic, AGENTS.md-only prompt instead.` and the generated prompt contains no
  `CLAUDE.md` line — confirms the fallback fix for the case the original bug most affected.
- Design validated against a real Kiro installation before implementation (not simulated):
  - `~/PRS/THINGS/cotorro/.kiro/hooks/aief-status-on-session-start.json` — a real, already-deployed
    `SessionStart` command Hook running a read-only script (`aief status` + `changes/*/change.md`
    parsing) against another AIEF project — confirms the "hooks only later, for deterministic
    low-cost controls, never always-on context injection" boundary this Change stays inside of
    (no Hook added here).
  - `~/Pictures/Workspace-claro/.kiro/skills/camel-quarkus/SKILL.md` — a real Kiro Skill package
    (YAML frontmatter, `references/`, `scripts/`) already used as the source for Change 0110's
    frontmatter-parsing work — confirms `.kiro/skills/<id>/SKILL.md` is the real, current Kiro
    Skill shape this Change's own `.kiro/skills/aief-change/SKILL.md` follows.
  - Kiro's own "Agent Steering & Skills" panel, opened against this repository, lists every
    `AGENTS.md` found (root, `cli/templates/agents/AGENTS.md`, and the three fixture files under
    `changes/0096-run-usability-validation-study/fixtures/`) — never `CLAUDE.md`/`GEMINI.md`/
    `CODEX.md`/`CURSOR.md`. This is why the fallback fix in this Change targets a generic
    `AGENTS.md`-only prompt, not a Kiro-specific instruction file: Kiro has no such file to fall
    back to, and the observed panel confirms it never treats another assistant's file as steering
    on its own either.
  - A Kiro agent, asked directly, fetched `kiro.dev/docs/steering.md` and
    `kiro.dev/docs/kiroignore.md` and reported (documentation-sourced, not just observed): `AGENTS.md`
    is a special steering type, always included, with no `always`/`fileMatch`/`manual`/`auto` mode
    and no documented directory-scoping or nearest-wins precedence — every discovered `AGENTS.md` in
    the workspace merges. `.kiroignore` is documented for reading/search, not confirmed to affect
    steering loading. This is a real, documented risk for the three fixture `AGENTS.md` files under
    `changes/0096-*/fixtures/` — left unmitigated here (see Findings Status below) because renaming
    them would rewrite evidence of a closed Change (`changes/0096-*/spec.md` R3 and
    `evidence.md`'s "Docs opened" rows record the literal filename `AGENTS.md` as part of what
    usability-study participants actually saw).

## What remains pending?

- The nested-`AGENTS.md`-as-steering issue for `changes/0096-*/fixtures/` is real (confirmed
  against Kiro's own docs, and independently re-confirmed live below) and unmitigated — out of
  scope here, tracked below.
- Hypothesis C ("compact prompt" mode) and any Kiro Specs adapter remain explicitly out of scope
  (see `change.md`).

### Live Kiro validation (post-implementation, independent)

A real Kiro session, pointed at this branch (`feat/0112-kiro-native-assistant-target`, this
Change's own implementation), was asked to validate independently — read-only, no commits, no
`aief close` — and confirmed every point:

1. `.kiro/skills/aief-change/SKILL.md` appears in its own "Agent Steering & Skills" panel and was
   discovered/loadable as a real Skill in its session (not just a file on disk).
2. Read the Skill's own content and reported the 7-step procedure clear and directly followable
   for a real Change in this project — no missing step. One minor wording nit noted, not a defect:
   step 1 names `aief status --next` while the "when something doesn't fit" section separately
   mentions `aief new-change` — different scenarios, not a contradiction, but flagged as worth
   double-checking against this repo's actual command names (`aief new-change <name>` is correct,
   per `docs/cli.md`).
3. `aief prompt kiro --change 0112-kiro-native-assistant-target`: confirmed the Skill path appears
   under "Read these files first" and a `grep -i claude` over the full output found no mention of
   `CLAUDE.md`.
4. `aief doctor`: confirmed `kiro` listed under "Assistants (optional)" with a check.
5. `npm test`: confirmed 1026/1026 passing, independently run.
6. `aief verify --change 0112-kiro-native-assistant-target --strict`: confirmed PASS, exit 0.
7. Cross-checked `evidence.md`'s claims about Kiro's own behavior against what it actually
   observes in this installation — no discrepancies found: `AGENTS.md` auto-discovery/merge as
   steering confirmed; the panel lists exactly the 5 `AGENTS.md` files this evidence names (root,
   `cli/templates/agents/AGENTS.md`, and the 3 `changes/0096-*/fixtures/` files) — "ni más ni
   menos"; the `.kiro/skills/<id>/SKILL.md` frontmatter shape confirmed; `CLAUDE.md`'s presence in
   this repo's root confirmed; no `.kiro/hooks/` in this repo, consistent with Hooks being out of
   scope here.

This resolves the "no live-Kiro validation" finding below. The nested-`AGENTS.md`-as-steering
finding stays open, but is now confirmed by two independent Kiro sessions (the earlier docs-fetch
session and this validation session's own `find` over the repo), not only documentation.

## What was learned?

- The `CLAUDE.md` fallback in `prompt.js` was real, reproducible code — not a stale doc — and
  would have made Kiro (or any future fifth assistant) inherit Claude's instructions by accident.
  Fixing it generically (all assistants, not a Kiro-specific branch) was cheaper and more correct
  than special-casing Kiro.
- Kiro's structural "AGENTS.md as special steering" discovery is narrower and safer than an
  earlier session-log read suggested (a live Kiro session's `[Steering] ExistingFiles` log entry,
  read before this Change started, listed `CLAUDE.md`/`GEMINI.md`/etc. alongside `AGENTS.md` — that
  turned out to be files the agent had read during that particular conversation, not the
  structural steering-discovery list the actual "Agent Steering & Skills" panel shows). Worth
  flagging: a session log is not the same signal as the product's own discovery mechanism.

## Findings Status

| Finding | Status | Resolved by |
|---|---|---|
| `prompt.js` falls back to `CLAUDE.md` for any assistant with no native file present | Resolved | This Change |
| No native `kiro` target in `assistant-resolver.js` | Resolved | This Change |
| `doctor.js`/`misc.js` maintain separate hardcoded assistant lists | Resolved | This Change |
| Nested `AGENTS.md` under `changes/0096-*/fixtures/` load as Kiro steering unconditionally, confirmed against Kiro's own docs and independently re-confirmed live | Open | Not addressed here — mitigation (documental note in a Skill, or an unverified `.kiroignore` effect on steering) needs its own justification, not a rename of closed-Change evidence |
| No live-Kiro validation that `.kiro/skills/aief-change/SKILL.md` is actually discovered/followed | Resolved | This Change — live Kiro validation session, see above |
