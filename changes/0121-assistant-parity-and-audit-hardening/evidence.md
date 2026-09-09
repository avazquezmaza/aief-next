# Evidence

## Summary

Implemented the six audit resolutions under the owner-authorized scope in Change 0121. AIEF itself created branch `general/0121-assistant-parity-and-audit-hardening` before scaffolding. The specification and tasks were written and read before implementation. The owner subsequently authorized closure, commit, feature-branch push and PR creation on 2026-09-09. Deployment and release approval remain outside this authorization.

## Findings Status

| Finding | Status | Resolution | Verification |
| --- | --- | --- | --- |
| F1: ESLint 10 incompatible with CI Node 18 | Resolved | Separate Node 22 lint job; runtime Node 18/20/22 matrix does not install ESLint | Clean npm ci + lint; full runtime suite passes on local Node 18 and 22 |
| F2: local .env files not ignored | Resolved | Ignore .env and .env.* with explicit .example exceptions | Effective Git ignore checks at root and nested paths |
| F3: overly broad one-branch-per-Change claim | Resolved | Root/template policy and maintainer guide describe main/dev-only switching and preservation of feature branches/worktrees | Canonical AGENTS equality and git-branch regression tests |
| F4: no native Codex skill/shared procedure | Resolved | Discoverable Codex skill, shared procedure, Kiro reference, native Claude/Gemini AGENTS imports | Both skill validators, reference resolution, CLI parity tests and live context marker |
| F5: credential presence treated as Graphify availability/authorization | Resolved | Local analysis default; relevance, actual tool availability and explicit/durable authorization required for external processing; doctor states only credential presence | Doctor regressions, generated prompt inspection, live hypothetical scenario D |
| F6: diagram tests regenerate tracked images | Resolved | Regenerate in test-owned temporary script layout, compare SVGs, validate PNGs and check original bytes | Diagram test passes; no tracked image changes after full runs |

## Verification

- Baseline from the audit: 1043 tests. Added 10 deterministic assistant parity tests, making 1053 total.
- Targeted tests (assistant parity, diagrams, canonical AGENTS, Git branch behavior): 40/40 pass.
- Clean tooling install: `npm --prefix cli ci`; 70 packages installed, npm reported 0 vulnerabilities for that resolved dependency set. This is not a comprehensive security audit.
- `npm run lint`: exit 0 on Node 22.23.1.
- Full suite on Node 22.23.1: 1053/1053 pass, zero skipped, 146.1 seconds. Local log: `/tmp/aief-0121-full.log`.
- Full suite on temporary Node 18.20.8: 1053/1053 pass, zero skipped, 69.5 seconds. Command: `npm exec --yes --cache /tmp/aief-0121-node-cache --package=node@18 -- node --test` from cli/. Local log: `/tmp/aief-0121-node18.log`.
- Todo example test runner: pass.
- Codex and Kiro skill validators: valid. Both relative references resolve to docs/assistant-workflow.md. Root AGENTS matches the canonical template byte-for-byte; native imports are present.
- Effective ignore checks: .env, .env.local and nested/.env.prod are ignored; .env.example and nested/.env.prod.example remain trackable.
- `aief prompt codex --change 0121`: generates the updated authorization-aware Graphify context. No assistant service is called by prompt generation.
- `git diff --check`: clean. No tracked SVG/PNG modifications.
- `node cli/bin/aief.js verify --strict --change 0121`: PASS. Repository-wide `node cli/bin/aief.js verify --strict`: PASS; After owner authorization, `aief close --yes --change 0121` passed all readiness checks and marked the Change Closed. Post-close strict verification also passed.

## Assistant behavior

See [behavioral-results.md](behavioral-results.md) and the reproducible [probe.py](probe.py).
Codex CLI 0.153.4, Claude Code 2.1.263 and Gemini CLI 0.59.0 all returned correct workflow decisions for four shared scenarios and the policy marker; all fixtures remained unchanged. Gemini required explicit trust for the synthetic directory while keeping plan/read-only mode. Claude over-read some fixture context and gave a partly imprecise policy explanation, documented separately from the correct decisions.

## Risks and limitations

- Read-only behavioral smoke tests do not prove end-to-end implementation quality or perfect instruction adherence. No model ranking is claimed.
- Node 20 remains in CI but was not run locally in this Change. The remote GitHub Actions workflow has not been dispatched or observed here.
- Skills/native assistant files are repository entrypoints; bootstrap still supplies only the shared AGENTS policy, as documented. No global assistant settings changed.
- F3 was a documentation correction: behavior on existing branches intentionally remains unchanged.
- The owner explicitly authorized closing, committing, pushing this branch and opening a PR. Merge and release decisions remain separate.

## Lessons Learned

Separate runtime support from development tooling requirements. File-presence checks cannot establish service availability or authorization. Native context loading differs between assistants even when AIEF's generated prompt contract is identical. Keep behavioral evidence separate from CLI exit status and run generators outside the working tree during tests.
