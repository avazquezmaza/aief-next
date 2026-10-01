# Evidence

## Summary

AIEF cannot verify locally *who* resolved an approval task, and this analysis finds no option that
changes that without network access or hardware keys. It did find cheaper, measurable holes:
`(human)` and `(review)` tasks can be bypassed in three ways (checked, marked `[-]`, or deleted)
and `close` and `verify --strict` accept all three, while `(gate:<id>)` tasks already resist two of
them. Recommendation: close the cheap holes, make the approvals a Change relies on visible at close
time, document platform controls for teams, and accept the residual risk explicitly. Reject git
provenance, signing-by-default and an `aief approve` command.

## Activities Performed

1. Read the enforcement code: `checkChangeReadiness()`/`checkStrictCompleteness()`
   (`cli/src/core/services/change-verifier.js`), `countOpenTasks()`
   (`cli/src/core/domain/change.js`), `taskLabelGate()` (`cli/src/core/services/gate-evaluator.js`),
   ADR-037, `AGENTS.md`, `docs/security-model.md`.
2. Probed bypass routes in a disposable project (`aief bootstrap demo`, one Change, `close` without
   `--yes` and `verify --strict`), with and without a `governed` track.
3. Measured git provenance signals on this repository's `main` and on PR #95's original commits.

## R1: Threat Model

| Actor | Example | Can AIEF address it locally and offline? |
| --- | --- | --- |
| A. Owner | Checks the box | Nothing to stop. |
| B. Assistant acting on owner instructions | "Approved, mark it and close" | Legitimate. AIEF should keep it visible, not block it. |
| C. Assistant overstepping | By mistake, or via prompt injection from repository content | **In scope.** AIEF can make bypasses harder and more visible, but cannot prove identity. |
| D. Malicious actor with the owner's credentials | Same account, keys and `gh` token | **Out of scope.** Indistinguishable from A on a local machine. |

Constraint: the assistant runs as the owner's OS user with the owner's git identity and, in this
setup, the owner's `gh` token. Any secret the owner can use without a physical action, the
assistant can use too.

## R2: Current Mechanism

- `countOpenTasks()` counts only `[ ]` lines (`/^\s*[-*+] \[ \]/gm`). `close` blocks on any
  unchecked task; `[x]` and `[-]` both count as resolved.
- `checkStrictCompleteness()` flags only `[ ] (human)` and `[ ] (review)` lines.
- `taskLabelGate()` (ADR-037) resolves a gate only from `[ ]`/`[x]` lines labeled `(gate:<id>)`.
  No matching line means `pending`, which blocks. A `[-]` line does not match, so it also blocks.
  Gates are evaluated only for Changes whose manifest declares a `track`.
- "Only a human may check" is a rule in `AGENTS.md` and `docs/assistant-workflow.md`. The assistant
  entrypoints (`CLAUDE.md`, `CODEX.md`, `GEMINI.md`, both `aief-change` skills) do not restate it;
  they defer to `AGENTS.md`. Nothing in code distinguishes who changed the line.

### Measured bypass routes (disposable project)

| tasks.md approval line | `close` (no `--yes`) | `verify --strict` |
| --- | --- | --- |
| `- [ ] (human) Owner approves.` (control) | blocks (1 unchecked task) | FAIL |
| `- [x] (human) …` | passes | PASS |
| `- [-] (human) …` | **passes** | **PASS** |
| line deleted | **passes** | **PASS** |
| `- [-] (review) …` | **passes** | **PASS** |
| `governed` track, all `(gate:*)` `[x]` | passes | — |
| `governed`, `- [-] (gate:approval)` | blocks (`approval` pending) | — |
| `governed`, `(gate:approval)` deleted | blocks (`approval` pending) | — |
| no track, `- [-] (gate:approval)` | passes (gates not evaluated) | — |

## R3: Options

