# Evidence

## Summary

Implemented README 2.0 and CLI v2.

## Verification

Recommended commands:

```bash
node cli/bin/aief.js help
node cli/bin/aief.js doctor
node cli/bin/aief.js status
node cli/bin/aief.js propose "Add login"
node cli/bin/aief.js verify
```

## Expected Results

- Help shows new commands.
- Doctor checks local tooling.
- Status shows AIEF repository health.
- Propose attempts OpenSpec and falls back to AIEF Change skeleton.
- Verify checks required files and Change folder structure.

## Known Issues

- OpenSpec integration is command-based and best-effort.
- CLI is not published to npm yet.
- CLI does not create GitHub releases.

## Lessons Learned

AIEF becomes easier to understand when positioned as orchestration, and easier to adopt when the CLI automates common workflow actions.
