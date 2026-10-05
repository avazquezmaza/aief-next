# Working a Change with an assistant

The procedure for working a Change — select, read, plan, build, verify, document, close — is the
`aief-change` skill. Its single source is
[`cli/templates/skills/aief-change/SKILL.md`](../cli/templates/skills/aief-change/SKILL.md)
(ADR-039). `AGENTS.md` is the policy; the skill is the procedure.

## How each assistant gets it

| Assistant | Policy | Procedure |
| --- | --- | --- |
| Claude Code | `AGENTS.md` | `.claude/skills/aief-change/SKILL.md` |
| Kiro | `AGENTS.md` | `.kiro/skills/aief-change/SKILL.md` |
| Codex | `AGENTS.md` | `.agents/skills/aief-change/SKILL.md` |
| Gemini CLI, Cursor, others | `AGENTS.md` | Included in `aief prompt`'s output |

`aief bootstrap` installs the skill for the configured assistant (`--assistant <id>` or
`knowledge/assistant.json`), or for all three when none is configured. `aief skill install
[assistant]` installs or refreshes it later. An installed copy someone edited is never overwritten;
`aief doctor` reports it when it falls behind AIEF's version. After upgrading AIEF, `aief update`
refreshes `AGENTS.md` and installed skills that nobody edited.

## Validating an assistant

Discovery varies between tools; a successful prompt-generation test does not prove an assistant
loaded native context or obeyed it. For behavioral validation, use the same synthetic scenario for
each tool, record versions and observable decisions, and inspect the fixture for unintended writes.
Keep model defaults and report service/authentication failures separately from behavioral failures.

Official references: [Claude Code skills](https://code.claude.com/docs/en/skills),
[Codex skills](https://developers.openai.com/codex/skills),
[Claude imports](https://code.claude.com/docs/en/memory#agentsmd),
[Gemini imports](https://geminicli.com/docs/cli/gemini-md/#modularize-context-with-imports).
