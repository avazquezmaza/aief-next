# Evidence

## Summary

AIEF now detects Java (Maven/Gradle), Quarkus, Camel, OpenShift, Kustomize, Argo CD, Podman,
ActiveMQ Artemis/Red Hat AMQ and Keycloak; Kafka and Redis in Java projects; and Kubernetes
manifests and Dockerfiles kept in subdirectories. A Java project gets `backend-standards.md`.

## Activities Performed

- `cli/src/detect.js`: `walkProject()` — one lazy, bounded, read-only walk per `detectProject()`
  call (depth ≤ 4, 5000 entries, 500 YAML files ≤ 256 KiB, skips `.git`/`node_modules`/`target`/
  `build`/`dist`/`out`/`.gradle`/`.idea`/`.venv`/`venv`/`vendor`/`graphify-out`, no symlinks).
  New optional detector fields `nestedFiles` and `manifestMarkers` use it; detectors without them
  never trigger the walk (R8).
- `cli/src/skills-catalog.json`: detectors `java`, `quarkus`, `camel`, `openshift`, `kustomize`,
  `argocd`; `kubernetes` extended with nested `Chart.yaml` and workload `kind:` markers;
  `container-deployment-reviewer` triggered by `openshift`/`kustomize`/`argocd`.
- Scope extended at the owner's request to the real reported stack (Camel Java DSL on Spring Boot
  and Quarkus, AMQ, Kafka, Podman, Keycloak, Redis): detectors `podman`, `activemq`, `keycloak`;
  `kafka`/`redis` extended to Java build files (and Strimzi manifests); `docker` extended to nested
  Dockerfiles; `podman` → `container-deployment-reviewer`, `keycloak` → `security-rbac-reviewer`.
- Eclipse JKube: `kubernetes` matches a nested `jkube` dir and the Kubernetes Maven/Gradle plugin;
  `openshift` matches the OpenShift Maven/Gradle plugin. Added after real-project validation showed
  JKube fragments carry no `kind:` (JKube infers it from the file name).
- `cli/src/commands/bootstrap.js`: `java` added to `EXPLICIT_BACKEND_IDS`.
- 11 tests (10 in `detect.test.js`, 1 in `cli-bootstrap-and-standards.test.js`).

## Verification

- `npm test`: 1124 tests, 1124 pass, 0 fail.
- `npm run lint`: clean. `git diff --check`: clean.
- `node cli/bin/aief.js verify`: PASS (the pre-existing non-blocking `0122` ID collision is
  unrelated).
- Manual smoke test on a scratch project (`pom.xml` with Quarkus + Camel + `quarkus-openshift`,
  `k8s/overlays/dev/kustomization.yaml`, `gitops/app.yaml` Argo CD Application): `bootstrap`
  reports `Detected: java, quarkus, camel, kubernetes, openshift, kustomize, argocd` and creates
  `backend-standards.md`.
- Validated read-only against three real Camel projects (owner's local workspace, not modified):
  | Project | Real stack (pom.xml) | Detected |
  |---|---|---|
  | Spring Boot adapter | Camel Spring Boot, JKube | `java, camel, spring, kubernetes, openshift` |
  | Quarkus atomic | Camel Quarkus, camel-quarkus-kafka, quarkus-openshift, `src/main/docker/` | `java, quarkus, camel, docker, kubernetes, openshift, kafka` |
  | Spring Boot mock | Camel Spring Boot, camel-kafka-starter, JKube | `java, camel, spring, kubernetes, openshift, kafka` |

  No false stack positives (no AMQ/Keycloak/Podman/Kustomize/Argo CD in these projects, none
  detected). A Redis key present only in a Secret, with no dependency or code usage, is correctly
  not detected. `bootstrap` on a scratch copy of the mock project creates `backend-standards.md`.
- This repository's own `aief status` detection is unchanged (`aiRoadmap, codeGraphUnderstanding`).

## Findings

- The smoke test reproduces the separate `aiRoadmap` false positive: right after `bootstrap`,
  `status` adds `aiRoadmap`, triggered by "AI assistants" in AIEF's own `AGENTS.md` template.
  Out of scope here; separate bug-fix Change. Also confirmed on the two real projects that
  already adopted AIEF (`keyword "ai assistants" found in AGENTS.md`).
- `argoproj.io` also matches Argo Workflows/Rollouts resources, not only Argo CD. Accepted: all
  are GitOps/rollout concerns covered by the same Skill.
- The Camel DSL flavour (Java vs YAML vs XML) is not distinguished; `camel` covers all of them.
- `quarkus-oidc` alone is generic OIDC; Keycloak is recognised from its name in build or config
  (e.g. an `auth-server-url` host), not from the OIDC extension.
- `kind: Deployment` does not match OpenShift `kind: DeploymentConfig` (word boundary; tested).

## Risks

- The walk adds I/O to every `detectProject()` call (`status`, `analyze`, `prompt`, `bootstrap`).
  Bounded by the caps above; negligible on typical repositories.
- Kubernetes manifests deeper than depth 4 are not detected.

## Recommendations

- Fix the `aiRoadmap` false positive (stop searching `AGENTS.md`/`CLAUDE.md` for it).
- Optional follow-ups: a Java/Quarkus/Camel integration Skill (messaging, idempotency, DLQ); `backend-standards.md` for `go`/`rust`.

## Artifacts Produced

- `cli/src/detect.js`, `cli/src/skills-catalog.json`, `cli/src/commands/bootstrap.js`
- `cli/tests/detect.test.js`, `cli/tests/cli-bootstrap-and-standards.test.js`

## Lessons Learned

- Detection limited to root paths missed most real deployment layouts; a single bounded walk
  shared by all detectors covers them without per-detector I/O.

## Next Change

- Bug fix: `aiRoadmap` must not be triggered by AIEF's own `AGENTS.md`.
