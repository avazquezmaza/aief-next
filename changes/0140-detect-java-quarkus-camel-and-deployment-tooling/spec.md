# Specification

## Goal

`aief status`/`analyze`/`bootstrap` recognize a Java (Maven/Gradle) project, Quarkus and Camel,
and the Kubernetes/OpenShift/Kustomize/Argo CD deployment tooling around it — including manifests
kept in subdirectories — and a Java project gets `backend-standards.md`.

## Requirements

- R1: A detector may declare `nestedFiles` (basenames). It matches when a file or directory with
  that exact basename exists at depth ≤ 4 (a root entry is depth 0; `a/b/c/d/name` is depth 4).
  Reason:
  `"<name>" found at <relative path>`.
- R2: A detector may declare `manifestMarkers` (strings). It matches when a `.yaml`/`.yml` file
  found by the same walk contains the marker (same word-boundary rule as `keywords`). Reason:
  `marker "<marker>" found in <relative path>`.
- R3: The walk runs at most once per `detectProject()` call, only if some detector needs it, and is
  bounded: skips `.git`, `node_modules`, `target`, `build`, `dist`, `out`, `.gradle`, `.idea`,
  `.venv`, `venv`, `vendor`, `graphify-out`; never follows symlinks; stops after 5000 entries;
  reads at most 500 YAML files, each ≤ 256 KiB. Read-only; unreadable entries are ignored.
- R4: New detectors:
  - `java` (strong): `pom.xml`, `build.gradle` or `build.gradle.kts` at the root.
  - `quarkus` (weak): keyword `io.quarkus` in the root build file.
  - `camel` (weak): keyword `org.apache.camel` in the root build file.
  - `openshift` (strong): root `.s2i` or `openshift`, nested `openshift.yml`/`openshift.yaml`,
    keyword `quarkus-openshift` in the root build file, or markers `route.openshift.io`,
    `apps.openshift.io`, `image.openshift.io`, `build.openshift.io`.
  - `kustomize` (strong): nested `kustomization.yaml`, `kustomization.yml` or `Kustomization`.
  - `argocd` (strong): marker `argoproj.io`.
- R5: `kubernetes` additionally matches nested `Chart.yaml` and markers `kind: Deployment`,
  `kind: StatefulSet`, `kind: DaemonSet`, `kind: CronJob`. Its existing root-path rule is kept.
- R6: `container-deployment-reviewer`'s `when` adds `openshift`, `kustomize`, `argocd`.
- R7: `EXPLICIT_BACKEND_IDS` adds `java`; a Java project gets `backend-standards.md`.
- R8: Detectors without the new fields behave exactly as before.
- R9: Messaging, cache, identity and containers for Java projects:
  - `kafka`: also keyword `kafka` in the root build file, marker `kafka.strimzi.io` (AMQ Streams).
  - `redis`: also keywords `redis`, `jedis`, `redisson`, `lettuce-core` in the root build file.
  - `activemq` (strong, new): keywords `activemq`, `artemis`, `qpid-jms`, `camel-amqp` in the root
    build file; marker `broker.amq.io` (AMQ Broker operator).
  - `keycloak` (strong, new): dependency `keycloak-js`; keyword `keycloak` in the root build file
    or `src/main/resources/application.properties`; marker `keycloak` in YAML.
  - `podman` (strong, new): root `Containerfile`, `podman-compose.yml`/`.yaml`, `.containerignore`;
    nested `Containerfile`.
  - `docker`: also nested `Dockerfile`, `Dockerfile.jvm`, `Dockerfile.native`,
    `Dockerfile.native-micro`.
- R10: `container-deployment-reviewer`'s `when` adds `podman`; `security-rbac-reviewer`'s `when`
  adds `keycloak`.
- R11: Eclipse JKube: `kubernetes` also matches a nested `jkube` directory (kind-less fragments in
  `src/main/jkube/`) and keywords `kubernetes-maven-plugin`/`kubernetes-gradle-plugin` in the root
  build file; `openshift` also matches `openshift-maven-plugin`/`openshift-gradle-plugin`.

## Acceptance Criteria

- [x] A root `pom.xml` with `io.quarkus` and `org.apache.camel` dependencies detects `java`,
      `quarkus`, `camel`; a plain Maven `pom.xml` detects `java` only.
- [x] `k8s/overlays/prod/kustomization.yaml` detects `kustomize`.
- [x] A nested YAML with `apiVersion: route.openshift.io/v1` detects `openshift`; one with
      `apiVersion: argoproj.io/v1alpha1` detects `argocd`; one with `kind: Deployment` detects
      `kubernetes`.
- [x] The same files under `node_modules/` or deeper than depth 4 are not detected.
- [x] `container-deployment-reviewer` is recommended for an `argocd`-only project.
- [x] `bootstrap` on a Maven-only project creates `backend-standards.md`.
- [x] A Camel-on-Spring-Boot `pom.xml` detects `spring`, `kafka`, `redis`, `activemq`, `keycloak`
      and not `quarkus`.
- [x] A Camel-on-Quarkus project detects `activemq`, `kafka`, `redis`, `keycloak` (via
      `application.properties`), `podman`, and `docker` via `src/main/docker/Dockerfile.jvm`.
- [x] Strimzi `KafkaTopic` and AMQ Broker `ActiveMQArtemis` manifests detect `kafka`/`activemq`.
- [x] A `src/main/jkube/` fragments dir detects `kubernetes`; the JKube Maven plugins detect
      `kubernetes` and `openshift`.
- [x] `npm test`, `node cli/bin/aief.js verify`, and `git diff --check` pass.
