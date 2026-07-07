# Tasks

## Implementation

- [x] Rewrite docs/navigator/install/linux.md (canonical bootstrap; personal-path alias removed).
- [x] Rewrite docs/navigator/install/macos.md (canonical bootstrap).
- [x] Rewrite docs/navigator/install/windows.md (canonical bootstrap; PowerShell note kept).
- [x] Rewrite docs/migration-guide.md around aief doctor/init/analyze/verify/close.
- [x] Normalize SpecBoot spelling in docs/, adapters/ (including navigator/diagrams and navigator/paths); leave ADRs, changes/, releases/, historical CHANGELOG entries untouched.
- [x] Update SECURITY.md scope (CLI product).
- [x] Rewrite docs/navigator/ai-assistants.md around aief prompt.
- [x] Fix docs/navigator/README.md pre-CLI phrasing.
- [x] Add COMMAND_HELP.explain (help-text data only) and extend the help-coverage test.
- [x] Update CHANGELOG.

## Verification

- [x] No personal paths in docs (grep).
- [x] No Specboot spelling in current-facing docs (grep).
- [x] aief help explain exits 0.
- [x] Link check over changed docs: 0 broken.
- [x] npm test green (50/50; help-coverage test now includes explain).
- [x] aief verify PASS.

## Evidence

- [x] Update evidence.md
