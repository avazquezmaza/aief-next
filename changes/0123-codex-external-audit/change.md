# Change

## ID

`0123-codex-external-audit`

## Type

Analysis

## Objective

Have Codex, acting as an independent reviewer outside this session, audit AIEF's current state:
its governance model (Change lifecycle, verify/close gates, ADR discipline), the CLI implementation
in `cli/src/`, and the two Changes closed today (0122-multi-agent-runtime-open-questions,
0122-ci-apt-chrome-mirror-flakiness). This Change produces the prompt and captures Codex's findings
as evidence — it does not implement fixes itself.

## Scope

### In scope

- Generate a ready-to-paste Codex prompt via `aief prompt codex --change 0123-codex-external-audit
  --profile reviewer`, scoped to a general architecture/governance/code audit of the repository as
  it stands on `main`.
- Record Codex's findings (once run, by a human, in a real Codex session) in `evidence.md`.
- This Change's own artifacts.

### Out of scope

- Implementing any fix Codex recommends — that becomes its own Change(s), reviewed and scoped
  normally, per ADR-008/ADR-013 (no speculative capability without evidence).
- Running Codex from within this session — this session is Claude Code, not Codex; the generated
  prompt must be pasted into an actual Codex session (CLI or ChatGPT) by a human.
- Any code change.

## Success Criteria

- A Codex prompt is generated and handed to the user.
- `evidence.md` records the prompt and, once available, a summary of Codex's findings.
- No code, config, or other document changed by this Change beyond its own directory.
