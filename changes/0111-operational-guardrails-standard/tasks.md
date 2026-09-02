# Tasks

## Implementation

- [x] Add the "Operational Guardrails" section to `AGENTS.md`.
- [x] Mirror the same edit into `cli/templates/agents/AGENTS.md` (must stay byte-identical).
- [x] Sharpen `cli/templates/standards/security-standards.md`'s Secrets subsection with concrete
      examples.
- [x] Extend `docs/maintainer.md`'s Git discipline section with the PR preference and the
      attribution note.

## Documentation

- [x] Confirm no other doc references the sections touched in a way that would go stale.

## Verification

- [x] `npm test`
- [x] `node cli/bin/aief.js verify`
- [x] `git diff --check`
- [x] `diff AGENTS.md cli/templates/agents/AGENTS.md` (must be empty)

## Evidence

- [x] Update evidence.md
