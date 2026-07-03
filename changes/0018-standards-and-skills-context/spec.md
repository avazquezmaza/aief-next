# Specification

## Goal

An adopted project carries its own knowledge base (standards + skill context) that AIEF injects into every prompt, so assistants know how to work without the user writing extra context — while OpenSpec remains the spec workflow engine and AGENTS.md remains the rule hierarchy root.

## Requirements

- Standards templates are useful documents (structure + `(adapt)` markers), not empty files.
- `adopt`: always create base/documentation/testing/security standards; frontend-standards when nextjs/react/tailwind fire; backend-standards when nestjs/postgres/cognito/n8n fire; never overwrite; print exactly what was created; register in the adoption Change tasks.
- `analyze`: seed change.md with a Detected Context section (signals with reasons, recommended Skills, available standards, risks explicitly marked as inferred, open questions) and add confirmation tasks. Nothing invented: only detected or explicitly-inferred content.
- Catalog: each Skill may declare name, whenToUse, standardsToRead, promptContext, commonRisks, evidenceExpectations; `recommendSkills` passes full content through.
- `prompt`: list `knowledge/standards/*.md` as "standards to follow"; include recommended Skills with promptContext and commonRisks under an explicit "included as context, not executed" note; honest fallback line for Skills without content; remind scope/acceptance criteria.
- Adapter: document the official OpenSpec workflow (Explore → Propose → Apply → Archive), the slash-command nature of `propose`, and that terminal delegation falling back locally is expected — without claiming validation against an installed release.

## Acceptance Criteria

- [ ] `adopt` on a React-only project creates frontend + 4 base standards, no backend standards; pre-existing standards untouched.
- [ ] `adopt` on an unknown stack creates exactly the 4 base standards.
- [ ] `analyze` change.md contains Detected Context with real signals and inferred risks marked as inference.
- [ ] `prompt` lists standards, includes Skill context with the honesty note, and flags Skills without operational content.
- [ ] `verify` passes right after adopt.
- [ ] Full test suite passes; OpenSpec/Specboot remain optional.
- [ ] Evidence updated.
