# Specification

## Goal

`main` is ready to tag as `v3.5.0`: every Change since 3.4.0 is integrated and documented, all
manifests report 3.5.0, and `releases/v3.5.0.md` tells an upgrading user what changed.

## Requirements

### R1: Integration

- 0148–0152 each have `Closed` status and are reachable from `main`.

### R2: Documentation audit

- Check for drift since 3.4.0: version strings; `[-]` approval semantics and "Approvals relied
  on:" (0150) in `docs/cli.md`, `docs/security-model.md`, `AGENTS.md` + template, governance
  conventions; Skill/detector lists that would need `protocol-security-reviewer`,
  `websocket`, `grpc` (0151).
- Fix each verified gap; record "no gap" findings in `evidence.md`.

### R3: Version bump

- `package.json`, `cli/package.json`, `package-lock.json`, `cli/package-lock.json`: own version
  `3.5.0`; dependencies unchanged.
- `README.md` `## Status` says "AIEF 3.5".

### R4: Release notes

- `releases/v3.5.0.md` with Upgrade notes (approval `[-]` now blocks; close output; strict notice;
  new Skill/detectors), Summary of 0148–0153, Verification.

### R5: Changes index

- `changes/README.md`: section "3.5.0 — 0148–0153", "Released by Change 0153.", lists 0153; then
  "Unreleased (after 3.5.0) — 0154+" with no entries yet.

## Acceptance Criteria

- [x] R1 recorded in `evidence.md`.
- [x] R2 audit recorded; verified gaps fixed.
- [x] `node -p "require('./package.json').version"` and `cli/package.json` print `3.5.0`.
- [x] `node cli/bin/aief.js --version` prints `aief 3.5.0`.
- [x] No "AIEF 3.4" in `README.md`, `docs/`, `cli/README.md` except historical notes.
- [x] `releases/v3.5.0.md` written.
- [x] `changes/README.md` updated; all its links resolve.
- [x] `npm test`, `npm run lint`, `node cli/bin/aief.js verify`, `git diff --check` pass.
