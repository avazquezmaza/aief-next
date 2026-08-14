# Evidence

## Summary

Ran ten realistic-messiness validation scenarios against the `architecture-definition` Skill
(Change 0091), plus an explicit applicability adversarial review, using real fixtures
(`buildSkillContext()`/`appliesTo()`/`buildInstructions()` directly) and real disposable scratch
projects driven through the actual `aief` CLI. Found and fixed two real defects, both scoped
entirely to `cli/src/skills/architecture-definition.js`: (1) a keyword false-negative on the
mission's own contradiction scenario ("isolated data" vs. "shared schema" triggered nothing), and
(2) the Skill's instructions never told the assistant to check `knowledge/decisions.md` before
recommending, risking exactly the "recommend against an approved decision" failure mode the
mission is most concerned about. Both fixes are minimal, textual/keyword-only, ship with
regression tests, and were reverified against the scenarios that exposed them. No new graph,
state store, approval mechanism, or Definition redesign was needed or added.

## Activities Performed

- Re-read `architecture-definition.js`, `skill-context.js`, `definition-enrichment.js`,
  `cli.js`'s `prompt()` composer, `verify --strict`'s Definition-completeness checks, `close`
  readiness, and `knowledge/decisions.md`'s existing ADR-format convention, from the current
  source — not from the prior report's summary.
- Built an in-process scenario runner (`buildSkillContext()` + `appliesTo()`/`buildInstructions()`
  directly) for Scenarios A, B, D, F, I, J and the applicability adversarial-review cases —
  fast, deterministic, no filesystem/CLI overhead for pure content-classification questions.
- Built two real disposable scratch projects, driven through the actual `aief` CLI
  (`bootstrap` → `analyze` → `prompt --skill architecture-definition`), for Scenarios C, E, G, H,
  which require multi-file context (`README.md`, `docs/prd.md`, `knowledge/decisions.md`, the
  Definition Change itself) that only a real project layout exercises.
- Found two real defects (below), fixed both at the smallest scope, added 8 new regression tests,
  and reran every scenario the fixes touched to confirm.
- Deleted every scratch project after use; the main repository's own working tree carries only
  this Change's own files plus the two-defect fix.

## Scenario Matrix

| Scenario | Applicable | Useful | Duplicates | Invents | Governance Safe | Defect |
|---|---|---|---|---|---|---|
| A — Incomplete PRD | YES | YES — surfaced 4 real missing decisions as `(ambiguous)`, already recorded by the human, never re-derived | NO | NO — quoted only what the Change already says; no scale/availability/provider asserted | YES | None |
| B — Contradictory requirements | **NO → YES after fix** | YES after fix — applicability now triggers on the isolation-vs-schema contradiction | NO | NO | YES | **REAL DEFECT (fixed)** |
| C — Existing approved decision (PostgreSQL) | YES | YES after fix — instructions now direct the assistant to check `knowledge/decisions.md` first | NO after fix | NO | YES | **REAL DEFECT (fixed)** |
| D — Existing unresolved decision | YES | YES — `definitionEnrichment.decisionRequired` correctly surfaced the existing "Tenant isolation model" item | NO — instructions explicitly say "do not re-raise or duplicate these" | NO | YES | None |
| E — Approved decision (Azure) + new related concern (regional topology) | YES | YES — same check-first instruction as C distinguishes "decided" (Azure) from "still open" (regional topology, in `decisionRequired`) | NO | NO | YES | None (fixed by the same C fix) |
| F — Weak architecture signals (work-order business language) | NO (correctly) | N/A — correctly inert, no false activation | N/A | N/A | YES | None |
| G — Mixed context across README/PRD/knowledge/decisions.md/Change | Applicable, but see finding | PARTIAL — see "Design Limitation" below | N/A | NO | YES | DESIGN LIMITATION (documented, not fixed — out of scope) |
| H — Irrelevant historical knowledge (unrelated ADR) | YES | YES — new instruction text explicitly excludes unrelated historical decisions from shaping the recommendation | NO | NO | YES | None (fixed by the same C fix) |
| I — Deferred integration | YES | YES — `(deferred)` item correctly surfaced under "do not re-raise or duplicate" | NO | NO | YES | None |
| J — Previously resolved ambiguity (marker vs. durable knowledge disagree) | YES | N/A — this is a repository-state question, not an applicability question | N/A | N/A | YES | DOCUMENTATION/CONVENTION ISSUE (see below — not a Skill defect) |

