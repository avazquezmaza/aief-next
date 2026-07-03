# Evidence

## Summary

Implemented a minimal in-memory Todo service.

## Changed Files

```text
src/todo.js
tests/todo.test.js
package.json
README.md
```

## Verification

Command:

```bash
npm test
```

Expected result:

```text
3 tests pass.
```

## Results

- Creates a task with a title: passed.
- Lists created tasks: passed.
- Rejects empty task titles: passed.

## Known Issues

- Tasks are not persisted.
- There is no UI.
- Task completion is not implemented.

## Lessons Learned

A small executable example makes AIEF easier to learn because the specification, tasks, code, tests, and evidence are all visible together.
