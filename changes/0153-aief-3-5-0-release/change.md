# Change

## ID

`0153-aief-3-5-0-release`

## Type

General

## Objective

Prepare AIEF 3.5.0 in one Change, at the owner's request: confirm Changes 0148–0152 are integrated
on `main`, audit documentation for drift since 3.4.0, bump the version, and write
`releases/v3.5.0.md`. Precedents: Change 0146 (readiness) and Change 0147 (bump + notes), combined
here so the tag can point at a `main` that already contains everything.

## Inventory of what already exists

AIEF 3.5.0 is five Changes since `v3.4.0` (`92a5dae`), five commits, each Change closed with its
own evidence:

- **Governance:** `[-]` no longer resolves a `(human)` or `(review)` approval; `aief close` prints
  "Approvals relied on:"; `verify --strict` adds a non-blocking notice for an Analysis/Definition
  Change with no `(human)` line (0150, decided in analysis 0149).
- **Security docs:** `docs/security-model.md` describes Change-ID collisions as detected (0148) and
  the approval-identity residual risk and platform controls (0150).
- **Skills:** `protocol-security-reviewer` Skill with new `websocket` and `grpc` detectors; also
  recommended for the existing `graphql` detector (0151).
- **Repository navigation:** `changes/README.md` release index; history docs aligned with ADR-032
  (0152).

No ADR added since 3.4.0. MINOR, not PATCH, because 0150 changes what `aief close` and
`verify --strict` accept.

## Scope

### In scope

- Integration check: 0148–0152 closed and reachable from `main`.
- Documentation audit for drift since 3.4.0 (version strings, 0150 approval semantics, 0151 Skill
  and detectors), and fixes for verified gaps.
- `npm version 3.5.0 --no-git-tag-version` at the root and in `cli/` (manifests + lockfiles).
- `README.md` `## Status`: "AIEF 3.4" → "AIEF 3.5".
- `releases/v3.5.0.md` via `aief release 3.5.0`: upgrade notes, summary of 0148–0153,
  verification.
- `changes/README.md`: the "Unreleased" section becomes "3.5.0 — 0148–0153"; a new empty
  "Unreleased" section follows.
- Pre-tag grep for the previous version (`docs/maintainer.md` "Releasing"); diagram regeneration
  check.

### Out of scope

- Git tag `v3.5.0` and the GitHub Release: after this Change is merged, only with explicit owner
  confirmation.
- New features, commands or manifest fields; re-litigating any shipped Change.
- `CHANGELOG.md` entries (historical, not maintained past Change 0031).

## Success Criteria

- `aief --version` prints `aief 3.5.0`.
- No "AIEF 3.4" left in `README.md`, `docs/`, `cli/README.md` outside historical notes.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify` and `git diff --check` pass.

## Status

Closed (2026-10-01)
