# Evidence

> Composition: written manually by the human+assistant pair working this Change (assistant: Claude, via Claude Code; profile: architect-style reasoning; no `aief prompt` composition was used — this line dogfoods hypothesis H6 of docs/runtime-governance-open-questions.md).

## Summary

Created `docs/external-harness-patterns.md` on 2026-07-09: a pattern-by-pattern evaluation of `betta-tech/harness-sdd` and `multica-ai/andrej-karpathy-skills`, concluding in 2 adopt-as-affirmation verdicts, 8 adapt verdicts (each gated on named evidence per ADR-008), and 5 reject verdicts (each anchored to an accepted ADR or product-identity boundary). Documentation only: no code, no CLI change, no test change, no file copied from the external repos, AGENTS.md untouched, no dependency added.

## Activities Performed

- Created the Change with `aief new-change evaluate-external-harness-patterns` (ID 0033 assigned by the CLI).
- Read both public GitHub repos (2026-07-09):
  - **harness-sdd**: Spec-Driven Development harness for autonomous agents — four-phase gate system (Spec → human approval → Implementation → Review → Closure), role-separated agents (`leader`/`spec_author`/`implementer`/`reviewer` under `.claude/agents/`), EARS-numbered requirements mapped to tests, `CHECKPOINTS.md` + `init.sh` executable verification, `feature_list.json` WIP gate, `progress/current.md`+`history.md` state files, progressive disclosure of AGENTS.md.
  - **karpathy-skills**: four behavior principles for AI coding assistants (Think Before Coding, Simplicity First, Surgical Changes, Goal-Driven Execution), distributed as CLAUDE.md/CURSOR.md content and a Claude Code plugin.
- Wrote `docs/external-harness-patterns.md`: per-repo contributions; compatible patterns (already AIEF's model — independent convergence recorded as validation, not new work); adapt patterns (concept in, mechanism out, AIEF-native landing place, evidence gate each); reject patterns; 8 risks of copying without validating; explicit coverage of the seven relationship dimensions; 15-row decision table (Fuente | Patrón | Adoptar | Adaptar | Rechazar | Razón | Evidencia requerida); the six expected decisions confirmed in §7.
- Completed this Change's change.md, spec.md and tasks.md (were the generic scaffold).

## Verification

```
aief verify -> PASS (0033 present and structurally complete)
npm test    -> NOT RUN, correctly: no executable file changed (documentation only).
git status  -> Untracked only:
               changes/0033-evaluate-external-harness-patterns/
               docs/external-harness-patterns.md
Manual checks:
- No file copied from either external repo (all content is analysis, not reproduction).
- AGENTS.md, cli/, tests, folder structure: untouched.
- Every "adaptar" row names concrete required evidence; every "rechazar" row names
  the ADR (004/008/009/012) or identity boundary (Prime Directive, readiness doc) it protects.
- Change NOT closed, per instructions — Human Review tasks left unchecked in tasks.md.
```

## Findings

- **The strongest signal is convergent, not novel**: harness-sdd — built for *autonomous* agents — independently arrived at AIEF's two founding bets (artifact-based communication, human approval before code). External convergence from the opposite end of the autonomy spectrum is meaningful validation of ADR-009 and the human-gated model, at zero implementation cost.
- **harness-sdd's roles map almost 1:1 onto Profiles AIEF already has** (`spec_author`→analyst/architect, `implementer`→developer, `reviewer`→reviewer) — reinforcing that ADR-012's structured Profile model is the right landing place for role discipline, and that no agent runtime is needed to get role separation's benefit.
- **Its state files are AIEF's road not taken**: `feature_list.json`/`progress/current.md` are precisely the `.aief/state.json` ADR-009 rejected — seeing them in a real harness clarifies what AIEF avoided (second source of truth, per-person state made global).
- **karpathy-skills' "skills" are not AIEF Skills**: they are behavior rules, which ADR-012 explicitly bars from the Skills dimension ("Skills must never define assistant behaviour"). The correct shelves are AGENTS.md (rules), Profiles (reasoning), Standards (project conventions) — and several of the four principles already exist in AIEF's AGENTS.md template in weaker wording.
- **Both repos' verification patterns point at the same existing roadmap item**: CHECKPOINTS.md and init.sh are harness-sdd's answer to the gap AIEF already named as the closability/verify contract (ROADMAP-TO-1.0 workstream 4) — confirming that workstream's priority rather than adding a new one.

## Risks

- The 8 "adaptar" verdicts could be read as a to-do list; they are not — each is blocked on its evidence gate, and acting on them without that evidence is the ADR-008 violation this document exists to prevent.
- External repos evolve; this evaluation is a 2026-07-09 snapshot. If either repo is revisited, re-read before citing.
- WebFetch-based reading summarizes rather than exhaustively audits the repos; any future adaptation Change should re-verify the specific pattern's details at source before designing against them.

## Recommendations

- Treat the two "adopt" rows as done (they describe AIEF as it is) and record the convergence in any future external-facing material about why files-as-truth works.
- When ROADMAP-TO-1.0 workstream 4 (closability contract) is designed, bring the requirement-numbering/executable-verification rows of the table into that design session as candidate inputs.
- If/when ADR-012 (Operational Profiles) is implemented, use harness-sdd's role-isolation discipline and karpathy's Think Before Coding as source material for `thinkingStyle` content — through the structured model, never as copied files.
- Keep AGENTS.md untouched until there is validation evidence that assistants violate the current (weaker) wording of simplicity/surgical rules; then sharpen wording in place.

## Artifacts Produced

- New: `docs/external-harness-patterns.md`.
- `changes/0033-evaluate-external-harness-patterns/` (this Change: change.md, spec.md, tasks.md, evidence.md).

## Lessons Learned

- Evaluating an agent-autonomy harness through AIEF's ADR lens turned out to be cheap and high-yield: most verdicts fell out mechanically from four ADRs (004, 008, 009, 012), which suggests the decision log is doing its job as a filter for external ideas — the evaluation took one document, not a debate.

## Next Change

Human review of this evaluation's verdicts (tasks.md → Human Review section), then whichever evidence gate opens first: ADR-012 implementation (roles-as-profiles), closability-contract design (workstream 4, absorbing the traceability/executable-verification rows), or observed friction unlocking one of the remaining "adaptar" rows.
