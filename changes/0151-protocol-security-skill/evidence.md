# Evidence

## Summary

Added `websocket` and `grpc` dependency detectors and a `protocol-security-reviewer` catalog Skill
(triggered by `websocket`, `grpc` and the existing `graphql` detector) to
`cli/src/skills-catalog.json`. Data-only change: no code in `cli/src/` changed.

## Activities Performed

- Scoped down from the original proposal (spike/PoC maturity clause, Kafka/RabbitMQ, standards
  template edits and non-npm detection moved out of scope; see `change.md`).
- `cli/src/skills-catalog.json`: two detectors (after `graphql`), one Skill (before the
  `project-architecture-reviewer` fallback).
- `cli/tests/detect.test.js`: three tests — each listed dependency yields a strong
  `websocket`/`grpc` signal; `socket.io`, `@grpc/grpc-js` and `graphql` each recommend the Skill
  with strong confidence; a project with `express` and a near-miss name (`wsx`) gets neither
  signal nor Skill.
- `cli/tests/cli-bootstrap-and-standards.test.js`: `aief prompt` in a `socket.io` project renders
  "Protocol Security Reviewer:" and its `promptContext`.

## Verification

- `npm test`: 1141 tests, 1141 pass, 0 fail.
- `npm run lint`: clean.
- `node cli/bin/aief.js verify`: PASS.
- `git diff --check`: clean.
- `verify --change 0151-protocol-security-skill --strict`: FAIL only on the unchecked `(review)`
  and `(human)` lines, which are expected to be open until their owners act.
- No extra I/O: the detectors use only `dependencies`, which `evaluateDetector()` matches against
  the `package.json` object `detectProject()` already parsed (`cli/src/detect.js`).
- Docs: a search for existing catalog Skill ids found mentions only in historical `changes/` and
  `releases/v3.3.0.md`; no current doc enumerates the catalog, so none needed updating.

## Findings

- `aief prompt` renders a catalog Skill by `name`, not `id`; the prompt test asserts the name.
- `--type spike` is free text (used only for the branch prefix); the CLI gives it no behavior,
  which is why the spike/PoC mode was not implementable as a rule in this Change.

## Risks

- Projects already using `graphql` will now also see this Skill in `doctor`/`prompt` output — an
  intended, additive change in recommended context.
- `protobufjs` is also used outside gRPC (plain protobuf serialization); a project using it alone
  gets the Skill. Acceptable: the guidance is still relevant to any wire protocol, and the reason
  line states which dependency triggered it.

## Recommendations

- Follow-up ADR/Change: security maturity by Change type (spike/PoC vs production), framework-wide.
- Follow-up Change: a broker-focused Skill (Kafka/RabbitMQ: ACLs, SASL, broker TLS).

## Artifacts Produced

- `cli/src/skills-catalog.json`, `cli/tests/detect.test.js`,
  `cli/tests/cli-bootstrap-and-standards.test.js`, this Change's files.

## Lessons Learned

- Adding protocol guidance needed only catalog data plus tests; the detector → Skill → prompt
  path already handled everything else.

## Next Change

See Recommendations.
