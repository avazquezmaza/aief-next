# Evidence

## Summary

Implemented the decision from Analysis 0149 (Option 1+ with the non-blocking adjustment). `[-]` no
longer resolves a `(human)` or `(review)` approval; `aief close` prints the checked approvals it
relies on; `verify --strict` notes Analysis/Definition Changes with no `(human)` line without
failing. Docs state what is enforced, the residual risk, and platform controls for teams. AIEF
still does not claim to know who checked a box.

## Activities Performed

1. R1: `parseApprovalLines()` in `cli/src/core/domain/change.js`, next to `countOpenTasks()`, with
   the same `[-*+]` bullet and `x`/`X` tolerance. Returns label (`human`, `review`, `gate:<id>`),
   state (`checked`, `unchecked`, `abandoned`) and text.
2. R2: `abandonedApprovalProblems()` in `cli/src/core/services/change-verifier.js`, used by
   `checkChangeReadiness()` (so `close` and, for tracked Changes, the Workflow Engine's `readiness`
   gate) and by `checkStrictCompleteness()`. `(gate:<id>)` lines are left to `taskLabelGate()`,
   which already treats `[-]` as missing (ADR-037).
3. R3: under `--strict`, `addChangeLines()` adds a `warn` line (never `error`) for a Change whose
   `## Type` starts with Analysis or Definition and has no `(human)` line.
4. R4: `close` prints `Approvals relied on:` (or `none`) after "All readiness checks passed", for
   tracked and untracked Changes, with and without `--yes`.
5. R5: `docs/security-model.md` (Known Gaps rewritten: enforced rules, residual risk, team
   controls), `docs/cli.md` (`close` and `verify --strict` rows), `AGENTS.md` and
   `cli/templates/agents/AGENTS.md` (one sentence, still identical), and
   `docs/history/governance-conventions.md` §2 (exception for approvals).
6. Exercised the behavior in a disposable project before writing tests (all combinations below).

## Verification

New tests: `cli/tests/approval-labels.test.js`, 11 tests:

| Test | Covers |
| --- | --- |
| parser: labels, three states, bullet and case tolerance | R1 |
| readiness: `[-] (human)` / `[-] (review)` block; checked do not | R2 |
| readiness: ordinary `[-]` and `[-] (gate:…)` not this rule's concern | R2 |
| `--strict` names an abandoned approval | R2 |
| `close --yes` refuses `[-] (human)`, leaves `change.md` unclosed | R2 |
| `close` lists checked approvals, dry run and `--yes` | R4 |
| tracked Change: gates listed; `[-] (human)` blocks via the `readiness` gate | R2, R4 |
| `close` prints `Approvals relied on: none` | R4 |
| `--strict` notice for Analysis without `(human)`, result PASS | R3 |
| no notice once `(human)` exists | R3 |
| plain `verify` never shows the notice | R3 |

Disposable project (`aief bootstrap demo`), before tests were written:

| tasks.md | `close` | `verify --strict` |
| --- | --- | --- |
| `[ ] (human)` | blocks (unchecked task) | FAIL |
| `[x] (human)`, `[x] (review)` | passes; lists both | PASS |
| `[-] (human)` | blocks: `(human) approval marked [-]` | FAIL |
| `[-] (review)` | blocks: `(review) approval marked [-]` | FAIL |
| no approval lines | passes; `Approvals relied on: none` | PASS |
| `governed`, all gates `[x]`, `[-] (human)` | blocks: `readiness: (human) approval marked [-]` | FAIL |
| `governed`, all gates `[x]` | passes; lists the three gates | PASS |

Repository checks:

```bash
npm test                                   # 1137/1137 pass (1126 before + 11 new)
npm run lint                               # clean
node cli/bin/aief.js verify                # PASS
git diff --check                           # clean
diff -q AGENTS.md cli/templates/agents/AGENTS.md   # identical (agents-canonical test also passes)
```

R6, project-wide verdicts before and after:

| Command | Before | After |
| --- | --- | --- |
| `aief verify` | PASS | PASS |
| `aief verify --strict` | FAIL only on 0150's own open `(review)`/`(human)` tasks | Same, plus three non-blocking `!` notices: 0013, 0020, 0050 (the three Analysis Changes measured in 0149) |

### Independent Review (Gemini)

- **Reviewer:** Gemini (independent reviewer; implementation performed by Claude Code in PR #101).
- **Scope reviewed:** All diffs in PR #101 (`cli/src/core/domain/change.js`, `cli/src/core/services/change-verifier.js`, `cli/src/commands/close.js`, `cli/tests/approval-labels.test.js`, and documentation updates in `docs/security-model.md`, `docs/cli.md`, `AGENTS.md`, `cli/templates/agents/AGENTS.md`, `docs/history/governance-conventions.md`).
- **Verification details:**
  - `parseApprovalLines()` correctly parses bullet styles (`-`, `*`, `+`), checkbox states (`[x]`, `[-]`, `[ ]`), and target labels (`human`, `review`, `gate:<id>`) with case tolerance.
  - `checkChangeReadiness()` and `checkStrictCompleteness()` block on abandoned `(human)` and `(review)` approvals with actionable guidance.
  - Tracked changes and gate evaluations (ADR-037) remain robust and unregressed.
  - `verify --strict` flags historical and future Analysis/Definition Changes lacking `(human)` with a non-blocking `!` notice while preserving PASS verdicts on clean repos.
  - All test suites (`1137/1137` tests), linter, structural verifier, and diff checks pass cleanly.
- **Verdict:** Approved.

## Findings

- The notice text says "normally require one" deliberately: the three historical Analysis Changes
  predate the convention and are not defects.
- A deleted approval line in an ordinary Change remains undetectable (no history is read); this is
  part of the documented residual risk.

## Findings Status

| Finding | Status | Resolved By | Notes |
| --- | --- | --- | --- |
| C0149-F1 | Resolved | 0150 | `[-]` blocks `(human)`/`(review)`; checked and deleted lines remain residual risk. |
| C0149-F2 | Resolved | 0150 | `(human)`/`(review)` now share the gate rule for `[-]`. |
| C0149-F3 | Resolved | 0150 | Accepted residual risk, stated in `docs/security-model.md`. |
| C0149-F4 | Resolved | 0150 | Team platform controls documented. |
| C0149-F5 | Resolved | 0150 | `AGENTS.md` (and the template every entrypoint defers to) states the `[-]` rule. |

## Risks

- A project whose `tasks.md` uses `[-] (human)` today will see `close` block after upgrading. The
  message says how to resolve it. This repository has none (measured in 0149).

## Recommendations

- Independent review (`(review)`) completed and approved by Gemini; owner `(human)` approval recorded; Change closed.

## Artifacts Produced

- `cli/src/core/domain/change.js`, `cli/src/core/services/change-verifier.js`, `cli/src/commands/close.js`
- `cli/tests/approval-labels.test.js`
- `docs/security-model.md`, `docs/cli.md`, `docs/history/governance-conventions.md`
- `AGENTS.md`, `cli/templates/agents/AGENTS.md`

## Lessons Learned

- Reusing the gate pattern (absence or `[-]` means unresolved) closed most of the gap with a small
  change.

## Next Change

None required. Update 0149's Findings Status to point here when closing.
