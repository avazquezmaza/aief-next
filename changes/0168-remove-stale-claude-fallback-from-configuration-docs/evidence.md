# Evidence

## Summary

One stale sentence in `docs/configuration.md` corrected: a missing assistant file gives the
generic, `AGENTS.md`-only prompt, not `CLAUDE.md`.

## Activities Performed

1. Confirmed the behavior in a temporary project with `CLAUDE.md` and `AGENTS.md` but no
   `GEMINI.md`:

   ```text
   $ aief prompt gemini --change 0001
   Note: GEMINI.md not found in this project; using the generic, AGENTS.md-only prompt instead.
   ...
   Use AGENTS.md.
   ```

   `CLAUDE.md` does not appear in the prompt (matches `cli/src/commands/prompt.js`, Change 0112).
2. Rewrote the sentence in `docs/configuration.md` § Assistant instruction files.
3. Searched `docs/`, `README.md`, `AGENTS.md` and `cli/templates/` for other descriptions of the
   fallback: none left (`docs/cli.md` already says "never `CLAUDE.md` or another assistant's file").

## Verification

- `npm test` → 781 pass, 0 fail. `npm run lint` → clean. `git diff --check` → clean.
  `aief verify` → PASS. `aief verify --change 0168 --strict` → fails only on the open `(human)`
  review; after the owner checked it (PR #121 merged as `75394fa`), on `main`: `--strict` → PASS,
  `npm test` → 781 pass, lint and `git diff --check` clean.

## Findings

- None beyond the corrected sentence.

## Risks

- None (documentation only).

## Recommendations

- None.

## Artifacts Produced

- `docs/configuration.md`

## Lessons Learned

Behavior changes should grep the docs for the old behavior, not only update the main reference.

## Next Change

None queued from this one.
