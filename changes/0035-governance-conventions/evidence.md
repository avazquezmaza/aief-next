# Evidence

> Composition: written manually by the human+assistant pair (assistant: Claude, via Claude Code; profile: architect/documenter reasoning; no `aief prompt` composition used) — dogfooding H6 of docs/runtime-governance-open-questions.md.

## Summary

Standardized the governance conventions Flux Portal invented during dogfooding as documentation, optional templates, and one AGENTS.md rule on 2026-07-09 — with zero new CLI entities, commands, or hidden state, and full parser compatibility. Two new docs (`governance-conventions.md`, `dogfooding-findings.md`), three optional template pointers, one AGENTS.md subsection, one backlog refinement. Flux Portal was cited as the empirical source only and was not modified.

## Activities Performed

- Wrote `docs/governance-conventions.md`: (1) task/gate/review labels `(human)`/`(review)`; (2) deferred/moved-work vocabulary using the `[-]` marker; (3) OpenSpec↔AIEF WHAT/HOW split + the draft/mock-vs-real-backend rule; (4) harness engineering (project executes, AIEF records, no secrets); (5) SDD target maturity (no hashes/parsers); (6) increments within large Changes; (7) optional Architecture Checkpoint section; (8) Initiative as a deferred finding — plus a closing "Parser compatibility" section.
- Wrote `docs/dogfooding-findings.md`: five-column ledger (finding / evidence / decision / action / horizon), Flux Portal as case study, no external secrets.
- Added optional, commented pointers to `templates/change/{tasks,evidence,change}.md`; added a "Tasks and gates" subsection to `AGENTS.md`; refined the Initiative deferral in `knowledge/backlog.md`.

## Verification

```
Parser compatibility (temp repo, real run):
  tasks.md with:  - [x] done ; - [-] Moved To: ... ; - [-] Deferred: ... ; - [x] (human) Approval done
  $ aief close --yes  ->  ✓ Closed  (the [-] lines did NOT block; had a bare [ ] been left, it would have)
  Confirms: [ ] and pending (human)/(review) block close; [-] does not.

Suites:
  $ npm test (root)               -> 93 tests, 93 pass, 0 fail  (no executable file changed by this Change)
  $ (cd examples/todo-app && npm test) -> 3 tests, 3 pass, 0 fail
  $ node cli/bin/aief.js verify        -> Result: PASS
  $ node cli/bin/aief.js verify --change 0035 -> Result: PASS

Links: relative links in both new docs resolve (checked).
Scope: git status shows no path under trk-orchestrator-portal — Flux Portal untouched.
```

## Findings

- Every required convention maps onto the **existing** checkbox parser without a code change: `(human)`/`(review)` are still `- [ ]` (blocking, correct); `[-]` is not counted (non-blocking, correct for resolved/deferred work). This is why Governance Conventions is documentation-only — the parser already supports the distinction, it just wasn't written down.
- `templates/change/*.md` are reference documents, not consumed by the CLI's Change generation (`genericChangeFiles()` builds inline), so template edits carry zero runtime risk.
- The task/gate distinction here is the documented, convention-level answer to the open question raised in docs/runtime-governance-open-questions.md §2 — deliberately a convention now, machine-enforcement deferred to the closability-contract workstream.

## Risks

- Conventions rely on discipline, not enforcement: an assistant could still check a `(human)` box (the AGENTS.md rule + human diff review are the current guards). Promoting to machine enforcement is deferred, evidence-gated.
- Comments in templates are guidance only; teams may ignore them. Acceptable — the conventions are opt-in by design.

## Recommendations

- When the closability-contract workstream (ROADMAP-TO-1.0 #4) is designed, bring §1 (gates) and §2 (deferred markers) as candidate machine checks — e.g. warn when an assistant-authored diff checks a `(human)` box.
- Re-run this evaluation's Initiative question after the Flux Portal frontend migration completes (backlog #1).

## Artifacts Produced

- New: `docs/governance-conventions.md`, `docs/dogfooding-findings.md`.
- Modified: `templates/change/{tasks,evidence,change}.md`, `AGENTS.md`, `knowledge/backlog.md`.
- `changes/0035-governance-conventions/` (this Change).

## Lessons Learned

- The cheapest governance improvement was writing down what the parser already tolerated: no code, no risk, immediate consistency. Convention-before-mechanism (the path Skills/Standards/Profiles took) applied cleanly again.

## Next Change

Deferred items only, each evidence-gated: Initiative support (after the migration), and folding gates/traceability into the closability-contract workstream when it is designed.
