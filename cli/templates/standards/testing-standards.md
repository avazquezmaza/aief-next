# Testing Standards

> How this project verifies itself. Created by `aief adopt`. Edit to match reality.

## Commands

- (adapt) How to run the test suite, lint and type checks in this project.

## What must be tested

- Business logic and anything with branching behavior.
- Bug fixes: every fix adds a test that would have caught the bug.
- Critical user flows end-to-end where feasible.

## Rules

- Tests accompany the Change that introduces the behavior — not a later Change.
- A Change is not complete while its tests fail.
- Prefer small, readable tests over clever fixtures.
- (adapt) Coverage or quality gates enforced by CI, if any.
