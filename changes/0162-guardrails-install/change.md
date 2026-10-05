# Change

## ID

`0162-guardrails-install`

## Type

Feature

## Objective

Wave 2 of Analysis 0154, item A4: turn AIEF's "no secrets" policy into Claude Code configuration,
and offer a hook that keeps an assistant from checking approval boxes (the risk Analysis 0149
accepted).

## Decision (human)

The owner chose on 2026-10-05: merge deny rules into the project's Claude Code settings without
removing or changing existing ones (not a copy-yourself template); include the approval hook as an
explicit option. The hook is recorded as ADR-041.

## Scope

### In scope

- `aief guardrails install [--local] [--approval-hook]`.
- Deny-rule template, based on the list the owner wrote by hand in `THINGS/neto`.
- The approval-guard hook script and its registration.
- `aief doctor` guardrail report; docs; ADR-041; tests.

### Out of scope

- Kiro and Codex configuration (no equivalent verified yet).
- Running the command in any project.
- Version bump (released with the private-mode Change).

## Success Criteria

- Rules are merged without duplicates and without losing any existing setting.
- The hook blocks checking, abandoning or deleting an approval, and allows everything else.
- `npm test`, `npm run lint`, `aief verify --strict` pass.

## Status

Closed (2026-10-05)