## Scenario Detail

### A — Incomplete PRD

Input: a Definition Change with `Known Requirements` (corporate identity auth, dashboards,
ERP integration) and four `(ambiguous)`-marked `Open Questions` (tenant count, retention, region,
availability). `appliesTo()` → `applicable: true` (auth + integration keywords). Instructions
quoted the existing `(ambiguous)` items verbatim and instructed "do not re-raise or duplicate
these"; nowhere did the instructions assert a tenant count, retention period, region, or
availability number — the Skill only ever quotes the Change's own already-written content, it
never generates facts. `Decision (human)` was never referenced as anything but "leave exactly as
you found it."

### B — Contradictory requirements (REAL DEFECT, fixed)

Input: `Known Requirements` = "Each customer must have completely isolated data." /
"All customers must share one database schema for operational simplicity." — a direct
architecture contradiction, and the mission's own paradigm adversarial case.

**Before fix:** `appliesTo()` → `applicable: false` (`no architecture-relevant signal found`).
Neither "isolated"/"isolation" nor "schema"/"database" matched any keyword in
`ARCHITECTURE_SIGNAL_PATTERN` — a genuine architecture contradiction produced zero Skill output.
This directly undermines the product's own stated value for exactly the scenario the mission
called out as the primary adversarial case for this domain.

**Fix:** extended the fixed keyword set with `isolat(?:e|ed|ion)`, `schema`, `database` — three
words, same deterministic mechanism, no new classification logic.

**After fix:** `appliesTo()` → `applicable: true`. Locked in by
`skill-architecture-definition.test.js`'s new "a data-isolation vs. shared-schema contradiction is
applicable" test.

The Skill's instructions were already correct on *how* to handle a contradiction once triggered:
"surface it as an Option with trade-offs, or as a Decision required, never as a fact" and "DO NOT
silently choose... on the project's behalf" — this part needed no change; only applicability was
broken.

### C — Existing approved architecture decision (REAL DEFECT, fixed)

Setup: a real scratch project (`aief bootstrap` → `analyze`, routed to Definition) with
`knowledge/decisions.md` seeded with an approved ADR ("PostgreSQL is the system of record"), and
the Definition Change carrying a related, still-open "Tenant isolation model" decision.

