# Design

## Context

The Todo App example should remain simple and dependency-free.

## Decision

Implement an in-memory `TodoList` class with:

- `createTask(title)`
- `listTasks()`

## Alternatives Considered

### Use a database

Rejected because it would add complexity that distracts from the AIEF workflow.

### Use a web framework

Rejected because the example should focus on the Change lifecycle, not framework setup.

## Risks

- The example is intentionally small and does not demonstrate persistence.
