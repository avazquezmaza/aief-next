# Frontend Standards

> Client-side rules for this project.
> Created by `aief adopt` because frontend signals were detected. Edit to match reality.

## Components

- (adapt) Component organization, naming and file layout.
- Keep components small; extract logic into hooks/utilities when it grows.
- Server-side data fetching stays on the server (no secrets or privileged calls in client code).

## State

- (adapt) State management approach (local state, store library, server cache).
- Derive state where possible instead of duplicating it.

## Styling and UX

- (adapt) Styling system (CSS framework, design tokens, component library).
- Loading, empty and error states are part of every feature, not an afterthought.
- Accessibility: interactive elements are keyboard-reachable and labeled.

## Testing

- Critical user flows have tests; components with logic have unit tests.
- Details in testing-standards.md.
