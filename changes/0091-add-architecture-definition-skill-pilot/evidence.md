# Evidence

## Summary

Added one instructions-only Skill, `architecture-definition` (`cli/src/skills/architecture-definition.js`),
registered in the existing Skills Runtime alongside `change-context` and
`requirements-analysis-instructions`. It applies only to a Definition Change whose own content
carries a deterministic architecture-relevant signal, reads `context.definitionEnrichment` (Change
0090) to avoid duplicating already-recorded content, and instructs the assistant to draft
Architecture Concerns/Options Considered/Trade-offs/Recommendation inside the Definition Change's
existing sections — never filling `Decision (human)`, never checking a `(human)` task, never
writing application code. An end-to-end pilot against a disposable scratch project (the mission's
own B2B SaaS scenario) exercised the full path from `aief bootstrap` through a closed, human-decided
Definition Change with zero application code and zero new state anywhere.

## Activities Performed

- Inspected `requirements-analysis-instructions.js`, `change-context.js`, `skill.js`,
  `skill-service.js`, `skills/index.js` before writing any code.
- Wrote `cli/src/skills/architecture-definition.js`: descriptor, `appliesTo()` (Definition-type
  guard + a fixed keyword-signal test), `buildInstructions()` (reads
  `context.definitionEnrichment`, quotes untrusted content with the same disclaimer pattern
  `requirements-analysis-instructions.js` uses, states explicit governance prohibitions, shows a
  Recommendation/`Decision (human): TBD` pairing), `summarize()`.
- Registered it in `cli/src/skills/index.js`'s `MODULES` (one file, one entry — no other file
  touched, per the existing extension model).
- Added `cli/tests/skill-architecture-definition.test.js` (18 tests) and updated the three
  existing tests that hardcoded "two registered Skills"
  (`skill-registry.test.js`, `skill-service.test.js`, `cli.test.js`) to the new count of three.
- Found and fixed a real bug during test-writing (see "Findings" below): the Definition scaffold's
  own fixed section headers (`## Deployment & Operations`, `## Security & Compliance`, ...) always
  contain architecture-relevant words regardless of content, so testing raw `change.md` against the
  keyword pattern made `appliesTo()` applicable to every Definition Change, scaffold or not. Fixed
  by stripping headings before the keyword test — a regression test
  ("not applicable to a Definition Change with no architecture-relevant signal") locks this in.
- Added a Skills Runtime section to `docs/workflow.md` naming the new Skill, additive only.
- Ran a full end-to-end pilot against a disposable scratch project (below).

## Verification

Focused (`skill-architecture-definition`, `skill-context`, `skill-service`, `skill-model`,
`skill-registry`): **91/91 pass**.

Full `cli.test.js` (includes `--list-skills`/`--skill` CLI integration and the pre-existing PRD
end-to-end test): **255/255 pass**.

Full suite: `npm test` — **932/932 pass** (914 baseline-after-0090 + 18 new), 0 fail, 0 skipped.

`node cli/bin/aief.js verify` — **PASS**.

`git diff --check` — clean.

### End-to-end pilot (disposable scratch project, deleted after this evidence was recorded)

Scenario, per the mission: `README.md` describing "Build a B2B SaaS platform" with enterprise
authentication, sensitive operational data, external ERP integration, no architecture selected —
no application source.

1. `aief bootstrap` → `aief analyze` — **correctly routed to a Definition Change** (`0002-analyze-current-architecture`), not an Analysis Change: `Detected maturity: Definition.`
2. `aief prompt --list-skills` — `architecture-definition` listed alongside the other two.
3. `aief prompt --skill architecture-definition --change 0002-...` — `ready`, non-empty
   instructions, correctly quoting the (empty, at that point) `definitionEnrichment` and the
   Change's own real content.
