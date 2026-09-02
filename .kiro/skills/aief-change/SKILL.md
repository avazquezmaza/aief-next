---
name: aief-change
description: Work an AIEF Change in this repository — selecting one, implementing an increment, verifying it, and recording evidence. Use whenever asked to work on, implement, continue, verify, or close an AIEF Change; when a Change id (e.g. "0112", "changes/0112-...") is mentioned; or when `aief`, `change.md`, `spec.md`, `tasks.md`, or `evidence.md` come up in a request about this project. Not for questions about AIEF's own product design — only for doing the work a Change describes.
license: Apache-2.0
metadata:
  version: 1.0.0
---

# Working an AIEF Change

This project is governed by AIEF. `AGENTS.md` (already loaded as steering) is the one universal
policy file — read it if you haven't. This Skill only adds the procedure for working a Change; it
does not restate `AGENTS.md`, and it never copies a Change's own content — always read the actual
files.

## Procedure

1. **Select the Change.** Run `aief status --next` (or `aief status` to see every open Change) to
   find which one to work on. Never guess or pick the most recently modified directory — with
   multiple open Changes, ask which one if it isn't already clear from the request. This step has
   two valid outcomes, and only the first one continues down this procedure:
   - **A Change is selected** → go to step 2.
   - **No open Change** (`aief status --next` says so) → stop here; there is nothing to implement
     yet. Go to "When something doesn't fit" below — don't start working without a Change.

2. **Read, don't assume.** Before touching anything, read exactly these three files in the
   selected `changes/<id>-<slug>/`:
   - `change.md` — intent and scope (what's in scope, what's explicitly out).
   - `spec.md` — requirements and acceptance criteria. Do not implement anything `spec.md` doesn't
     ask for.
   - `tasks.md` — the actual checklist. Work the next open, ordinary task — not everything at
     once.

3. **Respect the gates.** Two checkbox labels in `tasks.md` are never yours to check:
   - `(human)` — only a human checks this.
   - `(review)` — only an independent reviewer (not the implementer) checks this.
   Leave them unchecked and say so; do not work around them.

4. **Work one increment.** Implement only what the current task requires. Keep the diff small and
   reviewable — this repository's own `AGENTS.md` and `docs/maintainer.md` set that expectation
   for every contributor, human or AI.

5. **Validate before calling it done.** Check the change against `spec.md`'s acceptance criteria.
   Run `node cli/bin/aief.js verify --change <id> --strict` (or `npm test` if the task touched
   code) and read the actual output — don't report success without having run it.

6. **Record evidence, don't paste logs.** Update `changes/<id>-<slug>/evidence.md`: what changed,
   how it was verified (a summary and the pass/fail result — not a full raw log), what remains
   pending, what was learned. If `evidence.md` already has real content, amend it — don't overwrite
   validated evidence.

7. **Stop at the boundary.** Never mark a `(human)`/`(review)` task done, never edit files outside
   the Change's stated scope, and never treat your own output as approved — that's a human
   decision, every time.

## When something doesn't fit

- No open Change matches the request (including step 1 finding none at all) → say so and propose
  `aief new-change <name>`, don't invent scope. Opening the Change is the human's call, not
  something to do unilaterally.
- The task is ambiguous → ask, per `AGENTS.md` rule 5 ("Ask when requirements are ambiguous").
- The Change is an Analysis or Definition Change (check `change.md`'s `## Type`) → different rules
  apply (no application code, no self-approved decisions) — read `AGENTS.md`'s workflow section
  and the Change's own `change.md` before assuming the ordinary-implementation flow above applies.
