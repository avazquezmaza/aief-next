# Change

## ID

`0170-aief-4-3-0-release`

## Type

General

## Objective

Prepare AIEF 4.3.0 in one Change, at the owner's request: confirm Changes 0161–0169 are integrated
on `main`, bump the version, write `releases/v4.3.0.md`, and update the release index. Precedent:
Change 0153. AIEF 4.2.0 (Change 0160) was prepared but never tagged; the owner approved tagging it
at `00f36d3` on 2026-10-22 before this Change, so 4.3.0 starts from `v4.2.0`.

## Inventory of what already exists

Nine Changes since `v4.2.0` (`00f36d3`), each closed with its own evidence:

- **Guardrails:** `aief guardrails install` — Claude Code credential deny rules and the optional
  approval-guard hook (0162, ADR-041); the same hook for Gemini CLI via `--assistant gemini`
  (0165 ADR-042, 0166), blocking with Gemini's JSON deny (0167).
- **Assistants:** Gemini CLI gets the `aief-change` skill in `.agents/skills/` (0163); parity tests
  cover all five assistants.
- **Change creation:** `new-change --type` writes the requested type and rejects unknown ones
  (0164); IDs skip numbers used in other worktrees and by AIEF branches (0169).
- **Fixes and docs:** `## Type` is a closed list and open CodeQL alerts resolved (0161); stale
  `CLAUDE.md` fallback sentence removed (0168).

MINOR, not PATCH: new command and flags (0162, 0166), and `new-change --type <unknown>` now fails
where it used to succeed (0164).

## Scope

### In scope

- Integration check: 0161–0169 closed and reachable from `main`.
- `npm version 4.3.0 --no-git-tag-version` at the root and in `cli/`.
- `aief release 4.3.0`; write `releases/v4.3.0.md` (upgrade notes, summary, verification).
- `changes/README.md`: 4.3.0 section, new Unreleased section.
- Pre-tag grep for the previous version; regenerate diagrams and confirm no drift.

### Out of scope

- Creating the `v4.3.0` tag and GitHub release (done after merge, with the owner's confirmation).
- npm publication (AIEF is not published to npm).
- Any functional change.

## Success Criteria

- `node cli/bin/aief.js --version` prints `aief 4.3.0`.
- `npm test`, `npm run lint`, `aief verify`, `git diff --check` pass.
- The owner approves release readiness.
