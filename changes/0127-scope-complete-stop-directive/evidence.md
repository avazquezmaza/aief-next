# Evidence

## Summary

Adds a lightweight "stop once scope is satisfied" directive, following up directly on Change
0096's usability-study finding (§6 row 4: a participant continued unprompted well past the
scoped task, with no hint or gate signaling it was already done). The directive lands in
`AGENTS.md` (read by every assistant) and `aief prompt`'s generated per-Change prompt (read at
the moment work starts) — no new subsystem, hook, or enforcement mechanism, per the audit's own
recommendation to keep this a prompt-level instruction.

## Activities Performed

- `AGENTS.md` and `cli/templates/agents/AGENTS.md`: added General Rule 11, identically in both
  (kept byte-identical, per the pre-existing `agents-canonical.test.js` guard).
- `cli/src/commands/prompt.js`: added the directive right after the existing "Respect the
  scope..." line, shared across every Change-type branch (general/enrichment/analysis/
  definition) — one insertion point, not duplicated per branch.
- `cli/tests/agents-canonical.test.js`: added the rule's distinguishing text to
  `CANONICAL_RULES`, so `aief bootstrap`'s delivery of it to adopted projects is guarded the
  same way every other normative rule already is.
- `cli/tests/cli-skills-and-maturity.test.js`: added a dedicated test confirming the generated
  prompt carries the directive.

## Verification

- `npm test` (cli/): 1071/1071 passed (1 new test; caught and fixed one case-sensitivity slip
  in the new test's own regex — "Propose" is capitalized as a new sentence in the actual
  output, not "propose").
- `npm run lint`: clean.
- `node cli/bin/aief.js verify --change 0127-scope-complete-stop-directive --strict`: PASS.
- `git diff --check`: clean.
- `agents-canonical.test.js`'s full suite (byte-identical template across bootstrap/bootstrap
  <name>, 100% normative-rule coverage) passes with the new rule included.

## Findings

- None beyond what change.md already named. The directive is deliberately unenforceable by
  code — it relies on the assistant reading and following it, exactly like every other
  General Rule in `AGENTS.md` already does (e.g. "Do not modify unrelated files").

## Risks

- An assistant can still ignore a prompt-level instruction — this Change does not, and cannot,
  guarantee compliance, only give the same explicit signal that was missing during Change
  0096's observed session. Measuring actual compliance (an "unrequested diff" eval) requires an
  evals harness this repository does not have yet — tracked separately, not part of this
  Change's scope.

## Recommendations

- Once an evals harness exists (this repository's own backlog, lower priority), replay Change
  0096's exact P5 scenario (or an equivalent) with this directive in place and measure whether
  the same scope-exceeding continuation still occurs — the only way to know whether the
  directive actually changes behavior, versus only stating an intent.

## Artifacts Produced

- `AGENTS.md`, `cli/templates/agents/AGENTS.md`, `cli/src/commands/prompt.js`.
- `cli/tests/agents-canonical.test.js`, `cli/tests/cli-skills-and-maturity.test.js`.

## Lessons Learned

- Adding the directive at the one shared point in `prompt.js`'s template (right after the
  existing scope-respecting line) covered every Change type in one edit — the same lesson as
  Change 0125's `next-change-service.js` finding: look for the shared code path before adding
  a per-branch special case.

## Next Change

- None required now. See Recommendations for the natural follow-up once an evals harness
  exists.
