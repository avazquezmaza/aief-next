# Design — Type ↔ Depth

> **Design only. Nothing is implemented by this Change.** Approved direction (2026-07-17): Depth and Type coexist as **different dimensions**; Depth is the user-facing entry, Type stays internal and keeps its governance semantics.

## 1. The two dimensions

> **Read §1.1 first.** The audit found that `Type`'s documented vocabulary is not the vocabulary in use. That fact changes two rules in this design, and it would have broken five real Changes had it been missed.

| | **Depth** | **Type** |
|---|---|---|
| Answers | *How deep is this work?* | *What governance semantics does it carry?* |
| Values | `Basic` · `Standard` · `Migration` | `General` · `Analysis` · `Enrichment` **(documented)** — see §1.1 |
| Audience | **The user.** The one question asked at intake | **Internal.** The CLI's behavior switch |
| Governs | Which artifacts exist; what `verify` demands | Prompt composition; human-review gates; Enrichment semantics |
| Written by | The human (once, at intake) | **The CLI** (derived, then written explicitly) |
| New? | Yes | No — exists today |

They are orthogonal: an architect can run a `Basic` Change; an `Enrichment` can be `Standard` or `Migration`.

## 1.1 What `Type` actually is today

`## Type` is documented as a three-value enum. **It is not.** It is a free-text field, and the 40 Changes in this repo contain at least these distinct values:

```bash
# every ## Type value in the repo
for f in changes/*/change.md; do sed -n '/^## Type/,+2p' "$f" | sed -n '3p'; done | sort -u
```

| Value in the wild | Changes | Resolves to |
|---|---|---|
| `General` | ~14 | general |
| `Analysis` | 3 | **analysis** |
| *(absent)* | **12** (0001–0012) | `""` |
| **`Implementation`** | 1 — **Change 0036** | general |
| `Documentation / Product Architecture` | 1 — 0026 | general |
| `Documentation (one isolated help-text entry in the CLI)` | 1 — 0027 | general |
| `Documentation (handoff package; …)` | 1 — 0028 | general |
| `General (CLI feature + documentation; base of a larger Workflow Cohesion workstream)` | 1 — 0030 | general |
| **`Enrichment`** | **0 — never used** | — |

Two facts follow, and both are load-bearing:

1. **The field works by accident.** `changeTypeFromContent()` lowercases the whole line and the callers compare `=== "analysis"` / `=== "enrichment"`. Anything else — `Implementation`, `Documentation / Product Architecture`, prose suffixes — falls through to general. It has never been an enum; it has been *two meaningful tokens and a default*.
2. **`Enrichment` has zero uses**, consistent with `enrich` having zero uses. The gate this design works hardest to protect has never once fired in this repository.

**Consequence for this design:** a strict "unknown Type ⇒ error" rule would fail **five existing Changes**, including Change 0036 — the accepted F1/F2/F3 work. The user's instruction was that Type *preserves existing behavior*. Existing behavior is tolerant. So the design stays tolerant (§4, I4).

*This is why the rule that Depth never overrides a declared Type matters more than it first appears: for 5 of 40 Changes, the declared Type is a sentence, and the only safe thing to do with a sentence is leave it alone.*

## 2. The derivation

```text
Basic      → General
Standard   → General
Migration  → Analysis
Enrichment → never derived. Declared explicitly, always.
```

### The resolution order (normative)

```text
1. Type declared in change.md?        → use it. Stop. (Depth never overrides a declared Type.)
2. Type absent, Depth declared?       → derive Type from Depth.
3. Both absent?                       → "" (today's exact behavior — unchanged).
```

**Step 3 is the backward-compatibility guarantee.** `changeTypeFromContent()` returns `""` when `## Type` is missing, and 12 of the 40 existing Changes (0001–0012) rely on that. The derivation must return `""` for them, not `"general"` — behaviorally identical today, but `""` is what the code returns now and this design changes no existing output.

### One question, not two

> *"No mantengas dos preguntas obligatorias para el usuario nuevo."*

Resolved as: **the human answers Depth; the CLI writes both lines.**

