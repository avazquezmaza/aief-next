# Specification

## Goal

AIEF provides consistent, verifiable instructions across Codex, Claude Code and Gemini without introducing secret exposure, unsupported CI tooling or test side effects.

## Requirements

- R1: Run lint with Node 22 in a separate CI job; keep runtime tests on Node 18, 20 and 22 without installing incompatible dev dependencies. Document setup commands.
- R2: Ignore `.env` and environment-specific local variants at any depth; keep `.env.example` and environment-specific `.example` templates trackable.
- R3: State that auto-branching applies only on main/dev. Existing feature branches and worktrees are preserved; users must choose the correct checkout. Keep the root and canonical AGENTS identical.
- R4: Add `.agents/skills/aief-change/SKILL.md` as a short Codex entrypoint. Put the shared procedure in current documentation; reference it from Kiro and assistant files instead of copying the procedure. Claude/Gemini import AGENTS using their documented native syntax. The procedure respects existing authorization, requires a spec before implementation and leaves human/review gates to their owners.
- R5: Graphify context permits semantic analysis only for a relevant task with an available tool and explicit or durable authorization for external processing. Credential presence is not authorization. Local code reading remains sufficient when those conditions are unmet. Doctor reports credential presence without claiming an engine is available or executing.
- R6: Copy diagram scripts into a temporary layout for regeneration tests, compare SVGs with committed files and validate generated PNG headers. Clean up only the test-owned temporary directory.
- R7: Test explicit assistant targeting, native-file fallback, explicit Change selection, ambiguity and gate enforcement with synthetic fixtures for all three assistants. Run the same bounded read-only scenarios through installed CLIs where service access permits; record versions, response evidence, limitations and fixture integrity. Use existing model defaults, no bypass flags.

## Acceptance Criteria

- [x] CI lint runs on supported Node 22; runtime jobs retain Node 18/20/22 without ESLint installation.
- [x] Effective Git ignore checks reject local secret files and allow example templates.
- [x] Branch docs match existing behavior and canonical AGENTS equality passes.
- [x] Codex skill validates; shared procedure and native imports resolve without duplicated policy bodies.
- [x] Generated prompts retain equivalent AIEF constraints across Codex, Claude and Gemini; external processing requires authorization.
- [x] Diagram verification leaves tracked SVG/PNG files untouched and checks temporary outputs.
- [x] Deterministic parity tests and full suite pass, with live assistant results or access limitations documented separately.
- [x] Lint, strict AIEF verification and git diff --check pass; evidence records all six findings.