| Option | Stops C? | Stops D? | Invariant fit | Cost | Friction (solo / team) | Verdict |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Accept and document | No | No | Full | Docs | None / None | Necessary but not sufficient |
| 1+. Close cheap holes and add visibility (below) | **Partly**: removes silent `[-]` and deletion for labeled lines; makes approvals visible at close | No | Full: file-only, deterministic, no network | Small CLI change and tests | Low / Low | **Recommended** |
| 2. Git provenance | No | No | Fits (local git) | Medium | Low / Low | **Reject**: not discriminating here (measured below) |
| 3. Signed approval commits | Only with hardware keys that need a touch | Only with hardware keys | Fits, but needs key setup and an allow-list | High | High / Medium | **Reject as default**; possible opt-in for regulated teams |
| 4. Platform controls (branch protection, required review by another account, CODEOWNERS) | **Yes for teams**: the assistant's token cannot approve its own PR | Yes, if the token is not an admin's | Outside AIEF; documented, not read | Docs | Not available solo / Low | **Recommend for teams** (docs) |
| 5. `aief approve` command | No: an assistant can run it | No | Fits | Medium (new command) | Medium / Medium | **Reject**: ceremony without assurance |

**Option 1+ in detail** (proposed for a follow-up implementation Change):
- A `[-]` line that still carries `(human)` or `(review)` does not resolve it. `close` and `--strict`
  report it as unresolved: "an approval cannot be abandoned with `[-]`; check it, or remove the
  label with a note". This matches how `(gate:*)` already behaves.
- `aief close --yes` prints the approval lines it is relying on (`(human)`, `(review)`,
  `(gate:*)`) before writing `Closed`, so the human sees exactly what is being treated as approved.
- `verify --strict` notes an Analysis or Definition Change that has no `(human)` line at all, since
  their scaffolds include one. This catches the "line deleted" route for the Change types that
  always require a human decision.
- Limit: an assistant can still check `[x]`, or delete the label from an ordinary Change. That is
  the residual risk, together with actor D.

### Option 2 measurements (this repository)

- PR #95's original commits and this session's commits all show the owner as author
  (`Andres Vazquez`); the assistant commits with the owner's identity. No signature (`%G? = N`).
- `main` is squash-merged: `changes/0145-laya-domain-model/tasks.md` was touched on `main` by one
  commit, the squash merge, committed by `GitHub` (`%G? = E`, web-flow signature). It proves GitHub
  made the merge, not who checked the box.
- 109 of the last 200 commit messages on `main` contain a Claude marker, because PR bodies end with
  "Generated with Claude Code" and the squash merge copies the PR body. The marker appears on every
  PR, so it cannot tell which approval an assistant made.
