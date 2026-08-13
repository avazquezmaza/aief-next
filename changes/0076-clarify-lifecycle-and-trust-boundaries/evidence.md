# Evidence

## Summary

Documentation-only Change resolving four DOCUMENT-classified findings from the completed audit:
F3 (manifest lifecycle limitation), F5 (`--evidence-from`'s intentional trust boundary), F9
(verify-vs-close semantic distinction), and the project-root reinforcement. No source code was
touched.

## Activities Performed

- `docs/concepts.md`: added a paragraph to the "Change Manifest" section stating plainly that no
  AIEF command today writes or synchronizes `manifest.json`'s `status` field, that `aief close
  --yes` writes only `change.md`, and the practical consequence (`status`/`status --next`/`prompt`
  will keep treating a manifest-tracked Change as open until the manifest is updated externally).
- `docs/cli.md`: added a paragraph after the Governance table stating `--evidence-from`'s path is
  intentionally not required to be project-local (naming why: CI systems commonly write reports
  outside the checked-out project) and that only numeric JUnit counts ever cross that boundary.
- `docs/cli.md`: added a paragraph explaining why `aief verify` (Structural Verification) can PASS
  while `aief close` reports blocked for the same Change — different questions, not a
  contradiction.
- `docs/getting-started.md`: extended the existing "Where do I run the commands?" answer with the
  actual observed consequence of running from the wrong directory (silent, separate project
  detection; a nested nested nested governance structure if `bootstrap` is run there) — worded to
  describe only what happens today, without claiming any refusal/warning guard exists yet (that is
  Batch 6's separate, later scope).

## Verification

- `git status --short` / `git diff --stat -- cli/src`: confirms zero source files touched — only
  `docs/cli.md`, `docs/concepts.md`, `docs/getting-started.md` changed.
- `node cli/bin/aief.js verify` (repo root): `Result: PASS`.
- `git diff --check`: clean.
- Adversarial re-read of each new paragraph against this audit's own confirmed runtime findings
  (Phases 8, 8.1, and 9): every claim made is something this audit directly observed and
  reproduced, not an aspiration or a guess — no aspirational behavior is described as current.

## Findings

None beyond the four findings this Change resolves. One forward note recorded here: the new
`docs/getting-started.md` sentence describing bootstrap's nested-project behavior will need a
small follow-up edit once Batch 6 (nested bootstrap guard) lands, to describe the guard's actual
behavior instead of (or alongside) today's "no guard" reality. Batch 6's own scope should include
that follow-up edit rather than leaving this Change's wording stale.

## Risks

None — no runtime behavior changed.

## Recommendations

Batch 6 (nested bootstrap) should update `docs/getting-started.md`'s new sentence once the guard
exists, per the forward note above.

## Artifacts Produced

- `docs/concepts.md`, `docs/cli.md`, `docs/getting-started.md` (all edited).

## Lessons Learned

None beyond what prior audit phases already established — this Change only transcribed already-
confirmed runtime findings into user-facing documentation.

## Next Change

Proceed to the next approved remediation batch (strict CLI parsing, Finding F7/H4).
