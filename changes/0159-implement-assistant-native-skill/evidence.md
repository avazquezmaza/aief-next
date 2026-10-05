# Evidence

## Summary

ADR-039 implemented. AIEF ships one self-contained `aief-change` skill, installed by
`aief bootstrap` (configured assistant, or all three) and by the new `aief skill install`, and
never overwrites an edited copy. `AGENTS.md` went from 208 to 118 lines (policy only); the
procedure lives in the skill and in `aief prompt` for assistants without one. Version 4.1.0.

## Activities Performed

1. Confirmed assumption A1 from 0158 against current docs: Claude Code reads
   `.claude/skills/<name>/SKILL.md` ([docs](https://code.claude.com/docs/en/skills)), Codex
   `.agents/skills/<name>/SKILL.md` ([docs](https://developers.openai.com/codex/skills)), Kiro
   `.kiro/skills/<name>/SKILL.md` (verified against a real installation in Change 0112). All use
   YAML frontmatter with `name` and `description`.
2. `cli/templates/skills/aief-change/SKILL.md` (v2.0.0, 79 lines): select, understand, plan,
   build, verify, document, close — self-contained, no repository-only links.
   `previous-versions.json` holds the sha256 of every skill version this repository shipped (5).
3. `core/domain/assistant-skill.js` (read-only: targets, template, version, `inspectSkill`,
   `isShippedSkill`) and `core/services/skill-installer.js` (`installSkill`, `skillTargetsFor`).
4. `commands/skill.js` (`aief skill install [assistant]`), `bootstrap --assistant` and skill
   install in adoption and in `bootstrap <name>`, `doctor` skill report, `prompt` procedure block,
   help texts.
5. `assistant-resolver.js`: passive detection ignores an unmodified AIEF-installed skill.
   Without this, installing all three would make every project resolve to Kiro.
6. `AGENTS.md` (template and root): removed AIEF Workflow, Required Completion Checklist and
   Evidence Guidance; short pointer to the skill; branch paragraph shortened.
7. This repository: `.kiro/` and `.agents/skills/aief-change/SKILL.md` are template copies
   (`.claude/` is gitignored here, so its copy is local only). `docs/assistant-workflow.md`
   rewritten as a short map; `CLAUDE.md`/`CODEX.md`/`GEMINI.md` point to the skill or template.
8. Tests: new `assistant-skill.test.js` (18) with a fixture of the shipped v1.1.0 skill;
   `agents-canonical` now requires the moved procedure in the installed skill; the `--skill`
   prompt test's end marker moved to the new procedure block.
9. Docs (`cli.md`, `configuration.md`, `getting-started.md`, `README.md`), version 4.1.0,
   `releases/v4.1.0.md`, `changes/README.md`, Analysis 0154 F6 resolved.

## Verification

| Check | Result |
|---|---|
| `npm test` in `cli/` | 718 pass, 0 fail (was 699) |
| `npm run lint` | clean |
| Passive-detection test without the resolver change | fails (the test is meaningful) |
| Copy of `THINGS/neto` (old Kiro skill): `doctor` → `skill install` → `doctor` | flagged older → updated + 2 installed → all three v2.0.0; `verify` PASS |
| `aief --version` | `aief 4.1.0` |

## Findings

| ID | Finding | Status |
|---|---|---|
| F1 | Installing all three skills would have made passive detection pick Kiro in every project | Fixed in this Change (R6) |
| F2 | `bootstrap` never overwrites `AGENTS.md`, so existing projects keep the 208-line version until replaced by hand | Open: candidate follow-up — the same "unmodified shipped version" rule could refresh `AGENTS.md` |
| F3 | The first draft of `doctor`'s message pointed to `cli/templates/…`, a path that exists only in AIEF's repository | Fixed before review |
| F4 | CodeQL on PR #110 flagged incomplete regex escaping in a new test (`assistant-skill.test.js`, alert 7) | Fixed: plain substring check instead of a built RegExp |
| F5 | CodeQL then counted alert 1 (polynomial ReDoS in `slugify`, on `main` since 2026-09-10) against this PR because it touches `shared.js` | Fixed: after the first replace each end holds at most one dash, so `/^-/` and `/-$/` replace `/^-+\|-+$/` with identical output. Other pre-existing alerts (2, 3, 5, 6) are in files this PR does not touch |

## Risks

- An assistant may not pick the skill from its `description`; the procedure is still in reach via
  `aief prompt`. Behavioral validation per assistant is described in `docs/assistant-workflow.md`.

## Recommendations

- Tag `v4.1.0` after merge, only with the owner's confirmation.
- Decide F2 (refresh unmodified `AGENTS.md`) as a small follow-up.
- Remaining wave 2: guardrails as configuration, private mode.

## Artifacts Produced

- Code, tests, fixture, docs, `releases/v4.1.0.md`.

## Lessons Learned

- Installing files that other logic reads as signals (passive detection) changes that logic's
  answers; check every reader of a path before writing to it.

## Next Change

F2 follow-up or the next wave-2 item, at the owner's choice.
