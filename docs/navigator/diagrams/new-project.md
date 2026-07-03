# New Project Diagram

```mermaid
flowchart TD
    A[Start New Project] --> B{Use CLI?}
    B -->|Yes| C[aief init project-name]
    B -->|No| D[Copy starter-project]

    C --> E[Create first Change]
    D --> E

    E --> F[Write spec.md]
    F --> G[Write tasks.md]
    G --> H[Use AI assistant]
    H --> I[Build]
    I --> J[Verify]
    J --> K[Update evidence.md]
```