```markdown
Depth: Standard
Type: General
```

`Type` is written **explicitly at creation**, not left to be derived at read time. This is deliberate and it is [F1](../../docs/dogfooding-findings.md)'s lesson applied before the bug exists: a value that is silently derived at every read is a parser guessing. A value written once and read thereafter is a fact. Derivation then survives only as a **fallback for hand-written Changes**, which is exactly where Flux Portal's Changes lived.

## 3. Valid combinations

All nine Depth × Type pairs are **semantically valid** — the dimensions are orthogonal by decision, so no pair is forbidden on meaning alone.

| Depth | Type in file | Resolved Type | Valid | Note |
|---|---|---|:-:|---|
| `Basic` | *(absent)* | `General` | ✓ | derived |
| `Basic` | `General` | `General` | ✓ | explicit, matches derivation |
| `Basic` | `Analysis` | `Analysis` | ✓ | override — a small analysis |
| `Basic` | `Enrichment` | `Enrichment` | ✓ | override — **all Enrichment gates apply** |
| `Standard` | *(absent)* | `General` | ✓ | derived |
| `Standard` | `General` | `General` | ✓ | explicit |
| `Standard` | `Analysis` | `Analysis` | ✓ | override |
| **`Standard`** | **`Enrichment`** | **`Enrichment`** | ✓ | **the approved override example** |
| `Migration` | *(absent)* | `Analysis` | ✓ | derived |
| `Migration` | `General` | `General` | ✓ | override — a migration that is not an analysis |
| `Migration` | `Analysis` | `Analysis` | ✓ | explicit, matches derivation |
| `Migration` | `Enrichment` | `Enrichment` | ✓ | override |
| *(absent)* | *(absent)* | `""` | ✓ | **legacy — today's behavior, untouched** |
| *(absent)* | any | as declared | ✓ | **legacy — every existing Change** |

**A declared Type always wins.** Depth never overrides, weakens or reinterprets it. That single rule is what makes "Depth cannot remove, weaken or hide a gate" mechanically true rather than a promise.

## 4. Invalid cases — fail loudly

Incompatibility is **never about semantics** (all pairs are valid). It is about **coherence**, and every rule below protects a gate or a parser.

| # | Invalid case | Why | Behavior |
|---|---|---|---|
| **I1** | `Type: Enrichment` **without** a `## Requirement Source` section | Enrichment's semantics *are* an external source. Without one, the human-review gate guards nothing | **Error, exit 1** |
| **I2** | A `## Requirement Source` section present **but** resolved Type ≠ `Enrichment` | **Gate evasion.** A Change with an external source that is not an Enrichment skips the Human Review gate | **Error, exit 1** |
| **I3** | Unknown `Depth` token (`Depth: Quick`) | A misread Depth silently derives the wrong Type. Depth is **new**, so strictness costs no existing Change | **Error, exit 1** — list valid values |
| **I4** | Unknown `Type` token (`Implementation`, `Documentation / Product Architecture`) | **Not an error — see below** | **Resolves to general. Reported, never fatal** |
| **I5** | Two contradictory `Depth:` declarations | Ambiguity | **Error, exit 1** ([Law 5](../../docs/aief-2.0/01-vision.md)) |
| **I6** | `Depth:` declared but uninterpretable (empty; decoy like `Depth (orig):`) | The exact F1 shape | **Error, exit 1**. Never guess |

### Why I4 is not an error

The obvious rule — *unknown Type ⇒ fail loudly* — is wrong here, and the evidence says so: it would fail **5 of 40 existing Changes**, including **Change 0036**, the accepted F1/F2/F3 work (`Type: Implementation`). The approved instruction is that Type **preserves existing behavior**; existing behavior tolerates any token and defaults to general (§1.1).

Strictness is affordable on `Depth` (I3) precisely because Depth is new — there is no legacy to break. It is not affordable on `Type`. **Loud failure is for what a tool cannot interpret, not for what it has always interpreted one way.**

### I2's detector must match a declaration, not a mention

