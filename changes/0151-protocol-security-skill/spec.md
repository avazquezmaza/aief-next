# Specification

## Goal

An assistant working on a project that uses WebSockets, gRPC or GraphQL receives concrete,
testable transport-security guidance automatically, through the existing catalog Skill mechanism.

## Requirements

### R1: Detectors

- `websocket` — description "WebSocket server/client", `signal: "strong"`,
  `dependencies: ["ws", "socket.io", "socket.io-client"]`.
- `grpc` — description "gRPC service/client", `signal: "strong"`,
  `dependencies: ["@grpc/grpc-js", "@grpc/proto-loader", "protobufjs"]`.
- Only the `dependencies` field (matched against `package.json` dependencies + devDependencies,
  as every existing dependency detector). No `files`, `searchFiles`, `nestedFiles` or
  `manifestMarkers`, so no additional I/O.
- The existing `graphql` detector is unchanged.

### R2: Skill `protocol-security-reviewer`

Same shape as the existing catalog Skills (e.g. `payments-reviewer`):

- `when: ["websocket", "grpc", "graphql"]`.
- `standardsToRead: ["backend-standards.md", "security-standards.md"]`.
- `promptContext` covers: TLS for any non-local transport (`wss://`, TLS/mTLS for gRPC);
  WebSocket handshake validates `Origin` against an allowlist and authenticates the connection;
  credentials never in URLs/query strings; gRPC auth enforced server-side (interceptors / mTLS);
  GraphQL introspection and gRPC server reflection disabled in production, with query
  depth/complexity limits; CORS with an explicit allowlist.
- `commonRisks`: Cross-Site WebSocket Hijacking (missing Origin check); tokens in query strings
  (logged by proxies); reflection/introspection left enabled in production; unbounded GraphQL
  queries or message sizes.
- `evidenceExpectations`: automated tests showing unauthenticated and unknown-origin connections
  (or calls) are rejected.

### R3: Tests

- `detectProject()` reports `websocket` and `grpc` (strong) for each listed dependency.
- `recommendSkills()` returns `protocol-security-reviewer` (strong, non-empty `because`) for a
  WebSocket-only, gRPC-only and GraphQL-only project.
- A project without these dependencies does not get the Skill.
- `aief prompt` in a project with `socket.io` renders the Skill name and its `promptContext`.

## Acceptance Criteria

- [x] R1 detectors present; existing detector tests still pass.
- [x] R2 Skill present and rendered by `aief prompt`.
- [x] R3 tests added and passing.
- [x] `npm test`, `npm run lint`, `node cli/bin/aief.js verify`, `git diff --check` pass.
