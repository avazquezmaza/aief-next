# Evidence

## Summary

All review findings in scope resolved on 2026-07-06. The two Major findings (pre-bootstrap install guides with a leaked personal path; manual pre-CLI migration guide) and five Minor findings are fixed. Documentation-only, except one isolated help-text data entry (`COMMAND_HELP.explain`) explicitly allowed by the scope.

## Activities Performed

- **Major 1**: `docs/navigator/install/{linux,macos,windows}.md` rewritten — canonical `npm install && npm link` flow, `aief doctor` verification, `node cli/bin/aief.js` as explicit no-link fallback, link to `docs/bootstrap.md`; the `alias aief="node /home/$USER/PRS/..."` personal path removed; OS-specific prerequisites and the optional OpenSpec/SpecBoot sections preserved.
- **Major 2**: `docs/migration-guide.md` rewritten — checkpoint → `aief doctor` → `aief init`/`adopt` → one Change at a time (`analyze`, `prompt`) → `verify`/`close --yes` → grow knowledge; "adopt gradually" principle preserved; cross-links to lifecycle.md and existing-project.md.
- **Minor (terminology)**: `Specboot` → `SpecBoot` across README, `docs/**` (including navigator diagrams/paths) and `adapters/**`. Untouched by design: `knowledge/decisions.md` (accepted ADRs), `changes/`, `releases/`, historical CHANGELOG entries, and all lowercase paths/packages (`adapters/specboot/`, `templates/specboot/`, `@lidr/lidr-specboot`).
- **Minor (SECURITY.md)**: scope now opens with "a dependency-free Node.js CLI plus documentation, templates, and examples" and lists CLI vulnerabilities first.
- **Minor (ai-assistants.md)**: rewritten around `aief prompt <assistant>`; handwritten prompt examples removed; manual-briefing fallback described as "the same files the Prompt Engine uses".
- **Minor (navigator/README.md)**: "What do I copy?" → "What do I run?".
- **Minor (explain help)**: added `explain` entry to `COMMAND_HELP` in `cli/src/cli.js` (data object only — `explain` already worked as a command and was already listed in usage; no behavior change) and added `"explain"` to the help-coverage test list.
- CHANGELOG entry for 0027.

## Verification

```
grep -rn "PRS" docs/ README.md          -> none (no personal paths)
grep -rln "Specboot" README docs adapters -> none (current docs normalized)
aief help explain                        -> exits 0, six standard fields
link check (7 changed docs)              -> 0 broken
npm test                                 -> 50 tests, 50 pass, 0 fail
                                            (help-coverage test now iterates 14 commands incl. explain)
aief verify                              -> PASS
```

## Findings

- The review's terminology count (~26 SpecBoot vs ~23 Specboot) traced exactly to the documentation-era boundary: every pre-0026 file used "Specboot". One sed pass over current docs closed it; historical records keep their original spelling intentionally.
- `explain` was the only usage-listed command without a help topic; the fix was pure data (COMMAND_HELP entry), confirming ADR-006's structure keeps help fixes out of logic.

## Risks

- None identified. No runtime logic touched; the one CLI file edit is a static data entry covered by the extended test.

## Recommendations

Deferred review Suggestions, for future Changes (all require owner prioritization):

1. Consolidate the triplicated onboarding docs (Getting-Started / first-30-minutes / learning-path).
2. Expand CONTRIBUTING.md before soliciting external contributions.
3. Add a root bootstrap job to CI (`npm install`, root `npm test`, `aief --help`).
4. Harmonize naming (product "AIEF" vs repo `aief-next` vs `@aief/cli`) before npm publication.

## Artifacts Produced

- Rewritten: `docs/navigator/install/{linux,macos,windows}.md`, `docs/migration-guide.md`, `docs/navigator/ai-assistants.md`.
- Edited: `SECURITY.md`, `docs/navigator/README.md`, `cli/src/cli.js` (COMMAND_HELP data), `cli/tests/cli.test.js` (one list entry), `CHANGELOG.md`, plus the SpecBoot normalization across `docs/` and `adapters/`.
- `changes/0027-product-review-fixes/` (this Change).

## Lessons Learned

- An independent review pass with fresh eyes caught what the consolidation Change itself could not: the files it *didn't* touch. "Review the periphery, not just the deliverables" is worth keeping as a release-readiness habit.

## Next Change

Candidates: Operational Profiles implementation (ADR-012), or the deferred review Suggestions above.
