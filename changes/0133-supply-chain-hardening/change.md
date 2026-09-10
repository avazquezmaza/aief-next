# Change

## ID

`0133-supply-chain-hardening`

## Type

General

## Objective

`docs/security-model.md` (Change 0132) named supply-chain hardening as a Known Gap: no CodeQL,
dependency review, or SBOM generation ran in CI. This Change closes the part of that gap that's
pure CI configuration — no application code, no new dependency (this CLI is already
dependency-free at runtime; the additions here use GitHub-hosted actions and npm's own built-in
`sbom` command, not a new package).

## Scope

### In scope

- `.github/workflows/codeql.yml`: CodeQL static analysis (`javascript-typescript`) on push to
  `main`, on every PR, and weekly (catches a newly disclosed CVE in already-merged code, not
  only new changes).
- `.github/workflows/dependency-review.yml`: `actions/dependency-review-action` on every PR —
  fails a PR that introduces a dependency with a known vulnerability.
- `.github/workflows/ci.yml`: new `sbom` job, on push to `main` only, generating a CycloneDX
  SBOM via npm's own built-in `npm sbom` (no new dependency — npm ≥9.5, already satisfied by
  this project's Node ≥22 floor) and uploading it as a build artifact.
- `docs/security-model.md`'s Known Gaps section updated to reflect what's now covered and what
  remains (secret scanning is a repository *setting*, not a workflow file — left for the
  project owner to enable directly, an outward-facing repository-configuration change, not
  something this Change toggles via API).

### Out of scope

- Enabling GitHub secret scanning / push protection itself — a repository setting change, left
  for the project owner (see above).
- Release attestations / artifact provenance (e.g. SLSA) — not pursued without a concrete
  release pipeline to attach it to; this project doesn't currently publish a versioned package.
- Any change to `cli/package.json`'s dependencies.
- Fixing any finding CodeQL or Dependency Review surfaces once they start running — that's
  follow-up work triaged when (if) something is actually found, not speculative work here.

## Success Criteria

- Three CI surfaces exist and are syntactically valid: CodeQL, Dependency Review, SBOM
  generation.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify --change 0133-supply-chain-hardening --strict`, and `git diff --check` all pass (no application code touched).
- `docs/security-model.md`'s Known Gaps section accurately reflects the new state.

## Status

Closed (2026-09-10)
