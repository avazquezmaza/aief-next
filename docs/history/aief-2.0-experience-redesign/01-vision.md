# 1 · Vision — AIEF 2.0

> Deliverable 1. Companion: [02-current-map.md](02-current-map.md) (the evidence), [11-roadmap.md](11-roadmap.md) (the sequence).

## 1. The problem in one paragraph

AIEF 1.x is a framework with **more surface than adoption**. On the migration it was built to govern, its CLI ran once and its artifacts were then produced by hand for two weeks — 9,011 lines of them. The validator that would have caught six missing specs was correct, installed, and never invoked. The parser that reads a Change's status could only read the format that a command nobody ran would have written. AIEF did not fail by lacking capability. **It failed by not being on the path between a developer and their work.**

## 2. What AIEF 2.0 is

> **AIEF is the layer that makes well-governed work the path of least resistance.**

Not a framework. Not a methodology. An **orchestration and experience layer** over tools that already work:

| | Owns | AIEF's posture |
|---|---|---|
| **SpecBoot** | Creating instruction scaffolding | **Invoke it.** Never re-implement it. |
| **OpenSpec** | Validating observable contracts | **Reference it.** Never duplicate a contract. |
| **The assistant** | Doing the work | **Brief it.** Never replace it. |
| **AIEF** | Knowing what comes next, and whether it is done | — |

AIEF's territory is exactly two questions, and it should be ruthless about owning nothing else:

1. **What should I do next?** (orchestration)
2. **Is this actually finished?** (governance)

Everything AIEF holds that answers neither question is a candidate for deletion.

## 3. What AIEF 2.0 is not

- **Not more capability.** The 2.0 surface must be *smaller* than 1.x. A release that adds a command without removing two is off-strategy.
- **Not an agent framework.** The Prime Directive stands: AI assists, humans decide. ([external-harness-patterns §4](../external-harness-patterns.md) rejected this once; it stays rejected.)
- **Not a documentation product.** AIEF 1.x has 11,600 lines of Markdown and ~1,500 lines of production code — an **8:1 ratio of explanation to behavior**. That ratio is the v4 failure mode AIEF was founded to escape, reappearing in AIEF's own repository.
- **Not a spec format.** ADR-001 stands.

## 4. The six laws

Each law is a generalization of something Flux Portal proved, not a preference.

### Law 1 — An artifact appears when a question demands it, never because the framework owns one.

*Evidence:* AIEF demands `change.md` + `spec.md` + `tasks.md` + `evidence.md` from every Change regardless of size. Flux Portal stopped writing `spec.md` at Change 0008 and never resumed — six consecutive omissions is not forgetfulness, it is a verdict.

### Law 2 — AIEF must read what humans write, not only what AIEF wrote.

*Evidence:* F1. `isClosedContent()` matched only the exact string `aief close` emits. Both formats humans actually used — bold (`**CLOSED**`) and blockquote (`> **Status: CLOSED**`) — read as `false`, 13 times out of 13. Generalized: **every AIEF reader is a reader of human Markdown first and of its own output second.** A round-trip check on your own output is not a parser.

### Law 3 — A capability that must be remembered will be forgotten.

*Evidence:* F2. `verify` was built, correct, and unused. AIEF's own CI ran it; adopted projects inherited nothing. Discipline decayed exactly where throughput mattered most. **Governance that depends on memory is decoration.** It must run automatically or it does not exist.

### Law 4 — A disproportionate gate gets bypassed, and a bypassed gate is worse than none.

*Evidence:* inference from Law 1's data, and the sharpest disagreement this study has with the existing findings. F2 reads "nobody ran `verify`" as an adoption defect. But `verify` demanded `spec.md` from six Changes whose authors had deliberately stopped producing them: **the only way to make `verify` pass was to write six specs nobody wanted.** A gate with no proportionality has exactly two outcomes — comply with theater, or stop running it. Flux chose the second.

> **This is a hypothesis, not a finding.** It is consistent with the data but was not observed directly (nobody recorded *why* they stopped). It would be **confirmed** by a second project that disables or ignores the CI gate rather than satisfying it; it would be **refuted** if a project with the gate delivered at adoption (F2's fix) simply complies and keeps running. F2's fix ships first precisely because it is the experiment that settles this. If Law 4 is right, delivering the gate without proportionality ([06-profiles.md](06-profiles.md)) will produce compliance theater instead of governance.

### Law 5 — When the truth cannot be determined, fail loudly.

*Evidence:* F1 and F3, and the same bug shape found independently in OpenSpec (`validate --all` reported `4 passed` while silently skipping a change). Two tools, one failure: **a confident wrong answer is worse than an error.** Silence about ambiguity is a lie with good manners.

### Law 6 — If you can't `cat` it, AIEF doesn't store it.

ADR-009, unchanged and reaffirmed. Flux Portal's governance survived two weeks of hand-editing, a squashed history and a full reconciliation **because it was files**. Every session-state file this study could have proposed would have drifted. This is the one bet AIEF 1.x got unambiguously right.

## 5. Progressive complexity, concretely

Complexity is not "hidden" — that just moves it. It is **triggered**, and the trigger is a question with a yes/no answer the user can already answer about their own work:

| The artifact appears when… | Question | If no |
|---|---|---|
| **ADR** | Did you decide something that would be expensive to reverse? | No ADR. Recorded as `ADR: none`. |
| **OpenSpec** | Does something outside this Change depend on the shape of what you produce? | `OpenSpec: none`. |
| **Rollback** | Can this break production for real users? | No rollback plan. |
| **Parity + cutover** | Will two systems run at once? | Neither appears. |
| **Checkpoint** | Does a phase boundary change what "done" means? | No checkpoint. |

Two properties make this work, and both are load-bearing:

1. **`none` is a real, recorded answer** — not a blank field. A blank means "nobody asked"; `none` means "asked and answered". This is [F4](../dogfooding-findings.md)'s core insight and the reason a mandatory field is safe here but not elsewhere.
2. **Nobody is asked all five.** The [profile](06-profiles.md) pre-answers most of them. A bug fix is never asked about cutover.

## 6. What success looks like

| Measure | AIEF 1.x | AIEF 2.0 |
|---|---|---|
| Time to first useful action | ~45–60 min | **< 15 min** |
| Mandatory artifacts, smallest change | 4 | **1** |
| Decisions before writing code | 90 documented paths | **2** |
| Competing entry points | 7 | **1** |
| Concepts required to start | ADR, OpenSpec, SpecBoot, profiles, skills, standards, 3 levels, 5 change types | **Change. Evidence.** |
| Markdown : code ratio | 8:1 | **shrinking** |

*(Derivations and reproduction commands: [02-current-map.md §5](02-current-map.md#5-the-onboarding-maze).)*

## 7. The honest risk

This study's own failure mode is **redesign as accumulation**: AIEF 2.0 ships as a new layer *on top of* AIEF 1.x, the profiles and standards and navigator all survive "for compatibility", and the surface grows. That is exactly how v4 died, and this document would then be its eulogy rather than its correction.

The countermeasure is a rule, not an intention: **[11-roadmap.md](11-roadmap.md)'s first milestone deletes before it adds, and no milestone is complete while its removals are pending.** If a stage of the roadmap ends with more user-facing surface than it started, the stage failed — regardless of what it shipped.
