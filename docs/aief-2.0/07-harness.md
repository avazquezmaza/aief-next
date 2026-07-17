# 7 · The modular harness

> Deliverable 8. **Design only.** No slot below authorizes implementation; the empty ones are diagnostics, not a backlog.

## 1. What the harness is

**The brief an assistant receives, assembled from eleven small pieces, each answering exactly one question.**

Today `aief prompt` composes AGENTS.md + assistant file + profile + standards + skills + the Change into one blob. It is [the highest-complexity component in the audit](02-current-map.md#41-workflow-engine-the-cli), it composes three empty dimensions, and when a piece is missing the prompt says so anyway — *"act as the architect profile"*, pointing at a directory holding one README.

The harness replaces the blob with **slots**. Same content, named shape. The payoff is not modularity for its own sake; it is that **an empty slot becomes visible instead of becoming a confident lie**.

## 2. The eleven pieces

Each answers one question. **No piece repeats another's content** — that rule is what keeps [ADR-012](../../knowledge/decisions.md)'s orthogonality intact, and it is the only rule that matters here.

| # | Piece | The one question | Source today | Owner |
|:-:|---|---|---|---|
| 01 | **Identity** | Who is acting? | `profiles/` — **empty** | ADR-012 (AIEF) |
| 02 | **Context** | What is true about this project? | detectors, `knowledge/`, standards | AIEF + project |
| 03 | **Objective** | What must be achieved? | `change.md` + `spec.md` | The Change |
| 04 | **Tools** | What can it act with? | **nothing** | Project |
| 05 | **Permissions** | What may it do without asking? | `AGENTS.md` (implicitly) | Project |
| 06 | **Constraints** | What must it never do? | `AGENTS.md`, standards | AGENTS.md |
| 07 | **Verification** | How do we know it's right? | `spec.md` acceptance, `verify` | The Change |
| 08 | **Evidence** | What is left as proof? | `evidence.md` | The Change |
| 09 | **Recovery** | What if it fails? | **nothing** | The Change (Migration) |
| 10 | **Evaluation** | Was the outcome good? | human gate (implicit) | Human |
| 11 | **Handoff** | Who continues, and from where? | **nothing** | The Change |

## 3. The diagnostic

Four slots are empty in AIEF 1.x: **01 Identity, 04 Tools, 09 Recovery, 11 Handoff.**

Now compare with [what Flux Portal built by hand](02-current-map.md#3-what-the-team-built-because-aief-didnt-have-it) because AIEF didn't have it:

| Empty slot | What Flux invented |
|---|---|
| **09 Recovery** | Rollback plans, rehearsed at cutover |
| **11 Handoff** | Checkpoints, increments, `tech-debt.md`, `implementation-status.md` |
| **01 Identity** | Nothing — the assistant improvised, "it worked, but it is undefined behavior" |
| **04 Tools** | The project's own harness (which [governance-conventions §4](../governance-conventions.md#4-harness-engineering) then documented as an experiment) |

**Three of four empty slots were filled by hand, under deadline, on the only real adoption.** That is the strongest independent evidence in this study that the slot model describes something real: the gaps were not theoretical — a team hit each one and paid to fill it.

The fourth (01 Identity) is the interesting one. Nobody filled it. The assistant improvised a definition of "architect" and the work shipped anyway. **A slot that stays empty through a successful migration is evidence the slot may not be load-bearing** — which is the uncomfortable question ADR-012 will have to answer when its implementation is reconsidered.

## 4. The rules

1. **One question per piece.** If a piece answers two, it's two pieces.
2. **No repetition.** Each fact has exactly one home. A constraint lives in 06 and is referenced, never restated, by 03.
3. **A piece may be empty — and must say so.** `01 Identity: not defined` is honest. *"Act as the architect profile"* pointing at nothing is a lie the assistant will fill in silently. This is [Law 5](01-vision.md#law-5--when-the-truth-cannot-be-determined-fail-loudly) applied to composition.
4. **Pieces are composed, never merged.** Composition is the renderer's job (ADR-012), never the sources'.
5. **The Track decides which pieces render.** `basic` renders 03, 06, 07, 08. Migration renders all eleven. Progressive complexity, applied to the prompt itself — and the direct answer to the prompt-bloat watch item from Change 0024.
6. **Pieces are content, not behavior.** No piece grants permission to bypass a gate. 05 (Permissions) describes what the *project* already allows; it never widens it.

## 5. What this is not

**Not new capability.** Nine of eleven slots are AIEF 1.x content, renamed and bounded. The harness is a *lens*, and its first job is to be a better audit than a better feature.

**Not an agent runtime.** `external-harness-patterns.md §4` rejected harness-sdd's orchestration model, and nothing here revives it: these are pieces of *a text brief a human hands to an assistant*. Slot 05 (Permissions) is the one to watch — it is one careless step from becoming an autonomy grant. It describes; it never authorizes.

**Not a mandate to fill the empty slots.** Per [ADR-008](../../knowledge/decisions.md):

| Slot | To fill it, first observe… |
|---|---|
| 01 Identity | ADR-012's own gate: re-validation on a real project. Currently 0 uses |
| 04 Tools | A second project where the assistant lacked a tool the project had |
| 09 Recovery | A second migration needing rollback (Flux is n=1) |
| 11 Handoff | A second multi-phase Change losing context at a boundary |

**Filling all four now would be exactly the v4 failure** — structure built from a diagram rather than from friction. The harness's value today is that it tells you *which four to watch*.