`grep "Requirement Source"` is wrong. Change 0030 — the Change that *built* Requirement Sources — mentions the phrase in its Scope prose and would trip the rule. The detector must be anchored to the section `enrich()` actually writes (`cli/src/cli.js:394`):

```text
## Requirement Source        ← the heading enrich() emits. Anchor here.
```

**Verified against the corpus:** zero of 40 Changes here, and zero of 13 in `trk-orchestrator-portal`, declare a `## Requirement Source` section. **I2 breaks nothing today** — the risk flagged in §12 is measured and closed.

**I2 still matters most**, because it is the only rule that closes a hole open right now: nothing currently prevents a Change from carrying a Requirement Source while declaring `Type: General`, and that Change would skip the Human Review gate entirely. Depth's arrival is what forces the check into existence.

## 5. Impact on `changeType()`

Today (`cli/src/core/domain/change.js:108`):

```js
export function changeTypeFromContent(changeMd) {
  const match = changeMd.match(/^##\s*type\s*(?:\r?\n)+\s*([^\r\n]+)/im);
  return match ? match[1].trim().toLowerCase() : "";
}
```

Proposed shape (not implemented):

- `depthFromContent(changeMd)` — a **new, tolerant reader**: accepts `Depth: X`, `## Depth` + value, bold, blockquote; rejects decoys; **errors on declared-but-uninterpretable** (Law 2 + Law 5, the F1 contract already built for status).
- `changeTypeFromContent(changeMd)` — **unchanged signature and unchanged behavior when `## Type` is present.**
- `resolveChangeType(changeMd)` — **new**: applies §2's resolution order. Every current caller of `changeType()` moves here.

**Callers to migrate** (`cli/src/cli.js`): `prompt` (`isAnalysis` / `isEnrichment`), `close` (enrichment human-review gate), `verify`, `createChange`. Each must be re-pointed deliberately — a missed caller is a silent behavior split, which is F1's failure class arriving through the front door.

**Invariant to test:** for every existing Change in this repo and in the case study, `resolveChangeType(x) === changeTypeFromContent(x)`. Both must be byte-identical today. If any Change's resolved Type changes, the design is wrong, not the Change.

## 6. Impact on prompt composition

**None, by construction.** `prompt` branches on `isAnalysis` / `isEnrichment`, which come from the resolved Type. Because a declared Type always wins and every CLI-created Change carries one, composition is unchanged for every existing Change.

The only new path: a **hand-written** Change with `Depth: Migration` and no Type now composes as Analysis instead of `""`. This is new behavior, it is intended, and it is the point — Flux Portal's 11 hand-written Changes had no Type at all and got the generic prompt.

**Depth itself is not injected into the prompt** in this design. Adding a Depth block would grow the prompt, and Change 0024 flagged prompt growth as a watch item. Depth governs *artifacts and gates*, not reasoning. Revisit only with evidence.

## 7. Impact on Enrichment gates

**Zero. Enumerated, not asserted:**

| Gate today | After |
|---|---|
| `aief enrich` writes `Type: Enrichment` explicitly | Unchanged — never derived (§2) |
| `enrich` writes `Requires Human Review` + Human Review tasks | Unchanged |
| `close` refuses while Human Review tasks are unchecked | Unchanged — reads the same resolved Type |
| `prompt` tells the assistant not to implement or touch the source | Unchanged |
| Requirement Source is read-only | Unchanged |

Plus **one gate gained**: I2 makes source-without-Enrichment a loud error.

**Any Depth may carry Enrichment, and the gates do not soften.** `Depth: Basic` + `Type: Enrichment` gets the full human-review gate. Depth decides how many artifacts; Type decides who must approve. They never trade.

## 8. Backward compatibility

| Population | Today | After | Impact |
|---|---|---|---|
| 28 Changes with `## Type` | Type read | Type read (step 1) | **none** |
| 12 Changes without `## Type` (0001–0012) | `""` | `""` (step 3) | **none** |
| Flux Portal's 13 hand-written Changes | `""` | `""` | **none** |
| Enrichment Changes | gated | gated | **none** |
| New Changes | — | `Depth:` + `Type:` written | new |

