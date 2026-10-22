# Evidence

## Summary

Gemini CLI now gets the `aief-change` skill at `.agents/skills/aief-change/SKILL.md`, the file Codex
already uses. Installing, refreshing and reporting act once per physical path. `aief prompt gemini`
points to the installed skill. The parity tests cover all five assistants in `ASSISTANT_FILES`.

## Activities Performed

1. **Verified discovery before implementing (R1).** In a temporary git project, `aief skill install
   codex` wrote `.agents/skills/aief-change/SKILL.md`; then (project path shortened):

   ```text
   $ gemini --version
   0.64.0
   $ gemini skills list   # untrusted
   Skipping project agents due to untrusted folder. To enable, ensure that the project root is trusted.
   Project hooks disabled because the folder is not trusted.
   Discovered Agent Skills:

   graphify [Enabled]
     ...
     Location:    /home/avazquez/.gemini/skills/graphify/SKILL.md

   $ GEMINI_CLI_TRUST_WORKSPACE=true gemini skills list
   Discovered Agent Skills:

   aief-change [Enabled]
     Description: Work an AIEF Change in this project — select one, read its change.md/spec.md/tasks.md, ...
     Location:    <tmp-project>/.agents/skills/aief-change/SKILL.md

   graphify [Enabled]
     ...
   ```

   Gemini discovers the skill only in a trusted folder. `GEMINI_CLI_TRUST_WORKSPACE` trusted the
   folder for that one run only; `~/.gemini/trustedFolders.json` was not changed.

2. **Domain (R1, R2).** `SKILL_TARGETS.gemini` added in `assistant-skill.js`. New
   `distinctSkillAssistantIds()` returns one assistant per distinct path (`claude`, `kiro`, `codex`).
   `skillTargetsFor(null)`, `project-updater.js` and `doctor` use it; `skillTargetsFor("gemini")` is
   now `["gemini"]`. `aief update`'s "not installed for" list still names assistants, so it lists
   `codex, gemini` together when `.agents/` is missing.
3. **Prompt (R3).** No logic change was needed in `prompt.js`: the existing ADR-039 D5 rule
   (`SKILL_TARGETS[assistant]` present → pointer) now reaches Gemini. Only its comment changed.
4. **Docs (R4).** `GEMINI.md`, `skill-installer.js`/`prompt.js` comments,
   `docs/assistant-workflow.md` (table row + "all of them"), `docs/cli.md` (`skill install` row),
   `README.md` (compatibility row).
5. **Tests (R5).** `assistant-parity.test.js` iterates `ASSISTANT_FILES` (5 assistants, with a guard
   test for the list), adds a per-assistant test of the procedure each one gets, and normalizes the
   procedure block in the identical-body test. `assistant-skill.test.js`: Gemini target, shared path
   written once, `bootstrap --assistant gemini|cursor`, doctor and `update` report the shared path once,
   the prompt test now uses Cursor for the inline procedure.

## Verification

- `node --test tests/assistant-skill.test.js tests/assistant-parity.test.js tests/aief-update.test.js`
  → 50 pass, 0 fail.
- `npm test` (cli/) → `tests 758, pass 758, fail 0`.
- `npm run lint` → no errors.
- `git diff --check` → clean.
- `aief verify --change 0163` → `Result: PASS`.
- `aief verify --change 0163 --strict` → `Result: FAIL`, only for the open approval (expected until
  the owner checks it):

  ```text
  ✗ ... [strict] unresolved required human decision: Owner reviews the diff and the Gemini discovery evidence before merge.
  ✗ ... [strict] unchecked (human) approval in spec.md Acceptance Criteria: Owner reviews the diff and the Gemini discovery evidence before merge.
  ```

  After the owner checked the `(human)` item (PR #114, merged as `1c2f1a5`), on `main`:
  `aief verify --change 0163 --strict` → `Result: PASS`; `npm test` 758 pass; lint and
  `git diff --check` clean; PR #114 CI (lint, test 22/24, CodeQL, dependency-review) green.
- Real CLI in a temporary project:

  ```text
  $ aief skill install gemini
  ✓ Installed .agents/skills/aief-change/SKILL.md
  $ aief skill install codex
  ✓ .agents/skills/aief-change/SKILL.md is up to date
  $ aief skill install
  ✓ Installed .claude/skills/aief-change/SKILL.md
  ✓ Installed .kiro/skills/aief-change/SKILL.md
  ✓ .agents/skills/aief-change/SKILL.md is up to date
  $ aief doctor
  AIEF-shipped files:
  ✓ .claude/skills/aief-change/SKILL.md (v2.0.0)
  ✓ .kiro/skills/aief-change/SKILL.md (v2.0.0)
  ✓ .agents/skills/aief-change/SKILL.md (v2.0.0)
  $ aief skill install cursor
  ○ cursor has no skill mechanism — aief prompt carries the Change procedure instead
  ```

- This repository: `aief prompt gemini --change 0163` now prints `Follow the aief-change skill
  (.agents/skills/aief-change/SKILL.md) for the Change procedure.`; the prompt went from 6,359 to
  3,320 bytes.

## Findings

- ADR-039/Change 0158's premise "Gemini has no skill mechanism" no longer holds for Gemini CLI 0.64.0.
- Skills (and hooks) in Gemini CLI are skipped in untrusted folders, so the skill is a convenience
  there, not a guarantee; `aief prompt gemini` still points to the file path, which Gemini can read.
- `aief new-change --type feature` writes `Type: General` in `change.md` (only the branch prefix uses
  the type). Corrected by hand for this Change; not fixed here (out of scope).

## Risks

- A Gemini user in an untrusted folder gets neither discovery nor the inline procedure from
  `aief prompt` once the skill is installed — only the pointer to the file.
- Behavioral obedience of the skill by Gemini was not probed (only discovery); see Change 0121's
  probe for the method.

## Recommendations

- Follow-up fix Change: `new-change --type` should write the Type into `change.md`.
- Change 0164 (guardrail parity) should reuse this finding: Gemini's hooks need a trusted folder too.
- ADR-039's text still lists three targets; record the Gemini mapping there when the owner decides.

## Artifacts Produced

- `cli/src/core/domain/assistant-skill.js`, `cli/src/core/services/skill-installer.js`,
  `cli/src/core/services/project-updater.js`, `cli/src/commands/doctor.js`, `cli/src/commands/prompt.js`
- `cli/tests/assistant-parity.test.js`, `cli/tests/assistant-skill.test.js`
- `GEMINI.md`, `docs/assistant-workflow.md`, `docs/cli.md`, `README.md`

## Lessons Learned

Assistant capabilities move faster than ADR text: verify a "has no X" claim against the installed
version before building around it.

## Next Change

0164 — define guardrail parity across assistants. The `(human)` review was given on PR #114.
