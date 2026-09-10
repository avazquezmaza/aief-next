# Tasks

## Implementation

- [x] Add `.github/workflows/codeql.yml` (R1).
- [x] Add `.github/workflows/dependency-review.yml` (R2).
- [x] Add the `sbom` job to `.github/workflows/ci.yml` (R3, R4).
- [x] Update `docs/security-model.md`'s Known Gaps section (R5).

## Documentation

- [x] `change.md`/this Change's own files explain why each addition needs no new dependency.

## Verification

- [x] Validated all three workflow files as syntactically valid YAML (`python3 -c "import
      yaml; yaml.safe_load(...)"`).
- [x] Confirmed `npm sbom --sbom-format cyclonedx` runs successfully locally with no new
      dependency (npm 10.9.8, already ≥9.5).
- [x] Run `npm test`, `npm run lint`, `git diff --check`.
- [x] Run `node cli/bin/aief.js verify --change 0133-supply-chain-hardening --strict`.

## Evidence

- [x] Update evidence.md
