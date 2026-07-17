# Evidence

## Summary

`AGENTS.md` existed in four divergent variants, and **the one that shipped was the poorest**: a 14-line string hardcoded inside `runAdoption()` delivering **7 of ~40 canonical normative statements (~18%)**. **Executed 2026-07-17** (human-approved): a single canonical source now feeds every adoption path, and an adopted project receives 100% of the approved rules — including the human/review gates and the assistant-file pointer it never received before.

**ADR-004 — "AGENTS.md holds the universal collaboration rules" — was violated in practice** and is now upheld: the rules AIEF documents for itself are the rules it delivers.

## Execution result (2026-07-17)

- **Canonical source:** `cli/templates/agents/AGENTS.md` (172 lines), built by semantic reconciliation of all four variants (provenance table below).
- **`runAdoption()`** reads the canonical (`cli/src/cli.js:534`); the divergent inline string is gone.
- **Root `AGENTS.md`** is byte-identical to the canonical, guarded by a test.
- **Tests:** `cli/tests/agents-canonical.test.js` — 7 new tests. Full suite **128/128 pass**.
- **Manual adopt on a temp project:** generated `AGENTS.md` byte-identical to canonical; `(human)`, `(review)`, `aief close`, `CLAUDE.md`, `GEMINI.md`, `Human Responsibilities` all present. 14 → 172 lines.
- **`aief verify` global: PASS.**
- **Files changed:** `AGENTS.md`, `cli/src/cli.js` (2 zones only: the `AGENTS_TEMPLATE` constant + the `runAdoption` read), `cli/package.json` (test registration), `cli/templates/agents/AGENTS.md` (new), `cli/tests/agents-canonical.test.js` (new). **Zero deletions, zero renames.**

### Reconciled rules — provenance of the canonical

Each rule with the variant(s) it came from. Root = 170-line repo AGENTS.md · Starter = `starter-project/AGENTS.md` (35) · Templates = `templates/project/AGENTS.md` (10) · Stub = the 14-line `runAdoption` inline string.

| Rule / section | Root | Starter | Templates | Stub |
|---|:-:|:-:|:-:|:-:|
| Prime Directive + "never auto-approved" + "human owner responsible" | ✓ | partial | | partial |
| R1 read the Change · R3 read tasks · R6 keep small · R7 no unrelated · R9 evidence | ✓ | ✓ | partial | ✓ |
| R2 read spec **+ "do not implement without a specification"** | ✓ | ✓ | **✓ (this clause only here)** | ✓ |
| "small, **focused** and reviewable" | ✓ | **✓ ("focused" only here)** | | |
| R4 no inventar · R5 preguntar si ambiguo · R8 update docs · R10 simple | ✓ | partial | | |
| AIEF Workflow (5 phases) · Working with Changes | ✓ | partial | | |
| **Tasks and gates — `(human)` / `(review)` + `aief close` blocking** | ✓ | | | |
| Required Completion Checklist · Coding/Documentation/Evidence Guidance · Human Responsibilities | ✓ | partial | | |
| **Assistant-file pointer (CLAUDE/GEMINI/CODEX/CURSOR)** | | | | **✓ (only here)** |

**The merge went both ways**, as the analysis required: the assistant-file pointer was rescued from the poorest variant (Stub); "focused" from Starter; "do not implement without a specification" from Templates. The 170-line Root was the base, not the whole.

## (original analysis follows)

## Activities Performed

1. Located and read all four variants.
2. Determined which ships: only the inline string in `runAdoption()`. Variants 2 and 3 are read by nothing.
3. Built the rule-by-rule matrix ([spec.md §1](spec.md)).
4. Checked the packaging constraint on the canonical's location.
5. Specified the fix, its tests, and its boundary against the general simplification.

## Verification

```bash
wc -l AGENTS.md starter-project/AGENTS.md templates/project/AGENTS.md   # -> 170 / 35 / 10
grep -n "Created AGENTS.md" -B2 cli/src/cli.js                          # -> :530 inline 14-line string
grep -rn readFileSync cli/src/cli.js                                    # -> standards, ci, package.json — never an AGENTS template
grep -c "CLAUDE.md" AGENTS.md                                           # -> 0  (!) the canonical lacks the stub's pointer
grep -c "(human)" AGENTS.md                                             # -> present
cat cli/package.json                                                    # -> no "files" field: everything under cli/ ships
node cli/bin/aief.js verify --change 0040-agents-md-canonical-source    # -> PASS
```

