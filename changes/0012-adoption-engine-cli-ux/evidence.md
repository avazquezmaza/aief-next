# Evidence

## Summary

Implemented the first Adoption Engine and CLI UX improvement for AIEF.

## Activities Performed

- Added command-specific help.
- Added guided `adopt`, `analyze`, `prompt`, and `close` commands.
- Improved `doctor`, `status`, and `verify` outputs.
- Added project signal detection.
- Added basic recommended Skills output.
- Updated CLI documentation.

## Verification

Recommended commands:

```bash
node cli/bin/aief.js help doctor
node cli/bin/aief.js doctor
node cli/bin/aief.js status
node cli/bin/aief.js analyze
node cli/bin/aief.js prompt --profile architect
node cli/bin/aief.js close
node cli/bin/aief.js verify
```

## Findings

This change directly addresses friction discovered while attempting to adopt AIEF in an existing Flux Portal project.

## Risks

- `adopt` is intentionally conservative but still writes files.
- Skill recommendations are heuristic.
- `close` does not update files yet.

## Recommendations

Use this version against the Flux Portal repository and record frictions before adding more automation.

## Lessons Learned

Existing project adoption requires guidance, not just templates.

## Next Change

Validate `aief adopt -> aief analyze -> aief prompt` on Flux Portal.
