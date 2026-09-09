# Working a Change with an assistant

Use this procedure with Codex, Claude Code, Gemini or Kiro. `AGENTS.md` is the policy source;
this document supplies the procedure, not a second set of project rules.

1. Select the Change named by the user. Otherwise run `aief status --next`; when multiple
   Changes could match, ask which one. Do not select by directory modification time.
   If no Change fits and the user has requested implementation with a clear scope, scaffold
   it using `aief new-change "<name>"`, then define its scope, spec and tasks before implementing.
   For an ambiguous request, clarify the missing requirements first. A read-only question does
   not require an implementation Change.
2. Read the selected `change.md`, `spec.md` and `tasks.md`. Follow the current task's scope and
   acceptance criteria. Analysis Changes produce findings and evidence; Definition Changes
   resolve prerequisites and proposed decisions, not application code or self-approved decisions.
3. Work the authorized scope in reviewable increments. Ordinary tasks may be checked when done;
   `(human)` and `(review)` tasks belong to their respective owners, as defined in `AGENTS.md`.
4. Run the relevant tests and `aief verify --change <id> --strict`. Here, the repository-local
   form is `node cli/bin/aief.js verify --change <id> --strict`; changes to the CLI also require
   `npm test`, `npm run lint` and `git diff --check`. Report unavailable checks as limitations,
   never as passes. Structural verification is not proof that application tests passed.
5. Amend `evidence.md` with what changed, actual checks and results, remaining work and lessons.
   Preserve existing validated evidence. For Analysis Changes maintain the Findings Status table.
6. Report completion and outstanding gates. Run `aief close --yes --change <id>` only when
   closure is authorized and readiness passes. Closing a Change does not authorize a push or release.

The CLI automatically switches branches when scaffolding on `main`/`dev`. It preserves other
branches and existing worktrees. Choose the intended checkout before starting another Change.

## Native entrypoints

| Assistant | Project discovery | AIEF procedure |
| --- | --- | --- |
| Codex | `AGENTS.md`; repo skills under `.agents/skills/` | `aief-change` skill and `CODEX.md` point here. `CODEX.md` is an AIEF convention, not a default Codex discovery filename. |
| Claude Code | `CLAUDE.md` imports `@AGENTS.md` | `CLAUDE.md` points here. |
| Gemini CLI | `GEMINI.md` imports `@AGENTS.md` | `GEMINI.md` points here. |
| Kiro | `AGENTS.md` and `.kiro/skills/` | `aief-change` skill points here. |

These entrypoints are supplied in this repository. Bootstrap supplies the canonical AGENTS policy,
not assistant-specific files or skills. In another project, add the appropriate entrypoint and
procedure together. Use `aief prompt <assistant> --change <id>` when generating a prompt explicitly.

Discovery varies between tools; a successful prompt-generation test does not prove an assistant
loaded native context or obeyed it. For behavioral validation, use the same synthetic scenario for
each tool, record versions and observable decisions, and inspect the fixture for unintended writes.
Keep model defaults and report service/authentication failures separately from behavioral failures.

Official references: [Codex instructions](https://learn.chatgpt.com/docs/agent-configuration/agents-md),
[Codex skills](https://learn.chatgpt.com/docs/build-skills),
[Claude imports](https://code.claude.com/docs/en/memory#agentsmd),
[Gemini imports](https://geminicli.com/docs/cli/gemini-md/#modularize-context-with-imports).
