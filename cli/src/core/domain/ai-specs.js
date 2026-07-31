// ai-specs discovery and resolver (AIEF 3.1, LIDR integration — Change 0053, ADR-023).
//
// Reads a LIDR/specboot-style project's ai-specs/skills/*.md and
// ai-specs/standards/*.md, and resolves them against a caller-supplied list
// of AIEF built-in resources. "AIEF consume LIDR, nunca lo copia": nothing
// here writes a file, and nothing in the existing CLI calls this module yet
// (ADR-023) — a project with no ai-specs/ directory is a strict, silent
// no-op.
import fs from "node:fs";
import path from "node:path";

export function discoverAiSpecs(cwd) {
  const root = path.join(cwd, "ai-specs");
  if (!fs.existsSync(root)) return { present: false, root, skills: [], standards: [] };
  return {
    present: true,
    root,
    skills: discoverResourceDir(path.join(root, "skills")),
    standards: discoverResourceDir(path.join(root, "standards"))
  };
}

// A missing subdirectory (ai-specs/ present but skills/ or standards/
// absent) is not an error — it is simply nothing to discover for that
// resource type.
function discoverResourceDir(dir) {
  if (!fs.existsSync(dir)) return [];

  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch (err) {
    // e.g. ENOTDIR: a ".md" path exists but is not a readable directory.
    return [{ id: null, path: dir, state: "read_error", content: null, diagnostic: `could not read ${dir}: ${err.message}` }];
  }

  const names = entries
    .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".md"))
    .map((entry) => entry.name)
    .sort();

  const claimedIds = new Set();
  const resources = [];
  for (const name of names) {
    const filePath = path.join(dir, name);
    const id = path.basename(name, path.extname(name));

    if (claimedIds.has(id)) {
      resources.push({ id, path: filePath, state: "duplicate", content: null, diagnostic: `duplicate id "${id}" in ${dir} — a previous file already claimed it` });
      continue;
    }
    claimedIds.add(id);

    let content;
    try {
      content = fs.readFileSync(filePath, "utf8");
    } catch (err) {
      resources.push({ id, path: filePath, state: "read_error", content: null, diagnostic: `could not read ${filePath}: ${err.message}` });
      continue;
    }

    if (!content.trim()) {
      resources.push({ id, path: filePath, state: "empty", content: null, diagnostic: `${filePath} is empty` });
      continue;
    }

    resources.push({ id, path: filePath, state: "present", content, diagnostic: null });
  }
  return resources;
}

// resolveResources(builtins, projectResources) -> { resources, warnings }
//
// Generic over `builtins`' shape — this function only ever reads `.id` from
// each entry, never any resource-specific field (ADR-023: not coupled to
// the Skill Catalog or knowledge/standards/). `projectResources` is
// discoverAiSpecs()'s `skills` or `standards` array (or anything shaped
// like it).
//
// Precedence: a project resource in state "present" always wins over a
// built-in sharing its id (never merged — the resolved entry is wholly one
// or the other) and is added outright when its id is new. A project
// resource in state "read_error"/"duplicate"/"empty" never wins and never
// gets added — only a warning is recorded, and any built-in sharing that id
// is left untouched.
export function resolveResources(builtins, projectResources) {
  const resolved = new Map();
  const warnings = [];

  for (const builtin of builtins) {
    if (builtin && typeof builtin.id === "string") {
      resolved.set(builtin.id, { id: builtin.id, source: "builtin", value: builtin });
    }
  }

  for (const project of projectResources) {
    if (!project) continue;

    if (project.id === null) {
      // A directory-level read error (discoverResourceDir's synthetic
      // entry) — no specific id was overridden, but the failure is still
      // worth surfacing rather than silently dropping.
      warnings.push(`ai-specs resource directory unavailable (${project.state}): ${project.diagnostic}`);
      continue;
    }
    if (typeof project.id !== "string") continue;

    if (project.state !== "present") {
      warnings.push(`ignored project ai-spec "${project.id}" (${project.state}): ${project.diagnostic}`);
      continue;
    }

    if (resolved.has(project.id)) {
      warnings.push(`"${project.id}": project ai-specs resource overrides AIEF's built-in (${project.path})`);
    }
    resolved.set(project.id, { id: project.id, source: "project", value: project });
  }

  return { resources: [...resolved.values()], warnings };
}