**Scope containment.** Created `changes/0040-agents-md-canonical-source/` only. No code changed, no file deleted or renamed.

## Findings

| # | Finding | Consequence |
|---|---|---|
| **D1** | **The variant that ships is the poorest.** The 170-line canonical never leaves AIEF's repo; adopters get 14 lines from a hardcoded string | ADR-004 violated in practice |
| **D2** | **The human-gate governance never reaches an adopted project.** `(human)` / `(review)` and their `aief close` consequence — Change 0035's whole contribution — are absent from every adopted `AGENTS.md` | Adopters cannot follow a convention they were never given. Flux Portal's hand-rolled gates were **not** a discipline failure — the rules were never delivered |
| **D3** | **The canonical is not a superset.** The assistant-file pointer exists **only** in the 14-line stub | A one-way merge would silently delete a live rule. Merge both ways |
| **D4** | **Variants 2 and 3 are read by nothing.** `templates/project/AGENTS.md` is dead; `starter-project/AGENTS.md` is a static sample | Only one variant is a real adoption path — the fix is smaller than "four files" suggests |
| **D5** | **The canonical cannot live at the repo root** for distribution: `cli/src/cli.js` cannot read `../AGENTS.md` from an npm install | Canonical goes to `cli/templates/agents/`; root becomes a test-guarded copy |
| **D6** | **~18%, not 8%.** The line-based figure quoted in Changes 0037/0038 (14/170) overstated the loss; measured rule by rule it is 7 of ~40 | The rule-based number is the honest one, and it is still the finding |

## Risks

| Risk | Severity | Mitigation |
|---|:-:|---|
| **Adopters' assistants change behavior overnight** — a 170-line AGENTS.md replaces 14 lines in every new adoption | **High** | Intended, but real: more rules = different assistant behavior. Ship with the release note, not silently |
| **The merge drops the assistant-file pointer** (D3) | **High** | Explicit test; the matrix names it |
| Two physical copies persist (root + template) | Med | Test-enforced equality. Alternatives recorded in spec §2 for a reviewer to overrule |
| `Understand -> Plan -> Build` ships to adopters — a phrasing that contradicts ADR-011 | Med | **Accepted deliberately.** Removing it here would fold a concept change into a bug fix. It goes with Change 0038's concept cluster |
| Existing adopted projects keep their 14-line file | Low | `adopt` never overwrites (ADR-005). Correct: AIEF does not rewrite a project's rules behind its back |

## Recommendations

1. **Execute this before anything else in the AIEF 2.0 programme.** It is a bug, not a redesign; it needs no decision beyond "go"; and it is the single change most likely to improve real adoptions — every future adopter gets the governance instead of 18% of it.
2. **Ship it as a visible change, not a silent one.** Assistants will behave differently on the next adoption.
3. **Review the merged canonical before it ships.** It becomes the rule file for every future adopter; that content deserves a second reader.
4. **Do not let it grow.** The temptation to "also fix the workflow phrasing while we're here" is exactly how a scoped bug fix becomes the redesign.

## Artifacts Produced

| Artifact | Location |
|---|---|
| The four-variant analysis + rule matrix | [`spec.md`](spec.md) |
| The design and its trade-off | [`spec.md §2`](spec.md) |

## Lessons Learned

1. **The most complete artifact was the one nobody received.** AIEF wrote itself excellent rules and shipped a stub. The gap was never authorship — it was delivery, which is this whole programme's thesis appearing one more time.
2. **"Consolidate to the best variant" would have lost a rule.** The poorest variant held the only assistant-file pointer. Completeness is not a total order.
3. **D2 reframes a finding I made two Changes ago.** I wrote that Flux Portal ignored the governance conventions. It never received them. The conventions were published in AIEF's repo and never delivered to the project that inspired them.

## Next Change

**None.** Execution of this Change awaits a human decision.

Per the approved order, the next work is **Change 0041 — the DELETE review package**.
