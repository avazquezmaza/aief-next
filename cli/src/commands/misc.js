// Standalone command handlers (modularization, second slice) — every
// handler here has zero dependency on any other command handler in cli.js
// (confirmed by grep before moving), only on the shared kernel
// (commands/shared.js). doctor/status, close/verify, bootstrap, prompt,
// enrich/propose/analyze/newChange are NOT here — each has real cross-
// handler dependencies or is substantial enough to deserve its own,
// separately-scoped slice.
//
// Grouped into one file rather than six one-function files: each handler
// below is 1-6 lines with no internal state of its own — splitting further
// would add file-count noise, not clarity.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify, writeFile } from "./shared.js";
import { assistantIds } from "../core/domain/assistant-resolver.js";

const COMMAND_HELP = {
  doctor: {
    purpose: "Inspect your local environment (required, recommended and optional tools) and current project readiness for AIEF. Recommended Skills include a project's own ai-specs/skills/*.md alongside AIEF's built-ins (project wins on id collision) — --verbose shows source, file path and overrides.",
    when: "Before adoption or when the project feels misconfigured.",
    reads: "PATH (node, npm, git, openspec, specboot, java, maven, gradle, docker, assistants), package.json, README.md, AGENTS.md, changes/, knowledge/, profiles/, adapters/, ai-specs/skills/.",
    writes: "Nothing.",
    example: "aief doctor   (or: aief doctor --verbose)",
    next: "aief bootstrap (current directory) or aief bootstrap <name> (new project)."
  },
  status: {
    purpose: "Show current AIEF adoption status, recent Changes and all open Changes. With --change <id>, inspect one Change (track, stage, blockers, SDD readiness); add --next for its compact next-action. Without --change, --next deterministically recommends the next eligible open Change when more than one is open (or explains why none is eligible). --graph shows the full Change dependency graph (nodes, edges, topological order, issues).",
    when: "When you want to know where the project stands, which Change to select with --change, or what a specific Change's next action is.",
    reads: "Project structure, package.json, changes/ and every Change's manifest.dependsOn.",
    writes: "Nothing.",
    example: "aief status --change <id> --next   (or: aief status --next / aief status --graph)",
    next: "aief prompt (one open Change) or aief prompt --change <id> (several open)."
  },
  bootstrap: {
    purpose: "Bootstrap a project to use AIEF: detects what it can, asks only what it must (the SDD Provider, only when genuinely ambiguous), and creates AIEF's visible structure without changing application code. Replaces the former init/adopt commands.",
    when: "Right after cloning, or the first time an existing project starts using AIEF.",
    reads: "AGENTS.md, changes/, openspec/, specboot markers, PATH (OpenSpec/SpecBoot CLIs, TTY), package.json, README.md and common project files.",
    writes: "Current directory (no argument): AGENTS.md if missing, changes/, knowledge/, profiles/, knowledge/standards/, knowledge/skills.md, the CI gate, changes/<next-id>-adopt-aief/, and knowledge/sdd-provider.json only when the SDD Provider choice is ambiguous and you are prompted. With a name: <project-name>/ with README.md, AGENTS.md, changes/, knowledge/, src/, tests/. Never modifies application code, never overwrites existing files, never a hidden .aief/ directory.",
    example: "aief bootstrap   (or: aief bootstrap my-project)",
    next: "aief verify, then aief analyze or aief new-change <name>."
  },
  analyze: {
    purpose: "Create an Analysis Change for an existing project.",
    when: "After adopt, before functional or architectural changes.",
    reads: "Project signals (package.json, README.md, docs).",
    writes: "changes/<next-id>-analyze-current-architecture/ (or the name you pass).",
    example: "aief analyze",
    next: "aief prompt --profile architect."
  },
  "new-change": {
    purpose: "Create a new Change skeleton (change.md, spec.md, tasks.md, evidence.md). --type definition scaffolds a pre-implementation Definition Change (context, open questions, decisions requiring human approval) instead of the default general skeleton.",
    when: "Whenever you start a meaningful unit of work. Use --type definition before application code exists, when what's unresolved is requirements/architecture/product decisions rather than implementation.",
    reads: "changes/ to compute the next ID.",
    writes: "changes/<next-id>-<name>/.",
    example: "aief new-change add-login   (or: aief new-change \"define project architecture\" --type definition)",
    next: "Fill change.md and spec.md, then aief prompt."
  },
  enrich: {
    purpose: "Normalize a requirement from an external source (Requirement Source) into a Change, read-only.",
    when: "When work starts from Jira, Notion, GitHub Issues or another requirement source instead of an idea.",
    reads: "The source, read-only (manual: nothing; jira: a local export file, no network, no credentials).",
    writes: "changes/<next-id>-<provider>-<source-id>/ (change.md, spec.md, tasks.md, evidence.md) if it does not already exist. Never writes to the external source.",
    example: "aief enrich manual TEST-001   (or: aief enrich jira ISSUE-123 --file requirements/jira/ISSUE-123.json)",
    next: "Review spec.md and Open Questions (Requires Human Review), then aief propose or aief prompt."
  },
  propose: {
    purpose: "Create a proposal from an idea (delegating to OpenSpec when available), or continue an existing Change with --change.",
    when: "When you have an idea but no Change yet, or when continuing an existing Change (e.g. after aief enrich + Human Review).",
    reads: "OpenSpec availability and version, changes/. With --change: the existing Change directory.",
    writes: "OpenSpec output if delegation succeeds, otherwise a local Change plus proposal.md (new idea) — or, with --change, only proposal.md inside that existing Change, never touching its change.md/spec.md/tasks.md and never overwriting an existing proposal.md. Falls back loudly, never silently.",
    example: "aief propose \"Add login\"   (or: aief propose --change 0002-manual-test-001)",
    next: "Review the proposal, then aief prompt."
  },
  prompt: {
    purpose: "Generate a ready-to-paste, assistant-agnostic prompt (native file for Claude, Gemini, Codex or Cursor; a generic AGENTS.md-only prompt for any other assistant, e.g. OpenCode). With no assistant named, resolves one automatically: explicit argument/--assistant > AIEF_ASSISTANT env var > knowledge/assistant.json > passive detection of a single native file present > an interactive choice on a TTY when 2+ native files are found and nothing else disambiguates them (a non-interactive shell fails instead of guessing). Never picks Claude as a silent default.",
    when: "After creating a Change. With several open Changes, name the target with --change <id>. Use --set-assistant/--show-assistant/--clear-assistant to manage the saved project preference.",
    reads: "AGENTS.md, assistant files, AIEF_ASSISTANT, knowledge/assistant.json, profiles and the selected Change (implicit only when exactly one Change is open).",
    writes: "Nothing for a normal prompt (including the interactive TTY choice — that applies to the current run only, never saved). --set-assistant writes/overwrites knowledge/assistant.json; --clear-assistant deletes it if present. --show-assistant writes nothing.",
    example: "aief prompt gemini --profile architect --change 0002-add-login   (single open Change: aief prompt gemini; set a default: aief prompt --set-assistant claude)",
    next: "Paste the prompt into your assistant; afterwards aief verify."
  },
  verify: {
    purpose: "Verify required AIEF files and Change structures — the whole project, or one Change with --change. --strict adds optional, objective completeness checks (unresolved TODO/TBD, untouched scaffold placeholders, empty Requirements/Acceptance Criteria, a Definition decision with no recorded outcome, an unresolved required human decision) on top of the default structural checks — default verify is unchanged either way.",
    when: "Before commit or after adoption; with --change <id> to check a single Change and see exactly which one was verified. Add --strict when you want to catch objectively incomplete work, not just structurally broken Changes.",
    reads: "README.md, AGENTS.md, changes/, knowledge/.",
    writes: "Nothing.",
    example: "aief verify   (or: aief verify --change 0002-add-login --strict)",
    next: "Fix reported gaps, then aief close."
  },
  close: {
    purpose: "Check that a Change is ready (files, tasks, evidence) and mark it Closed.",
    when: "After evidence is complete, before commit. With several open Changes, --change <id> is required — close never picks one implicitly.",
    reads: "The selected Change (implicit only when exactly one is open): change.md, tasks.md, evidence.md. With --evidence-from <path>, also a JUnit XML report at that path (already produced by your own test runner/CI — never executed by AIEF).",
    writes: "A Status section in change.md — only with --yes and only when all checks pass. With --evidence-from <path> (Change 0071), the Change's evidence.md ## Verification section, filled in with the report's counts — existing content there is never overwritten, only appended to or, on a repeat capture, replaced in place. Without --yes or --evidence-from, writes nothing.",
    example: "aief close --yes --change 0002-add-login   (single open Change: aief close --yes)\naief close --evidence-from test-results.xml --change 0002-add-login   (capture test counts into evidence.md first)",
    next: "Commit your work, then aief status."
  },
  release: {
    purpose: "Create release notes for a version.",
    when: "When preparing a release.",
    reads: "releases/.",
    writes: "releases/v<version>.md if it does not exist (never overwrites).",
    example: "aief release 0.2.0",
    next: "Fill in the release notes, then tag the release."
  },
  "use-profile": {
    purpose: "Print a minimal prompt header for a role profile.",
    when: "When you want the assistant to act as a specific role.",
    reads: "Nothing.",
    writes: "Nothing.",
    example: "aief use-profile developer",
    next: "aief prompt for a full, Change-aware prompt."
  },
  help: {
    purpose: "Show general usage or detailed help for one command.",
    when: "Anytime.",
    reads: "Nothing.",
    writes: "Nothing.",
    example: "aief help adopt",
    next: "Run the command you just read about."
  },
  explain: {
    purpose: "Alias of help: show detailed help for one command.",
    when: "Anytime.",
    reads: "Nothing.",
    writes: "Nothing.",
    example: "aief explain doctor",
    next: "Run the command you just read about."
  }
};
function printCommandHelp(command) {
  const info = COMMAND_HELP[command];
  if (!info) { console.error(`Unknown help topic: ${command}`); console.log(`Available topics: ${Object.keys(COMMAND_HELP).join(", ")}`); process.exitCode = 1; return; }
  console.log(`AIEF Help: ${command}`); console.log("─".repeat(60));
  console.log(`\nPurpose\n${info.purpose}\n\nWhen to use it\n${info.when}\n\nReads\n${info.reads}\n\nWrites\n${info.writes}\n\nExample\n  ${info.example}\n\nNext step\n${info.next}`);
}
export function help(topic) {
  if (topic) return printCommandHelp(topic);
  console.log(`AIEF CLI\n\nUsage:\n  aief help [command]\n  aief explain <command>\n  aief --help | --version\n\nDiscovery:\n  aief doctor [--verbose]\n  aief status [--change change-id] [--next] [--graph]\n\nBootstrap:\n  aief bootstrap             (bootstrap the current directory)\n  aief analyze [name]\n\nWork:\n  aief new-change <name>\n  aief enrich manual|jira <source-id> [--file path]\n  aief propose <idea> [--change change-id]\n  aief prompt [${assistantIds().join("|")}] [--profile architect] [--change change-id]
              (long form: --assistant gemini; no name given: resolves automatically)
              (aief prompt --set-assistant <name> | --show-assistant | --clear-assistant)\n  aief verify [--change change-id]\n  aief close [--yes] [--change change-id]\n\nProject:\n  aief bootstrap <project-name>  (create a new project skeleton)\n  aief release <version>\n`);
}

