# Tasks

## Decisions

- [ ] (human) D1 (F2b) — how AIEF covers assistants without hooks. Options: (a) `aief verify
      --strict` flags a `(human)`/`(review)` line whose first appearance in git history is already
      resolved; (b) `aief bootstrap` installs a Continue rule forbidding assistants to check
      approvals; (c) both; (d) neither, document the limitation. Recommendation: (c).
      Owner's choice (2026-11-17, in chat): (c) both; revised the same day to (a) only — D1b dropped
      once Continue was found to load `AGENTS.md` already (evidence.md, Findings).
- [ ] (human) D2 (F3) — evidence completeness rule. Options: (a) keep the 2× ratio and document it;
      (b) `complete` also requires `## Summary` and `## Verification` to hold real content;
      (c) `complete` requires no required section left `Pending.`. Recommendation: (b).
      Owner's choice (2026-11-17, in chat): (b) Summary + Verification.
- [ ] (human) D3 (F4) — what 0171's `F4` refers to, or record it as unrecoverable.
      Recommendation: unrecoverable.
      Owner's choice (2026-11-17, in chat): unrecoverable.

## Implementation

- [x] R1/R2: guard refuses introduced resolved approval lines.
- [x] R4 (D1a): `verify --strict` notice for approvals never committed unchecked.
- [x] R4 (D1b): Continue rule — dropped by the owner: Continue already loads `AGENTS.md`, which
      carries the same instruction (evidence.md, Findings).
- [x] R5: implement D2.
- [x] R6/R7: update 0171's references and record D3.

## Tests

- [x] Guard: new resolved line, new file, rewritten line refused; new unchecked and untouched
      resolved lines allowed.
- [x] Tests for D1a and D2.

## Documentation

- [x] Update `docs/` where the guard, `verify --strict` or evidence classification is described.

## Verification

- [x] `npm test`
- [x] `npm run lint`
- [x] `git diff --check`
- [x] `aief verify --strict --change 0172`

## Evidence

- [x] Update evidence.md

## Review

- [ ] (human) Owner reviews the diff before merge.
