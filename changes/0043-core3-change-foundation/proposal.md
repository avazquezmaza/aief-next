# Proposal

## Problem

`docs/aief-core-3-claude-code-prompt.md` proposes evolving AIEF toward a determinism-first,
manifest-driven Change model (`manifest.yaml` per Change, a `SddProvider` abstraction, a
declarative workflow engine, executable Skills, a hooks runtime, three-level verification, and a
natural-language front end over the same Core). None of this exists today. Today a Change is
four Markdown files (`change.md`, `spec.md`, `tasks.md`, `evidence.md`) whose state is derived by
regex over `change.md` (`cli/src/core/domain/change.js`), per **ADR-009** ("no hidden state — the
Change files are the only source of truth").

Two accepted ADRs bear directly on this initiative and are not satisfied by inspection alone:

- **ADR-013** — "no new capability enters AIEF's core unless it first removes, merges or
  replaces an equivalent capability." Core 3.0 as described is a large *net addition* (seven new
  `core/` subsystems, an adapter layer, a schema layer) with no removal named.
- **ADR-015** — until the AIEF 2.0 usability study (Change 0042) is consolidated, **new commands**
  are frozen, among other things.

This proposal (Entrega 1 only) is scoped specifically to stay inside what both ADRs already
permit: no new command, and a capability that is additive-and-dormant rather than a core
expansion — a Change may *optionally* carry a manifest; every Change that does not is completely
unaffected. Whether the *program as a whole* (Entregas 2–8) satisfies ADR-013 is a separate
decision this Change does not make (see Blocking Questions in the top-level report).

## Objective

Let AIEF read a `manifest.json` when a Change has one, and keep reading legacy Changes exactly as
it does today when it does not — with one unified loader function used by both paths, so future
Entregas (workflow engine, SDD provider) have one Change shape to build against instead of two.

## Scope

- `manifest.json` per Change (optional), its structural validation, and a unified loader that
  picks manifest or legacy inference deterministically (manifest wins when present — no merging).
- Non-invasive integration into the one existing command whose output already depends on Change
  state: `aief status`.
- Tests proving both paths, plus a zero-drift regression across every Change under `changes/`.

## Out of Scope

Everything listed under "Out of scope" in [change.md](change.md): workflow engine, gates, tracks,
SDD provider, new commands, skills/hooks execution, verification levels, review formalization,
close-gate changes, migration tooling. These are Entregas 2–8 and are not started here.

## Compatibility

- All four existing Change files remain required exactly as today; `manifest.json` is additive.
- `CHANGE_FILES` (`cli/src/core/domain/change.js:12`) is unchanged.
- No existing Change in `changes/` has a `manifest.json`, so every existing Change is proven to
  round-trip through the new unified loader with identical output to today's `loadChange()` —
  this is a required test, not an assumption.
- No public command, flag, or file name is renamed or removed.

## Risks

1. **ADR-013 compliance of the wider initiative** (not this Change alone) is unresolved — flagged,
   not decided, here.
2. **ADR-015 "new commands" freeze** could be breached by later Entregas (4+) if they proceed
   without re-checking the freeze/thaw state at that time. Not a risk to Entrega 1 itself.
3. **Dependency introduction (YAML).** The vision document's own examples use YAML; the
   repository has zero runtime dependencies today. Introducing `js-yaml` (or similar) without
   justification would violate the project's coding guidance. This proposal recommends JSON
   instead (see [design.md](design.md) §5) and treats YAML as a deferred, separately justified
   decision — not a blocker, since the vision document explicitly allows this substitution when
   documented.
4. **Silent duplication of truth.** A manifest field (e.g. `status`) could drift from what
   `change.md`'s own `## Status` says if both are read for the same Change. Mitigated by making
   manifest presence override legacy inference *entirely* for that Change (no merging of the two
   sources) — documented in design.md §3.
   **Materialized in a sharper form during implementation** (independent review finding B1,
   2026-07-25): `close` itself created the disagreement, by writing `change.md` while checking
   success against the (untouched) manifest through a function shared with `status`. Fixed by
   isolating `close`'s write-verification from the manifest entirely — see `spec.md` R10 and
   `evidence.md`.
5. **Schema drift.** A separate `schemas/change-manifest.schema.json` maintained by hand alongside
   a hand-rolled validator would be two definitions of the same shape that can silently diverge.
   This proposal defers the standalone schema file (see design.md §5) until a schema-validation
   approach is chosen, to avoid that duplication existing without an enforcement mechanism behind it.

## Success Criteria

See "Success Criteria" in [change.md](change.md).
