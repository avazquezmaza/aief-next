# Tasks

## Implementation

- [x] Write `docs/security-model.md`: trust zones (reusing architecture.md's four-zone model),
      trust-boundary table, assets, threat-category mitigations, Known Gaps section (R1-R4).
- [x] Link it from `SECURITY.md` (R5).
- [x] Link it from `README.md`'s documentation table (R6).

## Documentation

- [x] Every claim in the new document was checked against the actual repository (grep/read)
      before writing it — not one column done, then the rest from memory.

## Verification

- [x] Confirmed `docs/architecture.md#system-context` anchor exists (reused, not duplicated).
- [x] Confirmed `FORBIDDEN_CAPABILITIES` text is byte-identical in `skill.js`/`hook.js` before
      citing it.
- [x] Confirmed the path-containment comment/mechanism in `jira.js` before citing it.
- [x] Run `npm test`, `npm run lint`, `git diff --check` (no application code touched).
- [x] Run `node cli/bin/aief.js verify --change 0132-threat-model-and-trust-boundaries --strict`.

## Evidence

- [x] Update evidence.md
