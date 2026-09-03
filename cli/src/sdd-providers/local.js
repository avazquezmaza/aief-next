// LocalSddProvider (AIEF Core 3.0, Entrega 3 — SDD Provider, Change 0045).
// Wraps the *existing*, already-correct local Change model
// (readChangeFiles()/loadChange(), cli/src/core/domain/change.js) — this
// module adds no new artifact-reading logic for the four required files; it
// gives the existing behavior the same shape OpenSpecProvider answers
// through (design.md §7).
import fs from "node:fs";
import path from "node:path";

import { CHANGE_FILES, readChangeFiles } from "../core/domain/change.js";
import { makeArtifact, readArtifactFile, parseRequirements, parseTasks } from "../core/domain/sdd-model.js";

export const PROVIDER_ID = "local";

// create/archive are declared but not implemented in this Entrega (design.md
// §3/§19) — no side effect, no simulated success (commissioning §2).
export const CAPABILITIES = {
  create: false,
  read_artifacts: true,
  requirements: true,
  tasks: true,
  validate: true,
  archive: false
};

// Optional files a real Change in this repository may carry, beyond the
// four required ones (CHANGE_FILES). AGENTS.md's own "Working with Changes"
// section documents design.md/adr.md/notes.md; proposal.md and
// verification.md are not yet documented there but are real, used files
// (this planning effort's own Changes 0043–0045) — both sets are resolved,
// per the project owner's explicit instruction when approving this
// Entrega's implementation (spec.md SDD-R16's deferred decision, resolved
// here rather than left open).
const OPTIONAL_FILES = ["proposal.md", "design.md", "verification.md", "adr.md", "notes.md"];

// detect()/resolveChange(): the local provider is always available and
// always resolves — the AIEF Change directory *is* the SDD Change, there is
// no separate id to look up (design.md §3/§6).
export function detect() {
  return { available: true };
}

export function resolveChange(change) {
  return { resolved: true, changeId: change.basename };
}

// getArtifacts(change) -> normalized artifact set (design.md §8's shape).
// Required files reuse readChangeFiles() exactly (SDD-R15's zero-drift
// requirement); optional files are read with the same present/missing/
// empty/read_error classification via readArtifactFile(), never a second,
// divergent set of rules.
export function getArtifacts(change) {
  const { missing, empty } = readChangeFiles(change.dir);
  const requiredArtifacts = {};
  for (const file of CHANGE_FILES) {
    const filePath = path.join(change.dir, file);
    const state = missing.includes(file) ? "missing" : empty.includes(file) ? "empty" : "present";
    requiredArtifacts[file] = makeArtifact(PROVIDER_ID, file, filePath, state);
  }

  const optionalArtifacts = {};
  for (const file of OPTIONAL_FILES) {
    const filePath = path.join(change.dir, file);
    const result = readArtifactFile(fs, filePath);
    // Optional files are `not_applicable` when absent — their absence is
    // normal, not a gap the way a missing required file is (SDD-R18: a
    // provider never reports a genuinely-optional artifact as if it were
    // expected and missing).
    const state = result.state === "missing" ? "not_applicable" : result.state;
    optionalArtifacts[file] = makeArtifact(PROVIDER_ID, file, filePath, state, result.diagnostic || null);
  }

  // "specifications" is an array from the start (SDD-R13), even though the
  // local convention has exactly one spec.md today — 0 or 1 entries, never
  // more, until the local format itself changes (out of scope here).
  const specifications = [requiredArtifacts["spec.md"]];

  return {
    provider: PROVIDER_ID,
    changeId: change.basename,
    artifacts: {
      proposal: optionalArtifacts["proposal.md"],
      design: optionalArtifacts["design.md"],
      verification: optionalArtifacts["verification.md"],
      adr: optionalArtifacts["adr.md"],
      notes: optionalArtifacts["notes.md"],
      tasks: requiredArtifacts["tasks.md"],
      evidence: requiredArtifacts["evidence.md"],
      changeDoc: requiredArtifacts["change.md"],
      specifications
    }
  };
}

export function getRequirements(change) {
  const { files } = readChangeFiles(change.dir);
  return parseRequirements(files["spec.md"], PROVIDER_ID, path.join(change.dir, "spec.md"));
}

export function getTasks(change) {
  const { files } = readChangeFiles(change.dir);
  return parseTasks(files["tasks.md"], PROVIDER_ID, path.join(change.dir, "tasks.md"));
}

// validate(change) -> SDD readiness (design.md §10). Answers "are the
// artifacts present and valid" — nothing here is a Workflow Engine
// transition verdict (SDD-R22).
export function validate(change) {
  const { missing, empty } = readChangeFiles(change.dir);
  const blockers = missing.map((f) => `${f} is missing`).concat(empty.map((f) => `${f} is empty`));
  return {
    provider: PROVIDER_ID,
    status: blockers.length ? "not_ready" : "ready",
    artifacts: Object.fromEntries(CHANGE_FILES.map((f) => [f, missing.includes(f) ? "missing" : empty.includes(f) ? "empty" : "passed"])),
    blockers,
    warnings: [],
    info: []
  };
}

// createChange()/archive(): declared, not implemented (CAPABILITIES above
// already report them false). No function is exported for either — a
// caller must go through callCapability() (sdd-model.js), which reports
// "unsupported" without ever invoking anything, matching "no ejecutes
// efectos secundarios; no simules éxito."
