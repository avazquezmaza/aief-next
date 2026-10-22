# Evidence

## Summary

The approval guard now blocks Gemini CLI edits with exit 0 and `{"decision":"deny","reason":...}`,
which Gemini reports as a denial instead of a hook failure. Claude Code keeps exit 2. Verified with
a real Gemini CLI 0.64.0 run: same block, no hook-failure lines.

## Activities Performed

1. **Hook (R1–R3).** `aief-approval-guard.mjs` builds the refusal message once; for `write_file` /
   `replace` it writes `{"decision":"deny","reason":<message>}` to stdout and returns 0; for Claude
   Code tools it writes the message to stderr and returns 2, as before. Allowed events are
   unchanged (exit 0, empty stdout).
2. **Shipped-file history (R4).** The 0166 template's sha256 (`359bf239…2781c`) added to
   `previous-versions.json`; byte copy kept as `cli/tests/fixtures/aief-approval-guard-0166.mjs`.
3. **Tests (R5).** `cli/tests/guardrails.test.js`: Gemini denials asserted as exit 0 + JSON with the
   exact reason and empty stderr; allowed Gemini events asserted as exit 0 + empty stdout; a new
   test that Claude events still exit 2 with empty stdout; the refresh test covers the 0166 copy.

## Verification

- `node --test tests/guardrails.test.js` → 23 pass.
- `npm test` → 781 pass, 0 fail. `npm run lint` → clean. `git diff --check` → clean.
  `aief verify` → PASS. After the owner checked both `(human)` items: `aief verify --change 0167
  --strict` → PASS.
- **Real Gemini CLI 0.64.0**, same synthetic fixture and prompt as Change 0166, after
  `aief guardrails install --assistant gemini`:

  ```text
  replace "- [x] Write the greeting"       → success
  replace "- [x] (human) Owner approves"   → error "Tool execution blocked: AIEF approval guard: (human) and (review) items
                                              are approvals a person gives, not an assistant (AGENTS.md). ..."
  final file: - [x] Write the greeting / - [ ] (human) Owner approves
  ```

  stderr lines matching `failed (aief-approval-guard)` or `Hook(s) [aief-approval-guard] failed`:
  **0** (Change 0166's run with exit 2: **3**).
- Limitation: the first attempt hit the free-tier daily quota for `gemini-3.8-flash` (HTTP 429)
  before any tool call; the verified run used `-m gemini-3.5-flash-lite`. The hook result does not
  depend on the model.

## Findings

- Gemini printed its one-time project-hook notice ("The following project-level hooks have been
  detected in this workspace: aief-approval-guard ... These hooks will be executed") on the first
  run in the new folder, as its docs describe.

## Risks

- None new: the Claude path is unchanged and tested; Gemini's exit-0 JSON is its documented
  preferred block.

## Recommendations

- The stale `CLAUDE.md` fallback sentence in `docs/configuration.md` remains for a documentation
  fix (Change 0166 finding).

## Artifacts Produced

- `cli/templates/guardrails/aief-approval-guard.mjs`, `cli/templates/guardrails/previous-versions.json`
- `cli/tests/guardrails.test.js`, `cli/tests/fixtures/aief-approval-guard-0166.mjs`

## Lessons Learned

A free-tier quota can stop an end-to-end check mid-session; naming the model explicitly kept the
evidence reproducible.

## Next Change

Documentation fix for the stale `CLAUDE.md` fallback sentence.
