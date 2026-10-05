# Evidence

## Summary

`aief update` replaces `AGENTS.md` and installed `aief-change` skills that are unmodified older AIEF
versions, never touches an edited file, and never creates a missing one. Decision recorded as
ADR-040. Version 4.2.0.

## Activities Performed

1. Collected 15 sha256 hashes from every `cli/templates/agents/AGENTS.md` and root `AGENTS.md`
   version in history (`templates/agents/previous-versions.json`). Read-only check: the
   `AGENTS.md` of four local projects (`GC_China`, `THINGS/neto`, `trk-herbie-bot`, `THINGS/pcia`)
   matches one of them.
2. Extracted `core/domain/shipped-file.js` (`sha256`, `readPreviousHashes`, `classifyShipped`);
   `assistant-skill.js` now uses it; new `core/domain/agents-file.js`.
3. `core/services/project-updater.js` and `commands/update.js`; wired in `cli.js`, help and
   `explain update`.
4. `aief doctor`: section renamed "AIEF-shipped files", `AGENTS.md` line added, older unmodified
   files point to `aief update`.
5. Tests: `aief-update.test.js` (7) with fixture `AGENTS-3.5.0.md` (the template shipped in 3.5.0);
   two expectations in `assistant-skill.test.js` follow the renamed `doctor` messages.
6. Docs (`cli.md`, `configuration.md`, `assistant-workflow.md`), ADR-040, version 4.2.0,
   `releases/v4.2.0.md`, `changes/README.md`; Change 0159's F2 marked resolved.

## Verification

| Check | Result |
|---|---|
| `npm test` in `cli/` | 725 pass, 0 fail (was 718) |
| `npm run lint` | clean |
| Copy of `THINGS/neto` in the scratchpad (project untouched) | `doctor` flagged old `AGENTS.md` and Kiro skill → `aief update` refreshed both (118-line `AGENTS.md`) and listed missing Claude/Codex skills → second run changed nothing |
| `aief --version` | `aief 4.2.0` |

## Findings

| ID | Finding | Status |
|---|---|---|
| F1 | After `update`, the new `AGENTS.md` delegates the procedure to the skill; a project with no skill for its assistant relies on `aief prompt` | Mitigated: `update` lists assistants without the skill |

## Risks

- A project whose assistant has no installed skill loses the procedure from `AGENTS.md` after
  `update` until it runs `aief skill install` or uses `aief prompt`. `update` says so.

## Recommendations

- Tag `v4.2.0` after merge, only with the owner's confirmation.
- When the owner decides to touch projects: `aief update` then `aief skill install <assistant>`,
  review `git diff`.

## Artifacts Produced

- Code, tests, fixture, docs, ADR-040, `releases/v4.2.0.md`.

## Lessons Learned

- A rule that already protects one shipped file (the skill) generalizes cheaply once its
  classifier is a shared module.

## Next Change

Small cleanups (CodeQL alerts, `Type` as a closed list) or guardrails as configuration.
