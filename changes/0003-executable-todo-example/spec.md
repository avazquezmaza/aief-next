# Specification

## Goal

Provide a real, runnable Todo App example that teaches AIEF by example.

## Requirements

- The example must be executable with Node.js.
- The example must include a simple Todo service.
- The service must support creating tasks.
- Empty task titles must be rejected.
- Created tasks must be listed.
- Automated tests must verify the behavior.
- Evidence must document how the example was verified.

## Acceptance Criteria

- [ ] `examples/todo-app/package.json` exists.
- [ ] `examples/todo-app/src/todo.js` exists.
- [ ] `examples/todo-app/tests/todo.test.js` exists.
- [ ] Running `npm test` from `examples/todo-app` executes tests.
- [ ] Tests cover valid task creation.
- [ ] Tests cover empty title rejection.
- [ ] The example Change evidence is updated.

## Constraints

- Do not require external dependencies.
- Keep implementation small.
- Use plain JavaScript.