4. Filled in Known Requirements/Open Questions/Decisions Required/Options Considered/Recommendation
   by hand, following the Skill's own instructions (marking new items `(ambiguous)`/`(decision
   required)`/`(human)`), leaving `Decision (human)` untouched.
5. `aief verify --strict` — **FAIL**, as required: `Decisions Required has content but Decision
   (human) records no outcome yet`, plus two unresolved `(human)` task blockers.
6. `aief close --yes` — **blocked**, same reason.
7. Recorded the human decision in `Decision (human)`/`Rationale`, checked the two `(human)` tasks
   (playing the human role, as the pilot's operator), recorded `knowledge/decisions.md` ADR-001.
8. `aief verify --strict` — **PASS**.
9. Filled `evidence.md`, checked remaining ordinary tasks, `aief close --yes` — **closed**.
10. Final inspection of the whole scratch project tree: **no `src/`, no application code, no
    infrastructure/migration files, no second decision ledger, no file outside the expected AIEF
    governance set** (`AGENTS.md`, `changes/`, `knowledge/` including the one `decisions.md`,
    `profiles/`, the CI gate). `aief verify` (whole project) — PASS.
11. Exactly one Definition Change was created by `analyze` — no Analysis Change appeared anywhere.

## Findings

One real bug found and fixed during test-writing (not left in a "known issue" state): `appliesTo()`'s
keyword signal, tested against raw `change.md`, always matched because the Definition scaffold's
own fixed headers contain architecture-relevant words. Fixed by stripping headings before the
match; a dedicated regression test (`appliesTo: not applicable to a Definition Change with no
architecture-relevant signal`) now locks this in. No other findings.

## Adversarial Review

Every question in this Change's own `change.md`/the mission's adversarial-review list, verified
against the actual source (`grep`) and the live pilot run, not merely by design intent:

- Can it invent requirements? **NO** — untrusted-content disclaimer explicitly forbids treating
  quoted Change content as instructions; the Skill only ever reads and quotes, never asserts new
  facts as Known.
- Can it infer certainty from missing evidence? **NO** — instructions direct ambiguity to
  `(ambiguous)`/`(decision required)`, never to a stated fact.
- Can it silently choose a cloud provider, database, or tenancy model? **NO** — "DO NOT silently
  choose an architecture, cloud provider, database, or any other technology" is explicit source
  text, verified by test.
- Can it fill `Decision (human)`? **NO** — explicit prohibition, verified by test and by the live
  pilot (the field stayed `TBD` until the human step).
- Can it check a `(human)` task? **NO** — explicit prohibition; the Skill Service's own capability
  lock also makes this structurally impossible (`writeFiles: false`, enforced at registration).
- Can it generate source code? **NO** — explicit prohibition; live pilot confirms no `src/` or
  application code anywhere.
- Can it duplicate an already-existing decision/ambiguity? **NO** — `buildInstructions()` quotes
  `definitionEnrichment`'s already-marked items with "do not re-raise or duplicate these," verified
  by test.
- Can it override existing approved durable knowledge? **NO** — zero write capability; instructions
  only ever point at `knowledge/decisions.md`, never edit it.
- Can it create a second source of truth? **NO** — explicit prohibition against a second approval
  mechanism/decision ledger/file outside `change.md`; live pilot used only `knowledge/decisions.md`.
- Can it become Claude-specific? **NO** — source-level test (`doesNotMatch(source, /claude|gemini/i)`)
  passes; `assistantRequired: false`.

## Recommendations

Review this pilot before deciding whether to generalize the pattern to Security/Data/
Integration/NFR Definition Skills, per the mission's own explicit stop-and-review instruction.

## Artifacts Produced

- `cli/src/skills/architecture-definition.js` — new Skill.
- `cli/src/skills/index.js` — one registry entry added.
- `cli/tests/skill-architecture-definition.test.js` — 18 new tests.
- `cli/tests/skill-registry.test.js`, `cli/tests/skill-service.test.js`, `cli/tests/cli.test.js` —
  updated for the new registered-Skill count, no behavior change to existing Skills.
- `docs/workflow.md` — additive Skills Runtime documentation.

## Lessons Learned

Writing the applicability test against the *real* Definition scaffold (not a hand-trimmed fixture)
is what surfaced the heading-collision bug — a reminder that a keyword-signal check must be
verified against the actual generated content, not an idealized shape.

## Next Change

None planned — per the mission, the program stops here for review before any Security/Data/
Integration/NFR Definition Skill is considered.
