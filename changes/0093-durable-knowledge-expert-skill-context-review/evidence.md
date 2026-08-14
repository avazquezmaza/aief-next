# Evidence

## Summary

Traced the actual durable-knowledge model, prompt composition, and Skill Context against current
source (not the Change 0092 report's summary), evaluated six realistic scenarios — two of them
against this repository's own real, 31-ADR/1437-line `knowledge/decisions.md` rather than a
hypothetical — and applied the mission's own six-criterion Foundation Change Threshold explicitly.
Three of six criteria fail against real evidence (only one expert Skill exists yet; no material
duplication/risk has been demonstrated beyond the single defect Change 0092 already fixed; and
whole-ledger injection would create measurable, real noise for any domain-scoped Skill). **Verdict:
A — KEEP AS-IS.** No runtime code was changed in this Change.

## 1. Current Durable Knowledge Model (traced against source)

- **Authority:** `knowledge/decisions.md` is the one durable-decision ledger — confirmed by its own
  header (`knowledge/decisions.md:1-3`): "Key decisions behind AIEF Next. Each entry follows a
  lightweight ADR format: decision, context, consequences. Entries are accepted unless explicitly
  marked otherwise."
- **Real structure (this repo's own file, used as concrete evidence, not a hypothetical):** 1437
  lines, 31 `## ADR-NNN` entries, reverse-numeric-chronological (ADR-031 first, ADR-008 last —
  confirmed by `grep -n "^## ADR-"`), free-text `**Status: Accepted (date), by the project
  owner.**` on every entry inspected — **no structured Approved/Superseded/Rejected field exists
  anywhere in this ledger**; "accepted unless explicitly marked otherwise" is a prose convention,
  not a machine-parseable one.
- **Writers:** humans/assistants editing the file directly, per the Definition Change workflow's
  own instruction ("record it in knowledge/decisions.md" — `cli.js:1109`'s `isDefinition` block).
  No AIEF command writes to it programmatically.
- **Readers:** none, in code. `grep -rn "decisions.md" cli/src/*.js cli/src/**/*.js` (excluding
  tests) returns only string literals inside scaffold templates and prompt text (`cli.js:593-595`,
  `cli.js:1109`) and the three references inside `architecture-definition.js`'s own instruction
  text (Change 0092) — **zero `fs.readFileSync`/`fs.existsSync` calls against `decisions.md`
  anywhere in `cli/src/`.**
- **Prompt inclusion:** not included, ever — see §2.
- **Skill Context inclusion:** not included, ever — see §3.

## 2. Current Prompt Composition (traced end to end, `cli.js`'s `prompt()`)

The composed prompt's fixed "Read these files first" block
(`cli.js:1109`) lists, in order: `change.md`/`spec.md`/`tasks.md`, the assistant file (if present),
`README.md` (if present), `knowledge/skills.md` (if present) — then standards, skills, workflow,
SDD, the invoked Skill's own section, hook output, evidence guard, feedback note. **`knowledge/decisions.md`
never appears in this list, for any Change type, any profile, any assistant.** It is referenced
only inside the `isDefinition` prose block as a place to *write* an approved decision — never a
place to read one first, before Change 0092's own fix added that instruction to one Skill's own
output (not to the base composer).

Change 0092's own claim ("cross-file context is generally invisible to composed `aief prompt`") is
**accurate for `knowledge/decisions.md` specifically** — confirmed here by direct trace, not
re-asserted from the prior report. (`docs/prd.md`'s equivalent invisibility, also claimed in 0092,
is out of this Change's scope per its own non-goals — durable knowledge only.)

## 3. Current Skill Context (traced against source)

`buildSkillContext()` (`skill-context.js`) returns exactly: `project`, `change`, `workflow`, `sdd`,
`action`, `definitionEnrichment` (Change 0090) — six fields, verified against the module's own
current export, not assumed from memory. No `durableKnowledge`, `decisions`, or any
`knowledge/`-sourced field exists. `definitionEnrichment` reuses `analyzeDefinitionSections()`
against the Change's own `change.md` only — it has no path to any file outside the Change
directory, by design (Change 0090's own scope: one Change's own content, nothing project-wide).

## 4. Existing Skills — precedent check

`change-context.js` and `requirements-analysis-instructions.js` were re-inspected for a
"check file X yourself" pattern: neither contains one (`grep -n "check\|inspect\|read "` against
both returns nothing beyond code comments). Both operate exclusively on data the Skill Context
already resolved (`workflow`, `sdd`) — they never ask the assistant to go read a project file
independently. **`architecture-definition`'s "check knowledge/decisions.md first" instruction
(Change 0092) is the only instance of this pattern across all three shipped Skills.** It is a novel
convention, not yet repeated, and not yet proven to need repeating.

## 5. Scenario Results

| Scenario | Shared Context Helpful? | Noise Risk | Explicit Skill Instruction Enough? |
|---|---:|---:|---:|
| A — One relevant approved decision (PostgreSQL ADR, Change 0092's own scratch fixture) | Marginally — saves one instruction line, but the assistant still has to read the file either way | None (small file) | **YES** — proven working in Change 0092's real scratch-project run |
| B — Many irrelevant decisions (this repo's own 31-ADR ledger: 186 lines mention workflow/hook/harness vs. 22 mentioning database/persistence) | NO — most of any injected content would be irrelevant to a given domain Skill | **Real, measured** — ~87% of this repo's ADR-topic mentions are unrelated to a hypothetical persistence-focused Skill | **YES** — the instruction already tells the assistant to use only what's relevant, and the assistant (unlike a blind injection) can skim/skip irrelevant entries the way a human would |
| C — Superseded decision (real finding: no structured status field exists anywhere in this repo's ledger — only reverse-chronological ordering + free prose) | NO — shared context could not safely resolve "which one wins" any better than the assistant reading the file directly; there is no structured field for AIEF to parse even if it wanted to | Low for raw injection specifically, but nothing to gain either | **YES** — the instruction already tells the assistant "an approved decision is authoritative," and reverse-chronological ordering + prose-reading (which any capable assistant already does) surfaces recency correctly; a parsed/semantic layer would be needed to do better, and that's explicitly out of scope |
| D — Conflicting current Definition state (`Decisions Required` says "choose persistence," ledger already says "PostgreSQL approved" — same shape as Change 0092's Scenario J) | NO — this is not a context-visibility problem, it is a **documentation/convention** problem: `change.md`'s own marker went stale because a human recorded the decision in `knowledge/decisions.md` without updating the Change's own Open Questions/Decisions Required line | N/A | **YES, for the correctness question** — the check-first instruction lets the assistant notice the conflict and prompt the human to update `change.md` (which is the correct fix, per ADR-009: `change.md`'s own markers are the single source of truth for *that Change's* state); AIEF core must not auto-reconcile this (would be exactly the "automatic human decision completion" the mission's overengineering guard prohibits) |
| E — No `knowledge/decisions.md` file at all | N/A — nothing to inject either way | None | **YES** — the existing instruction text already says "if it exists"; no code path assumes the file's presence, no null-handling gap exists because nothing reads the file in the first place |
| F — Large ledger (real evidence: this repo's own 1437 lines / ~19.6KB / ~36.5K-token estimate, 31 ADRs) | NO, worsens with scale — a mature project's ledger only grows; unconditionally injecting all of it into every expert-Skill invocation for every Definition Change would scale linearly with project age, while relevance to any one Skill's domain does not | **Real and growing** — confirmed by this repo's own 31-ADR count after fewer than 100 Changes; a multi-year project could have hundreds | **YES** — an instruction ("check the file, use only what's relevant") scales with the assistant's own judgment; a blind injection does not scale at all without exactly the filtering/retrieval machinery this Change is explicitly prohibited from building |

## 6. Architecture Pattern Assessment

- Was the Change 0092 per-Skill fix sufficient? **YES** — validated by Change 0092's own real
  scratch-project runs (Scenarios C, E, H all passed after the fix; PostgreSQL/Azure approved
  decisions were respected, an unrelated ADR did not shape the recommendation).
- Would repeating it across future Skills be harmful? **NO** — a few lines of prose per Skill
  module is not the kind of duplication that creates drift risk; it is the same category of
  repetition as every shipped Skill already repeating its own governance prohibitions ("DO NOT
  fill in Decision (human)," etc.) rather than a single shared constant — and that repetition was
  a deliberate, reviewed choice in Change 0091, not an oversight. AIEF's own stated principle
  (`architecture.md`: "explicit over implicit," restated in this mission's §11) favors this.

## 7. Shared Context Assessment

- Would shared durable context reduce real defects? **NO** — the one real defect Change 0092 found
  (Skill never told to check the ledger) is already fixed at the Skill-instruction level; a shared
  context field would not catch anything the instruction doesn't already catch, since neither
  approach can determine *domain relevance* without either (a) the Skill's own instructions doing
  the judgment call (current approach) or (b) semantic/AI relevance scoring (explicitly
  prohibited).
- Would it materially increase prompt noise? **YES** — real evidence in Scenario B/F above.
- Would it require parsing? **Only if it tried to be smarter than raw injection** — and parsing
  `knowledge/decisions.md` into a structured shape (status, supersession) is not possible today
  without inventing a status-field convention this repository's own ledger does not use, which
  would itself be exactly the "new decision ledger"/"new semantic authority" this Change (and
  Change 0092, and the original feasibility review) all independently reject.
- Would it require retrieval? **Only to solve the noise problem raw injection creates** — and
  retrieval is explicitly out of scope.
- Would it require a graph? **NO** — nothing in any scenario needed traversal, multi-hop queries,
  or persisted graph state; a flat, chronological Markdown file plus an explicit "read it" instruction
  answers every scenario tested.

## 8. Foundation Change Threshold (mission §21 — all six required for verdict B)

1. **More than one expert Skill clearly needs the same durable context.** **FALSE** — exactly one
   expert Skill (`architecture-definition`) exists. A second Skill's need cannot be "clearly"
   established from n=1; Change 0092's own recommendation to pilot Data Definition next has not
   yet happened, so this is speculative, not demonstrated.
2. **Existing prompt composition does not already provide it sufficiently.** **Formally true, but
   the practical gap is already closed** — the composed prompt itself never surfaces
   `decisions.md`, but the *system as a whole* (prompt + Skill instruction + the assistant's own
   real filesystem access, which every actual Claude Code / Gemini CLI session has) already
   provides sufficient access, proven working in Change 0092's real scratch runs. The criterion
   asks whether a gap exists in principle; it does, but §6/§7 show the existing fix already closes
   it in practice without a core change.
3. **Domain-specific instructions create material duplication or risk.** **FALSE** — one Skill,
   one instruction block, no demonstrated risk beyond the single already-fixed defect.
4. **Shared context would not create significant noise.** **FALSE** — real evidence in Scenario
   B/F directly contradicts this criterion.
5. **The change is additive and backward compatible.** Not evaluated further — moot once criteria
   1/3/4 fail; a shared fix is not justified regardless of this one.
6. **No new persistence/graph/retrieval system is needed.** **TRUE** on its own, but this alone
   does not justify building the fix — it only means *if* a fix were justified, it wouldn't need to
   be a graph.

**Three of six criteria fail.** Per the mission's own explicit rule ("If these are not all
satisfied: KEEP AS-IS"), the threshold is not met.

## 9. Architectural Verdict

**A. KEEP AS-IS.**

Each expert Skill continues to explicitly instruct the assistant when and how to consult durable
knowledge, exactly as `architecture-definition` already does after Change 0092. No Skill Context
field, no prompt-composition change, no new file read anywhere in `cli/src/`.

**Why not B:** the Foundation Change Threshold is not met (§8) — the demonstrated need is for one
Skill, the existing fix already closes the practical gap, and real evidence (this repository's own
31-ADR ledger) shows shared/whole-ledger injection would trade a solved problem for a real, new
noise problem with no filtering mechanism this Change is permitted to build.

**Why not C:** no one has proposed or is at risk of building an overbroad shared abstraction; there
is nothing to reject beyond declining to build the shared fix in the first place. A is the more
precise, more honest verdict than C's implied "we considered and rejected a design that was
seriously on the table."

## 10. Implementation

None. `git diff --stat` (excluding this Change's own four files) is empty — confirmed below.

## Adversarial Questions (mission §23)

- Does every expert Skill actually need durable knowledge? **Not established — only one exists.**
- Does every Definition Change need durable knowledge injected? **NO** — most Definition Changes
  in this repository's own history never reference `knowledge/decisions.md` at all.
- Would whole-ledger injection create noise? **YES**, per real evidence.
- Would prompt size become materially worse? **Yes, and it would only worsen with project age**
  (Scenario F).
- Is "check decisions.md first" enough? **YES**, proven in Change 0092.
- Is repeated explicit instruction actually harmful? **NO.**
- Would shared context improve `appliesTo()`? **NO** — applicability is about the Change's own
  content signaling relevance, not about durable knowledge, which is orthogonal.
- Would shared context improve deduplication? **NO** — deduplication already works via
  `definitionEnrichment` (the Change's own markers) plus the check-first instruction; durable
  knowledge duplication risk is a *recommendation* risk, not a *Definition-marker* duplication
  risk, and the instruction already addresses it.
- Would shared context create hidden coupling? **Potentially** — every Skill would silently depend
  on a project-wide file's shape/size, a coupling the instruction-based approach avoids by keeping
  the decision inside each Skill's own explicit text.
- Would parsing `decisions.md` create a second semantic authority? **YES** — exactly the risk this
  Change, Change 0092, and the original feasibility review all independently flag.
- Does current ADR formatting support safe raw consumption? **YES, for direct assistant reading**
  (the assistant reads prose with judgment); **NO, for any automated/parsed consumption** (no
  structured status field exists).
- Can approved vs. superseded decisions be understood today? **YES, by a reading assistant**
  (reverse-chronological order + prose), **NOT reliably by any automated parser** — another reason
  raw injection without parsing is the only safe shared-context shape, and even that shape doesn't
  solve anything the instruction doesn't already solve.
- Would Data Definition materially benefit from shared context? **Not demonstrated** — Data
  Definition doesn't exist yet; when it's piloted, it should reuse the identical explicit-
  instruction pattern, not a new mechanism.
- Would Security Definition materially benefit? **Same answer, deferred to when it exists.**
- Does any of this require a graph? **NO.**
- Does any of this require retrieval? **NO — and if noise ever becomes a real, demonstrated problem
  across multiple real Skills, that is evidence against blind shared injection, not evidence for
  building retrieval infrastructure**, per this mission's own explicit instruction (§18).
- Can the solution remain Claude/Gemini agnostic? **YES** — an instruction telling the assistant to
  read a repository file is universal; no assistant-specific API or behavior is referenced anywhere
  in `architecture-definition.js` (unchanged, reconfirmed by the existing source-level test).

## Verification

No runtime code was changed. Confirmed via `git diff --stat` (excluding this Change's own new
files under `changes/0093-.../`): **empty** — zero lines touched anywhere in `cli/src/`.

Full suite: `npm test` — **940/940 pass**, 0 fail, 0 skipped (identical to baseline — no test was
added or modified, since no behavior changed).

`node cli/bin/aief.js verify` — **PASS**.

`git diff --check` — clean.

## Findings

None requiring a code change. The review confirms the Change 0092 fix's design is sound and should
be the template for any future expert Skill's own durable-knowledge handling — not something to
centralize.

## Risks

None new. If a second and third expert Skill are built and each turns out to need materially more
durable-knowledge nuance than "check the file, use only what's relevant, respect what's approved,"
this verdict should be revisited with that concrete evidence — not before.

## Recommendations

Proceed to pilot Data Definition using the existing explicit durable-knowledge instruction pattern,
reusing `architecture-definition.js`'s "Check durable knowledge first" wording as the template
rather than inventing new phrasing per Skill.

## Artifacts Produced

- This Change's own `change.md`/`spec.md`/`tasks.md`/`evidence.md` — a review-only Change, no
  runtime artifact.

## Lessons Learned

Real repository evidence (this project's own 31-ADR ledger) settled a question that pure design
reasoning could have gone either way on: the noise-vs-benefit tradeoff of shared injection is
concrete and measurable, not hypothetical, and it weighs clearly against a shared fix at this
project's current scale — a conclusion worth re-deriving from evidence again, not assuming, once a
second expert Skill actually exists.

## Next Change

Pilot Data Definition (per the recommendation above) — not implemented in this Change.
