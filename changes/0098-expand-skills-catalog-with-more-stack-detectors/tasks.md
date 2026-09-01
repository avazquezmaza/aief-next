# Tasks

## Implementation

- [x] Add 20 new detectors to `cli/src/skills-catalog.json` (python, go, rust, spring, vue,
      angular, svelte, mongodb, redis, graphql, docker, kubernetes, vercel, netlify, stripe,
      supabase, firebase, react-native, kafka, rabbitmq).
- [x] Add 2 new Skills (`payments-reviewer`, `container-deployment-reviewer`) with full
      `promptContext`/`commonRisks`/`evidenceExpectations`.

## Documentation

- [x] change.md / spec.md record the scope and requirements; no separate doc needed (data-only
      change, catalog is self-describing).

## Verification

- [x] `npm test` — 1003/1003 passing (997 existing + 6 new test cases).
- [x] `node cli/bin/aief.js verify` — PASS.
- [x] `git diff --check` — clean.
- [x] Confirmed zero diff in `cli/src/detect.js` (data-only change).

## Evidence

- [x] Update evidence.md
