# Todo Task Creation

## ADDED Requirements

### Requirement: Create Task

The system SHALL allow creating a task with a non-empty title.

#### Scenario: Create task with valid title

- **GIVEN** a non-empty title
- **WHEN** the task is created
- **THEN** the system returns a task with an id, title, and completed status

### Requirement: Reject Empty Task Title

The system SHALL reject empty or whitespace-only task titles.

#### Scenario: Reject empty task

- **GIVEN** an empty title
- **WHEN** task creation is attempted
- **THEN** the system raises a validation error

### Requirement: List Tasks

The system SHALL list created tasks.

#### Scenario: List created tasks

- **GIVEN** one or more created tasks
- **WHEN** tasks are listed
- **THEN** the created tasks are returned
