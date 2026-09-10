# Specification

## Goal

The user has a ready-to-paste prompt that puts Codex in an independent-reviewer role over AIEF's
current governance model, CLI implementation, and the two Changes closed today — generated through
AIEF's own native `aief prompt codex` entrypoint rather than an ad hoc prompt, so the review follows
the same instruction hierarchy (`AGENTS.md` → assistant file → profile → active Change) every other
AIEF-generated prompt does.

## Requirements

- Use `aief prompt codex --change 0130-codex-external-audit --profile reviewer` (native entrypoint,
  `docs/assistant-workflow.md`) — do not hand-write a parallel prompt format.
- The Change context (`change.md`) must scope the audit honestly: governance model, CLI
  implementation, and the two same-day Changes — not a re-ask of the "Multi-Agent Runtime
  Foundation" mega-proposal already deferred in `docs/history/multi-agent-runtime-open-questions.md`.
- The generated prompt is handed to the user as-is; this session does not simulate being Codex.
- `evidence.md` records that the prompt was generated and handed off, and is updated with Codex's
  findings if/when the user reports them back.

## Acceptance Criteria

- [x] `aief prompt codex --change 0130-codex-external-audit --profile reviewer` runs successfully.
- [x] The generated prompt is presented to the user in full.
- [x] `evidence.md` documents the handoff.
- [ ] (human) Codex's findings, once obtained, are pasted back and summarized here.
