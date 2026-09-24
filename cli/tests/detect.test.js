import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { detectProject, recommendSkills, containsKeyword } from "../src/detect.js";

function makeProject(files = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "aief-detect-"));
  for (const [name, content] of Object.entries(files)) {
    const full = path.join(dir, name);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, "utf8");
  }
  return dir;
}

test("keyword matching uses word boundaries", () => {
  assert.equal(containsKeyword("we value maintainability", "ai"), false);
  assert.equal(containsKeyword("plain text", "ai"), false);
  assert.equal(containsKeyword("the lieutenant said", "tenant"), false);
  assert.equal(containsKeyword("tenant isolation matters", "tenant"), true);
  assert.equal(containsKeyword("Multi-tenant SaaS", "tenant"), true);
  assert.equal(containsKeyword("uses an LLM pipeline", "llm"), true);
});

test("generic prose does not trigger detectors", () => {
  const dir = makeProject({
    "README.md": "This project values maintainability and plain, readable code."
  });
  const project = detectProject(dir);
  assert.deepEqual(project.signals, []);
});

test("tenant keyword triggers multitenant with a reason", () => {
  const dir = makeProject({
    "README.md": "A multi-tenant SaaS with tenant isolation per Host header."
  });
  const project = detectProject(dir);
  const multitenant = project.signals.find((s) => s.id === "multitenant");
  assert.ok(multitenant, "multitenant signal expected");
  assert.equal(multitenant.signal, "weak");
  assert.match(multitenant.reasons[0], /README\.md/);
});

test("dependencies produce strong signals", () => {
  const dir = makeProject({
    "package.json": JSON.stringify({ dependencies: { next: "14.0.0", pg: "8.0.0" } })
  });
  const project = detectProject(dir);
  const ids = project.signals.map((s) => s.id);
  assert.ok(ids.includes("nextjs"));
  assert.ok(ids.includes("postgres"));
  const nextjs = project.signals.find((s) => s.id === "nextjs");
  assert.equal(nextjs.signal, "strong");
  assert.match(nextjs.reasons[0], /dependency "next"/);
});

test("skills are recommended with reasons", () => {
  const dir = makeProject({
    "README.md": "Multi-tenant platform with RBAC permissions."
  });
  const project = detectProject(dir);
  const skills = recommendSkills(project);
  const ids = skills.map((s) => s.id);
  assert.ok(ids.includes("multitenant-saas-architect"));
  assert.ok(ids.includes("security-rbac-reviewer"));
  for (const skill of skills) {
    assert.ok(skill.because.length > 0, `${skill.id} must explain why`);
  }
});

test("drizzle counts as postgres and cognito recommends the AWS skill (learned from Flux Portal validation)", () => {
  const dir = makeProject({
    "package.json": JSON.stringify({ dependencies: { "drizzle-orm": "0.36.4", "amazon-cognito-identity-js": "6.3.12" } })
  });
  const project = detectProject(dir);
  const ids = project.signals.map((s) => s.id);
  assert.ok(ids.includes("postgres"));
  assert.ok(ids.includes("cognito"));
  assert.ok(recommendSkills(project).some((s) => s.id === "aws-saas-platform"));
});

test("no signals falls back to general reviewer", () => {
  const dir = makeProject({ "README.md": "A simple library." });
  const skills = recommendSkills(detectProject(dir));
  assert.equal(skills.length, 1);
  assert.equal(skills[0].id, "project-architecture-reviewer");
});

// --- Change 0072: confidence reflects strong (dependency) vs weak (keyword-in-doc) signals ---

test("recommendSkills: a Skill triggered by a strong (dependency) signal gets confidence 'strong'", () => {
  const project = { packageJson: {}, tech: {}, signals: [{ id: "nextjs", description: "Next.js", signal: "strong", reasons: ["dep"] }, { id: "nestjs", description: "NestJS", signal: "strong", reasons: ["dep"] }] };
  const skills = recommendSkills(project);
  const match = skills.find((s) => s.id === "nextjs-nestjs-architecture");
  assert.equal(match.confidence, "strong");
});

test("recommendSkills: a Skill triggered only by weak (keyword-in-doc) signals gets confidence 'weak'", () => {
  const project = { packageJson: {}, tech: {}, signals: [{ id: "multitenant", description: "Multitenant", signal: "weak", reasons: ["keyword"] }] };
  const skills = recommendSkills(project);
  const match = skills.find((s) => s.id === "multitenant-saas-architect");
  assert.equal(match.confidence, "weak");
});

