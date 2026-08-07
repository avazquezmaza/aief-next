# Evidence

## Summary

Added a "Platform support" subsection to `docs/getting-started.md` (under `## Install`) stating
that Linux and macOS are fully supported without caveats, and that Windows has `win32`-specific
code branches but is not verified end-to-end — WSL2 is the recommended path today.
Documentation-only; no `cli/src/` file was touched.

## Activities Performed

- Inspected `cli/src/cli.js` and `cli/src/sdd-providers/openspec.js` for platform-specific code:
  both branch on `process.platform === "win32"` for tool detection (`where` vs `which`) and
  `spawnSync`'s `shell` option — confirming Windows has explicit but unexercised support.
- Confirmed no path is built with manual `/` concatenation anywhere under `cli/src/` (all use
  `path.join`), which is why Linux/macOS need no special-casing.
- Confirmed `README.md`, `docs/getting-started.md`, and `docs/cli.md` had zero prior mention of
  platform support (`grep -ni "platform\|windows\|macos\|linux\|wsl"` returned nothing).
- Checked `docs/cli.md` for an install/prerequisites section to cross-reference from — none
  exists, so no cross-reference was added (per spec.md's stated requirement).

## Files Changed

- `docs/getting-started.md` — new "Platform support" subsection under `## Install`.

## Verification

- `npm test` (root, via `cli/`): 756/756 passing.
- `node cli/bin/aief.js verify` (repo root): PASS.
- `git diff --check`: clean, no whitespace errors.
- No file under `cli/src/` was touched (documentation-only Change).

## Findings

None — this was a documentation gap-fill, not an analysis of existing code for defects.
