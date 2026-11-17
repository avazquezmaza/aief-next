# Change

## ID

`0172-approval-and-evidence-audit-follow-ups`

## Type

Fix

## Objective

Resolve the audit findings Change 0171 left open as one-word references (F2, F3, F4), plus the gap
its own history exposed: an assistant without hooks (Continue + DeepSeek) committed a `(human)`
approval already checked, and nothing in AIEF noticed.

- **F2 — invented approvals pass the guard.** `cli/templates/guardrails/aief-approval-guard.mjs`
  only compares approvals that already existed unchecked. A new `- [x] (human) …` line, or a new
  `spec.md` whose `(human)` criterion is already checked, passes (reproduced: exit 0; checking an
  existing one exits 2). `aief close` then prints it under "Approvals relied on".
- **F2b — assistants without hooks have no guard at all.** The guard is a Claude Code / Gemini CLI
  hook. Continue runs no hook; Change 0171 reached the host with `(human) Owner reviews the diff
  before merge` checked by the assistant in both `tasks.md` and `spec.md`.
- **F3 — generic prose can make evidence "complete".** `classifyEvidence()` returns `complete`
  when substantive lines ≥ 2 × `Pending.` lines. With eight template sections still `Pending.`,
  16 lines of generic prose in one section flips `partial` to `complete`. The 2× margin is
  documented as intentional, so this needs a decision, not just a patch. Not the same finding as
  the historical F3 in `docs/history/dogfooding-findings.md` (fixed by Change 0036).
- **F4 — unrecoverable reference.** 0171 lists `F4.` with no content. The only F4 in the repo is a
  different audit's ("an architectural decision shipped with no ADR", `proposed`).

## Scope

### In scope

- F2: the guard also refuses an edit that introduces a `(human)`/`(review)` line already resolved
  (`[x]` or `[-]`), including a `Write` that creates `tasks.md` or `spec.md`.
- F2b: decide how AIEF covers assistants without hooks, and implement the chosen option.
- F3: decide the evidence-completeness rule, and implement it if it changes.
- F4: decide what 0171's `F4` refers to (or record it as unrecoverable).
- Make 0171's `F3`/`F4` references point to this Change, so they stop colliding with
  `docs/history/dogfooding-findings.md` numbering.

### Out of scope

- The historical F4 (mandatory `ADR:`/`OpenSpec:` declaration) — it has its own proposal.
- Assistant configuration outside this repository (e.g. a rule in a VM's Continue config).
- Any change to `(human)`/`(review)` semantics or to `aief close` readiness beyond the above.

## Depends on

- 0171-close-rewrites-status-declarations-instead-of-appending

## Success Criteria

- Adding a resolved `(human)`/`(review)` line through an edit tool is refused, with tests; adding
  an unchecked one still passes.
- F2b, F3 and F4 each have a recorded human decision, and whatever was decided is implemented and
  tested (or recorded as "no change").
- 0171's documents no longer cite `F3`/`F4` without content.
- `npm test`, lint, `git diff --check` and `aief verify --strict --change 0172` pass.
