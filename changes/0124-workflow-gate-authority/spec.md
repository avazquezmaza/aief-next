# Specification

## Goal

Turn workflow gate authority into durable, human-approved decisions and implementation-ready prerequisites — without writing application code.

## Requirements

- The decision must not change `aief close`'s behavior for any Change that declares no
  `track` (100% of Changes closed to date) — see change.md's Known Requirements.
- Any resolution mechanism decided for `review`/`approval`/`security_review` must resolve from
  a repository-visible, git-tracked fact (a `tasks.md` label a human checked) — never from
  runtime/environment state, a daemon, or a database (ADR-021).
- The decision must state explicitly whether it also covers D4 (the `(review)`-task
  enforcement gap in `change-verifier.js` already diverging from what `AGENTS.md` states today)
  or defers it, and why.
- This Change produces no application-code diff — only `change.md` (this Definition Change's
  own record), `spec.md`, `tasks.md`, `evidence.md`, and — once the human Decision is recorded
  — `knowledge/decisions.md`.

## Acceptance Criteria

- [ ] Context, Business/Product Constraints and Known Requirements are captured.
- [ ] Open Questions are answered or explicitly deferred.
- [ ] Every Decision Required has a Recommendation and an explicit human Decision.
- [ ] Approved decisions are recorded in knowledge/decisions.md.
- [ ] Implementation Prerequisites and Follow-up Changes are listed.
- [ ] Evidence updated.
