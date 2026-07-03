# Specification

## Goal

Users can create and list Todo tasks.

## Requirements

- A task has:
  - `id`
  - `title`
  - `completed`
- New tasks must default to `completed: false`.
- Empty or whitespace-only titles must be rejected.
- Created tasks must be retrievable through a list operation.

## Acceptance Criteria

- [x] Given a non-empty title, when a task is created, then a task object is returned.
- [x] Given a created task, when tasks are listed, then the task appears in the list.
- [x] Given an empty title, when a task is created, then an error is raised.

## Constraints

- Use plain JavaScript.
- Do not add external dependencies.
- Keep storage in memory.
