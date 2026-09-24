# Change

## ID

`0140-detect-java-quarkus-camel-and-deployment-tooling`

## Type

Feature

## Objective

A Quarkus/Camel integration project deployed to OpenShift via Kustomize and Argo CD (Camel Java
DSL on Spring Boot and Quarkus, with AMQ, Kafka, Redis, Keycloak and Podman) is invisible to
AIEF's detection today: the catalog has no Java, Maven, Quarkus, Camel, OpenShift, Kustomize or
Argo CD detector, and Kafka/Redis are only recognised from a Node `package.json`, so `aief status` reports no real stack, `bootstrap` generates no
`backend-standards.md`, and only the generic fallback Skill is recommended. Reported from a real
adoption (an integration project whose only detected signal was a spurious `aiRoadmap`).

The deployment tools are hard to detect with today's engine: `detect.js` only checks exact root
paths and keywords in a fixed list of root files, while Kustomize, OpenShift and Argo CD manifests
live in subdirectories (`k8s/overlays/prod/kustomization.yaml`, `deploy/argocd/app.yaml`,
`src/main/kubernetes/openshift.yml`). This Change adds a bounded, read-only nested search to the
engine and the detectors that use it.

## Scope

### In scope

- `cli/src/detect.js`: two new optional detector fields, both resolved by one shared, lazily
  computed, bounded directory walk (max depth, skipped vendor/build dirs, file-count and file-size
  caps):
  - `nestedFiles` — basenames (file or directory) matched anywhere within the walk;
  - `manifestMarkers` — strings matched (word-boundary, as `keywords`) inside `.yaml`/`.yml` files
    found by the walk.
- `cli/src/skills-catalog.json`: new detectors `java`, `quarkus`, `camel`, `openshift`,
  `kustomize`, `argocd`, `podman`, `activemq`, `keycloak`; `kubernetes` extended to nested Helm
  charts and Kubernetes manifests; `kafka`/`redis` (previously `package.json`-only) extended to
  Java build files; `docker` extended to nested Dockerfiles (Quarkus `src/main/docker/`).
  `container-deployment-reviewer` also triggered by `podman`, `openshift`, `kustomize`, `argocd`;
  `security-rbac-reviewer` also triggered by `keycloak`. Eclipse JKube (`src/main/jkube/`, the
  Kubernetes/OpenShift Maven/Gradle plugins) recognised as Kubernetes/OpenShift.
- `cli/src/commands/bootstrap.js`: `java` added to `EXPLICIT_BACKEND_IDS`, so a Java project
  (Maven or Gradle, Spring and Quarkus included) gets `backend-standards.md`.
- Tests in `cli/tests/detect.test.js` and `cli/tests/cli-bootstrap-and-standards.test.js`.

### Out of scope

- A Java/Quarkus/Camel-specific Skill — a follow-up Change if wanted.
- `go`/`rust` still generate no `backend-standards.md` — same gap, separate Change.
- The `aiRoadmap` false positive from AIEF's own `AGENTS.md` — separate bug-fix Change.
- Any change to how `AGENTS.md`/`CLAUDE.md` are created or read.

## Success Criteria

- A fixture with a Quarkus + Camel `pom.xml` detects `java`, `quarkus`, `camel`, and `bootstrap`
  creates `backend-standards.md`.
- Camel on Spring Boot and on Quarkus fixtures detect Kafka, Redis, AMQ (Artemis), Keycloak,
  Podman and the nested Quarkus Dockerfile.
- Nested `kustomization.yaml`, an OpenShift `Route`, and an Argo CD `Application` are detected
  from subdirectories; the same files deeper than the depth limit, or under a skipped directory
  (`node_modules`, `target`, …), are not.
- Every existing test still passes; `npm test`, `node cli/bin/aief.js verify`, and
  `git diff --check` pass.