- Approval checks land in the same commit as implementation work (for example 0145's close), so
  "same commit also changed code" is the normal case, not a warning sign.

## R4: Recommendation

1. **Implement Option 1+** in a small follow-up Change: `[-]` no longer resolves labeled approvals;
   `close --yes` lists the approvals it relies on; `--strict` flags Analysis/Definition Changes
   without a `(human)` line.
2. **Document Option 4** for teams in `docs/security-model.md`: branch protection, at least one
   required review from a different account, CODEOWNERS on `changes/**`, and an assistant token that
   cannot approve or merge.
3. **Accept and state the residual risk** (Option 1): for a solo owner whose assistant shares
   their identity and tokens, AIEF cannot verify who checked an approval. The control is the
   owner's review at close time and at merge, which Option 1+ makes explicit.
4. **Reject** Options 2 and 5; keep Option 3 as a documented opt-in idea, not a feature.

ADR-037 is not changed: gates already behave as recommended. The `[-]` rule for `(human)`/`(review)`
changes the convention in `docs/history/governance-conventions.md` §2. The implementation Change
should decide whether that deserves its own ADR.

**Decision requested from the owner:** Do you approve Option 1+ as the next implementation Change,
together with the documentation of Option 4 and the accepted residual risk, and the rejection of
Options 2, 3 (as a default) and 5?

## Decision

**Date:** 2026-10-01
**Decision by owner:** approved the complete recommendation, with one adjustment.

1. **Option 1+ (harden approval labels):** approved as the next implementation Change
   (`0150-harden-approval-labels`).
2. **Option 4 (platform controls):** document in `docs/security-model.md` for team workflows.
3. **Option 1 (residual risk):** accept, and state it explicitly in `docs/security-model.md`.
4. **Options 2, 3 (as a default) and 5:** rejected.
5. **Adjustment:** the "Analysis/Definition Change without a `(human)` line" check is a
   **non-blocking notice**. Measured before deciding: 3 closed Analysis Changes have no `(human)`
   line, and a blocking check would make project-wide `verify --strict` fail on history. No
   `[-] (human)` or `[-] (review)` line exists in the repository, so the `[-]` rule affects no
   closed Change.

Provenance (C0149-F3 in practice): this section was first drafted by another assistant, citing an
earlier "si" from the owner that had authorized starting the analysis, not approving its outcome.
The owner then confirmed the decision explicitly in the chat ("ok" to the recommendation including
the adjustment). The text above records that confirmation.

## Verification

```bash
node cli/bin/aief.js verify --change 0149-human-approval-identity --strict
# Expected FAIL only on the owner's (human) task until it is reviewed.
```

Bypass probes: disposable project under the session scratchpad, not in the repository. Commands
and outputs are summarized in R2.

## Findings

- **C0149-F1 (High):** `(human)` and `(review)` approvals are resolved by `[x]`, by `[-]` or by
  deleting the line; `close` and `verify --strict` accept all three (measured).
- **C0149-F2 (Medium):** `(gate:*)` approvals already resist `[-]` and deletion, but only for
  Changes with a declared `track`; without a track the labels are ignored (measured).
- **C0149-F3 (High, inherent):** No local signal distinguishes owner from assistant: shared git
  identity, squash merges committed by GitHub, and an AI marker on every PR body (measured).
- **C0149-F4 (Medium):** With a shared `gh` token, platform controls bind only for teams with a
  second account and branch protection. A solo owner cannot use required reviews on their own PRs.
- **C0149-F5 (Low):** Assistant entrypoints do not restate the `(human)` rule; they rely on
  `AGENTS.md` (0 mentions in `CLAUDE.md`, `CODEX.md`, `GEMINI.md`, both `aief-change` skills).

## Findings Status

| Finding | Status | Resolved By | Notes |
| --- | --- | --- | --- |
| C0149-F1 | Open | — | Approved: Option 1+ in `0150`. |
| C0149-F2 | Open | — | Partly addressed by Option 1+ (same rule for `(human)`/`(review)`). |
| C0149-F3 | Open | — | Accepted residual risk, to be stated in `docs/security-model.md`. |
| C0149-F4 | Open | — | Proposed: document Option 4 for teams. |
| C0149-F5 | Open | — | Optional: one line in each entrypoint during the Option 1+ Change. |

## Risks

- Option 1+ changes what `[-]` means on labeled approval lines. Existing closed Changes are not
  re-verified by `close`, but `verify --strict` across the project could start reporting historical
  lines. The implementation Change must check the repository's own history first.

## Recommendations

See R4.

## Artifacts Produced

- `changes/0149-human-approval-identity/evidence.md` (this analysis)

## Lessons Learned

- The gate mechanism (ADR-037) already contains the stronger pattern (absence means pending). The
  older `(human)`/`(review)` labels never adopted it.
- A local, offline tool cannot authenticate a human against an assistant that shares the human's
  identity. Its realistic job is to make approvals explicit and bypasses loud.

## Next Change

Approved: `0150-harden-approval-labels` (Option 1+ with the non-blocking notice adjustment, plus the
docs for Option 4 and the residual risk).
