# OpenSpec Adapter

This adapter explains how to use AIEF with OpenSpec.

OpenSpec is optional. In the [three-level AIEF workflow](../../docs/Workflow.md), OpenSpec powers **level 2 (the Feature Workflow)**: turning ideas into proposals, specs and tasks. AIEF keeps level 1 (context) and level 3 (governance).

OpenSpec can be used as a more formal specification engine for teams that want structured change proposals, design notes, and spec deltas.

Note: `aief close` is **not** the same as OpenSpec `/archive` — close governs the AIEF Change (Status in change.md), archive governs the OpenSpec change. If you use both tools, do both (comparison table in [docs/Workflow.md](../../docs/Workflow.md)).

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

## The official OpenSpec workflow

The real OpenSpec project (github.com/Fission-AI/OpenSpec — note: the older `openspec-ai/openspec` URL returns 404) defines this workflow:

```text
Explore -> Propose -> Apply -> Archive
```

Key facts for AIEF users (verified against the OpenSpec repository documentation on 2026-07-03):

- `propose` is an **assistant slash command** (`/opsx:propose <idea>`), not a terminal command. The terminal CLI covers `openspec init`, `openspec update`, `openspec config` and related maintenance commands.
- Each OpenSpec change lives in `openspec/changes/<name>/` with proposal, specs, design and tasks; completed changes are archived under `openspec/changes/archive/`.

What this means for AIEF:

- **AIEF uses** OpenSpec as the Proposal → Spec → Tasks engine, driven from your AI assistant with the OpenSpec slash commands.
- **AIEF does not reimplement** proposal generation, spec deltas or archiving.
- Because `propose` is not a terminal command, `aief propose` delegation will normally fall back to the local Change skeleton — loudly, by design (see below). The local skeleton is the supported path when OpenSpec is not installed or not driveable from the terminal.

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
| Real OpenSpec release | **Not yet validated against an installed release.** Repository documentation was reviewed (2026-07-03) and indicates `propose` is a slash command, not a terminal command — so terminal delegation is expected to fall back locally. When you install a release, record the version and observed command surface here. |

If the real OpenSpec CLI uses a different command than `propose`, update `openspecInfo()`/`propose()` in `cli/src/cli.js` and this table.
