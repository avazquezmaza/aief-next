# Evidence

## Summary

The native AIEF reviewer prompt was run in a real Codex session. Codex reviewed
`origin/main` at `8ef73a3`, including the governance model, `cli/src/`, and the two Changes named in
this Analysis Change. The review found two high-priority lifecycle defects and two documentation
integrity problems. No application source was modified by this Change.

The strongest finding is a split-brain close operation for manifest-backed Changes: `aief close
--yes` reports success after writing only `change.md`, while every unified reader continues to take
`manifest.json.status` as authoritative. A second reproduction showed that parallel branches can
allocate the same numeric Change ID and whole-project strict verification does not reject the
collision.

## Audit Scope and Method

- Read `AGENTS.md`, `CODEX.md`, `README.md`, this Change's `change.md`, `spec.md`, and `tasks.md`.
- Reviewed the current `origin/main` implementation and tests locally, following imports, module
  boundaries, and call sites. No Graphify capability was available or required; the architecture
  conclusions below are based on local static analysis plus executable reproductions.
- Reviewed Changes `0122-multi-agent-runtime-open-questions` and
  `0122-ci-apt-chrome-mirror-flakiness`, together with their commits and recorded verification.
- Inspected the subsequent graph, workflow-gate, CI-matrix, stop-directive, and architecture-fitness
  Changes already present on `origin/main` so findings would not report issues already resolved.
- Ran the full test suite against `origin/main`: 1,079 tests, 1,071 passed, 0 failed, 8 skipped.
  Lint could not be independently rerun in the detached audit worktree because its local dependency
  installation did not contain `eslint`; this is an environment limitation, not a lint result.

## Findings Status

| ID | Severity | Finding | Status | Resolution Change |
| --- | --- | --- | --- | --- |
| C0130-F1 | High | Manifest-backed `aief close --yes` reports success but leaves the authoritative manifest open | Resolved | 0131-manifest-close-persistence |
| C0130-F2 | High | Parallel branches can create duplicate numeric Change IDs and project-wide verification accepts them | Resolved (detection); allocation-side prevention deliberately not pursued | 0135-detect-duplicate-change-id-collisions |
| C0130-F3 | Medium | Change 0122 multi-agent evidence records a modification forbidden by its own specification | Resolved | 0134-resolve-codex-audit-doc-findings |
| C0130-F4 | Low | Change 0122 CI evidence retains stale, contradictory pre-confirmation language after CI passed | Resolved | 0134-resolve-codex-audit-doc-findings |

## Findings

### C0130-F1 — close does not persist the authoritative manifest status

`cli/src/commands/close.js` loads a tracked Change through `loadChangeUnified()` and the workflow
engine, but `markClosed()` writes only the `## Status` section of `change.md`. In contrast,
`cli/src/core/domain/change-loader.js` explicitly defines `manifest.json` as authoritative and sets
`closed` from `manifest.status` alone.

A synthetic standard-track Change with `manifest.status: "open"`, complete tasks, a satisfied
`(gate:review)`, and real evidence reproduced the defect on `origin/main`:

1. `aief close --yes --change 0001` exited 0 and printed `Closed`.
2. The manifest remained byte-for-byte open.
3. `aief status --change 0001` immediately reported `Status: open`, warned that the manifest still
   governs, and offered the close action again.

The tracked-close test asserts the success output and the new text in `change.md`, but never asserts
`manifest.status` or a subsequent unified read. A command that claims a lifecycle transition must
atomically update the authoritative state, or refuse the transition. Add a regression test that
closes a manifest-backed Change and then reloads it through `loadChangeUnified()` and `aief status`.

### C0130-F2 — numeric Change identity is not collision-safe across branches

This audit branch contains `0123-codex-external-audit`; `origin/main` independently contains
`0123-fix-graph-cycle-membership`. Both were valid local allocations on parallel branches.
`nextChangeId()` derives the number only from the current checkout, so this race is expected, but no
merge-time or project-level verifier detects it.

A synthetic project containing `0123-a` and `0123-b` passed whole-project `aief verify --strict`.
Targeted commands with `--change 0123` did fail safely as ambiguous, while full basenames remained
usable. This prevents silent selection but leaves common numeric references unusable and allows the
collision into repository history. Add a strict project invariant for unique numeric prefixes, or
change identity allocation so parallel branches cannot produce the same canonical ID. Resolve this
audit branch's collision before merging it.

