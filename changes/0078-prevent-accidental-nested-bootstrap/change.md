# Change

## ID

`0078-prevent-accidental-nested-bootstrap`

## Type

General

## Objective

Fix the nested-bootstrap finding from the completed technical audit: running `aief bootstrap`
(no argument) from a subdirectory of an already-bootstrapped AIEF project silently creates a
second, independent, fully-duplicated governance structure nested inside the real one. Add a
lightweight ancestor-detection guard, not a general project-root-discovery redesign.

## Scope

### In scope

- `bootstrapHere()`: before `runAdoption()` writes anything, check whether an ancestor directory
  (above the current one) already has both `AGENTS.md` and `changes/` — the AIEF project markers
  — **and** the current directory does not yet have them itself (an ordinary idempotent re-run of
  an already-bootstrapped directory is unaffected). If both hold, refuse (exit 1, zero writes)
  with a message naming the ancestor project's path, unless `--force` is explicitly passed.
- A new `--force` boolean flag on `bootstrap` only, added to Batch 5's `KNOWN_FLAGS` schema.
- Regression tests: bootstrap from an actual project root (unchanged success); bootstrap from a
  fresh, unrelated directory with no AIEF ancestor at any depth (unchanged success); bootstrap
  from a subdirectory of an already-bootstrapped project (now refuses, no nested structure
  created); the same case with `--force` (proceeds, matching today's prior behavior, explicitly
  opted into).

### Out of scope

- Any change to how read-only commands (`status`, `verify`, `prompt`, etc.) resolve their working
  directory — this guard is specific to `bootstrap`'s own pre-flight check, not a general
  upward-discovery redesign for every command.
- Any change to `aief bootstrap <name>` (the new-project-elsewhere path via `initProject`), which
  is unaffected by this finding (it creates a project at an explicitly-named new location, not
  silently in the current directory).
- `docs/getting-started.md`'s wording update to describe the new guard's actual behavior —
  handled in this same Change (small follow-up to the sentence Change 0076 added, per that
  Change's own forward note).

## Success Criteria

- `aief bootstrap` from the actual project root: unchanged, succeeds exactly as before.
- `aief bootstrap` from a directory with no AIEF ancestor anywhere above it: unchanged, succeeds
  exactly as before (this is ordinary "adopt AIEF into a new project" usage).
- `aief bootstrap` from a subdirectory of an existing, already-bootstrapped AIEF project: refuses
  (exit 1), creates nothing, names the ancestor project's path.
- `aief bootstrap --force` in that same subdirectory: proceeds, matching today's prior (pre-guard)
  behavior — an explicit, deliberate choice, not a silent default.

## Status

Closed (2026-08-13)
