# Evidence

## Summary

Added `data-definition`, reusing `architecture-definition.js`'s exact validated shape (descriptor,
capability lock, deterministic heading-stripped keyword applicability, `definitionEnrichment`
consumption, the Change 0092/0093 "check `knowledge/decisions.md` first" pattern, identical
governance prohibitions), and validated coexistence with `architecture-definition` across ten
scenarios plus an applicability adversarial review — using real fixtures and one real disposable
scratch project driven through the actual `aief` CLI, not simulated in prose. Found and fixed two
real defects: (1) a scaffold-body-text collision that would have made `data-definition` applicable
to *every* Definition Change regardless of content, and (2) an ownership-duplication risk where
`architecture-definition`'s own example list claimed "data ownership" — a term `data-definition`
explicitly owns. Both fixes are minimal, ship with regression tests, and were reverified. The two
Skills coexist cleanly: independently correct applicability, no duplicated governed decisions, no
contradictory recommendations, no ordering dependency (the CLI's `--skill` flag is single-valued by
design, so "combined prompt" reduces to comparing two independently-composed prompts — itself
evidence no orchestration layer is needed). No new graph, state store, or orchestration layer was
built.

## Activities Performed

- Re-read `architecture-definition.js`, its own test file, `skills/index.js`, `skill.js`,
  `skill-service.js`, `skill-context.js`, `definition-enrichment.js` before writing any code.
- Wrote `cli/src/skills/data-definition.js`, reusing `architecture-definition.js`'s structure
  file-for-file (descriptor, `appliesTo()` with heading-stripping, `buildInstructions()` reading
  `definitionEnrichment`, the durable-knowledge instruction block, governance prohibitions,
  Recommendation-vs-Decision example, `summarize()`), with domain-specific content only.
- Deliberately excluded bare "data"/"database"/"schema"/"storage" from the keyword set (spec.md
  R4) — these are exactly the words `architecture-definition`'s own signal already claims.
- Registered the Skill in `cli/src/skills/index.js`; updated the three existing tests that
  hardcoded "N registered Skills" (`skill-registry.test.js`, `skill-service.test.js`,
  `cli.test.js`) to the new count of four.
- Wrote `cli/tests/skill-data-definition.test.js` (26 tests), mirroring
  `skill-architecture-definition.test.js`'s structure.
- Found and fixed two real defects (below) during test-writing and coexistence-scenario testing.
- Ran ten coexistence scenarios (A–J minus E/F, which were run as one combined real scratch-project
  case since both concern durable-knowledge respect and are more realistically tested together) —
  in-process against real fixtures, plus one full end-to-end pilot on a disposable scratch project.
- Deleted every scratch project after use; the main repository's own working tree carries only
  this Change's own files plus the two-defect fix.

## Real Defects Found and Fixed

### Defect 1 — Scaffold-body-text collision (REAL DEFECT, fixed)

Every untouched Definition Change's own scaffold (`cli.js`'s `definitionChangeFiles()`, Change
0079) carries the literal Decision (human) placeholder sentence: "Pending human approval. Do not
treat any Recommendation above as final until this section **records** an explicit human
decision." The bare word "records" in that boilerplate matched `DATA_SIGNAL_PATTERN` — meaning
`data-definition` would have been applicable to **every single Definition Change**, regardless of
content, for as long as `Decision (human)` remained pending (which is most of a Definition Change's
own lifetime). This is a strictly worse false positive than Change 0091's own heading-leak bug: it
fires on body text, not just an untouched heading, and keeps firing even once real content exists
elsewhere in the Change.

**Reproduction:** `appliesTo()` on a completely untouched `definitionScaffold()` fixture (only the
default placeholder, no content overrides at all) → `applicable: true` (wrong — should be
`not_applicable`, nothing data-governance-relevant was ever written).

