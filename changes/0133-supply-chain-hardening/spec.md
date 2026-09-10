# Specification

## Goal

CI surfaces a known-vulnerability check on every dependency change, static-analysis findings on
every push/PR and weekly, and a machine-readable SBOM per release to `main` — all without adding
a runtime or dev dependency to the CLI itself.

## Requirements

- R1: `.github/workflows/codeql.yml` runs `github/codeql-action` (`init` + `analyze`) for the
  `javascript-typescript` language, triggered on push to `main`, every pull request, and a
  weekly cron schedule. Declares only the `security-events: write`/`contents: read` permissions
  it needs.
- R2: `.github/workflows/dependency-review.yml` runs `actions/dependency-review-action` on every
  pull request.
- R3: `.github/workflows/ci.yml` gains an `sbom` job, gated to `push` events only (not PRs — an
  SBOM describes what's released, generated once per merge), that runs `npm ci` then
  `npm sbom --sbom-format cyclonedx` inside `cli/` and uploads the result as a build artifact.
- R4: No new entry in `cli/package.json`'s `dependencies` or `devDependencies` — the SBOM step
  uses npm's own built-in command.
- R5: `docs/security-model.md`'s Known Gaps section is updated: the CodeQL/dependency-review/SBOM
  gap is removed (now covered); a new line names secret scanning specifically as a remaining,
  deliberately-not-automated gap (a repository setting, not CI config).

## Acceptance Criteria

- [ ] All three workflow YAML files parse as valid YAML.
- [ ] `cli/package.json`'s dependency lists are unchanged by this Change.
- [ ] `docs/security-model.md` no longer lists "no CodeQL/dependency-review/SBOM" as a gap, and
      does list the secret-scanning-is-a-setting gap.
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0133-supply-chain-hardening --strict` all pass.
