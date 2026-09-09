# Specification

## Goal

Every path an assistant reads instructions from — `AGENTS.md` and `aief prompt`'s generated
prompt — explicitly says to stop once a Change's acceptance criteria are satisfied, instead of
opportunistically continuing into unrequested scope.

## Requirements

- R1: `AGENTS.md`'s `## General Rules` list gains a new numbered rule: stop once acceptance
  criteria are satisfied; propose further work as a follow-up Change rather than doing it
  inline.
- R2: `cli/templates/agents/AGENTS.md` (the canonical template `aief bootstrap` writes) carries
  the identical rule, byte-for-byte with the root file (per the existing
  `agents-canonical.test.js` guard).
- R3: `aief prompt`'s generated prompt text includes the directive for every Change type
  (general, enrichment, analysis, definition) — added once, at the point shared by all
  branches, not duplicated per-branch.
- R4: `agents-canonical.test.js`'s `CANONICAL_RULES` array includes a distinguishing substring
  of the new rule, so `aief bootstrap`'s delivery of it to adopted projects is guarded the same
  way every other normative rule already is.

## Acceptance Criteria

- [ ] `AGENTS.md` and `cli/templates/agents/AGENTS.md` are byte-identical (existing guard test
      passes) and both contain the new rule.
- [ ] `aief prompt --change <any>` includes "stop" language tied to acceptance criteria, for a
      general Change (verified by a new test).
- [ ] `aief bootstrap`'s adopted `AGENTS.md` contains the new rule (existing
      `CANONICAL_RULES` coverage test passes with the addition).
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0127-scope-complete-stop-directive --strict` all
      pass.