**No existing Change requires migration.** `Depth` is additive; its absence resolves to today's behavior. This is the single most important property of the design and the reason it can ship without touching a file.

## 9. Metadata migration

**None required.** Deliberately.

- Existing Changes are **not** back-filled with `Depth:`. Rewriting 40 change.md files to add a field nobody read would be a migration whose only purpose is tidiness — and it would rewrite closed Changes, which [Change 0038](../0038-framework-simplification-map/spec.md) forbids.
- Legacy Changes resolve to `""` forever. That is correct: they were created before the dimension existed, and inventing a Depth for them retroactively would be fabricating a fact.
- **Optional, later, off by default:** `aief verify` may *report* Changes with no Depth as an informational note. Never an error, never a fix-up.

## 10. Reversibility

Reversible at every stage, because the design is additive and Type remains the authority:

| To roll back | Do | Data to undo |
|---|---|---|
| Stop writing `Depth:` at creation | Revert `createChange` | none |
| Ignore `Depth:` entirely | `resolveChangeType` → `changeTypeFromContent` | none |
| Remove the reader | Delete `depthFromContent` | none |

Existing `Depth:` lines become inert text in a Markdown file. **Nothing to migrate back**, no state to rebuild, no format to downgrade — because there is no state (ADR-009). Rollback is a code revert, full stop.

## 11. Tests required

**Derivation**
1. `Basic` no Type → `general`; `Standard` no Type → `general`; `Migration` no Type → `analysis`.
2. Declared Type always wins over derivation, for all nine pairs.
3. Both absent → `""` (**not** `"general"`).
4. `Enrichment` is never produced by derivation from any Depth.

**Invalid cases** (each exits 1 with a message naming the file and the valid values)
5. I1 · I2 · I3 · I4 · I5 · I6.

**Gates**
6. `Depth: Basic` + `Type: Enrichment` → every Human Review gate still fires; `close` still refuses.
7. `close` on an Enrichment with unchecked Human Review still exits 1, for all three Depth values.
8. No Depth value permits `close` to pass a gate it fails today.

**Regression (the load-bearing one)**
9. For **all 40 Changes in this repo** and **all 13 in `trk-orchestrator-portal`**: `resolveChangeType() === changeTypeFromContent()`. Zero drift.
10. `prompt` output is byte-identical for every existing Change, before and after.

**Reader tolerance (F1 contract)**
11. `Depth: Standard`, `**Depth:** Standard`, `> Depth: Standard`, `## Depth\n\nStandard` all parse.
12. `Depth (orig): Basic` is a decoy → not a declaration.
13. Declared-but-uninterpretable → loud error, never a guess.

## 12. Risks

| Risk | Severity | Mitigation |
|---|:-:|---|
| **A caller of `changeType()` is missed** → one path derives, another doesn't; gates split silently | **High** | Test 9 + 10 (zero drift across 53 real Changes). Migrate callers explicitly, not by search-and-replace |
| ~~**I2 breaks an existing Change**~~ | ~~High~~ | **Closed by measurement.** Zero of 40 Changes here and zero of 13 in `trk-orchestrator-portal` declare a `## Requirement Source` section. No grandfather clause needed — provided the detector is heading-anchored (§4) |
| **A strict Type rule breaks Change 0036 and four others** | **High** | **Found during design, not implementation.** `Type` is free text in practice (§1.1): `Implementation`, `Documentation / Product Architecture`, prose suffixes. I4 is therefore non-fatal |
| **`Enrichment` has never been used** — the gate this design protects has never fired | Med | Recorded, not resolved. It means the Enrichment gate is **unvalidated in production**, so tests 6–8 are the only evidence it works. Do not treat "preserved" as "proven" |
| Depth becomes a second mandatory question | Med | The CLI writes Type; the user is asked once (§2) |
| Unknown-token errors annoy on legacy files | Med | I3/I4 fire only on a **declared** token, never on absence |
| Derivation grows into "Depth configures gates" | **High** | Design rule: **a declared Type always wins**. Depth never touches a gate |
| Prompt bloat if Depth is injected later | Low | Not injected (§6) |
