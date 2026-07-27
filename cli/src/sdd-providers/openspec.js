// OpenSpecProvider (AIEF Core 3.0, Entrega 3 — SDD Provider, Change 0045).
//
// Deliberate, documented duplication note: `run()`/`commandExists()`-style
// detection already exists in cli.js's private `openspecInfo()`, used by
// `propose()`. That function is NOT relocated or imported here — the
// commissioning instruction is explicit that `propose()` and everything it
// depends on must not change in this Entrega ("no cambies: detección actual
// del binario ... no refactorices propose()"). Editing cli.js at all, even
// to relocate a helper, carries a real risk of behavior drift for a working,
// tested command. This module therefore has its own small, self-contained
// binary-detection implementation instead — a few lines of generic shell
// process-spawning code, not business logic — and the resulting duplication
// is recorded here and in design.md/evidence.md as a known, bounded,
// deliberately deferred consolidation (ADR-017's own recorded obligation to
// wire `propose()` to this provider in a later Change would resolve it).
//
// Directory shape resolved against `adapters/openspec/mapping.md` (verified
// against the upstream OpenSpec project's documented convention):
//   openspec/changes/<change_id>/{proposal.md, tasks.md, design.md, specs/<capability>/spec.md}
// `design.md` is explicitly optional per that same document ("Optional in
// both approaches") — its absence is `not_applicable`, never `missing`.
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { makeArtifact, readArtifactFile, parseRequirements, parseTasks } from "../core/domain/sdd-model.js";

export const PROVIDER_ID = "openspec";

export const CAPABILITIES = {
  create: false,
  read_artifacts: true,
  requirements: true,
  tasks: true,
  validate: true,
  archive: false
};

function run(command, args) {
  const result = spawnSync(command, args, { stdio: "pipe", shell: process.platform === "win32", encoding: "utf8" });
  return { status: result.status, stdout: result.stdout || "", stderr: result.stderr || "" };
}

function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  return run(checker, [command]).status === 0;
}

// detect(cwd) -> { available, cliPresent, structurePresent, reason? }
// Binary presence and project-structure presence are checked and reported
// independently (SDD-R5) — a committed openspec/ directory with no local
// CLI install is a real, valid case (e.g. CI reading artifacts). Filesystem
// first, always: the binary check only runs when structure is absent (to
// give a fuller reason), never on the success path — `status` and every
// other filesystem-only artifact read must not spawn a process just to
// confirm something the directory listing already answered (independent
// review finding, fixed before close: the original implementation called
// commandExists() unconditionally, before even checking structurePresent).
export function detect(cwd) {
  const structurePresent = fs.existsSync(path.join(cwd, "openspec")) || fs.existsSync(path.join(cwd, ".openspec"));
  if (structurePresent) {
    return { available: true, structurePresent, cliPresent: null };
  }
  const cliPresent = commandExists("openspec") || commandExists("opsx");
  return { available: false, structurePresent, cliPresent, reason: cliPresent ? "OpenSpec CLI found but no openspec/ project structure" : "OpenSpec CLI and project structure both absent" };
}

function openspecRoot(cwd) {
  const primary = path.join(cwd, "openspec");
  if (fs.existsSync(primary)) return primary;
  return path.join(cwd, ".openspec");
}

// True when `child` is `parent` itself or genuinely nested inside it — never
// escaped via "../" segments or an absolute path swap.
function isPathWithin(parent, child) {
  const relative = path.relative(parent, child);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}

// resolveChange(change, cwd) -> { resolved, changeId?, reason? }
// Only meaningful when the manifest declares sdd.change_id — OpenSpec has
// no way to guess which of its Changes corresponds to an AIEF Change
// without that explicit link (SDD-R14: linked, never merged).
//
// change_id is rejected outright if it would resolve outside
// openspec/changes/ — independent review finding, fixed before close: a
// manifest.json (which could come from an untrusted contributor's PR, not
// just a trusted maintainer) declaring `sdd.change_id: "../../../etc/passwd"`
// or similar used to be joined into a filesystem path with no containment
// check, letting getArtifacts() read arbitrary files outside the project
// and report their content as if it were this Change's SDD proposal.
export function resolveChange(change, cwd) {
  const changeId = change.manifest?.sdd?.change_id;
  if (typeof changeId !== "string" || !changeId.trim()) {
    return { resolved: false, reason: "no sdd.change_id declared in the manifest" };
  }
  const changesRoot = path.join(openspecRoot(cwd), "changes");
  const changeDir = path.join(changesRoot, changeId);
  if (!isPathWithin(changesRoot, changeDir)) {
    return { resolved: false, changeId, reason: `sdd.change_id ${JSON.stringify(changeId)} is not a valid change identifier` };
  }
  if (!fs.existsSync(changeDir)) {
    return { resolved: false, changeId, reason: `openspec/changes/${changeId}/ does not exist` };
  }
  return { resolved: true, changeId };
}

