# OpenSpec Adapter

This adapter explains how to use AIEF with OpenSpec.

OpenSpec is optional.

AIEF defines the lightweight engineering workflow:

```text
Idea -> Spec -> Tasks -> Build -> Verify -> Evidence
```

OpenSpec can be used as a more formal specification engine for teams that want structured change proposals, design notes, and spec deltas.

## When to use this adapter

Use this adapter when:

- your team already uses OpenSpec,
- you want stricter change proposals,
- you need clearer spec deltas,
- you want a formal review process before implementation.

Do not use it when:

- you are starting with AIEF for the first time,
- your change is very small,
- the extra structure does not add value.

## Relationship

```text
AIEF
  └── Change lifecycle and AI collaboration

OpenSpec
  └── Optional specification format for changes
```

AIEF remains the project workflow. OpenSpec can implement the Specification part of that workflow.

## CLI integration contract

`aief propose <idea>` delegates to OpenSpec only after validating the contract at runtime:

1. Check that an `openspec` executable is on PATH.
2. Read the version from `openspec --version` (reported as `unknown` if unavailable).
3. Scan `openspec --help` for a `propose` command before calling it.
4. If any step fails, or `openspec propose <idea>` exits non-zero, AIEF prints an explicit message — for example:

```text
OpenSpec delegation failed (exit code 1). Falling back to local Change generation.
```

and creates a local Change with `proposal.md`. The fallback is always announced; AIEF never duplicates work silently.

### Validation status

| Aspect | Status |
|---|---|
| Runtime detection (`--version`, `--help` scan) | Covered by CLI tests (`cli/tests/cli.test.js`) using simulated OpenSpec binaries. |
| Real OpenSpec release | **Not yet validated against a specific version.** When you validate one, record the version and command surface here. |

If the real OpenSpec CLI uses a different command than `propose`, update `openspecInfo()`/`propose()` in `cli/src/cli.js` and this table.
