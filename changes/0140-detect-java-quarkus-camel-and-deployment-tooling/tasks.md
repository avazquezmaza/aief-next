# Tasks

## Implementation

- [x] `detect.js`: bounded nested walk, `nestedFiles` and `manifestMarkers` (R1–R3, R8).
- [x] `skills-catalog.json`: `java`, `quarkus`, `camel`, `openshift`, `kustomize`, `argocd`;
      extend `kubernetes`; extend `container-deployment-reviewer.when` (R4–R6).
- [x] `skills-catalog.json`: `activemq`, `keycloak`, `podman`; extend `kafka`, `redis`, `docker`;
      extend `container-deployment-reviewer.when`/`security-rbac-reviewer.when` (R9–R10).
- [x] `skills-catalog.json`: Eclipse JKube for `kubernetes`/`openshift` (R11).
- [x] Validate against real Camel projects (Spring Boot and Quarkus).
- [x] `bootstrap.js`: add `java` to `EXPLICIT_BACKEND_IDS` (R7).

## Documentation

- [x] No user doc enumerates detectors; confirm nothing else needs updating.

## Verification

- [x] Tests in `detect.test.js` and `cli-bootstrap-and-standards.test.js` for every acceptance
      criterion.
- [x] `npm test`, `node cli/bin/aief.js verify`, `git diff --check`.
- [ ] (review) Independent review of the detection rules and walk limits.

## Evidence

- [x] Update evidence.md
