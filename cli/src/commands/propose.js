// Command handler: propose (modularization, third slice). Zero dependency
// on any other command handler — only the shared kernel plus OpenSpec
// detection (process-utils.js).
import path from "node:path";
import { run, commandExists } from "../process-utils.js";
import { section, parseArgs, createChange, writeFile, printNext, resolveExplicitChange } from "./shared.js";

// Validate the OpenSpec CLI contract before delegating. Never assume
// "openspec propose <idea>" exists: check installation, version and
// whether the propose command is actually exposed.
function openspecInfo() {
  if (!commandExists("openspec")) return { installed: false };
  const versionResult = run("openspec", ["--version"]);
  const version = versionResult.status === 0 ? String(versionResult.stdout || "").trim() : "unknown";
  const helpResult = run("openspec", ["--help"]);
  const helpText = `${helpResult.stdout || ""}${helpResult.stderr || ""}`;
  const supportsPropose = helpResult.status === 0 && /\bpropose\b/i.test(helpText);
  return { installed: true, version, supportsPropose };
}
export function propose(args) {
  section("AIEF Propose");
  const parsed = parseArgs("propose", args);
  if (!parsed) return;
  // --change continues an existing Change (e.g. after `aief enrich` + Human
  // Review) instead of forking a new one: it only adds/keeps proposal.md,
  // never touching change.md/spec.md/tasks.md, so the Requirement Source,
  // Normalized Requirement, [H]/[I]/[S] classification and Human Review
  // status already recorded there stay exactly as they are.
  if (typeof parsed.change === "string") { proposeForChange(parsed.change, parsed._.join(" ")); return; }
  const idea = parsed._.join(" ");
  if (!idea) { console.error('Example: aief propose "Add login"\n   or: aief propose --change <change-id>   (continue an existing Change, e.g. after aief enrich)'); process.exitCode = 1; return; }
  const openspec = openspecInfo();
  if (!openspec.installed) {
    console.log("OpenSpec is not installed. Creating a local Change instead.");
  } else if (!openspec.supportsPropose) {
    console.warn(`OpenSpec ${openspec.version} is installed but does not expose a "propose" command. Falling back to local Change generation.`);
  } else {
    console.log(`Delegating to OpenSpec ${openspec.version}...`);
    const r = run("openspec", ["propose", idea], { stdio: "inherit" });
    if (r.status === 0) return;
    console.error(`OpenSpec delegation failed (exit code ${r.status}). Falling back to local Change generation.`);
  }
  const dir = createChange(idea);
  if (dir) {
    writeFile(path.join(dir, "proposal.md"), `# Proposal\n\n## Idea\n\n${idea}\n\n## Why\n\n-\n\n## What Changes\n\n-\n`);
    console.log("Created local proposal.md.");
    printNext("review proposal.md", "aief prompt");
  }
}
function proposeForChange(changeId, idea) {
  // Same shared resolver as prompt/verify/close — never "last match wins".
  const changeDir = resolveExplicitChange(changeId);
  if (!changeDir) { printNext("aief status"); return; }
  const name = path.relative(process.cwd(), changeDir);
  const proposalPath = path.join(changeDir, "proposal.md");
  const title = idea || path.basename(changeDir).replace(/^\d+-/, "");
  console.log(`Change: ${name}\n`);
  const created = writeFile(proposalPath, `# Proposal\n\n## Idea\n\n${title}\n\n## Why\n\n-\n\n## What Changes\n\n-\n\n## Source\n\nThis Change's Requirement Source, Normalized Requirement and Human Review status remain in change.md and spec.md — this proposal does not replace or duplicate them.\n`);
  if (created) console.log(`Created ${name}/proposal.md.`);
  else console.log(`${name}/proposal.md already exists — not overwritten. Edit it directly, or review change.md/spec.md for the underlying requirement.`);
  printNext(`review ${name}/proposal.md and ${name}/spec.md`, "aief prompt");
}
