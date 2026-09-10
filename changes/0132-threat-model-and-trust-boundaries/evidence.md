# Evidence

## Summary

`SECURITY.md` named no trust boundaries, threat categories, or mitigations — just a reporting
procedure and a scope list. `docs/security-model.md` consolidates what already exists (path-
containment checks, Skills' untrusted-data labeling, Hooks' structurally-forbidden capabilities,
ADR-021's execution boundary, `AGENTS.md`'s Operational Guardrails) into one document, with an
honest "Known Gaps" section for what doesn't exist yet (supply-chain hardening, identity
verification on `(human)`/`(review)`/`(gate:<id>)` checkboxes). No code changed.

## Activities Performed

- Grepped the repository for existing security-relevant discipline before writing anything:
  `isPathWithin`/`isReallyWithin` path-containment checks (found in `jira.js`,
  `openspec.js`, `verification-evidence.js`, `evidence-reference-integrity.js`); Skills'
  "untrusted project data" labeling (`architecture-definition.js`, `data-definition.js`,
  `requirements-analysis-instructions.js`); `FORBIDDEN_CAPABILITIES` (confirmed byte-identical
  in `skill.js`/`hook.js`); ADR-019/020/021's exact decision text in `knowledge/decisions.md`;
  `AGENTS.md`'s Operational Guardrails section verbatim.
- Confirmed `docs/architecture.md#system-context`'s existing four-zone model and reused it
  rather than inventing a second, competing trust-zone diagram.
- Wrote `docs/security-model.md`: trust zones, a trust-boundary table (8 rows, each citing a
  real file/ADR/AGENTS.md section), an Assets section (citing Changes 0129 and 0131's real
  fixes as examples of what these boundaries protect), and a Known Gaps section naming 5
  specific, honestly-stated limitations rather than implying full coverage.
- Linked the new document from `SECURITY.md` (one line, its own scope unchanged) and from
  `README.md`'s documentation table (one new row).

## Verification

- `npm test` (cli/): 1095/1095 passed — unaffected, as expected for a docs-only Change.
- `npm run lint`: clean — unaffected.
- `node cli/bin/aief.js verify --change 0132-threat-model-and-trust-boundaries --strict`: PASS.
- `git diff --check`: clean.
- Every citation in the document (file names, the exact `FORBIDDEN_CAPABILITIES` array text, the
  jira.js path-traversal comment, ADR numbers, the `docs/architecture.md#system-context` anchor)
  was verified against the actual repository content before being written into the document —
  not recalled from earlier context in this session without re-checking.

## Findings

- Confirmed there is no existing document consolidating trust boundaries — the closest prior
  art was `SECURITY.md` (reporting-only) and the individual ADRs (each documents its own
  boundary in isolation, never cross-referenced as a set).
- Found, while researching, that the `(human)`/`(review)`/`(gate:<id>)` task-label convention
  has no identity verification — `aief close` checks whether the box is checked, not who
  checked it. This is an honest limitation, not a defect to fix reactively here; recorded as a
  Known Gap.

## Risks

- None from this Change itself (documentation only). The document's own "Known Gaps" section is
  explicit about what remains actually unprotected — the risk of a misleading security posture
  claim is the one this Change is written to avoid, not introduce.

## Recommendations

- Supply-chain hardening (CodeQL, dependency review, secret scanning, SBOM) is named as a Known
  Gap and remains the next natural item in this session's own backlog ordering.
- If the numeric-Change-ID-collision gap (C0130-F2, cited in this document's Known Gaps) is ever
  addressed with an automated check, this document's corresponding row should be updated to
  point at the resolving Change.

## Artifacts Produced

- `docs/security-model.md` (new).
- `SECURITY.md`, `README.md` (one line/row each).

## Lessons Learned

- Re-verifying every citation against the actual repository — rather than trusting this
  session's own earlier reads of the same files — caught nothing wrong this time, but is the
  same discipline that caught the D4 correction in Change 0124/0125 and the C0130-F1
  verification in Change 0131; worth keeping as standard practice for any document making
  factual claims about the codebase.

## Next Change

- Supply-chain hardening (CodeQL/SBOM/etc.), per this document's own Known Gaps section and
  this session's backlog ordering.
