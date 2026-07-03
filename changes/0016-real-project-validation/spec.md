# Specification

## Goal

Confirm on a real codebase that the Adoption Engine's guarantees hold (safe, additive, explained, guided), and convert observed frictions into tested improvements.

## Requirements

- Target: `/home/avazquez/PRS/bitbucket_code/trk-orchestrator-portal` (Flux Portal — Next.js 14, TypeScript, Tailwind, Drizzle/Postgres, Cognito, multitenant, n8n).
- `doctor` must detect the real stack with accurate, verifiable reasons.
- `adopt` must be additive only: `git status` may show new untracked paths, never modified tracked files.
- `verify` must PASS after adoption.
- `analyze` + `prompt --assistant claude` must produce a correct Analysis prompt referencing CLAUDE.md.
- Each friction found must be either fixed (with a test) or recorded as a pending recommendation.

## Acceptance Criteria

- [ ] Full flow executed on Flux Portal; outputs captured in evidence.
- [ ] No tracked file in the target modified by AIEF.
- [ ] Frictions recorded; evidence-driven fixes covered by tests.
- [ ] CLI suite passes after fixes.
- [ ] Target's `0001-adopt-aief` evidence completed.
- [ ] Evidence updated in this Change.