**Before fix:** ran `aief prompt --skill architecture-definition` and inspected the **full**
composed prompt (not just the Skill's own instructions block) — `knowledge/decisions.md`'s content
appeared *nowhere*: the file is referenced only as a *write target* ("record it there once
approved"), never as something to read. An assistant following only the Skill's instructions had
no way to know PostgreSQL was already decided, and could plausibly recommend MongoDB or another
persistence technology as though the question were still open.

**Fix:** added a "Check durable knowledge first" section to `buildInstructions()`: before drafting
anything, check `knowledge/decisions.md` (if it exists); an approved decision there is
authoritative — do not recommend against it, do not contradict it, do not duplicate it as a new
Decisions Required entry; only note new consequences/prerequisites it creates; if the Change's own
content genuinely conflicts with an approved decision, surface the conflict explicitly for human
reconsideration, never silently override it.

**Why this fix, not a Skill Context field:** per this Change's own non-goal against widening Skill
Context without a demonstrated need, and because the fix that actually solves the problem is
telling the assistant (which already has real filesystem access in its own working session) to go
read the file itself — zero new I/O anywhere in AIEF's own code, zero new Skill Context field, the
smallest coherent fix available. Confirmed against a rerun of the same scratch project: the
composed prompt's Skill section now explicitly instructs the check.

### D — Existing unresolved decision

Input: `Decisions Required` = "Tenant isolation model. (decision required)",
`Options Considered` = "Shared schema. / Schema per tenant." `context.definitionEnrichment`
correctly returned `decisionRequired: ["Tenant isolation model. (decision required)"]`; the
Skill's instructions quoted it under "do not re-raise or duplicate these, build on them instead."
This is the direct proof that `definitionEnrichment` (Change 0090) does what it was built for:
the Skill never asked the assistant to add a second, duplicate tenant-isolation decision entry.

### E — Approved decision + new related concern

Same scratch project as C, with an additional approved "Deploy on Azure" ADR and open
"regional topology"/"availability zones"/"disaster recovery" items in `Decisions Required`. The
same Check-durable-knowledge-first instruction (fixed under C) applies identically here — no
second mechanism was built. The instruction explicitly distinguishes "already decided" (do not
reopen) from "a genuinely new decision that approved decision creates" (regional topology on top
of an already-chosen cloud is exactly this) — the same wording, not scenario-specific logic.

### F — Weak architecture signals

Input: "Users can create work orders. Managers approve work orders. Reports can be exported." —
no security, integration, persistence, deployment, scale, or tenancy language anywhere.
`appliesTo()` → `applicable: false`, correctly. This confirms the Change 0091 heading-stripping
fix still holds, and that the Scenario-B keyword additions (`isolat`/`schema`/`database`) did not
reintroduce false-positive activation on ordinary business language — verified by a new permanent
regression test.

### G — Mixed context across files (DESIGN LIMITATION, documented, not fixed)

Setup: `README.md` ("enterprise SaaS"), `docs/prd.md` ("external ERP integration"),
`knowledge/decisions.md` ("OIDC provider approved" — used the PostgreSQL/Azure ADRs above as the
concrete instance), Definition Change (tenant isolation unresolved).

Finding: `aief prompt`'s composed "Read these files first" list includes `README.md` (existing,
general behavior, unrelated to this Change) but **never** `docs/prd.md` or any other `docs/*` file,
and — as found under C — never `knowledge/decisions.md`. This is a **pre-existing, general
prompt-composition limitation**, not introduced by Change 0090/0091 and not specific to
`architecture-definition` — every Skill and every profile shares the same composed "Read these
files first" list. Fixing it generally (e.g. always listing every `docs/*.md` file) is a broader
prompt-composition change than this Change's own scope guard (spec.md R14) permits, and risks
exactly the "broad runtime change" this Change is instructed to stop and report rather than
silently absorb. **Classification: DESIGN LIMITATION — real, but out of scope for 0092.**
Recorded as a candidate for a future, separately-scoped prompt-composition Change if it proves to
materially matter in practice (the C fix already mitigates the `knowledge/decisions.md` half of
this specifically for the architecture Skill).

### H — Irrelevant historical knowledge

Same `knowledge/decisions.md` as C, with an added unrelated ADR ("the public marketing site uses a
static site generator — a separate property from the SaaS application"). The Check-durable-
knowledge-first instruction (fixed under C) explicitly states: "Only decisions actually relevant
to this Change's own concerns matter here — an unrelated historical decision elsewhere in the
project's `knowledge/decisions.md` is not architecture context for this Change and should not
shape a recommendation." No ADR query engine, scoping mechanism, or filtering logic was built —
this is instruction text only, exactly as the mission requires (section 15: "do not build an ADR
query engine in this Change").

### I — Deferred integration

Input: `Open Questions` = "ERP synchronization design will be decided during Delivery.
(deferred)". `definitionEnrichment.deferred` correctly surfaced it; the Skill's generic
"already-marked items — do not re-raise or duplicate these, build on them instead" instruction
covers `deferred` exactly the same as `ambiguous`/`decisionRequired`/`humanApprovalRequired` — no
separate deferred-specific carve-out exists or was needed. Locked in by a new regression test.

### J — Previously resolved ambiguity (DOCUMENTATION/CONVENTION ISSUE, not a Skill defect)

Scenario: a Definition Change's `Open Questions` still marks "Expected scale? (ambiguous)" while
(hypothetically) a human separately recorded "Expected initial load: 500 users / 50 concurrent" in
`knowledge/decisions.md` without updating the Change's own marker.

Finding: `analyzeDefinitionSections()` reads only `change.md` — by design (ADR-009, "no hidden
state," ADR that every Definition fact lives in the Change's own visible file, never
cross-referenced or inferred from a second source). If a value becomes known, the correct action
is for the human/assistant to *edit `change.md`'s own line* — remove the `(ambiguous)` marker and
move the value into Known Requirements — the same discipline every other Definition Change already
requires. **Classification: DOCUMENTATION/CONVENTION ISSUE**, not a Skill limitation and not an
AIEF core defect: automatically reconciling `change.md` markers against `knowledge/decisions.md`
content would itself be exactly the "automatic human decision completion" / "AI maturity
classification" the mission's overengineering guard prohibits. The Check-durable-knowledge-first
instruction added under C incidentally helps here too (an assistant checking
`knowledge/decisions.md` first would notice the resolved value and could prompt a human to update
the marker), but no automatic reconciliation was built, and none should be.

## Applicability Adversarial Review

| Check | Result | Verdict |
|---|---|---|
| False positive: scaffold headers alone | Not applicable (Change 0091's own fix holds) | Correct — verified by existing regression test |
| False positive: generic words ("system", "data") alone | Not applicable | Correct, no false positive |
| False positive: negative statement ("we will not use multi-tenancy") | Applicable | **Accepted, documented limitation** — the mechanism is a keyword match, not sentiment analysis; a negative statement about tenancy is still real tenancy-relevant content worth a human/assistant look, so this is arguably a reasonable outcome, not a harmful one. Not fixed (would require semantic classification, explicitly prohibited). |
| False positive: "integration" in a non-architecture sense ("seamless team integration") | Applicable | **Accepted, documented limitation** — same reasoning; keyword-only matching cannot distinguish sense without semantic classification, which is explicitly out of scope. |
| False negative (before fix): "isolated data" / "shared schema" contradiction | Not applicable | **REAL DEFECT — fixed** (see Scenario B). |
| Case sensitivity | `AUTHENTICATION` (uppercase) matches correctly (`/i` flag) | Correct |
| Signal inside a fenced code block | Matches (content, not header) | Correct — code-block content is still real Change content |
| Word-boundary precision: "scaled" (team headcount) vs. "scale" (system scale) | Does not match `\bscale\b` or `scalab...` | Coincidentally correct here — "the team scaled up" is genuinely not a system-scale statement, so the non-match is contextually reasonable, not merely lucky pattern behavior. |
| Non-Definition Change carrying every keyword | Not applicable — `type` guard wins first | Correct, verified by existing regression test |

**Verdict:** the mechanism remains simple, deterministic, explainable, and conservative overall.
One real gap was found and fixed (Scenario B). The remaining false-positive cases are accepted,
documented limitations inherent to any keyword-only mechanism — fixing them would require semantic
or LLM classification, which the mission explicitly prohibits. No threshold, weighting, or scoring
was added.

## Adversarial Review (mission §32)

- Did the Skill duplicate existing governed decisions? **NO** — Scenario D/E, verified by test and
  live scratch run.
- Did it contradict approved knowledge? **NO** — the C fix makes approved decisions authoritative
  by instruction; nothing in the Skill can write, so it cannot contradict anything structurally
  either.
- Did it invent requirements? **NO** — Scenario A; the Skill only ever quotes the Change's own
  content, never asserts a new fact.
- Did it convert deferred concerns into blockers? **NO** — Scenario I.
- Did it over-trigger on weak signals? **NO** — Scenario F, and the applicability review above.
- Did it miss obviously relevant architecture contexts? **Partially, before the fix** — Scenario B
  (fixed). Scenario G's cross-file gap is real but pre-existing/general, not specific to this
  Skill, and out of this Change's scope.
- Did it force recommendations with insufficient evidence? **NO** — instructions explicitly permit
  "insufficient evidence to recommend yet" / a conditional Recommendation (unchanged from Change
  0091; no scenario surfaced a case where the Skill's own text forces a conclusion).
- Did it alter `Decision (human)`? **NO** — structurally impossible (zero write capability);
  verified by capability-lock test.
- Did it alter human tasks? **NO** — same.
- Did it generate application code? **NO** — no scratch project in this Change gained any
  `src/`/`app/`/`infra/`/`terraform/`/`migrations/`/`Dockerfile` file.
- Did it introduce assistant-specific behavior? **NO** — `grep -i "claude|gemini"` against the
  full, fixed source file returns nothing; the existing source-level test still passes.
- Did realistic usage reveal a need for a new graph? **NO** — every scenario resolved via existing
  Definition sections, markers, `knowledge/decisions.md`, and (for D/E) `definitionEnrichment` —
  no scenario needed a query across multiple Changes, a formal dependency traversal, or anything
  `dependsOn` doesn't already cover.
- Did fixes expand Architecture-specific logic into AIEF core unnecessarily? **NO** — both fixes
  are confined to `cli/src/skills/architecture-definition.js` and its own test file; `skill.js`,
  `skill-service.js`, `skill-context.js`, `definition-enrichment.js`, and `cli.js` are byte-for-
  byte untouched (confirmed by `git diff --name-status`).

## Verification

Focused: `node --test cli/tests/skill-architecture-definition.test.js` — **26/26 pass** (18 from
Change 0091 + 8 new).

Full suite: `npm test` — **940/940 pass** (932 baseline + 8 new), 0 fail, 0 skipped.

`node cli/bin/aief.js verify` — **PASS**.

`git diff --check` — clean.

`git diff --stat` / `git diff --name-status` — exactly two files touched by the fix:
`cli/src/skills/architecture-definition.js` (+22/-1) and
`cli/tests/skill-architecture-definition.test.js` (+92) — within the scope guard (spec.md R14); no
STOP condition was triggered.

## Findings

Two REAL DEFECTs found and fixed (Scenario B keyword gap, Scenario C/E/H missing
check-durable-knowledge-first instruction). One DESIGN LIMITATION documented, not fixed (Scenario
G's cross-file prompt-composition gap — pre-existing, general, out of scope). One
DOCUMENTATION/CONVENTION ISSUE identified and explained, not a code defect (Scenario J's
marker-vs-durable-knowledge staleness — the correct fix is always editing `change.md` itself, per
ADR-009). Several accepted, documented applicability limitations (negative statements, non-
architecture senses of "integration") — inherent to keyword-only matching, explicitly not worth
fixing per the mission's own overengineering guard.

## Risks

None new. The `docs/prd.md`/`knowledge/decisions.md` cross-file visibility gap (Scenario G) is a
pre-existing risk across the whole product, not introduced or worsened by this Change — flagged as
a candidate for a future, separately-scoped prompt-composition Change if it proves to matter in
practice.

## Recommendations

See this Change's own final report for the generalization verdict and second-domain
recommendation.

## Artifacts Produced

- `cli/src/skills/architecture-definition.js` — two real-defect fixes (keyword extension,
  check-durable-knowledge-first instruction).
- `cli/tests/skill-architecture-definition.test.js` — 8 new regression tests.
- This Change's own `change.md`/`spec.md`/`tasks.md`/`evidence.md`.

## Lessons Learned

Realistic, adversarial scenario testing (not just unit tests against idealized fixtures) surfaced
two real gaps a pure-design review would not have: a keyword omission only visible when testing
the mission's own contradiction language verbatim, and a cross-file visibility gap only visible
when inspecting the actual full composed `aief prompt` output rather than just the Skill's own
`buildInstructions()` return value.

## Next Change

None planned in this Change — see the final report's generalization verdict and (if applicable)
second-domain recommendation for what should come next.
