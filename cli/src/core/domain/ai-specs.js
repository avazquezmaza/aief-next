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