test("recommendSkills: the no-signals fallback gets confidence null — an honest statement, not a guess", () => {
  const project = { packageJson: {}, tech: {}, signals: [] };
  const skills = recommendSkills(project);
  assert.equal(skills[0].confidence, null);
});

test("recommendSkills: a Skill triggered by both a strong and a weak signal gets confidence 'strong' (any strong trigger is enough)", () => {
  const project = { packageJson: {}, tech: {}, signals: [{ id: "rbac", description: "RBAC", signal: "weak", reasons: ["keyword"] }, { id: "multitenant", description: "Multitenant", signal: "strong", reasons: ["dep"] }] };
  const skills = recommendSkills(project);
  const match = skills.find((s) => s.id === "security-rbac-reviewer");
  assert.equal(match.confidence, "strong");
});

test("recommendSkills: strong-confidence recommendations sort before weak, catalog order preserved within each group", () => {
  const project = {
    packageJson: {},
    tech: {},
    signals: [
      { id: "multitenant", description: "Multitenant", signal: "weak", reasons: ["keyword"] },
      { id: "nextjs", description: "Next.js", signal: "strong", reasons: ["dep"] },
      { id: "nestjs", description: "NestJS", signal: "strong", reasons: ["dep"] },
      { id: "rbac", description: "RBAC", signal: "weak", reasons: ["keyword"] }
    ]
  };
  const skills = recommendSkills(project);
  const ids = skills.map((s) => s.id);
  assert.deepEqual(ids, ["nextjs-nestjs-architecture", "multitenant-saas-architect", "security-rbac-reviewer"]);
});

test("graphify-out/ presence triggers the graph-understanding skill (Change 0064)", () => {
  const dir = makeProject({ "graphify-out/.gitkeep": "" });
  const project = detectProject(dir);
  const ids = project.signals.map((s) => s.id);
  assert.ok(ids.includes("codeGraphUnderstanding"));
  const skills = recommendSkills(project);
  assert.ok(skills.some((s) => s.id === "graphify-ast-architecture"));
});

test("dependency-graph keyword triggers the graph-understanding skill without graphify-out/ (Change 0064)", () => {
  const dir = makeProject({
    "README.md": "This document explains our module dependency graph and call graph."
  });
  const project = detectProject(dir);
  const skills = recommendSkills(project);
  assert.ok(skills.some((s) => s.id === "graphify-ast-architecture"));
});

test("graph-understanding skill does not fire on unrelated projects", () => {
  const dir = makeProject({ "README.md": "A simple library." });
  const skills = recommendSkills(detectProject(dir));
  assert.ok(!skills.some((s) => s.id === "graphify-ast-architecture"));
});

// --- Change 0098: expand skills-catalog.json with more stack detectors ---

test("file-presence detectors fire for python, go, rust, docker, kubernetes, vercel and netlify", () => {
  const dir = makeProject({
    "requirements.txt": "django\n",
    "go.mod": "module example.com/app\n",
    "Cargo.toml": "[package]\nname = \"app\"\n",
    "Dockerfile": "FROM node:20\n",
    "k8s/deployment.yaml": "apiVersion: apps/v1\n",
    "vercel.json": "{}",
    "netlify.toml": ""
  });
  const ids = detectProject(dir).signals.map((s) => s.id);
  for (const id of ["python", "go", "rust", "docker", "kubernetes", "vercel", "netlify"]) {
    assert.ok(ids.includes(id), `expected ${id} to be detected`);
  }
});

test("dependency-based detectors fire for vue, angular, svelte, mongodb, redis, graphql, stripe, supabase, firebase, react-native, kafka and rabbitmq", () => {
  const dir = makeProject({
    "package.json": JSON.stringify({
      dependencies: {
        vue: "3.4.0",
        "@angular/core": "17.0.0",
        svelte: "4.2.0",
        mongoose: "8.0.0",
        ioredis: "5.3.0",
        graphql: "16.8.0",
        stripe: "14.0.0",
        "@supabase/supabase-js": "2.39.0",
        firebase: "10.7.0",
        "react-native": "0.73.0",
        kafkajs: "2.2.4",
        amqplib: "0.10.3"
      }
    })
  });
  const signals = detectProject(dir).signals;
  const ids = signals.map((s) => s.id);
  for (const id of ["vue", "angular", "svelte", "mongodb", "redis", "graphql", "stripe", "supabase", "firebase", "react-native", "kafka", "rabbitmq"]) {
    assert.ok(ids.includes(id), `expected ${id} to be detected`);
  }
  assert.equal(signals.find((s) => s.id === "vue").signal, "strong");
});

