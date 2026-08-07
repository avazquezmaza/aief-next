# Specification

## Goal

A user who wants to run `aief` on Linux, macOS, or Windows can find out — from
`docs/getting-started.md`, without reading CLI source — which of those are supported without
caveats and which are code-present-but-unverified, plus the recommended workaround (WSL2) for the
unverified case.

## Requirements

- `docs/getting-started.md` gains a "Platform support" subsection under `## Install` stating:
  - Linux and macOS: fully supported, no caveats — code is POSIX-generic.
  - Windows: `win32`-specific branches exist in `cli/src/cli.js` and
    `cli/src/sdd-providers/openspec.js` (tool detection via `where`, `shell: true` for spawned
    processes) but are not verified end-to-end; WSL2 is the recommended path today.
- No CLI/runtime behavior changes — this Change is documentation-only.
- `docs/cli.md` is checked for an install/prerequisites section to cross-reference; none exists,
  so no cross-reference is added (confirmed via `grep -ni "install\|prerequisite" docs/cli.md`).

## Acceptance Criteria

- [x] `docs/getting-started.md` has a "Platform support" subsection covering Linux, macOS, and
      Windows/WSL2 as described above.
- [x] No file under `cli/src/` is touched.
- [x] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` all pass.
