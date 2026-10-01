# Change

## ID

`0151-protocol-security-skill`

## Type

Feature

## Objective

Give projects that use WebSockets, gRPC or GraphQL protocol-specific security context in the
prompts AIEF already builds, using the existing deterministic detector → Skill recommendation
mechanism in `cli/src/skills-catalog.json`. No new command, no new runtime behavior, no model call.

## Scope

### In scope

- Two new dependency-based detectors in `cli/src/skills-catalog.json`:
  - `websocket`: `ws`, `socket.io`, `socket.io-client`.
  - `grpc`: `@grpc/grpc-js`, `@grpc/proto-loader`, `protobufjs`.
- One new catalog Skill, `protocol-security-reviewer`, triggered by `websocket`, `grpc` and the
  existing `graphql` detector.
- Tests in `cli/tests/` for detection, recommendation, a negative case, and the rendered prompt.

### Out of scope

- A "Spike / PoC" security-maturity mode or relaxed rules by Change type. That is a framework-wide
  governance decision (it would apply to auth, secrets and data too, and `spike` is not a typed
  Change in the CLI) — candidate follow-up ADR/Change.
- Kafka / RabbitMQ / other brokers: different risk profile (ACLs, SASL, broker TLS); candidate
  follow-up Skill.
- Changes to standards templates (`backend-standards.md`, `security-standards.md`); the Skill's
  `standardsToRead` already points at both.
- Non-npm detection (pom.xml, requirements.txt, go.mod) for these protocols.
- Any new CLI command, any change to `close`/`verify` logic, any ML or external call.

## Success Criteria

- A project with any listed dependency gets `protocol-security-reviewer` (strong signal) in
  `recommendSkills()`, `aief doctor` and `aief prompt`, with its `promptContext` rendered.
- A project without them does not.
- The new detectors read only the `package.json` dependencies `detectProject()` already parses:
  no extra file I/O.
- `npm test`, `npm run lint`, `node cli/bin/aief.js verify` and `git diff --check` pass.

## Status

Closed (2026-10-01)