// deriveResourceDescription(content) -> a short, human-readable description
// for a project-sourced resource file (Skill or Standard alike; AIEF 3.1,
// Change 0054/ADR-024, generalized in Change 0055/ADR-025). The file's first
// non-empty line, with a leading Markdown heading marker stripped — never
// throws, never returns empty.
export function deriveResourceDescription(content) {
  const lines = String(content || "").split(/\r?\n/);
  const firstNonEmpty = lines.find((line) => line.trim().length > 0);
  if (!firstNonEmpty) return "Project-defined resource";
  const stripped = firstNonEmpty.replace(/^#+\s*/, "").trim();
  return stripped || "Project-defined resource";
}

// Stable alias kept for Change 0054 callers/tests — identical behavior,
// generic "resource" fallback text aside (a Skill-specific fallback string
// was never actually reachable for a `state: "present"` resource, so this
// is not an observable behavior change for any real Skill file).
export const deriveSkillDescription = deriveResourceDescription;

// resolveResourceRecommendations(builtins, projectResources, resourceDirLabel)
//   -> { items, warnings, invalidCount }
//
// Shared by resolveSkillRecommendations() and resolveStandardRecommendations()
// (Change 0055/ADR-025, extracted from Change 0054's original Skill-only
// implementation) — adds only what rendering a recommendation needs on top
// of resolveResources(); does not know about `aief doctor`/`aief prompt`,
// console output, or any other presentation concern.
//
// `invalidCount` is counted separately from `warnings.length`: an override
// warning describes a *successful* precedence decision (already visible via
// an item's `overridesBuiltin`/`[project override]` tag), not a problem —
// only a genuinely unusable project resource (read_error/duplicate/empty)
// should make a caller surface a "something was ignored" hint.
function resolveResourceRecommendations(builtins, projectResources, resourceDirLabel) {
  const { resources, warnings } = resolveResources(builtins, projectResources);
  const builtinIds = new Set(builtins.filter((b) => b && typeof b.id === "string").map((b) => b.id));
  const invalidCount = projectResources.filter((resource) => resource.state !== "present").length;

  const items = resources.map((entry) => {
    if (entry.source === "builtin") {
      return {
        id: entry.id,
        description: entry.value.description,
        because: entry.value.because || [],
        source: "builtin",
        path: entry.value.path ?? null,
        overridesBuiltin: false
      };
    }
    return {
      id: entry.id,
      description: deriveResourceDescription(entry.value.content),
      because: [`ai-specs/${resourceDirLabel}/${entry.id}.md present in project`],
      source: "project",
      path: entry.value.path,
      overridesBuiltin: builtinIds.has(entry.id)
    };
  });

  return { items, warnings, invalidCount };
}

// resolveSkillRecommendations(builtins, cwd) ->
//   { items, warnings, invalidCount, aiSpecsPresent }
//
// `builtins` is normally `recommendSkills(project)`'s output (each entry
// already carrying `id`/`description`/`because`) — this function does not
// import or call `recommendSkills()` itself, keeping `cli/src/detect.js`
// untouched.
export function resolveSkillRecommendations(builtins, cwd) {
  const aiSpecs = discoverAiSpecs(cwd);
  return { ...resolveResourceRecommendations(builtins, aiSpecs.skills, "skills"), aiSpecsPresent: aiSpecs.present };
}

// resolveStandardRecommendations(builtins, cwd) ->
//   { items, warnings, invalidCount, aiSpecsStandardsPresent }
//
// `builtins` is normally cli.js's `builtinStandardsList()` output (Change
// 0055/ADR-025) — `{ id, description, path }` per file under
// `knowledge/standards/`. `aiSpecsStandardsPresent` is true whenever
// `ai-specs/standards/` contributed at least one entry (valid or not) — the
// signal a caller (e.g. `aief doctor`) uses to decide whether to show
// anything at all, keeping a project with no such directory fully
// unaffected (ADR-025).
export function resolveStandardRecommendations(builtins, cwd) {
  const aiSpecs = discoverAiSpecs(cwd);
  return {
    ...resolveResourceRecommendations(builtins, aiSpecs.standards, "standards"),
    aiSpecsStandardsPresent: aiSpecs.standards.length > 0
  };
}
