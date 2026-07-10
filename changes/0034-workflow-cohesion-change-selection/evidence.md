# Evidence

> Composition: written manually by the human+assistant pair (assistant: Claude, via Claude Code; profile: developer/architect reasoning; no `aief prompt` composition used) — dogfooding H6 of docs/runtime-governance-open-questions.md.

## Summary

Made Change selection explicit and deterministic across `status`, `prompt`, `verify` and `close` on 2026-07-09, closing the Workflow Cohesion finding from Flux Portal dogfooding: workflow commands could implicitly select the chronologically latest open Change even when the user was working on another. One shared resolver now backs every Change-operating command; with more than one open Change, mutating/composing commands refuse to guess and require `--change <id>`. Backward compatible: single-open repos keep their current ergonomics. No hidden state introduced (ADR-009); no runtime executes external tests/agents/loops.

## Activities Performed

- **Shared resolver**: added `matchChanges(selector, dirs)` to `cli/src/core/domain/change.js` — deterministic tiers (exact basename → exact numeric ID → substring of name), returning all matches in the first non-empty tier so callers can distinguish not-found from ambiguous.
- **Verification service**: added `verifyChange(change, cwd)` and factored the shared `addChangeLines()` in `core/services/change-verifier.js`; changed the whole-project `verify` "Next:" hint so that with several open Changes it no longer names one as active, instead prompting explicit selection.
- **cli.js selection helpers**: `openChangeDirs()`, `resolveExplicitChange()` (loud on no-match and on ambiguity, lists candidates, exit 1), `resolveImplicitChange()` (one open → that Change; zero → error; many → error + candidate list + `--change` form). No session state — selection derived from files every call.
- **Rewired commands** onto the shared resolver: `prompt` (implicit only when one open; `--change` otherwise; composes only the selected Change), `close` (never closes implicitly with >1 open; keeps readiness checks + `--yes`), `propose --change` (dropped its old "last match wins" substring pick), `verify` (new `--change` single-Change mode that names the verified Change), `status` (lists all open Changes, flags multiplicity, presents none as active).
- **Hints & help**: `new-change`/`analyze`/`enrich` next-steps and the adoption tasks note now name their target Change; `COMMAND_HELP` (status/prompt/verify/close) and the usage banner document `--change`.
- **Docs**: `docs/cli.md`, `docs/Workflow.md`, `README.md` updated from "latest open is automatically active" to the explicit-selection model.
- **Tests**: new `cli/tests/change-selection.test.js` (matchChanges unit tests + the 12 required scenarios + status listing), registered in `cli/package.json`; updated the two existing `prompt` tests that relied on implicit multi-open selection to pass `--change`.

## Verification

```
Commands (real output captured in a temp repo with two open Changes):

$ aief prompt          # 2 open, no --change
Multiple open Changes (2) — not selecting one implicitly:
- 0001-add-login
- 0002-remove-banner
Select one explicitly:
  aief prompt --change <id>
(exit 1)

$ aief close --yes     # 2 open, no --change
Multiple open Changes (2) — not selecting one implicitly: ...  (exit 1)

$ aief verify --change 0001
Verified Change: changes/0001-add-login
○ changes/0001-add-login — in progress ...
Result: PASS

Test suites:
$ npm test  (root)              -> 93 tests, 93 pass, 0 fail
$ (cd cli && npm test)          -> 93 tests, 93 pass, 0 fail
$ (cd examples/todo-app && npm test) -> 3 tests, 3 pass, 0 fail
$ node cli/bin/aief.js verify   -> Result: PASS

The 12 required scenarios are covered by cli/tests/change-selection.test.js:
zero/one/two+ open; selection by id; by slug; non-existent id; ambiguous id;
prompt with multiple open; verify with multiple open; close with multiple open;
no mutating command silently selects the latest; single-open backward compat.
```

## Findings

- The safest behavior consistent with AIEF's philosophy was an **actionable error listing the candidates**, not interactive selection — the CLI is non-interactive by design (its output pipes into assistants), so interactive prompts would break that. Matches the guided/honest-messaging principle (ADR-006).
- Reusing the already-extracted `core/` verifier meant `verify --change` shares the exact same rules as project verify — no second implementation of "is this Change sound".
- No session file was needed: because open/closed is already derived from `change.md`, the whole feature is stateless (ADR-009 held without effort).

## Risks

- **This repo shows "14 open Changes"** because its early Changes (0001–0012) predate the `close` mechanism and never got a `## Status / Closed` section. That is pre-existing state, not introduced here; `verify` still PASSes. It does mean that inside *this* repo, `prompt`/`close` now require `--change` — the correct, intended behavior, but worth noting for anyone running bare `aief prompt` in the framework repo itself.
- Substring matching can still be ambiguous by design; mitigated by failing loudly with the candidate list rather than picking one. Exact name or numeric ID always disambiguates.
- Selection remains name/ID based, not a full "unified Change identity" (the broader roadmap workstream) — this Change deliberately scopes only the "confusing active-Change selection" symptom.

## Recommendations

- Consider, in a later Change, retro-closing the historical 0001–0012 Changes so the framework repo itself returns to few open Changes — cosmetic, out of scope here.
- Fold the remaining "Unified Change identity" roadmap items (duplicate-creation refusal, OpenSpec artifacts inside the Change dir) into a future Change; this one covers selection only.

## Artifacts Produced

- Modified: `cli/src/core/domain/change.js` (+matchChanges), `cli/src/core/services/change-verifier.js` (+verifyChange/addChangeLines), `cli/src/cli.js` (resolvers + rewiring + help), `cli/package.json` (test file), `cli/tests/cli.test.js` (two prompt tests), `docs/cli.md`, `docs/Workflow.md`, `README.md`.
- New: `cli/tests/change-selection.test.js`.
- `changes/0034-workflow-cohesion-change-selection/` (this Change).

## Lessons Learned

- Prior investment (the `core/` extraction) paid off directly: adding `--change` verify and a shared resolver was small and low-risk precisely because verification rules already lived in one testable place.

## Next Change

`0035-governance-conventions` (this cycle): document the task/gate, deferred-work, OpenSpec↔AIEF, harness and increment conventions Flux Portal had to invent, plus the dogfooding findings log — templates and docs only, no new runtime entities.
