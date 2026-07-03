# Decision Tree

Use this page to choose the right path.

```mermaid
flowchart TD
    A[Start] --> B{Do you already have a project?}
    B -->|No| C[Use New Project path]
    B -->|Yes| D[Use Existing Project path]

    C --> E{What OS are you using?}
    D --> E

    E -->|Windows| F[Windows install guide]
    E -->|Linux| G[Linux install guide]
    E -->|macOS| H[macOS install guide]

    F --> I{Do you want tooling?}
    G --> I
    H --> I

    I -->|AIEF only| J[Use templates and CLI]
    I -->|AIEF + OpenSpec| K[Use OpenSpec for specs/tasks]
    I -->|AIEF + OpenSpec + Specboot| L[Use OpenSpec plus Specboot-style agent instructions]

    J --> M{Which AI assistant?}
    K --> M
    L --> M

    M -->|Claude| N[Use CLAUDE.md]
    M -->|Gemini| O[Use GEMINI.md]
    M -->|Codex| P[Use CODEX.md]
    M -->|Cursor| Q[Use CURSOR.md]
    M -->|Other| R[Use AGENTS.md]

    N --> S[Create first Change]
    O --> S
    P --> S
    Q --> S
    R --> S

    S --> T[Build]
    T --> U[Verify]
    U --> V[Update evidence.md]
```

## Read Next

- New project: [new-project.md](new-project.md)
- Existing project: [existing-project.md](existing-project.md)
- Tooling: [tooling.md](tooling.md)
- AI assistants: [ai-assistants.md](ai-assistants.md)
