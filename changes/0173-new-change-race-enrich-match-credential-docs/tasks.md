# Tasks

## Decisions

- [ ] (human) D1 — rewording an approval that is already resolved. Since Change 0172 the guard
      refuses it (it reads as "removed" + "added already resolved"), so fixing a typo in
      `- [x] (human) Approve scopes` is blocked and an agent may fall back to `sed`, which the guard
      cannot see. Options: (a) keep blocking — the wording is what was approved; (b) allow it when
      the same number of resolved approvals of the same label exists before and after and only
      the text changed. Recommendation: (a) — a reworded approval is a different approval, and
      `verify --strict`'s history notice already covers the shell path.
      Owner's choice (2026-11-17, in chat): (a) keep blocking.

## Implementation

- [x] R1/R2: atomic directory claim and write check in `createChange()`.
- [x] R3: exact slug match in `enrich`.
- [x] R4: credential wording in `docs/configuration.md`.
- [x] R6: implement D1 — no behaviour change; pinned by a guard test.

## Tests

- [x] `new-change` into an existing target directory: exit 1, nothing written, no "Created".
- [x] `enrich` next to a suffix-sharing Change; exact duplicate still detected.

## Verification

- [x] `npm test`
- [x] `npm run lint`
- [x] `git diff --check`
- [ ] `aief verify --strict --change 0173`

## Evidence

- [x] Update evidence.md (including R5, the live guard test)

## Review

- [ ] (human) Owner reviews the diff before merge.