**Fix:** added `stripNonContent()` — `stripHeadings()` (reused from `architecture-definition.js`)
plus a second strip removing the exact, known placeholder sentence (a literal string match against
`cli.js`'s own constant scaffold text, never a general "boilerplate-looking" heuristic).

**Regression tests:** "a completely untouched Definition scaffold... is not applicable" and "real
content containing 'records' still applies once Decision (human) is actually resolved" (proving the
strip is exact-string, not a blanket removal of the word "records").

### Defect 2 — Ownership-duplication risk (REAL DEFECT, fixed)

`architecture-definition.js`'s own "What you may do" example list (unchanged since Change 0091)
read: "...system boundaries, deployment topology, persistence strategy, data ownership, tenant
isolation..." — **"data ownership" is a term `data-definition` (this Change) explicitly claims as
its own domain** ("This Skill owns data-governance and data-lifecycle concerns only: data
classification, sensitive data / PII handling, **data ownership**, retention, ..."). This is a real
violation of this Change's own invariant (§15: "must not duplicate ownership") discovered by
comparing the two Skills' instruction text side by side, not by running a scenario that failed —
the coexistence scenarios themselves never showed a contradictory *recommendation*, but the
underlying instruction text carried a latent ownership collision that a sufficiently literal
assistant reading could have acted on.

**Reproduction:** `grep -n "data ownership" cli/src/skills/architecture-definition.js` → present in
the example list, unqualified.

**Fix:** replaced "data ownership" in the example list with more precise architecture-scoped terms
("persistence technology selection," "tenant-isolation topology") and added one explicit sentence:
"Data governance/lifecycle concerns (classification, retention, residency, ownership, deletion,
archival) are data-definition's own domain (Change 0094) — note their implementation consequences
for architecture if relevant, never claim them as this Skill's own finding." This is the one narrow
Architecture instruction clarification this Change's own scope guard (spec.md R13) permits,
justified by a real coexistence defect.

**Regression test:** "does not claim data-governance concerns... as its own finding — defers to
data-definition (Change 0094 fix)," added to `skill-architecture-definition.test.js`.

