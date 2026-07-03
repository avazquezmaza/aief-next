# Evidence

## Summary
Added the first AIEF CLI MVP.

## Verification
Manual verification commands:

```bash
node cli/bin/aief.js help
node cli/bin/aief.js init demo-project
cd demo-project
node ../cli/bin/aief.js new-change add-login
node ../cli/bin/aief.js verify
node ../cli/bin/aief.js use-profile developer
node ../cli/bin/aief.js release 0.1.0
```

## Expected Results
- Help command prints usage.
- Init creates project folders and files.
- New change creates `changes/0001-add-login/`.
- Verify confirms required files exist.
- Use profile prints assistant prompt.
- Release creates `releases/v0.1.0.md`.

## Known Issues
- CLI is not published to npm yet.
- CLI does not call OpenSpec or Specboot yet.
- No automated CLI tests yet.

## Lessons Learned
A small CLI makes AIEF much easier to adopt because it removes manual folder creation.
