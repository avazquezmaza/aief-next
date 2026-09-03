// Command handler: analyze (modularization, third slice). Zero dependency
// on any other command handler — only the shared kernel plus project
// detection/maturity classification.
import path from "node:path";
import { detectProject, recommendSkills } from "../detect.js";
import { classifyMaturity } from "../core/domain/project-maturity.js";
import { cwd, exists, section, printNext, parseArgs, createChange, listStandards } from "./shared.js";

const KNOWN_MATURITY_VALUES = new Set(["definition", "implemented", "ambiguous"]);

// Change 0080: `aief analyze` used to unconditionally create an Analysis
// Change — correct once application code exists, wrong for a repository
// still in Definition (README/PRD/business requirements, no source yet):
// that repository would get "review package configuration", "inspect source
// modules" tasks for things that do not exist.
//
// Routing, in priority order:
// - maturity "implemented" -> today's exact behavior, byte-identical
//   (Analysis Change). Never regressed.
// - maturity "definition"  -> a Definition Change instead (Change 0079),
//   seeded with the same Objective text, explaining why.
// - maturity "ambiguous"   -> falls back to today's exact behavior (Analysis
//   Change), the smallest, safest, backward-compatible choice for a
//   near-empty repository — but the ambiguity itself is reported explicitly,
//   never silently swallowed. A bare/near-empty directory is exactly what
//   every pre-existing `aief analyze` caller and test already expects to
//   produce an Analysis Change; refusing to act here would be a real,
//   observable regression, not a safety improvement. `--maturity` lets a
//   human override the detected value either way.
export function analyze(args) {
  const parsed = parseArgs("analyze", args);
  if (!parsed) return;
  let maturityOverride = null;
  if (typeof parsed.maturity === "string") {
    maturityOverride = parsed.maturity.toLowerCase();
    if (!KNOWN_MATURITY_VALUES.has(maturityOverride)) {
      console.error(`Unknown --maturity "${parsed.maturity}". Use one of: ${[...KNOWN_MATURITY_VALUES].join(", ")}.`);
      process.exitCode = 1;
      return;
    }
  }
  section("AIEF Analyze");
  const detected = classifyMaturity(cwd());
  const maturity = maturityOverride || detected.maturity;
  const name = parsed._.join(" ") || "analyze-current-architecture";

  if (maturity === "definition") {
    console.log("Purpose: create a Definition Change — this repository looks pre-implementation (requirements/context present, no application source found).\nWrites only under changes/<id>-<name>/.\n");
    console.log(`Detected maturity: Definition${maturityOverride ? " (forced via --maturity)" : ""}.\n${detected.reasons.map((r) => `- ${r}`).join("\n")}\n`);
    const dir = createChange(name, { type: "definition", noBranch: parsed["no-branch"] });
    printNext(dir ? `aief prompt --change ${path.basename(dir)}` : "aief prompt", "See docs/getting-started.md for the pre-implementation Definition workflow.");
    return;
  }

  console.log("Purpose: create an Analysis Change seeded with the project context doctor already detects.\nWrites only under changes/<id>-<name>/.\n");
  if (maturity === "ambiguous" && !maturityOverride) {
    console.log(`Project maturity is ambiguous — defaulting to Analysis.\n${detected.reasons.map((r) => `- ${r}`).join("\n")}\nRun \`aief new-change <name> --type definition\` instead if this is actually pre-implementation work, or \`aief analyze --maturity definition\` to force this classification.\n`);
  }
  const project = detectProject();
  const context = { project, skills: recommendSkills(project), standards: listStandards(), skillsDocPresent: exists("knowledge/skills.md") };
  const dir = createChange(name, { type: "analysis", context, noBranch: parsed["no-branch"] });
  if (context.project.signals.length) console.log(`Seeded change.md with ${context.project.signals.length} detected signal(s), ${context.skills.length} skill(s) and ${context.standards.length} standard(s).`);
  // Explicit selection in the hint: after adoption there are typically two
  // open Changes (adopt-aief + this Analysis), so the suggested command must
  // name its target instead of relying on implicit "latest open".
  printNext(dir ? `aief prompt claude --profile architect --change ${path.basename(dir)}` : "aief prompt claude --profile architect");
}