test("spring detector is a weak, keyword-in-file signal (pom.xml mentioning springframework)", () => {
  const dir = makeProject({
    "pom.xml": "<dependency><groupId>org.springframework.boot</groupId></dependency>"
  });
  const project = detectProject(dir);
  const spring = project.signals.find((s) => s.id === "spring");
  assert.ok(spring, "spring signal expected");
  assert.equal(spring.signal, "weak");
});

test("plain Java/Gradle project without Spring does not trigger the spring detector", () => {
  const dir = makeProject({ "build.gradle": "plugins { id 'java' }" });
  const ids = detectProject(dir).signals.map((s) => s.id);
  assert.ok(!ids.includes("spring"));
});

test("stripe dependency recommends the payments-reviewer skill with a reason", () => {
  const dir = makeProject({
    "package.json": JSON.stringify({ dependencies: { stripe: "14.0.0" } })
  });
  const skills = recommendSkills(detectProject(dir));
  const match = skills.find((s) => s.id === "payments-reviewer");
  assert.ok(match, "payments-reviewer expected");
  assert.equal(match.confidence, "strong");
  assert.ok(match.because.length > 0);
});

test("docker and kubernetes both recommend the container-deployment-reviewer skill", () => {
  const dockerOnly = makeProject({ Dockerfile: "FROM node:20\n" });
  const dockerSkills = recommendSkills(detectProject(dockerOnly));
  assert.ok(dockerSkills.some((s) => s.id === "container-deployment-reviewer"));

  const k8sOnly = makeProject({ "k8s/deployment.yaml": "apiVersion: apps/v1\n" });
  const k8sSkills = recommendSkills(detectProject(k8sOnly));
  assert.ok(k8sSkills.some((s) => s.id === "container-deployment-reviewer"));
});

// --- Change 0100: specialize the python detector into django/flask/fastapi ---

test("manage.py is a strong signal for django", () => {
  const dir = makeProject({ "manage.py": "#!/usr/bin/env python\n" });
  const project = detectProject(dir);
  const django = project.signals.find((s) => s.id === "django");
  assert.ok(django, "django signal expected");
  assert.equal(django.signal, "strong");
  assert.match(django.reasons[0], /manage\.py/);
});

test("flask and fastapi are weak, keyword-in-requirements.txt signals", () => {
  const dir = makeProject({ "requirements.txt": "flask==3.0.0\nfastapi==0.109.0\n" });
  const project = detectProject(dir);
  const flask = project.signals.find((s) => s.id === "flask");
  const fastapi = project.signals.find((s) => s.id === "fastapi");
  assert.ok(flask && fastapi, "flask and fastapi signals expected");
  assert.equal(flask.signal, "weak");
  assert.equal(fastapi.signal, "weak");
});

test("a plain Python project with no framework does not trigger django/flask/fastapi", () => {
  const dir = makeProject({ "requirements.txt": "requests==2.31.0\n" });
  const ids = detectProject(dir).signals.map((s) => s.id);
  assert.ok(ids.includes("python"));
  for (const id of ["django", "flask", "fastapi"]) assert.ok(!ids.includes(id));
});

test("django, flask and fastapi each recommend python-backend-architecture", () => {
  for (const [files, expectStrong] of [
    [{ "manage.py": "" }, true],
    [{ "requirements.txt": "flask==3.0.0\n" }, false],
    [{ "pyproject.toml": "fastapi = \"^0.109\"\n" }, false]
  ]) {
    const dir = makeProject(files);
    const skills = recommendSkills(detectProject(dir));
    const match = skills.find((s) => s.id === "python-backend-architecture");
    assert.ok(match, `expected python-backend-architecture for ${JSON.stringify(files)}`);
    assert.equal(match.confidence, expectStrong ? "strong" : "weak");
  }
});

// --- Change 0140: Java/Quarkus/Camel and nested deployment tooling ---

const QUARKUS_CAMEL_POM = `<project>
  <dependencies>
    <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-openshift</artifactId></dependency>
    <dependency><groupId>org.apache.camel.quarkus</groupId><artifactId>camel-quarkus-rest</artifactId></dependency>
  </dependencies>
</project>
`;

