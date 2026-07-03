# Specification

## Goal

The Adoption Engine is safe to run on real existing projects, explains its reasoning, and degrades loudly (never silently) when optional tooling is missing or incompatible.

## Requirements

- `adopt` uses the next available Change ID instead of a hardcoded `0001`.
- Technology detection keywords, files and dependency signals are declared in `cli/src/skills-catalog.json`, each with id, description, signal strength, keywords, files and recommended skills.
- Keyword matching uses word boundaries; generic words like "maintainability" or "plain" must not trigger `ai` or `tenant` signals.
- Skill recommendations include the reason (which detector fired and why).
- `propose` checks whether OpenSpec is installed, reports its version when available, verifies a `propose` command is exposed, and prints "OpenSpec delegation failed. Falling back to local Change generation." (or an equivalent explicit message) on any failure before creating a local Change.
- `COMMAND_HELP` covers: doctor, status, adopt, analyze, new-change, propose, prompt, verify, close, release, init, use-profile, help — each with purpose, when, reads, writes, example and next step.
- `prompt` detects Analysis Changes regardless of CRLF/LF line endings.
- `templates/change/evidence.md` and the CLI evidence template share one standard structure: Summary, Activities Performed, Verification, Findings, Risks, Recommendations, Artifacts Produced, Lessons Learned, Next Change.
- `verify` warns (without failing) when an evidence.md still contains template placeholders.
- `release` reports honestly whether the file was created or already existed.
- No new runtime dependencies; Node >= 18.

## Acceptance Criteria

- [ ] `adopt` on a project with `changes/0001-existing/` creates `0002-adopt-aief` (or next free ID).
- [ ] A README containing only "maintainability" triggers no skill recommendations beyond the fallback.
- [ ] `doctor`/`adopt` output includes the reason per recommended skill.
- [ ] `propose` without OpenSpec prints an explicit local-fallback message and creates the Change.
- [ ] `propose` with a broken OpenSpec prints the delegation-failure message.
- [ ] `aief help new-change` exits 0 and shows all six fields.
- [ ] `prompt` on a CRLF Analysis Change forbids source-code modification.
- [ ] `npm test` in `cli/` passes.
- [ ] `aief verify` at repo root passes.
- [ ] Evidence updated.
