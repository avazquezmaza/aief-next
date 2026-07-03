# Evidence

> **Note:** captured retroactively on 2026-07-03. The analysis was performed with an AI assistant (Claude) before this file was filled in; findings below are the real, verified results of that session — several were reproduced by executing the CLI in a sandbox. Nothing here is invented after the fact.

## Summary

Full architecture and code review of the repository. Conclusion: the repo is coherent as a methodology framework; the executable core (CLI) had real defects in exactly the commands that form the Adoption Engine, plus versioning/license hygiene gaps. No production-security surface exists (no network code, no secrets).

## Activities Performed

- Reviewed repository structure, all documentation trees (docs/, specs/, adapters/, profiles/, templates/, starter-project/), the CLI (`cli/src/cli.js`) and the todo-app example.
- Executed read-only CLI commands (`verify`, `doctor`, `status`) against the repo.
- Reproduced suspected bugs empirically in a sandbox outside the repo (adopt ID collision, keyword false positives).
- Ran the todo-app test suite.
- Scanned for hardcoded secrets (none found).

## Verification

- `aief verify` at repo root: PASS.
- `examples/todo-app` tests: 3/3 pass.
- Sandbox reproduction: `aief adopt` in a project with `changes/0001-existing/` created a duplicate ID `0001-adopt-aief`; a README containing only "plain text about maintainability" triggered the `aiRoadmap` detector via substring "ai".

## Findings

- **Adoption Engine bugs:** hardcoded `0001-adopt-aief` ID collided with existing Changes; substring keyword detection produced false-positive skill recommendations; `release` printed "Created" when nothing was written; `help` lacked topics for documented commands; Analysis detection in `prompt` broke on CRLF files.
- **Zero test coverage** on the only executable product code (the CLI `test` script just printed help).
- **OpenSpec integration unvalidated:** `openspec propose` was assumed, with a silent fallback masking breakage.
- **Hygiene:** `LICENSE` contained only the words "MIT License"; CHANGELOG/releases/README told contradictory version stories; `knowledge/` was missing from the framework's own repo; two evidence files were template placeholders; no CI existed.
- **Not applicable (worth recording):** no Next.js app, middleware, API routes, multitenancy, RBAC or n8n integration exists here — those keywords in the CLI are detection signals inherited from the AIEF v4 origin project.

## Risks

- Windows-specific behavior untested (`shell: true` in `run()`, CRLF handling) — no Windows environment available during analysis.
- Weak (keyword-based) detection can still mislead; it is a heuristic even with word boundaries.

## Recommendations

- Fix Adoption Engine defects and decouple detection into data (done in Change 0014).
- Add CLI tests and CI (tests in 0014; CI in 0015).
- Validate OpenSpec contract loudly (runtime validation in 0014; real-release validation still pending).
- License/changelog hygiene and public README (Change 0015).
- Windows robustness as a future Change.

## Artifacts Produced

- Architecture / Code Review report (delivered in the analysis session; findings incorporated into Changes 0014 and 0015).
- Sandbox reproduction commands for the confirmed bugs.

## Lessons Learned

- Evidence must be captured when the work happens; reconstructing it later costs accuracy (hence this retroactive note).
- Empirical reproduction (running the CLI on fixtures) turned "likely bugs" into confirmed ones cheaply.

## Next Change

`0014-adoption-engine-hardening` (completed) — implemented the fixes this analysis recommended.
