# Changes

Every meaningful unit of work should live in its own Change folder.

Example:

```text
changes/
└── 0001-add-login/
    ├── change.md
    ├── spec.md
    ├── tasks.md
    └── evidence.md
```

## Naming

Use:

```text
<number>-<short-description>
```

Examples:

```text
0001-add-login
0002-fix-timeout
0003-update-docs
```

## Minimum files

Each Change should include:

- `change.md`
- `spec.md`
- `tasks.md`
- `evidence.md`
