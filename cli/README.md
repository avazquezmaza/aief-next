# AIEF CLI

The AIEF CLI is a guided workflow tool.

It should explain what each command does, what it reads, what it writes, and what to do next.

## Existing project flow

```bash
aief doctor
aief adopt
aief verify
aief analyze
aief prompt --profile architect
```

## Command groups

### Discovery

```bash
aief doctor
aief status
aief help doctor
```

### Adoption

```bash
aief adopt
aief analyze
```

### Work

```bash
aief new-change add-login
aief propose "Add login"
aief prompt --profile architect
aief verify
aief close
```

## Skills recommendation

`aief doctor` and `aief adopt` inspect project signals and recommend possible Skills.

Profiles define the role. Skills define specialized knowledge.
