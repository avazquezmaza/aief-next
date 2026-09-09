# Tasks

## Implementation

- [x] Add the STOP rule to `AGENTS.md`'s General Rules (R1).
- [x] Mirror it in `cli/templates/agents/AGENTS.md` (R2).
- [x] Add the same directive to `aief prompt`'s shared, per-Change-type generated text (R3).

## Documentation

- [x] Add the rule's substring to `agents-canonical.test.js`'s `CANONICAL_RULES` (R4).

## Verification

- [x] Add a test confirming the new prompt text renders.
- [x] Confirm `agents-canonical.test.js`'s full suite still passes (byte-identical template,
      100% normative-rule coverage).
- [x] Run `npm test` (1071/1071), `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0127-scope-complete-stop-directive --strict`.

## Evidence

- [x] Update evidence.md
