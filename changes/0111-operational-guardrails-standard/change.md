# Change

## ID

`0111-operational-guardrails-standard`

## Type

General

## Objective

Encode four operational guardrails the user already applies as working practice — no secrets in
tracked files, no `Co-Authored-By` trailer on AI-authored commits, confirmation before
outward-facing/hard-to-reverse actions, and preferring a PR over a direct push to main/dev — as
explicit AIEF policy, both for this repository (dogfood) and for the templates `aief bootstrap`/
`adopt` hands to new projects.

## Scope

### In scope

- `AGENTS.md` (and its identical template copy `cli/templates/agents/AGENTS.md`, kept in sync):
  a new section stating the four guardrails as assistant-facing rules, applicable to every AI tool
  AIEF supports.
- `cli/templates/standards/security-standards.md`: sharpen the existing "Secrets" subsection with
  concrete examples (API tokens, cloud keys, bot tokens, PINs) matching the guardrail wording.
- `docs/maintainer.md` "Git discipline" section: extend with the PR-over-direct-push preference and
  a repo-specific note on commit attribution.

### Out of scope

- Any automated enforcement (secret-scanning script, git hook, CI gate). AIEF's Hook and
  Verification Rule registries cannot declare `executeCommands`/`network`/`writeFiles` this Entrega
  (ADR-020/ADR-021, Model C deferred) — mechanical enforcement is a separate, larger Change if
  wanted later.
- Changing where the `Co-Authored-By` trailer is actually injected — that instruction is supplied
  by the host/session outside any file this repository controls; this Change only states the
  project's policy.
- Any change to `aief verify`, Hooks, or Verification Rules behavior.

## Success Criteria

- The four guardrails are readable, in plain language, in `AGENTS.md` and reflected in the
  identical template.
- `security-standards.md`'s secrets guidance is concrete enough to act on without guessing.
- `docs/maintainer.md`'s Git discipline section states the PR preference and the attribution note.
- Full suite passes; `aief verify` passes; `git diff --check` passes.

## Status

Closed (2026-09-02)
