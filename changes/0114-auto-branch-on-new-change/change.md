# Change

## ID

`0114-auto-branch-on-new-change`

## Type

General

## Objective

Enforce "one branch per Change" at the CLI level instead of relying on prose in each assistant's
instruction file. A Gemini session created a Change directly on `main` because the "branch before
touching files" convention only ever existed as a private memory / `CLAUDE.md` guidance — nothing
Gemini reads mentioned it, and the CLI itself did not enforce it either. Every assistant target
(Claude, Gemini, Codex, Kiro) converges on the same `aief` binary, so the fix belongs in
`createChange()`, not in another `*.md` file.

## Scope

### In scope

- `aief new-change` switches off a protected branch (`main`/`dev`) onto `<type>/<id>-<slug>`
  automatically, before any Change file is written.
- Same behavior for `aief analyze` and `aief propose`, which scaffold Changes through the same
  shared `createChange()` — no extra code needed for them.
- `--no-branch` escape hatch on `new-change`.
- No-op (not a crash) outside a git repository, and when already on a non-protected branch.
- Documentation: `AGENTS.md` (the one file every assistant defers to), `docs/maintainer.md`, and
  the Kiro skill (`.kiro/skills/aief-change/SKILL.md`), which is invoked per-task rather than read
  as ambient context the way `CLAUDE.md`/`GEMINI.md`/`CODEX.md` are.

### Out of scope

- `aief enrich`, which writes its Change files directly instead of through `createChange()` — does
  not get auto-branch in this Change. Follow-up.
- Never commits or pushes — only `git checkout -b`, which is trivially reversible and does not fall
  under AGENTS.md's destructive/irreversible-operation guardrail.
- No change to `CLAUDE.md`/`GEMINI.md`/`CODEX.md`/`CURSOR.md` — they already defer to `AGENTS.md`
  and should not duplicate it.

## Success Criteria

- Running `aief new-change`/`analyze`/`propose` from `main` or `dev` in a git repository creates
  and switches to `<type>/<id>-<slug>` before any Change file exists.
- Running from a non-protected branch, or outside a git repo, leaves the branch untouched.
- `--no-branch` opts out.
- Full suite and `aief verify` pass.
