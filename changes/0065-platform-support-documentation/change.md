# Change

## ID

`0065-platform-support-documentation`

## Type

General

## Objective

Document AIEF's actual OS/platform support so users don't have to read the CLI source to find
out whether `aief` works outside Linux. Today `README.md`, `docs/getting-started.md`, and
`docs/cli.md` say nothing about platform — a user on macOS or Windows has no documented answer,
even though the code already has `process.platform === "win32"` branches
(`cli/src/cli.js`, `cli/src/sdd-providers/openspec.js`) that are undocumented and untested
end-to-end.

## Scope

### In scope

- A short "Platform support" note in `docs/getting-started.md` (or `README.md` — whichever the
  existing "Getting Started" entry point convention favors) stating: Linux and macOS are
  supported without caveats (POSIX-generic code path, `path.join` throughout, no `darwin`-specific
  branching needed); Windows has `win32`-specific branches in the code (tool detection via
  `where`, `shell: true` for `spawnSync`) but is **not verified end-to-end** — WSL2 is the
  recommended path for Windows users until it is.
- Cross-reference from `docs/cli.md` if that doc has an install/prerequisites section.

### Out of scope

- Actually testing/fixing Windows native support — this Change documents current state, it does
  not change CLI behavior or add new `win32` handling.
- CI matrix changes (e.g., adding a Windows runner) — a follow-up Change if the project decides to
  formally support and verify Windows natively.

## Success Criteria

- A user reading `docs/getting-started.md` (or equivalent) can tell, without reading
  `cli/src/cli.js`, which platforms are supported and which are code-present-but-unverified.
- No CLI/runtime behavior changes.

## Status

Closed (2026-08-07)
