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

---

## AIEF Workflow

```text
Understand -> Plan -> Build -> Verify -> Document
```

### Understand

Read:

- `change.md`
- `spec.md`
- `tasks.md`
- relevant project documentation

### Plan

Before changing files, identify:

- what will change,
- what will not change,
- risks or assumptions,
- validation approach.

### Build

Implement only what the Change requires.

Avoid unrelated refactoring.

### Verify

Check the acceptance criteria.

Run relevant tests when available.

### Document

Update:

- `evidence.md`
- README or docs if behavior changed
- known issues if something remains pending

---

## Working with Changes

Every meaningful implementation belongs to one Change.

`aief new-change` (and `analyze`/`propose`, which scaffold Changes the same way) switches off
`main`/`dev` onto a dedicated branch (`<type>/<id>-<slug>`) automatically before writing any Change
file — one branch per Change is enforced by the CLI itself, not by an assistant remembering a rule
written in prose. Don't re-implement this per assistant; `--no-branch` opts out when a Change
genuinely belongs on the current branch.

A Change should contain:

```text
change.md
spec.md
tasks.md
evidence.md
```

Optional files may include:

```text
design.md
adr.md
notes.md
```

### Tasks and gates

Ordinary `- [ ]` tasks in `tasks.md` may be checked by whoever does the work. Two labels mark checkboxes an assistant must **not** check on its own:

```markdown
- [ ] (human) Human-only approval — only a human may check this
- [ ] (review) Independent review — by someone other than the implementer
```

Both stay blocking for `aief close` while unchecked. Full conventions (deferred work, increments, checkpoints, OpenSpec↔AIEF): [governance conventions](https://github.com/avazquezmaza/aief-next/blob/main/docs/history/governance-conventions.md).

---

## Required Completion Checklist

Before marking a Change complete, confirm:

- [ ] Goal is understood.
- [ ] Requirements are implemented.
- [ ] Tasks are complete or remaining work is documented.
- [ ] Tests or manual verification were performed.
- [ ] Evidence was updated.
- [ ] Documentation was updated if needed.
- [ ] No unrelated changes were introduced.

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

## Evidence Guidance

`evidence.md` should answer:

1. What changed?
2. How was it verified?
3. What remains pending?
4. What was learned?

An Analysis Change's `evidence.md` keeps a living `## Findings Status` table so later Changes that
resolve a finding record it there instead of leaving the list to go stale — see [governance
conventions §9](https://github.com/avazquezmaza/aief-next/blob/main/docs/history/governance-conventions.md#9-findings-status--tracking-resolution-across-changes).

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
