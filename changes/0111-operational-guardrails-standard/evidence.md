# Evidence

## Summary

Encoded four operational guardrails (no secrets in tracked files, no `Co-Authored-By` trailer on
AI-authored commits, confirm before outward-facing/hard-to-reverse actions, prefer a PR over a
direct push to main/dev) as explicit policy in `AGENTS.md` (and its identical template copy),
sharpened `security-standards.md`'s Secrets subsection with concrete examples, and extended
`docs/maintainer.md`'s Git discipline section.

## Activities Performed

- Added an "Operational Guardrails" section to `AGENTS.md`, after "Human Responsibilities".
- Copied the updated `AGENTS.md` verbatim to `cli/templates/agents/AGENTS.md` (the two files are
  required to stay byte-identical; `diff` confirms this).
- Added concrete secret examples (API tokens, cloud/provider keys, bot tokens, PINs) to
  `cli/templates/standards/security-standards.md`'s existing Secrets subsection.
- Added two lines to `docs/maintainer.md`'s Git discipline section: preferring a PR over a direct
  push to main/dev, and this repository's own no-`Co-Authored-By` policy.

## Verification

- `npm test` — 1023/1023 pass.
- `node cli/bin/aief.js verify --change 0111-operational-guardrails-standard` — PASS.
- `git diff --check` — clean.
- `diff AGENTS.md cli/templates/agents/AGENTS.md` — exit 0 (identical).

## Findings

None.

## Risks

- The `Co-Authored-By` trailer is actually injected by the host/session's own configuration, not by
  any file this repository controls. This Change states AIEF's policy but cannot enforce it
  mechanically — a project (or session) whose host config forces the trailer will still produce it
  until that config is changed at its source.
- None of the four guardrails are mechanically enforced (no secret-scanning script, git hook, or CI
  gate was added) — see "Recommendations".

## Recommendations

- If mechanical enforcement of the secrets guardrail is wanted (e.g. a regex/gitleaks-style check
  wired into `npm test` or a native git pre-commit hook), scope it as its own Change — it does not
  fit AIEF's Hook/Verification Rule registries as they stand today, since neither can declare
  `executeCommands`/`network`/`writeFiles` this Entrega (ADR-020/ADR-021).

## Artifacts Produced

- `AGENTS.md`, `cli/templates/agents/AGENTS.md`, `cli/templates/standards/security-standards.md`,
  `docs/maintainer.md` — all edited.

## Lessons Learned

- `AGENTS.md` and its template copy already had a byte-identical invariant with no enforcement
  beyond convention; this Change relied on `diff` manually rather than any existing test asserting
  the two stay in sync.

## Next Change

None planned; mechanical enforcement (see Recommendations) is a candidate if the user wants it.
