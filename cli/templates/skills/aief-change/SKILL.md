---
name: aief-change
description: Work an AIEF Change in this project — select one, read its change.md/spec.md/tasks.md, implement within scope, verify, record evidence.md, and close when approved. Use whenever asked to work on, implement, continue, verify or close a Change; when a Change id (e.g. "0012", "changes/0012-...") is mentioned; or when aief, change.md, spec.md, tasks.md or evidence.md come up in a request about this project's work. Not for general questions about how AIEF itself is built.
metadata:
  version: 2.0.0
  source: AIEF (installed by aief bootstrap / aief skill install — edit freely; AIEF never overwrites a modified copy)
---

# Working an AIEF Change

`AGENTS.md` is the project policy and always wins. This skill is the procedure for doing the work a
Change describes. Read the Change's own files every time; never rely on memory of them.

## 1. Select the Change

- Use the Change the user names. Otherwise run `aief status --next`; with several open Changes and
  no clear match, ask which one. Never pick by directory modification time.
- No Change fits and the user asked for implementation with a clear scope: scaffold one with
  `aief new-change "<name>"` (add `--depends-on <id>` if it needs another Change first), then write
  its scope, spec and tasks before implementing.
- An ambiguous request: ask for the missing requirements first. A read-only question needs no
  Change.

`aief new-change` switches off `main`/`dev` onto `<type>/<id>-<slug>` before writing anything; on
any other branch or worktree it stays put. Choose the intended checkout first.

## 2. Understand

Read in `changes/<id>-<slug>/`:

- `change.md` — objective, in scope, out of scope, success criteria, `## Depends on`.
- `spec.md` — requirements and acceptance criteria. Implement nothing it does not ask for.
- `tasks.md` — the checklist, and which items are approvals.

Then the project documentation they point to.

## 3. Plan

Before changing files, state: what will change, what will not, risks or assumptions, and how you
will verify it.

## 4. Build

- Implement only what the Change requires, in small, reviewable increments. No unrelated refactoring.
- **Analysis** Changes produce findings and evidence, not code changes.
- **Definition** Changes resolve open questions and propose decisions. Never write application
  code, and never fill `Decision (human)` yourself.
- Check ordinary tasks as you finish them.
- Never check a `(human)` or `(review)` item, in `tasks.md` or in `spec.md`'s Acceptance Criteria.
  They belong to a person (`(human)`) or a reviewer other than you (`(review)`). `[-]` does not
  resolve them.

## 5. Verify

- Run the project's tests for what you changed, and `aief verify --change <id> --strict`.
- Report a check you could not run as a limitation, never as a pass. `aief verify` checks the
  Change's structure; it is not proof that the application's tests passed.

## 6. Document

Amend `evidence.md`, keeping what was already validated:

1. What changed?
2. How was it verified (real commands and results)?
3. What remains pending?
4. What was learned?

An Analysis Change keeps a `## Findings Status` table up to date. Update the README or docs if
behavior changed.

Before calling the work complete, confirm: goal understood, requirements implemented, tasks done or
remaining work documented, verification performed, evidence updated, docs updated if needed, no
unrelated changes.

## 7. Close

Report what is done and which approvals are still open. Run `aief close --yes --change <id>` only
when the user authorized closing and readiness passes; `close` warns if a `## Depends on` Change is
still open. Closing is not authorization to commit, push or release.
