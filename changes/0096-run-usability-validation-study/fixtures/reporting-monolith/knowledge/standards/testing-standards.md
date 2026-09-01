# Testing Standards

> How this project verifies itself. Created by `aief adopt`. Edit to match reality.

## Applies now

Testability is a Definition-stage concern, not an afterthought — decide it before code exists.

- For every functional requirement or decision recorded in a Definition Change, note how it will
  be verified once implemented (a testable acceptance criterion, not just a description).
- Identify trust boundaries and critical user flows early — they drive both the security model
  and what "must be tested" means once implementation starts.
- A Change is not complete while its tests fail. This holds for a Definition Change too: its own
  acceptance criteria (spec.md) must be met before close, even though there is no test runner
  yet.

## Applies once implementation starts

### Commands

- (adapt) How to run the test suite, lint and type checks in this project.

### What must be tested

- Business logic and anything with branching behavior.
- Bug fixes: every fix adds a test that would have caught the bug.
- Critical user flows end-to-end where feasible — the ones identified during Definition.

### Rules

- Tests accompany the Change that introduces the behavior — not a later Change.
- Prefer small, readable tests over clever fixtures.
- (adapt) Coverage or quality gates enforced by CI, if any.
