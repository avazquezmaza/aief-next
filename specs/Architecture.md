# AIEF Architecture

AIEF is intentionally small.

```text
Kernel
  ├── Principles
  ├── Workflow
  ├── Change Model
  ├── Agent Instructions
  └── Evidence
```

## Kernel

The Kernel is the stable part of AIEF.

It defines:

- the workflow,
- the minimum artifacts,
- the collaboration rules,
- the evidence requirement.

## Extensions

Advanced capabilities should be added as extensions.

Examples:

- OpenSpec alignment,
- Specboot alignment,
- MCP,
- memory,
- RAG,
- CI/CD,
- compliance.

The starter version does not require these extensions.
