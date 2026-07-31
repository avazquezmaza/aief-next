# Claude Instructions

Follow all rules in `AGENTS.md`. This repository is itself an AIEF project (its own dogfood) —
before contributing to the CLI, also read [docs/maintainer.md](docs/maintainer.md) for the
registry-extension pattern, the Change workflow, and testing commands.

Claude-specific guidance:

- Summarize assumptions before implementing.
- For architecture or design questions, explain trade-offs clearly.
- Keep implementation changes small and easy to review.
- When updating documentation, prefer concise Markdown.
- Do not duplicate `AGENTS.md`; treat it as the source of truth.
- Reuse existing domain services and registries (see `docs/maintainer.md` "Extending a registry")
  instead of creating a parallel implementation of something that already exists.
- Before committing: run the full suite (`npm test`), `node cli/bin/aief.js verify`, and
  `git diff --check` — all three must pass. See `docs/maintainer.md` "Testing".
- Never run `git push`, delete files/branches, or perform another destructive or irreversible Git
  operation without the user's explicit confirmation for that specific action.
