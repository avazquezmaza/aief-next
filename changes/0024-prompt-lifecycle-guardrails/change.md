# Change

## ID

`0024-prompt-lifecycle-guardrails`

## Type

General

## Objective

Close two small Workflow Engine frictions observed in the real Claude Code validation on trk-orchestrator-portal, before moving to the operational-knowledge roadmap: prompt re-run safety over existing evidence, and explicit guidance on where results belong (project evidence vs AIEF feedback, plus tasks.md ownership for Analysis Changes).

## Scope

### In scope

- Re-run guardrail in `aief prompt`: when the target Change's evidence.md has real (non-empty, non-placeholder) content, the generated prompt instructs the assistant not to overwrite blindly, to review/amend only if needed, to preserve validated evidence, and to report a re-verification when nothing changed. Derived from files; no hidden state.
- "Where results belong" block in the prompt: project evidence goes in evidence.md; AIEF/tooling feedback goes in the assistant's response (a separate feedback file only if the Change explicitly asks). No feedback.md is created automatically.
- Analysis-branch wording fix resolving the "complete only evidence.md" vs close contradiction: complete **or amend** evidence.md; do not mark tasks.md unless explicitly asked; report which tasks appear complete. `close` unchanged.

### Out of scope

- New commands, hidden state, changes to verify/close/Skills/Standards/Profiles, automatic feedback.md, any Knowledge Engine work.

## Success Criteria

- Re-running `aief prompt` over completed evidence no longer invites overwriting.
- The assistant knows where AIEF feedback belongs and who owns tasks.md.
- Full suite passes; `aief verify` passes.

## Status

Closed (2026-07-04)
