# Tasks

## Implementation

- [x] Rewrite step 1 of `## Procedure` in `.kiro/skills/aief-change/SKILL.md` to name both outcomes
      of `aief status --next` and point the "nothing open" case at `## When something doesn't fit`.
- [x] Rewrite the "no open Change" bullet in `## When something doesn't fit`: drop the circular
      `aief status --next` re-suggestion, keep `aief new-change <name>`, make the human decision
      explicit.

## Documentation

- [x] No other document needs updating — confirmed by grepping for `status --next` outside
      `changes/`: no other file presents the procedure that carried the ambiguity (see evidence.md).

## Verification

- [x] Re-read the edited Skill top-to-bottom against spec.md's Acceptance Criteria.
- [x] `git diff` review: changes confined to step 1 and the one bullet; frontmatter and steps 2–7
      untouched.
- [x] `npm test` — 1026/1026 pass.
- [x] `git diff --check` — clean.
- [x] `node cli/bin/aief.js verify --change 0113-skill-no-open-change-path` (default) — PASS.
- [-] Blocked: `node cli/bin/aief.js verify --change 0113-skill-no-open-change-path --strict` — run,
  and it FAILS with exactly one problem: the unchecked `(human)` approval task below. `--strict`
  reports every open `(human)` line as an unresolved required human decision, so it cannot pass
  until that gate is checked by a human. Not worked around; see evidence.md → Verification.

## Review and Approval

- [x] (human) Approve the final wording of step 1 and the "no open Change" bullet — this Change is a
      redaction decision about instructions the assistant itself follows, so the wording is not the
      implementer's to sign off on.
- [x] (review) Independent review of the diff by someone other than the implementer: confirm the
      clarification is faithful to actual CLI behavior and that no other Skill content drifted.

## Evidence

- [x] Update evidence.md
