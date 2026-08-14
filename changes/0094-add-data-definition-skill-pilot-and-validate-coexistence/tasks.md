# Tasks

## Inspection

- [x] Re-read `architecture-definition.js`, `skill-architecture-definition.test.js`,
      `skills/index.js`, `skill.js`, `skill-service.js`, `skill-context.js`,
      `definition-enrichment.js` — identify shared expert-skill pattern vs. architecture-specific
      behavior before writing any code.

## Implementation

- [x] Write `cli/src/skills/data-definition.js`.
- [x] Register it in `cli/src/skills/index.js`'s `MODULES`.

## Focused Tests

- [x] `cli/tests/skill-data-definition.test.js` (mirroring `skill-architecture-definition.test.js`'s
      structure): descriptor/capability lock, applicability (positive/negative/adversarial),
      definitionEnrichment consumption, governance prohibitions, durable-knowledge instruction,
      domain-boundary deferral to architecture-definition, determinism, zero-write.

## Coexistence Scenarios

- [x] A — Sensitive multi-tenant SaaS (both applicable)
- [x] B — Persistence vs. retention (no ownership overlap)
- [x] C — Sensitive data, no architecture signal (Data only)
- [x] D — Architecture only, no data-governance signal (Architecture only)
- [x] E — Approved durable data decision (no reopening/duplication)
- [x] F — Approved architecture decision, Data evaluates consequences only
- [x] G — Contradictory data requirements (surfaced, not reconciled)
- [x] H — Weak data signals (not applicable)
- [x] I — Deferred data concern (respected)
- [x] J — Existing unresolved data decision (enriched, not duplicated)

## Applicability Adversarial Review

- [x] False positives/negatives, generic "data"/"database"/"schema"/"storage", headings, code
      blocks, negative statements, architecture-specific context — each explicitly checked.

## Architecture Regression

- [x] Full `skill-architecture-definition.test.js` run unmodified; confirm no unintentional
      behavior change.

## Cross-Skill / Ordering

- [x] Inspect combined `aief prompt --skill architecture-definition --skill data-definition`-style
      output (or sequential invocation) for repeated-but-harmless durable-knowledge instructions,
      no contradictory directions, no ownership crossover.
- [x] Confirm Skill order does not change correctness.

## Defects

- [x] Classify every finding; fix only REAL DEFECT findings at smallest coherent scope; add a
      regression test and rerun the affected scenario for each fix.

## E2E Pilot

- [x] One disposable scratch project (B2B SaaS: multiple customers, sensitive employee/customer
      records, enterprise auth, ERP integration, undefined retention, unclear region, no
      architecture) run end to end: bootstrap → analyze → Definition → both Skills → human
      decisions → verify --strict FAIL → decisions recorded → verify --strict PASS → close.
- [x] Final tree inspected: no application code, no infrastructure, no hidden state, no second
      decision store, no duplicated governed concern.

## Verification

- [x] Full suite: `npm test` (≥ 940, 0 fail).
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.
- [x] `git diff --stat` / `git diff --name-status` reviewed against the scope guard.

## Evidence

- [x] Update evidence.md with the full scenario matrix, coexistence analysis, and pattern verdict.
