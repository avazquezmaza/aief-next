# AIEF CLI UX

The CLI should be self-explanatory.

Each command should answer:

- Purpose
- When to use it
- What it reads
- What it writes
- Examples
- Recommended next step

## Existing project adoption

```bash
aief doctor
aief adopt
aief verify
aief analyze
aief prompt --profile architect
```

## Command intent

| Command | Purpose | Writes files? |
|---|---|---|
| `doctor` | Inspect environment and project readiness | No |
| `status` | Show current AIEF adoption state | No |
| `adopt` | Add minimum AIEF workflow to an existing project | Yes |
| `analyze` | Create an Analysis Change | Yes |
| `prompt` | Generate assistant prompt | No |
| `verify` | Check AIEF structure | No |
| `close` | Print closure checklist | No in MVP |
| `propose` | Create/delegate proposal | Yes |
| `release` | Create release notes | Yes |
