# Tasks

## Implementation

- [x] Add "Platform support" subsection to `docs/getting-started.md` under `## Install` (Linux/
      macOS supported without caveats; Windows has `win32` code branches but is unverified,
      WSL2 recommended).
- [x] Check `docs/cli.md` for an install/prerequisites section to cross-reference — none found,
      so no cross-reference added.

## Documentation

- [x] No other document requires updating: this note lives at the single documented entry point
      for install instructions (`docs/getting-started.md`).

## Verification

- [x] `npm test` (root) passes.
- [x] `node cli/bin/aief.js verify` at repo root passes.
- [x] `git diff --check` passes.
- [x] Confirmed no file under `cli/src/` was touched.

## Evidence

- [x] Update evidence.md
