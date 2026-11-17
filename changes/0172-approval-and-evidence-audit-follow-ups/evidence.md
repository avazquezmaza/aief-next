# Evidence

## Summary

Follow-ups to the audit recorded in Change 0171. The approval guard now refuses an approval that
arrives already resolved (F2); `aief verify --strict` notices, for any assistant, an approval that
is resolved but was never committed unchecked (D1a); evidence counts as complete only when
`## Summary` and `## Verification` hold real content (F3, D2); 0171's bare `F3`/`F4` references
point here, and F4 is recorded as unrecoverable (D3). The Continue rule (D1b) was dropped by the
owner: Continue already loads `AGENTS.md`, which carries the same instruction (see Findings).

## Activities Performed

- `cli/templates/guardrails/aief-approval-guard.mjs`: after the existing checks, every approval
  resolved in the result that was absent before the edit is refused as
  `added already resolved: (human) …` — a new line, a new file, a rewritten line (R1, R2).
- `previous-versions.json` gains the 0167 guard's sha256, and
  `cli/tests/fixtures/aief-approval-guard-0167.mjs` keeps a copy, so `aief guardrails install`
  refreshes an unmodified 0167 copy and still leaves an edited one alone (R3).
- `cli/src/core/services/approval-history.js` (new): read-only `git log` / `git show` over a
  Change's `tasks.md` and `spec.md`; reports `(human)`/`(review)` items resolved now and never
  unchecked in any commit. `change-verifier.js` prints them under `--strict` as `!` notices, for
  open Changes only (D1a).
- `classifyEvidence()` in `cli/src/core/domain/change.js`: after the 2× ratio, `complete` also
  requires `## Summary` and `## Verification`, when present, to hold a substantive line (D2).
- 0171's `change.md`, `spec.md` and `evidence.md`: the F2/F3/F4 references point to this Change and
  say they are not the `docs/history/dogfooding-findings.md` findings of the same number (R7).
- Docs: `docs/cli.md` (guard row, `verify --strict` row), `docs/configuration.md` (guard and the
  no-hook case), `docs/concepts.md` (Evidence).

## Verification

- Reproduction before the fix (scratch project, guard run as Claude Code would): checking an
  existing unchecked approval → exit 2; adding `- [x] (human) …` as a new line → exit 0; writing a
  new `spec.md` with a checked `(human)` criterion → exit 0.
- `node --test cli/tests/guardrails.test.js` → 28 pass (5 new: new resolved line, new file,
  rewritten line, allowed cases, Gemini JSON denial; refresh of an unmodified 0167 hook).
- `node --test cli/tests/approval-history.test.js` → 5 pass: committed unchecked then checked (not
  reported), committed already checked in `tasks.md` and `spec.md` (reported), uncommitted added
  approval (reported), no git repository (nothing), `verify --strict` notice — non-blocking, absent
  without `--strict`, absent once the Change is closed.
- `node --test cli/tests/evidence-classification.test.js` → 15 pass (4 new). The scratch probe
  that showed F3 (eight `Pending.` sections, 16–20 generic lines in Summary → `complete`) now
  returns `partial` at every size.
- On this repository: `aief verify --strict` → zero new notices; 0.16 s. `aief verify` → PASS, no
  closed Change changed classification.
- `npm test` → `tests 813, pass 813, fail 0`. `npm run lint` → clean. `git diff --check` → clean.
- PR: https://github.com/avazquezmaza/aief-next/pull/125, squash-merged as `7480564`. On `main`
  before close, `aief verify --strict --change 0172` → PASS with five `!` notices for the owner's
  approvals — the squash-merge window described in Risks, observed as predicted.

## Findings

- **D1b adds nothing Continue does not already have.** Continue 2.0.0 (read in the installed
  extension, `SUPPORTED_AGENT_FILES = ["AGENTS.md", "AGENT.md", "CLAUDE.md"]`, loaded with
  `alwaysApply: true`) applies the workspace's `AGENTS.md` as a rule. `AGENTS.md` already forbids
  an assistant to check `(human)`/`(review)` items; the assistant in 0171 had that instruction and
  checked the approval anyway. A `.continue/rules/` file would repeat it through the same channel.
  ADR-042 also asks for a verified installation before AIEF ships assistant-specific guardrails.
  The owner dropped D1b on this basis; D1 resolves to (a).
- The D1a notice is a notice, not an error, on purpose: git cannot tell an assistant that wrote an
  approval already checked from a person who wrote and checked their own in one commit, and a
  shallow clone can miss the unchecked version.

## Risks

- D2 can move an in-progress Change from `complete` to `partial` when Summary or Verification is
  still the template. None of this repository's Changes moved; free-form evidence without those
  headings is unaffected.
- D1a and squash merges: a PR squash-merged into `main` collapses a Change's history into one
  commit, so on `main` its approvals look first-committed already resolved until the Change is
  closed. The notice is non-blocking and limited to open Changes, so the window is the time
  between merge and close. Observed on this Change before its first commit: all five owner
  approvals were noticed, as designed, because the owner checked them in the working tree.
- The guard now also refuses rewording an already-checked approval (it reads as a new resolved
  item). That is deliberate — the wording is what was approved — but it is new behaviour.

## Recommendations

- None beyond this Change.

## Artifacts Produced

- `cli/templates/guardrails/aief-approval-guard.mjs`, `previous-versions.json`,
  `cli/tests/fixtures/aief-approval-guard-0167.mjs`
- `cli/src/core/services/approval-history.js`, `cli/src/core/services/change-verifier.js`
- `cli/src/core/domain/change.js`
- `cli/tests/guardrails.test.js`, `cli/tests/approval-history.test.js`,
  `cli/tests/evidence-classification.test.js`
- `docs/cli.md`, `docs/configuration.md`, `docs/concepts.md`
- 0171's `change.md`, `spec.md`, `evidence.md` (references only)

## Lessons Learned

An instruction an assistant already has is not a control. What caught 0171's invented approval was
a person reading the diff; what catches the next one without a hook is a check over git history.

## Next Change

None required.
