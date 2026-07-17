# 4 · AIEF 1.x vs AIEF 2.0

> Deliverable 4.

## 1. The difference in one line

**AIEF 1.x is a framework you must remember. AIEF 2.0 is a path you fall onto.**

## 2. Posture

| | AIEF 1.x | AIEF 2.0 |
|---|---|---|
| Governing question | *What capability is missing?* | *Why, having it, did nobody use it?* |
| Identity | A framework beside OpenSpec and SpecBoot | An orchestration layer over them |
| Growth direction | Add capability | **Remove surface** |
| Default artifact count | Everything, always | Nothing, until a question demands it |
| Governance runs | When someone remembers | Automatically, in CI |
| Reader posture | Recognizes its own output | Reads what humans write; errors on ambiguity |
| Gate posture | One size, all Changes | Proportional to declared Track |
| Teaching | Explain everything, every time | Explain on demand |
| Entry | 7 doors, 90 paths | `aief` |

## 3. Numbers

| Measure | 1.x | 2.0 target | Source |
|---|---|---|---|
| Time to first useful action | ~45–60 min | **< 15 min** | [02 §5](02-current-map.md#5-the-onboarding-maze) |
| Mandatory artifacts (smallest change) | 4 | **1** | [06](06-profiles.md) |
| Mandatory artifacts (migration) | 4 | 4 + what the risk demands | [06](06-profiles.md) |
| Decisions before writing code | 90 paths | **2** | [05](05-user-flow.md) |
| Entry points | 7 | **1** | [02 §6](02-current-map.md#6-duplication) |
| Commands on the main path | 15 | **1 + 5** | [05](05-user-flow.md) |
| `AGENTS.md` versions | 4 | **1** | [02 §6](02-current-map.md#6-duplication) |
| Concepts required to start | 8+ | **2** (Change, Evidence) | [05](05-user-flow.md) |
| Markdown : code | 8:1 | shrinking | [02 §1](02-current-map.md#1-the-measurements) |
| Components with 0 observed use | 18 of 36 | — | [02 §10](02-current-map.md#10-classification) |

## 4. Same work, both versions

A one-line bug fix, governed:

| | 1.x | 2.0 |
|---|---|---|
| Commands | `new-change` → edit 3 files → `prompt` → `verify` → `close` | `aief` → fix → `aief` |
| Files created | 4 (`change`, `spec`, `tasks`, `evidence`) | **1** (`change.md`, evidence inside) |
| Scaffolds arriving empty | 3 | 0 |
| Questions asked | profile? assistant? type? OpenSpec? | *what are you changing?* |
| `verify` demands | `spec.md` present, tasks checked, evidence complete | evidence non-empty |
| Realistic outcome | Skipped. Nobody governs a typo fix with four files | Governed, because it cost one line |

**That last row is the whole thesis.** 1.x's real behavior on small work is not "heavy governance" — it is *no governance*, because the cost exceeds the value and people are rational. Flux Portal's 13 hand-written Changes are what that looks like at scale.

## 5. What does not change

Reaffirmed by evidence, not preserved by inertia:

- **Files are the only truth** (ADR-009). It survived a squashed history, two weeks of hand-editing, and a full reconciliation.
- **AI assists, humans decide.** The Prime Directive is untouched.
- **`evidence.md`.** The validated differentiator. 3,655 hand-written lines.
- **The Change.** The one abstraction that survived contact with reality.
- **Adoption never touches application code.** Zero destructive actions on a production repo — a trust asset that took two validations to earn.
- **OpenSpec and SpecBoot are not modified.** Not by 1.x, not by 2.0.

## 6. What 2.0 risks that 1.x doesn't

Honest accounting — each risk gets a named countermeasure, because a risk without one is a wish:

| Risk | Countermeasure |
|---|---|
| **Becoming a layer on top instead of a replacement** — the v4 death | [11-roadmap.md](11-roadmap.md): every milestone deletes before it adds; a milestone with pending removals is incomplete |
| **`basic` becomes the escape hatch** — everything declared basic, governance evaporates | Escalation triggers are questions about *the work*, not preferences; `verify` can detect a `basic` Change touching an API surface. **Unbuilt, ungated, needs evidence** |
| **Track becomes a fifth thing to learn** | It is inferred and proposed by `aief`, confirmed by the human — never a blank field to fill |
| **Proportionality is rationalization** (Law 4 is wrong) | F2's fix ships first and settles it: if projects comply with the uniform gate once it's automatic, Law 4 is refuted and Tracks are unnecessary |
| **Terminology collision** (Profile vs Track) | [03 §5.1](03-proposed-map.md#51-adr-012-operational-profiles--terminology-collision-not-a-contradiction) — decide before building |
| **n=1** | The whole study rests on one project. Per ADR-008, every proposal names its gate; nothing ships on this evidence alone |
