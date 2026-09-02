# Specification

## Goal

Anyone reading `AGENTS.md` (in this repo or a project that adopted AIEF) finds the four guardrails
stated as plain rules, not implied by convention; the secrets guidance is concrete; and this repo's
own Git discipline section names the PR-over-push preference and the attribution policy.

## Requirements

- `AGENTS.md` gains a new section (after "Human Responsibilities", the natural home for
  process/behavior rules) listing:
  1. Never commit secrets — API tokens, cloud keys, bot tokens, PINs — to tracked files; they come
     from the environment or a gitignored local file. Points to `security-standards.md` for detail
     rather than duplicating it.
  2. AI-authored commits do not carry a `Co-Authored-By` trailer.
  3. Confirm outward-facing or hard-to-reverse actions (deploys, production changes, pushes,
     writes to external systems such as Confluence) before doing them — this is the existing Prime
     Directive applied concretely, not a new principle.
  4. When a change is finished, prefer opening a PR over pushing directly to `main`/`dev`, unless
     told otherwise.
- `cli/templates/agents/AGENTS.md` is byte-identical to `AGENTS.md` after the edit (same invariant
  the two files hold today — verified by `diff`).
- `security-standards.md`'s "Secrets" subsection names concrete secret categories (API tokens,
  cloud/provider keys, bot tokens, PINs) alongside the existing env/gitignored-file guidance,
  without changing its structure or removing existing content.
- `docs/maintainer.md`'s "Git discipline" section gains: a line preferring PR over direct push to
  main/dev unless told otherwise, and a line noting this repository's commits do not carry a
  `Co-Authored-By` trailer.
- No behavior change to any command, Hook, Verification Rule, or Skill — documentation only.

## Acceptance Criteria

- [x] `AGENTS.md` and `cli/templates/agents/AGENTS.md` contain the new guardrails section and are
      identical (`diff` exits 0).
- [x] `security-standards.md`'s Secrets subsection lists the concrete examples.
- [x] `docs/maintainer.md`'s Git discipline section states the PR preference and the attribution
      note.
- [x] Full suite passes (`npm test`); `node cli/bin/aief.js verify` passes; `git diff --check`
      passes.