// Specifications are enumerated in sorted capability order — never the raw
// filesystem readdir order, which is not guaranteed stable across platforms
// (commissioning instruction: "no dependas del orden accidental del
// filesystem").
function resolveSpecifications(changeDir) {
  const specsDir = path.join(changeDir, "specs");
  if (!fs.existsSync(specsDir)) return [];
  let entries;
  try {
    entries = fs.readdirSync(specsDir, { withFileTypes: true });
  } catch (err) {
    return [makeArtifact(PROVIDER_ID, "specification", specsDir, "read_error", `could not read ${specsDir}: ${err.message}`)];
  }
  const capabilities = entries.filter((e) => e.isDirectory()).map((e) => e.name).sort();
  return capabilities.map((capability) => {
    const specPath = path.join(specsDir, capability, "spec.md");
    const result = readArtifactFile(fs, specPath);
    return makeArtifact(PROVIDER_ID, "specification", specPath, result.state, result.diagnostic || null, { capability });
  });
}

// getArtifacts(change, cwd) -> normalized artifact set, or { error } if the
// OpenSpec Change reference doesn't resolve (never fabricated content).
export function getArtifacts(change, cwd) {
  const resolution = resolveChange(change, cwd);
  if (!resolution.resolved) return { error: resolution.reason };

  const changeDir = path.join(openspecRoot(cwd), "changes", resolution.changeId);
  const proposalPath = path.join(changeDir, "proposal.md");
  const tasksPath = path.join(changeDir, "tasks.md");
  const designPath = path.join(changeDir, "design.md");

  const proposalResult = readArtifactFile(fs, proposalPath);
  const tasksResult = readArtifactFile(fs, tasksPath);
  const designResult = readArtifactFile(fs, designPath);
  // design.md is optional per OpenSpec's own documented convention
  // (adapters/openspec/mapping.md: "Optional in both approaches") — absence
  // is not_applicable, never missing (SDD-R18).
  const designState = designResult.state === "missing" ? "not_applicable" : designResult.state;

  return {
    provider: PROVIDER_ID,
    changeId: resolution.changeId,
    artifacts: {
      proposal: makeArtifact(PROVIDER_ID, "proposal", proposalPath, proposalResult.state, proposalResult.diagnostic || null),
      design: makeArtifact(PROVIDER_ID, "design", designPath, designState, designResult.diagnostic || null),
      tasks: makeArtifact(PROVIDER_ID, "tasks", tasksPath, tasksResult.state, tasksResult.diagnostic || null),
      specifications: resolveSpecifications(changeDir)
    }
  };
}

export function getRequirements(change, cwd) {
  const artifacts = getArtifacts(change, cwd);
  if (artifacts.error) return [];
  const requirements = [];
  for (const spec of artifacts.artifacts.specifications) {
    if (spec.state !== "present") continue;
    const content = readArtifactFile(fs, spec.path).content;
    requirements.push(...parseRequirements(content, PROVIDER_ID, spec.path));
  }
  return requirements;
}

export function getTasks(change, cwd) {
  const artifacts = getArtifacts(change, cwd);
  if (artifacts.error) return [];
  if (artifacts.artifacts.tasks.state !== "present") return [];
  const content = readArtifactFile(fs, artifacts.artifacts.tasks.path).content;
  return parseTasks(content, PROVIDER_ID, artifacts.artifacts.tasks.path);
}

// validate(change, cwd) -> SDD readiness (design.md §10) — a provider-level
// fact, never a Workflow Engine verdict (SDD-R22).
export function validate(change, cwd) {
  const artifacts = getArtifacts(change, cwd);
  if (artifacts.error) {
    return { provider: PROVIDER_ID, status: "invalid", artifacts: {}, blockers: [artifacts.error], warnings: [], info: [] };
  }
  const required = [artifacts.artifacts.proposal, artifacts.artifacts.tasks];
  const blockers = required
    .filter((a) => a.state === "missing" || a.state === "empty" || a.state === "read_error")
    .map((a) => `${a.type} is ${a.state} (${a.path})`);
  const warnings = artifacts.artifacts.specifications.length === 0
    ? ["no specifications found under specs/*/spec.md"]
    : [];
  return {
    provider: PROVIDER_ID,
    status: blockers.length ? "not_ready" : "ready",
    artifacts: Object.fromEntries([...required, ...artifacts.artifacts.specifications].map((a) => [a.type === "specification" ? `specification:${a.metadata.capability}` : a.type, a.state])),
    blockers,
    warnings,
    info: []
  };
}

// createChange()/archive(): declared, not implemented — see local.js's same
// note. No function exported; callCapability() (sdd-model.js) reports
// "unsupported" without invoking anything.