test("a Quarkus + Camel pom.xml detects java, quarkus, camel and openshift (Change 0140)", () => {
  const ids = detectProject(makeProject({ "pom.xml": QUARKUS_CAMEL_POM })).signals.map((s) => s.id);
  for (const id of ["java", "quarkus", "camel", "openshift"]) assert.ok(ids.includes(id), `expected ${id}`);
});

test("a plain Maven or Gradle build detects java only (Change 0140)", () => {
  for (const file of ["pom.xml", "build.gradle", "build.gradle.kts"]) {
    const ids = detectProject(makeProject({ [file]: "<project/>\n" })).signals.map((s) => s.id);
    assert.deepEqual(ids, ["java"], `${file}: ${ids.join(",")}`);
  }
});

test("nested kustomization, OpenShift Route, Argo CD Application and Deployment are detected with their path (Change 0140)", () => {
  const dir = makeProject({
    "k8s/overlays/prod/kustomization.yaml": "resources:\n  - ../../base\n",
    "deploy/openshift/route.yaml": "apiVersion: route.openshift.io/v1\nkind: Route\n",
    "gitops/apps/app.yaml": "apiVersion: argoproj.io/v1alpha1\nkind: Application\n",
    "manifests/base/deploy.yml": "apiVersion: apps/v1\nkind: Deployment\n"
  });
  const signals = detectProject(dir).signals;
  const byId = Object.fromEntries(signals.map((s) => [s.id, s]));
  assert.match(byId.kustomize.reasons[0], /"kustomization\.yaml" found at k8s\/overlays\/prod\/kustomization\.yaml/);
  assert.match(byId.openshift.reasons[0], /marker "route\.openshift\.io" found in deploy\/openshift\/route\.yaml/);
  assert.match(byId.argocd.reasons[0], /marker "argoproj\.io" found in gitops\/apps\/app\.yaml/);
  assert.ok(byId.kubernetes.reasons.includes("marker \"kind: Deployment\" found in manifests/base/deploy.yml"), byId.kubernetes.reasons.join("; "));
});

test("an OpenShift DeploymentConfig does not count as a Kubernetes Deployment marker (Change 0140)", () => {
  const ids = detectProject(makeProject({ "deploy/dc.yaml": "kind: DeploymentConfig\n" })).signals.map((s) => s.id);
  assert.ok(!ids.includes("kubernetes"));
});

test("nested search skips vendor/build dirs and stops below depth 4 (Change 0140)", () => {
  const dir = makeProject({
    "node_modules/pkg/kustomization.yaml": "resources: []\n",
    "target/classes/app.yaml": "apiVersion: argoproj.io/v1alpha1\n",
    "a/b/c/d/e/kustomization.yaml": "resources: []\n",
    "a/b/c/d/e/app.yaml": "apiVersion: argoproj.io/v1alpha1\n"
  });
  const ids = detectProject(dir).signals.map((s) => s.id);
  assert.ok(!ids.includes("kustomize"), ids.join(","));
  assert.ok(!ids.includes("argocd"), ids.join(","));
  const atLimit = detectProject(makeProject({ "a/b/c/d/kustomization.yaml": "resources: []\n" })).signals.map((s) => s.id);
  assert.ok(atLimit.includes("kustomize"), "depth 4 is still searched");
});

test("an Argo CD-only repository gets the container-deployment-reviewer Skill (Change 0140)", () => {
  const project = detectProject(makeProject({ "apps/app.yaml": "apiVersion: argoproj.io/v1alpha1\nkind: Application\n" }));
  const skill = recommendSkills(project).find((s) => s.id === "container-deployment-reviewer");
  assert.ok(skill);
  assert.equal(skill.confidence, "strong");
});

test("a Camel on Spring Boot stack detects spring, kafka, redis, activemq and keycloak from pom.xml (Change 0140)", () => {
  const pom = `<project>
  <dependency><groupId>org.apache.camel.springboot</groupId><artifactId>camel-kafka-starter</artifactId></dependency>
  <dependency><groupId>org.apache.camel.springboot</groupId><artifactId>camel-activemq-starter</artifactId></dependency>
  <dependency><groupId>org.springframework.boot</groupId><artifactId>spring-boot-starter-data-redis</artifactId></dependency>
  <dependency><groupId>org.keycloak</groupId><artifactId>keycloak-admin-client</artifactId></dependency>
</project>
`;
  const ids = detectProject(makeProject({ "pom.xml": pom })).signals.map((s) => s.id);
  for (const id of ["java", "camel", "spring", "kafka", "redis", "activemq", "keycloak"]) assert.ok(ids.includes(id), `expected ${id}: ${ids.join(",")}`);
  assert.ok(!ids.includes("quarkus"));
});

