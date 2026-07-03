# Evidence

## Summary

First real-project validation of the Adoption Engine, executed on 2026-07-03 against Flux Portal (`trk-orchestrator-portal`) — a production-grade Next.js 14 multitenant n8n orchestrator with Cognito auth and Drizzle/Postgres. **The full flow (`doctor → adopt → verify → analyze → prompt`) completed with zero manual fixes and zero modifications to tracked files.** Four frictions were observed; all four were fixed in AIEF the same day with test coverage, honoring the "improve only from observed evidence" principle.

## Activities Performed

- Inspected the target (read-only): stack, git state (clean except a pre-existing CLAUDE.md edit).
- `aief doctor`: 10/10 detectors fired with accurate reasons — nextjs, react, typescript, tailwind, postgres, cognito (strong: dependencies/files); n8n, multitenant, rbac, aiRoadmap (weak: keywords in README.md/CLAUDE.md). 5 Skills recommended, each with its "because" trail.
- `aief adopt`: created `AGENTS.md`, `knowledge/README.md` (inside a pre-existing empty `knowledge/`), `profiles/README.md`, `changes/0001-adopt-aief/`.
- `aief verify`: PASS.
- `aief analyze`: created `changes/0002-analyze-current-architecture/`.
- `aief prompt --assistant claude --profile architect`: correct Analysis prompt, referenced CLAUDE.md, forbade source-code modification.
- Completed the target's `0001-adopt-aief` evidence and tasks.
- Fixed the four observed frictions in AIEF and re-validated on the target.

## Verification

- `git status` in the target after adoption: only untracked additions (`AGENTS.md`, `changes/`, `knowledge/README.md`, `profiles/`); the only modified tracked file (`CLAUDE.md`) was already modified before adoption.
- CLI suite after fixes: 22/22 pass.
- Re-ran `doctor` on Flux Portal after fixes: `aws-saas-platform` now recommended (via cognito, strong signal); duplicated "Next:" gone.
- `aief verify`: PASS in the target and in this repository.

## Findings

Frictions observed (all fixed same-day, each backed by this validation):

1. **Catalog gap — Drizzle:** the postgres detector fired only because the `postgres` driver package was present; `drizzle-orm`/`drizzle-kit` were not signals. A Drizzle project using the `pg` driver under a different name would have been missed. Fixed in `skills-catalog.json` + regression test.
2. **Skill gap — Cognito without AWS SDK:** the project uses Cognito (`amazon-cognito-identity-js`, `aws-jwt-verify`) but no `@aws-sdk/*` packages, so `aws-saas-platform` was never recommended despite the cognito signal firing. Fixed: the skill now triggers on `cognito` too.
3. **Output duplication in `doctor`:** the embedded status printed "Next: aief adopt" and doctor printed its own "Recommended next step" — two next-step blocks in one command. Fixed: doctor suppresses the status-level hint.
4. **Inconsistent hint:** `analyze` suggested `aief prompt --profile architect` while the README flow documents `--assistant claude --profile architect`. Fixed.

Positive observations:

- Adoption was genuinely additive: pre-existing `knowledge/` reused, `CLAUDE.md`/`README.md` untouched, IDs collision-free.
- Detection reasons were all verifiable against the actual files — no false positives on a 12KB CLAUDE.md.
- `adopt` output is verbose (repeats the full signal dump after doctor); acceptable, recorded as a possible future refinement, not fixed (no observed harm).

## Risks

- One validation project is a sample of one; the detectors and flow should also be exercised on a project with a very different stack (e.g. Python or Go) where package.json signals don't exist.
- The target's `0002-analyze-current-architecture` is created but not yet driven; the prompt-to-assistant loop is validated only up to prompt generation.

## Recommendations

- Run the generated architect prompt in Flux Portal to validate the assistant loop end-to-end (completes the target's 0002).
- Add a non-Node project to the validation set to exercise detection without package.json.
- Consider trimming `adopt` output (signals already shown by doctor) if verbosity is confirmed as friction by another user.

## Artifacts Produced

- In the target: `AGENTS.md`, `knowledge/README.md`, `profiles/README.md`, `changes/0001-adopt-aief/` (evidence completed), `changes/0002-analyze-current-architecture/`.
- In AIEF: `cli/src/skills-catalog.json` (drizzle + cognito→aws), `cli/src/cli.js` (doctor dedup, analyze hint), `cli/tests/detect.test.js` (+1 test).

## Lessons Learned

- Real-project validation immediately surfaced gaps that fixtures never would (Drizzle, Cognito-without-SDK): the roadmap principle "improve only from observed evidence" paid off on the first run.
- Weak keyword signals performed well on a real, large CLAUDE.md — the word-boundary fix from 0014 held up.

## Next Change

Drive `0002-analyze-current-architecture` in Flux Portal with the generated prompt (in that repository), and afterwards consider `0017-cross-stack-validation` (validate adoption on a non-Node project).
