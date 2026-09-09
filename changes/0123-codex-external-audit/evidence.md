# Evidence

## Summary

Generated a native AIEF prompt (`aief prompt codex --change 0123-codex-external-audit --profile
reviewer`) putting Codex in an independent-reviewer role over AIEF's governance model, CLI
implementation, and the two Changes closed earlier today (0122-multi-agent-runtime-open-questions,
0122-ci-apt-chrome-mirror-flakiness). Handed to the user to paste into a real Codex session — this
session (Claude Code) does not simulate being Codex.

## Activities Performed

- Ran `node cli/bin/aief.js prompt codex --change 0123-codex-external-audit --profile reviewer`;
  command succeeded, produced the standard AIEF prompt wrapper (AGENTS.md, reviewer profile, scope
  restricted to this Change's directory, Analysis-Change constraints: no application code edits).
- Presented the full prompt output to the user for pasting into an actual Codex session.

## Verification

- Command exit succeeded; output non-empty and well-formed (matches the shape of every other
  `aief prompt <assistant>` invocation in this repository's history).

## Findings

Pending — to be filled in once the user runs the prompt in a real Codex session and reports back.

## Risks

- This session cannot verify Codex actually ran the prompt as intended, or that its environment has
  the same `main` checkout — the user should point Codex at this repository's current `main` (or
  this Change's branch) before pasting the prompt.

## Recommendations

- Any fix Codex recommends should become its own Change, scoped and reviewed normally — not applied
  directly from Codex's raw output.

## Next Change

Depends on Codex's findings, once reported.
