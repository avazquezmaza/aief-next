# Evidence

## Summary

Design for the Type ↔ Track transition, per the approved direction: Track is the user-facing entry, Type stays internal and keeps its governance semantics. **Nothing implemented.** Full design: [design.md](design.md).

The design holds together on one rule — **a declared Type always wins over derivation**. That is what makes "Track cannot remove, weaken or hide a gate" a structural property rather than a promise, and it is what makes every existing Change resolve exactly as it does today.

**Checking the rules against the real corpus corrected two of them.** Designing from the documented model alone would have shipped a rule that fails Change 0036.

## Activities Performed

1. Read `changeTypeFromContent()` and every caller of `changeType()`.
2. Enumerated the real `## Type` values across all 40 Changes.
3. Checked `Type: Enrichment` and `## Requirement Source` usage here and in `trk-orchestrator-portal`.
4. Wrote the design; corrected rules I2 and I4 against what the corpus proved.

## Verification

```bash
# 12 of 40 Changes have no ## Type -> resolve to "" today
for f in changes/*/change.md; do grep -qiE '^##\s*Type' "$f" || echo "$f"; done | wc -l   # -> 12

# The real Type vocabulary is NOT an enum
for f in changes/*/change.md; do sed -n '/^## Type/,+2p' "$f" | sed -n '3p'; done | sort -u
#   -> General | Analysis | Implementation | Documentation / Product Architecture
#      | "Documentation (one isolated help-text entry in the CLI)"
#      | "General (CLI feature + documentation; base of a larger Workflow Cohesion workstream)"

grep -rliE '^\s*Enrichment' changes/*/change.md                       # -> (none). Zero uses.
grep -rn -E '^##\s*Requirement Source' changes/*/change.md            # -> (none)
grep -rn -E '^##\s*Requirement Source' <case-study>/changes/*/change.md  # -> (none)
grep -n 'Requirement Source' cli/src/cli.js                           # -> :394 enrich() writes "## Requirement Source"

node cli/bin/aief.js verify --change 0039-type-track-derivation-design  # -> PASS
```

**Scope containment.** Created `changes/0039-type-track-derivation-design/` only. No code, no deletion, no rename. OpenSpec and SpecBoot untouched.

## Findings

| # | Finding | Consequence |
|---|---|---|
| **C1** | **`## Type` is free text, not a three-value enum.** Real values include `Implementation` (Change 0036), `Documentation / Product Architecture`, and values with prose suffixes | A strict "unknown Type ⇒ error" rule **would break 5 of 40 Changes, including 0036**. I4 is non-fatal |
| **C2** | **The field works by accident.** Callers compare `=== "analysis"` / `=== "enrichment"`; everything else falls through to general. It has never been an enum — it is two meaningful tokens and a default | "Preserve existing behavior" means preserving *tolerance*, not enforcing the documented model |
| **C3** | **12 of 40 Changes (0001–0012) have no `## Type`** and resolve to `""`, not `"general"` | Derivation must return `""` when Track and Type are both absent. `"general"` would be a behavior change disguised as a cleanup |
| **C4** | **`Type: Enrichment` has zero uses**, matching `enrich`'s zero uses | The gate this design works hardest to protect **has never fired in production**. Preserved ≠ proven |
| **C5** | **I2's naive detector trips on Change 0030** — the Change that *built* Requirement Sources mentions the phrase in prose | The detector must anchor on the `## Requirement Source` heading `enrich()` emits (`cli.js:394`) |
| **C6** | **Zero Changes declare `## Requirement Source`** — here or in the case study | I2 breaks nothing today. A flagged risk closed by measurement rather than by assurance |
| **C7** | **Nothing today prevents gate evasion**: a Change may carry a Requirement Source and declare `Type: General`, skipping Human Review | I2 closes a hole that is open right now. Track's arrival is what forces the check into existence |

## Risks

| Risk | Severity | Mitigation |
|---|:-:|---|
| A caller of `changeType()` is missed → gates split silently between paths | **High** | Zero-drift regression across all 53 real Changes (design §11, tests 9–10); migrate callers explicitly |
| Derivation drifts into "Track configures gates" | **High** | Structural rule: a declared Type always wins. Track never touches a gate |
| The Enrichment gate is unvalidated in production (C4) | Med | Tests 6–8 are the only evidence it works. Do not read "preserved" as "proven" |
| Track becomes a second mandatory question | Med | The CLI writes Type; the human is asked once |
| Type's free-text reality gets "cleaned up" later as a side quest | Med | Would be a **behavior change** for 5 Changes. Needs its own Change and its own decision — not a refactor |

## Recommendations

1. **Confirm I4 stays non-fatal.** It is the one place where the obvious rule is wrong, and the evidence (Change 0036 would fail) is concrete.
2. **Do not normalize `## Type` as part of this work.** It is free text on 5 Changes; tidying it is a behavior change wearing a cleanup's clothes.
3. **Treat the zero-drift regression as the acceptance gate** for the eventual implementation. If any of the 53 Changes resolves differently, the design is wrong.
4. **Still do not build Tracks.** Approved conceptually ≠ approved to build; Stage 1's experiment gates them.

## Artifacts Produced

| Artifact | Location |
|---|---|
| The design | [`design.md`](design.md) |
| Requirements + acceptance | [`spec.md`](spec.md) |

## Lessons Learned

1. **Designing against the documented model would have shipped a broken rule.** The docs say Type has three values; the repo says otherwise, and the counter-example is Change 0036 — the accepted work from two days ago. The corpus is the specification; the specification is a claim about it.
2. **"Fail loudly" is not free.** Law 5 says fail when you cannot determine the truth — not when you can determine it and dislike the answer. Type's tolerance is interpretable behavior, so tolerance stays. Strictness is affordable on Track only because Track has no legacy.
3. **A risk you can measure is not a risk.** "I2 might break an existing Change" took one grep to close. Two greps distinguished a mention from a declaration.
4. **The gate being protected has never fired.** Enrichment has 0 uses. Worth knowing before treating its preservation as the design's hardest constraint.

## Next Change

**None proposed.** Design only; implementation is separately approved and separately gated.

Per the approved order, the next work is **Change 0040 (AGENTS.md)**, then **0041 (DELETE review)**.
