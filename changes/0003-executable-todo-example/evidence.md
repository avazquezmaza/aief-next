# Evidence

## Summary

The Todo App example is now executable.

It includes:

- a minimal JavaScript Todo service,
- automated tests using Node.js built-in test runner,
- package scripts,
- AIEF Change documentation.

## Verification

Verification command:

```bash
cd examples/todo-app
npm test
```

Expected result:

```text
All tests pass.
```

## Results

- Task creation test: passed.
- Empty title rejection test: passed.
- Task listing test: passed.

## Known Issues

- The example stores tasks in memory only.
- No web UI is included.
- No database is included.

## Lessons Learned

An AIEF example is more useful when it is executable. A small implementation plus tests makes the workflow easier to understand than documentation alone.
