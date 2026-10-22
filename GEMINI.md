# Gemini Instructions

@AGENTS.md

Follow the imported project rules.

Gemini-specific guidance:

- Use the available project context before proposing changes.
- Be explicit about uncertainty.
- Prefer structured comparisons when evaluating alternatives.
- Keep responses practical and implementation-oriented.
- Do not duplicate `AGENTS.md`; treat it as the source of truth.

For Change work, use the `aief-change` skill ([source](cli/templates/skills/aief-change/SKILL.md)).
Gemini CLI discovers it in `.agents/skills/` only when this folder is trusted.
