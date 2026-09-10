# Specification

## Goal

`aief close` never reports success on a manifest-backed Change while leaving `manifest.json`'s
`status` field — the sole authority for whether that Change is closed — silently stale.

## Requirements

- R1: `markManifestClosed(changeDir)` reads `manifest.json` if present; returns `null` when
  absent (no-op, no error — the legacy/no-manifest path is entirely unaffected).
- R2: If present, `markManifestClosed()` parses and validates the manifest with the exact same
  `parseManifest()`/`validateManifest()` functions `change-loader.js` already uses for reading
  — never a second, diverging notion of "valid manifest." Any failure returns `false`; the file
  on disk is left byte-for-byte untouched.
- R3: On success, `markManifestClosed()` writes back every original field unchanged except
  `status`, now `"closed"`, as pretty-printed JSON (2-space indent) plus a trailing newline.
- R4: `close.js` calls `markManifestClosed()` before `markClosed()` (the `change.md` writer) —
  atomicity: a `false` result aborts the close with a clear error and a non-zero exit, and
  `change.md` is never written in that case.
- R5: This applies to every Change with a `manifest.json`, tracked or not — `close.js`'s
  existing `isTracked` check (used to decide the *readiness* rule) is irrelevant to whether the
  manifest gets updated on a successful close.

## Acceptance Criteria

- [ ] A manifest-backed Change (with or without a `track`) that closes successfully has
      `manifest.json.status === "closed"` afterward, and `aief status`/`aief verify` report no
      manifest/change.md disagreement as a result.
- [ ] A manifest/change.md disagreement created independently of `close` (e.g. a hand-edited
      `change.md`) is still detected and reported, non-blockingly, exactly as before this
      Change — drift *detection* itself is unchanged, only what `close` itself can cause.
- [ ] A malformed or schema-invalid `manifest.json`: `aief close --yes` exits non-zero, names
      the problem, and leaves both `manifest.json` and `change.md` exactly as they were.
- [ ] A Change with no `manifest.json`: `aief close`'s behavior, output, and files touched are
      unchanged from before this Change.
- [ ] `npm test`, `npm run lint`, `git diff --check`, and
      `node cli/bin/aief.js verify --change 0131-manifest-close-persistence --strict` all pass.