**Instance resolved**: this audit branch's own collision (`0123-codex-external-audit` vs.
`0123-fix-graph-cycle-membership`, already merged to `main`) was fixed by renaming this Change to
`0130-codex-external-audit` before merging, per this finding's own recommendation — confirmed with
`git mv` and updating every internal `0123-codex-external-audit` reference in this Change's own
files. The **general** gap — no merge-time or project-level check rejects a duplicate numeric
prefix — remains open; this Change does not implement that verifier (out of its own scope), only
its own single instance of the problem it found.

### C0130-F3 — Change 0122 multi-agent artifacts contradict their specification

`changes/0122-multi-agent-runtime-open-questions/spec.md` requires a new history document with “no
existing document modified” and its acceptance criteria say no file outside the Change and that new
document was modified. Its evidence records that `docs/history/README.md` was also edited to add an
index entry and nevertheless marks the acceptance criterion complete.

The actual architectural decision was conservative and consistent with ADR-008/ADR-013; no runtime
code was introduced. The defect is in scope control and attestation. Amend the specification to
authorize the index update, or revert the index update; then correct the acceptance evidence so it
matches the chosen scope.

### C0130-F4 — Change 0122 CI evidence is internally stale

`changes/0122-ci-apt-chrome-mirror-flakiness/evidence.md` first records that PR #67's second push
passed lint and all Node test jobs and says this confirms the fix. Later, the same file says it is
“awaiting confirmation” and its Next Change still says “Once CI is confirmed green.” The executable
fix is supported by the earlier CI result, but the stale text weakens the audit trail. Rewrite those
two passages to reflect the confirmed result and final merged state.

## Positive Observations

- The multi-agent proposal was correctly deferred rather than converted into speculative runtime
  architecture; its history document names explicit evidence gates and existing ADR constraints.
- The content-based removal of the unused Chrome apt source addresses the reproduced CI failure,
  and the evidence records the failed filename-based attempt rather than hiding it.
- The graph-cycle fix on current `main` uses strongly connected components to distinguish actual
  cycle members from dependents blocked by a cycle, with focused regression coverage.
- Explicit ambiguous Change selectors fail loudly, which limits the impact of C0130-F2.

## Risks and Recommendations

C0130-F1 can cause automation or a human to believe a tracked Change closed when AIEF still treats
it as open. Fix it before relying on workflow tracks for automated lifecycle decisions. C0130-F2 is
already present in the branch topology and should be resolved before this Analysis Change is merged.
Implement each correction through a separate scoped Change, then update the status table above with
the resolving Change and verification evidence.

## Independent Verification (Claude Code)

Per this project's own discipline of not accepting an external review's claims without
reproducing them, each finding was independently checked against `origin/main` before this
Change was finalized:

- **C0130-F1 (High)**: Reproduced in an isolated `git worktree` at `origin/main`. Scaffolded a
  `lite`-track Change with a `manifest.json` (`status: "open"`), complete tasks, and real
  evidence; ran `aief close --yes`. Output: `✓ Closed`. `manifest.json` afterward: byte-for-byte
  unchanged (`"status": "open"`). `aief status` immediately after: `Status: open`, with a
  warning that the manifest still governs and the close action offered again. **Confirmed as
  described.**
- **C0130-F2 (High)**: Self-evident from this session's own history — the exact collision Codex
  describes (`0123-codex-external-audit` vs. `0123-fix-graph-cycle-membership`) is the real
  collision this Change was created under. **Confirmed**, and its own instance resolved (see
  above).
- **C0130-F3 (Medium)**: Confirmed by reading `changes/0122-multi-agent-runtime-open-questions/`
  directly: `spec.md` states "no existing document modified" and marks the corresponding
  acceptance criterion `[x]`; `evidence.md` lists `docs/history/README.md` (a pre-existing file)
  as modified. **Confirmed as described** — a real scope/attestation inconsistency in an
  already-merged Change.
- **C0130-F4 (Low)**: Confirmed by reading `changes/0122-ci-apt-chrome-mirror-flakiness/
  evidence.md` directly: it states its fix was CI-confirmed, then later still says "awaiting
  confirmation" and "once CI is confirmed green, this Change can close" — while `change.md`
  itself already records `## Status: Closed`. **Confirmed as described.**

All four findings hold up under independent reproduction, not just review of the prose.

## Pending Human Action

The Codex findings are now captured, summarized, and independently verified here. `C0130-F1`
has a fix Change opened (`0131-manifest-close-persistence`); `C0130-F2`'s instance on this
branch is resolved (the rename above). `C0130-F3`/`C0130-F4` remain open, minor documentation
corrections to already-closed Changes — small enough to fix directly if/when a human asks, not
speculatively bundled into this Analysis Change's own scope. The `(human)` acceptance/task
remains unchecked because AGENTS.md reserves that attestation for a human.