test("a Camel on Quarkus stack detects Artemis, Kafka, Redis, Keycloak (via config), Podman and the nested Quarkus Dockerfile (Change 0140)", () => {
  const dir = makeProject({
    "pom.xml": `<project>
  <dependency><groupId>org.apache.camel.quarkus</groupId><artifactId>camel-quarkus-kafka</artifactId></dependency>
  <dependency><groupId>io.quarkiverse.artemis</groupId><artifactId>quarkus-artemis-jms</artifactId></dependency>
  <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-redis-client</artifactId></dependency>
  <dependency><groupId>io.quarkus</groupId><artifactId>quarkus-oidc</artifactId></dependency>
</project>
`,
    "src/main/resources/application.properties": "quarkus.oidc.auth-server-url=https://keycloak.example.com/realms/integraciones\n",
    "src/main/docker/Dockerfile.jvm": "FROM registry.access.redhat.com/ubi9/openjdk-17\n",
    "Containerfile": "FROM registry.access.redhat.com/ubi9/openjdk-17\n"
  });
  const project = detectProject(dir);
  const ids = project.signals.map((s) => s.id);
  for (const id of ["java", "quarkus", "camel", "kafka", "activemq", "redis", "keycloak", "docker", "podman"]) assert.ok(ids.includes(id), `expected ${id}: ${ids.join(",")}`);
  const docker = project.signals.find((s) => s.id === "docker");
  assert.ok(docker.reasons.includes('"Dockerfile.jvm" found at src/main/docker/Dockerfile.jvm'), docker.reasons.join("; "));
  const skills = recommendSkills(project).map((s) => s.id);
  assert.ok(skills.includes("container-deployment-reviewer"));
  assert.ok(skills.includes("security-rbac-reviewer"), "Keycloak triggers the security reviewer");
});

test("AMQ Streams (Strimzi) and AMQ Broker operator resources are detected from manifests (Change 0140)", () => {
  const dir = makeProject({
    "deploy/topic.yaml": "apiVersion: kafka.strimzi.io/v1beta2\nkind: KafkaTopic\n",
    "deploy/broker.yaml": "apiVersion: broker.amq.io/v1beta1\nkind: ActiveMQArtemis\n"
  });
  const ids = detectProject(dir).signals.map((s) => s.id);
  assert.ok(ids.includes("kafka"), ids.join(","));
  assert.ok(ids.includes("activemq"), ids.join(","));
});

test("Eclipse JKube projects are detected: kind-less fragments in src/main/jkube and the Maven plugins (Change 0140)", () => {
  const fragmentsOnly = detectProject(makeProject({ "src/main/jkube/deployment.yaml": "spec:\n  replicas: 1\n" })).signals;
  const k8s = fragmentsOnly.find((s) => s.id === "kubernetes");
  assert.ok(k8s, "a jkube fragments dir implies Kubernetes");
  assert.ok(k8s.reasons.includes('"jkube" found at src/main/jkube'), k8s.reasons.join("; "));
  const pom = "<project><plugin><groupId>org.eclipse.jkube</groupId><artifactId>kubernetes-maven-plugin</artifactId></plugin><plugin><artifactId>openshift-maven-plugin</artifactId></plugin></project>\n";
  const ids = detectProject(makeProject({ "pom.xml": pom })).signals.map((s) => s.id);
  assert.ok(ids.includes("kubernetes"), ids.join(","));
  assert.ok(ids.includes("openshift"), ids.join(","));
});

// --- Change 0141: aiRoadmap ignores assistant instruction files ---

test("aiRoadmap ignores AGENTS.md/CLAUDE.md but still reads README.md and docs/architecture.md (Change 0141)", () => {
  const assistantOnly = detectProject(makeProject({
    "AGENTS.md": "This file defines how AI assistants collaborate.\n",
    "CLAUDE.md": "Uses an LLM assistant for reviews.\n"
  })).signals.map((s) => s.id);
  assert.ok(!assistantOnly.includes("aiRoadmap"), assistantOnly.join(","));
  for (const file of ["README.md", "docs/architecture.md"]) {
    const ids = detectProject(makeProject({ [file]: "Summaries are generated by an LLM.\n" })).signals.map((s) => s.id);
    assert.ok(ids.includes("aiRoadmap"), `${file}: ${ids.join(",")}`);
  }
});