// `init`/`adopt` were replaced by `aief bootstrap` in Change 0052 (ADR-013:
// bootstrap merges them rather than sitting beside them). Their
// implementations are kept as internal functions, called only from
// bootstrap()'s dispatch — never exposed as public commands again.
export function commandRemoved(oldName) {
  console.error(`aief ${oldName} has been replaced by aief bootstrap. Run: aief bootstrap`);
  process.exitCode = 1;
}

export function useProfile(profile) { console.log(`Use AGENTS.md.\n\nAct as the ${slugify(profile || "developer")} profile.\n\nWork only on the active Change.\n`); }
export function release(version) { const clean = String(version || "").replace(/^v/, ""); if (!clean) { console.error("Version is required. Example: aief release 0.1.0"); process.exitCode = 1; return; } const file = path.join("releases", `v${clean}.md`); const created = writeFile(file, `# Release v${clean}\n\n## Summary\n\n-\n\n## Verification\n\n-\n`); console.log(created ? `Created release notes: ${file}` : `Release notes already exist (not overwritten): ${file}`); }
export function printVersion() {
  // One extra ".." vs. cli.js's own original version of this function: this
  // file lives one directory deeper (cli/src/commands/, not cli/src/).
  const pkg = JSON.parse(fs.readFileSync(path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "package.json"), "utf8"));
  console.log(`aief ${pkg.version}`);
}
