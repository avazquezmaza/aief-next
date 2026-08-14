# Tasks

## Inspection

- [x] Re-read Change 0090, Change 0091, `architecture-definition.js`, `skill-context.js`,
      `definition-enrichment.js`, prompt composition (`cli.js`'s `prompt()`), `verify --strict`,
      `close` readiness, `knowledge/decisions.md` conventions — do not infer from the prior report.

## Validation Scenarios

- [x] Scenario A — Incomplete PRD
- [x] Scenario B — Contradictory requirements
- [x] Scenario C — Existing approved architecture decision
- [x] Scenario D — Existing unresolved decision
- [x] Scenario E — Approved decision + new related concern
- [x] Scenario F — Weak architecture signals
- [x] Scenario G — Mixed signals across files
- [x] Scenario H — Irrelevant historical knowledge
- [x] Scenario I — Deferred integration
- [x] Scenario J — Previously resolved ambiguity

## Applicability Adversarial Review

- [x] False positives / false negatives / heading leakage / case sensitivity / code blocks /
      negative statements / generic words — each explicitly checked.

## Defects

- [x] Classify every finding; fix only REAL DEFECT findings at smallest coherent scope; add a
      regression test and rerun the affected scenario for each fix.

## Verification

- [x] Full suite: `npm test` (≥ 932, 0 fail).
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.
- [x] `git diff --stat` / `git diff --name-status` reviewed against the scope guard (spec.md R14).
- [x] Adversarial review checklist (change.md's success criteria + mission's own list) answered.

## Evidence

- [x] Update evidence.md with the full scenario matrix and generalization verdict.
