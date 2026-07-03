import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const CATALOG_PATH = path.join(path.dirname(fileURLToPath(import.meta.url)), "skills-catalog.json");

export function loadCatalog(catalogPath = CATALOG_PATH) {
  return JSON.parse(fs.readFileSync(catalogPath, "utf8"));
}

function readIfExists(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
}

// Word-boundary match so generic prose does not trigger detectors
// (e.g. "maintainability" must not match "ai", "lieutenant" must not match "tenant").
export function containsKeyword(text, keyword) {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}($|[^a-z0-9])`, "i").test(text);
}

function evaluateDetector(detector, context) {
  const reasons = [];
  const { deps, rootDir, fileCache } = context;

  for (const dep of detector.dependencies || []) {
    if (deps[dep]) reasons.push(`dependency "${dep}" in package.json`);
  }
  for (const prefix of detector.dependencyPrefixes || []) {
    const match = Object.keys(deps).find((d) => d.startsWith(prefix));
    if (match) reasons.push(`dependency "${match}" in package.json`);
  }
  for (const fragment of detector.dependencySubstrings || []) {
    const match = Object.keys(deps).find((d) => d.includes(fragment));
    if (match) reasons.push(`dependency "${match}" in package.json`);
  }
  for (const file of detector.files || []) {
    if (fs.existsSync(path.resolve(rootDir, file))) reasons.push(`"${file}" present`);
  }
  for (const file of detector.searchFiles || []) {
    if (!(file in fileCache)) fileCache[file] = readIfExists(path.resolve(rootDir, file));
    const text = fileCache[file];
    if (!text) continue;
    const keyword = (detector.keywords || []).find((k) => containsKeyword(text, k));
    if (keyword) reasons.push(`keyword "${keyword}" found in ${file}`);
  }

  return reasons;
}

export function detectProject(rootDir = process.cwd(), catalog = loadCatalog()) {
  let packageJson = {};
  try {
    packageJson = JSON.parse(fs.readFileSync(path.resolve(rootDir, "package.json"), "utf8"));
  } catch {
    packageJson = {};
  }
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  const context = { deps, rootDir, fileCache: {} };

  const signals = [];
  const tech = {};
  for (const detector of catalog.detectors) {
    const reasons = evaluateDetector(detector, context);
    tech[detector.id] = reasons.length > 0;
    if (reasons.length) {
      signals.push({
        id: detector.id,
        description: detector.description,
        signal: detector.signal || "strong",
        reasons
      });
    }
  }
  return { packageJson, tech, signals };
}

export function recommendSkills(project, catalog = loadCatalog()) {
  const signalById = new Map(project.signals.map((s) => [s.id, s]));
  const recommendations = [];

  for (const skill of catalog.skills) {
    if (skill.fallback) continue;
    const triggers = (skill.when || []).filter((id) => signalById.has(id));
    if (!triggers.length) continue;
    recommendations.push({
      ...skill,
      because: triggers.map((id) => {
        const signal = signalById.get(id);
        return `${signal.description} detected (${signal.reasons.join("; ")}) — ${signal.signal} signal`;
      })
    });
  }

  if (!recommendations.length) {
    const fallback = catalog.skills.find((s) => s.fallback);
    if (fallback) {
      recommendations.push({
        ...fallback,
        because: ["no strong technology signals detected; general review recommended"]
      });
    }
  }
  return recommendations;
}