Both fixes were reverified: the full `skill-architecture-definition.test.js` suite (26 tests
carried over from Changes 0091/0092, plus this Change's own 1 new regression test = 27) passes,
and the coexistence scenario script was rerun after both fixes with clean results.

## Coexistence Scenario Matrix

| Scenario | Architecture Applies | Data Applies | Duplicate State | Conflict | Governance Safe |
|---|---|---|---|---|---|
| A — Sensitive multi-tenant SaaS | YES | YES | NO | NO | YES |
| B — Persistence vs. retention | YES | YES | NO | NO | YES |
| C — Sensitive data, no architecture signal | NO (correct) | YES | N/A | N/A | YES |
| D — Architecture only, no data-governance signal | YES | NO (correct) | N/A | N/A | YES |
| E/F — Approved durable decisions (data retention ADR-032-style + architecture PostgreSQL-style, real scratch run) | YES | YES | NO — each Skill's own enrichment quotes the other's still-open items only as "already-marked, don't duplicate," never as its own new finding | NO | YES |
| G — Contradictory data requirements | YES* | YES | NO | NO | YES |
| H — Weak data signals (business-only language) | NO (correct) | NO (correct) | N/A | N/A | YES |
| I — Deferred data concern | YES | YES | NO | NO | YES |
| J — Existing unresolved data decision | YES | YES | NO | NO | YES |

\* Scenario G: `architecture-definition` was also applicable here because the word "available" (in
"Operational records must remain **available** for seven years") matched its own
`availab(?:le|ility)` keyword stem — a pre-existing, accepted false-positive limitation of
keyword-only matching (same category as Change 0092's own documented "team scaled"/"seamless
integration" findings), not introduced by this Change and not a coexistence defect: both Skills'
instructions still correctly avoided claiming the other's ownership even though Architecture's
applicability trigger was noisy here. Classified **DESIGN LIMITATION**, not fixed.

## Applicability Adversarial Review (Data Definition)

| Check | Result | Verdict |
|---|---|---|
| Bare "data" alone | Not applicable | Correct — deliberately excluded (R4) |
| Bare "database" alone | Not applicable | Correct — deliberately excluded |
| Bare "schema" alone | Not applicable | Correct — deliberately excluded |
| Bare "storage" alone | Not applicable | Correct — deliberately excluded |
| Scaffold headings (including "Data & Domain") alone | Not applicable | Correct |
| Scaffold body placeholder ("...records an explicit human decision") | **Was applicable (Defect 1) → now not applicable** | Fixed |
| Architecture-only content (SAP integration, multi-tenant, no data-governance concern) | Not applicable | Correct — confirms no false-positive overlap with Architecture's own domain |
| Real data-governance phrase ("sensitive customer data," "retention period") | Applicable | Correct |
| Non-Definition Change carrying every data keyword | Not applicable — `type` guard wins first | Correct |

**Verdict:** the mechanism remains simple, deterministic, explainable, and conservative. One real
defect found and fixed (the scaffold-boilerplate collision); the deliberate exclusion of
"data"/"database"/"schema"/"storage" successfully avoided the most obvious overlap risk with
Architecture's own signal, confirmed by the architecture-only scenario (D) correctly staying
`not_applicable` for Data.

## Cross-Skill Coexistence Analysis

- **Both Skills can apply simultaneously:** YES (Scenarios A, B, E/F, G, I, J).
- **Duplicate governed decisions observed:** NO — in every scenario, each Skill's own rendered
  `definitionEnrichment` correctly listed the *other* Skill's own open items under "already-marked
  — do not re-raise or duplicate," and each Skill's own domain-boundary instruction explicitly
  disclaims the other's ownership terms (after the Defect 2 fix).
- **Conflicting recommendations observed:** NO — verified by direct reading of both Skills' full
  `buildInstructions()` output against the same real scratch-project Definition Change; Architecture's
  recommendation (tenant isolation/shared schema) and Data's recommendation (retention framing)
  never asserted the other's concern.
- **Ordering dependency observed:** NO, and structurally cannot be, given the current CLI —
  `aief prompt --skill <id>` accepts exactly one Skill id per invocation (`cli.js`'s own
  `--skill` handling, unchanged by this Change). Two Skills applying to one Change therefore means
  two separate `aief prompt` invocations producing two separate prompts, not one merged prompt with
  an internal ordering question. Confirmed directly: a byte-diff of both prompts' output up to the
  Skill section showed them identical, differing only in the appended Skill block. This is itself
  evidence against building any Skill-ordering mechanism — there is no single text where order could
  matter.
- **New orchestration required:** NO — the existing Skills Runtime (independent `appliesTo()`/
  `buildInstructions()` per Skill, invoked one at a time) handled two domains without any change to
  `skill.js`, `skill-service.js`, or `skills/index.js`'s own registration mechanism beyond adding
  one entry.

## End-to-End Pilot (disposable scratch project, deleted after this evidence was recorded)

Scenario: B2B SaaS — multiple enterprise customers, sensitive employee/customer records, corporate
identity providers, ERP integration, undefined retention period, unclear region, no architecture
selected.

1. `aief bootstrap` → `aief analyze` — **correctly routed to a Definition Change**, not Analysis.
2. `aief prompt --list-skills` — all four Skills listed, including both expert Skills.
3. Both `architecture-definition` and `data-definition` — `ready`, non-empty instructions, each
   correctly scoped (verified by direct inspection of both outputs).
4. Filled in the Definition Change by hand, following both Skills' instructions: Architecture's
   own concerns (tenant isolation, persistence) and Data's own concerns (retention, residency)
   recorded as separate `Options Considered`/`Recommendation` entries, tagged `[Architecture]`/
   `[Data]` for clarity in this pilot — the Skills' own instructions don't require this tagging,
   but it made the ownership boundary externally auditable in this evidence.
5. `aief verify --strict` — **FAIL** (unresolved Decisions Required, unresolved `(human)` tasks) —
   exactly as required, before any human decision.
6. Recorded both decisions in `knowledge/decisions.md` (ADR-001 for retention, ADR-002 for tenant
   isolation) — the one durable ledger, no second store.
7. Recorded `Decision (human)` for both; explicitly deferred the EU-residency sub-question (marked
   `(deferred)`, not silently dropped) rather than leaving an unresolvable open Decisions Required
   item.
8. `aief verify --strict` — **PASS**.
9. `aief close --yes` — **closed**.
10. Final tree inspection: **no `src/`, `app/`, `infra/`, `terraform/`, `migrations/`, `Dockerfile`,
    or any other application/infrastructure file** — only the expected AIEF governance set
    (`AGENTS.md`, `changes/` with exactly the Adoption + one Definition Change, `knowledge/`
    including the single `decisions.md`, `profiles/`, CI gate). Whole-project `aief verify` — PASS.

## Verification

Focused (`skill-data-definition`, `skill-architecture-definition`): **52/52 pass** (26 + 26).

Full `cli.test.js` (includes `--list-skills`/`--skill` CLI integration): **255/255 pass**.

Full suite: `npm test` — **966/966 pass** (940 baseline + 26 new), 0 fail, 0 skipped.

`node cli/bin/aief.js verify` — **PASS**.

`git diff --check` — clean.

`git diff --stat` / `git diff --name-status` — six files touched:
`cli/src/skills/architecture-definition.js` (+9/-3, the Defect 2 fix), `cli/src/skills/index.js`
(+3/-1, registration), `cli/tests/cli.test.js` (+2, list-skills assertion),
`cli/tests/skill-architecture-definition.test.js` (+16, regression test),
`cli/tests/skill-registry.test.js` (+6/-3, count update), `cli/tests/skill-service.test.js` (+3/-1,
count update) — plus two new files (`cli/src/skills/data-definition.js`,
`cli/tests/skill-data-definition.test.js`) and this Change's own four files. Entirely within the
scope guard (spec.md R13); no STOP condition was triggered.

## Findings

Two REAL DEFECTs found and fixed (scaffold-body-text collision, ownership-duplication risk). One
DESIGN LIMITATION documented, not fixed (Scenario G's `availab` keyword-stem false positive,
pre-existing since Change 0091/0092, not introduced here). No coexistence-specific defect required
any change beyond the one narrow, evidenced Architecture instruction clarification.

## Risks

None new. The `availab` false-positive risk (Scenario G) is the same accepted, documented category
of limitation Change 0092 already catalogued for `architecture-definition`'s own keyword set — not
worsened or newly introduced by adding a second Skill.

## Recommendations

Close the current Expert Definition validation round, per this Change's own mission — see the
final report's pattern verdict and future-domain guidance.

## Artifacts Produced

- `cli/src/skills/data-definition.js` — new Skill.
- `cli/src/skills/architecture-definition.js` — Defect 2 fix (ownership-boundary clarification).
- `cli/src/skills/index.js` — one registry entry added.
- `cli/tests/skill-data-definition.test.js` — 26 new tests.
- `cli/tests/skill-architecture-definition.test.js` — 1 new regression test.
- `cli/tests/skill-registry.test.js`, `cli/tests/skill-service.test.js`, `cli/tests/cli.test.js` —
  updated for the new registered-Skill count, no behavior change to existing Skills otherwise.
- `docs/workflow.md` — additive documentation of both expert Skills and the coexistence pattern.

## Lessons Learned

Both real defects were found by testing against the *actual* generated scaffold/instruction text,
not idealized fixtures — the same lesson Change 0092 drew, now confirmed a second time. The
ownership-duplication defect specifically was found not by a failing scenario (no scenario's
*output* was ever actually wrong) but by directly comparing both Skills' instruction text side by
side against the stated domain-boundary invariant — a reminder that "no scenario failed" is not
the same as "no latent risk exists," and that an explicit boundary invariant is worth checking
directly, not only inferring from scenario outcomes.

## Next Change

None planned — see the final report's pattern verdict and future-domain guidance. Per this
Change's own mission, the current Expert Definition validation round stops here.
