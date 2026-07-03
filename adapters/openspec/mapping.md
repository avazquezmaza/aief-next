# AIEF to OpenSpec Mapping

## Conceptual Mapping

| AIEF | OpenSpec | Notes |
|---|---|---|
| `changes/<id>/change.md` | `proposal.md` | Describes why the change exists. |
| `changes/<id>/spec.md` | `specs/<capability>/spec.md` | Defines requirements and behavior changes. |
| `changes/<id>/tasks.md` | `tasks.md` | Defines implementation checklist. |
| `changes/<id>/evidence.md` | No direct equivalent | AIEF keeps evidence as a first-class artifact. |
| `design.md` | `design.md` | Optional in both approaches. |

## Recommended Folder Shape

AIEF-native:

```text
changes/
└── 0001-create-task/
    ├── change.md
    ├── spec.md
    ├── tasks.md
    └── evidence.md
```

OpenSpec-compatible:

```text
openspec/
└── changes/
    └── 0001-create-task/
        ├── proposal.md
        ├── tasks.md
        ├── design.md
        └── specs/
            └── todo/
                └── spec.md
```

Hybrid AIEF + OpenSpec:

```text
changes/
└── 0001-create-task/
    ├── change.md
    ├── spec.md
    ├── tasks.md
    ├── evidence.md
    └── openspec/
        ├── proposal.md
        ├── design.md
        └── specs/
```

## Recommendation

For AIEF Starter projects, use AIEF-native structure first.

Adopt OpenSpec when your project needs more formal specification governance.
