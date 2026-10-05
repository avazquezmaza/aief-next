# AGENTS.md

This file defines how AI assistants collaborate inside an AIEF project.

These rules apply to every assistant: Claude, Gemini, Codex, Cursor, Copilot, ChatGPT, or any other AI tool.

If present, also read the assistant-specific file for the tool you are using: `CLAUDE.md`, `GEMINI.md`, `CODEX.md`, or `CURSOR.md`. Those files add assistant-specific guidance and never contradict this one.

---

## Prime Directive

**AI assists. Humans decide.**

Never treat AI output as automatically approved. The human owner is responsible for final decisions, review, and release.

---

## General Rules

1. Read the relevant Change before making edits.
2. Read `spec.md` before implementation. Do not implement without a specification.
3. Read `tasks.md` before changing files.
4. Do not invent requirements.
5. Ask when requirements are ambiguous.
6. Keep changes small, focused and reviewable.
7. Do not modify unrelated files.
8. Update documentation when behavior changes.
9. Generate evidence before considering work complete.
10. Prefer simple solutions over clever ones.
11. Once a Change's acceptance criteria are satisfied, stop. Do not opportunistically extend
    scope into adjacent code or additional artifacts, even when the extra work seems clearly
    beneficial — propose it as a follow-up Change instead.

---

## Working with Changes

Every meaningful implementation belongs to one Change. The step-by-step procedure (select, read,
plan, build, verify, document, close) is the `aief-change` skill that `aief bootstrap` installs for
Claude Code, Kiro and Codex; other assistants get it in `aief prompt`'s output.

`aief new-change` (and `analyze`/`propose`/`enrich`) switches off `main`/`dev` onto
`<type>/<id>-<slug>` before writing any file, keeps any other branch or worktree, and skips the
switch with `--no-branch`. Do not reimplement this switch per assistant.

A Change contains `change.md`, `spec.md`, `tasks.md` and `evidence.md`, and may add files such as
`design.md` or `notes.md`.

### Tasks and approvals

Ordinary `- [ ]` tasks in `tasks.md` may be checked by whoever does the work. Two labels mark checkboxes an assistant must **not** check on its own:

```markdown
- [ ] (human) Human-only approval — only a human may check this
- [ ] (review) Independent review — by someone other than the implementer
```

Both stay blocking for `aief close` while unchecked, in `tasks.md` or as an Acceptance Criterion in `spec.md`, and `[-]` does not resolve them: an approval is either checked by its owner or has its label removed with a reason. Full conventions (deferred work, increments, checkpoints): [governance conventions](https://github.com/avazquezmaza/aief-next/blob/main/docs/history/governance-conventions.md).

A Change that depends on another lists it under `## Depends on` in `change.md`, one id per bullet
(`aief new-change <name> --depends-on <id>` writes it). `aief close` warns while a dependency is
still open, and `aief status --next` recommends Changes whose dependencies are closed.

---

## Coding Guidance

- Follow existing project conventions.
- Keep naming clear and consistent.
- Prefer readable code over clever abstractions.
- Add comments only when they clarify intent.
- Do not introduce dependencies unless necessary.
- Do not rewrite large areas without explicit scope.

---

## Documentation Guidance

Documentation should be:

- short,
- practical,
- easy to scan,
- example-driven.

Avoid long theoretical explanations in starter documents.

---

## Human Responsibilities

Humans must approve:

- scope,
- trade-offs,
- architecture decisions,
- release readiness.

AI may propose, draft, implement, review, and summarize, but it does not approve final outcomes.

---

## Operational Guardrails

These apply to every assistant, on every project, regardless of what the current Change is about:

- **No secrets in tracked files.** API tokens, cloud keys, bot tokens, PINs, and any other
  credential never go into a file Git tracks — not in code, not in prompts, not in evidence files.
  They come from the environment or a gitignored local file. See `security-standards.md`'s Secrets
  section for the detail.
- **No `Co-Authored-By` trailer on AI-authored commits**, unless the project explicitly asks for
  one.
- **Confirm before outward-facing or hard-to-reverse actions** — deploys, production changes,
  pushes, writes to external systems (e.g. Confluence) — unless already durably authorized for that
  specific action. This is the Prime Directive applied concretely, not a separate rule.
- **Prefer opening a PR over pushing directly to `main`/`dev`** when a change is finished, unless
  told otherwise.
