// Command handler: guardrails (Change 0162). `aief guardrails install
// [--local] [--approval-hook]`.
import { installGuardrails } from "../core/services/guardrails-installer.js";
import { denyRules } from "../core/domain/guardrails.js";
import { section, parseArgs, printNext } from "./shared.js";

export function guardrails(args) {
  const [subcommand, ...rest] = args;
  if (subcommand !== "install") {
    console.error("Usage: aief guardrails install [--local] [--approval-hook]");
    process.exitCode = 1;
    return;
  }
  const parsed = parseArgs("guardrails", rest);
  if (!parsed) return;
  section("AIEF Guardrails");
  console.log("Purpose: add Claude Code deny rules for credentials (and, with --approval-hook, a hook that stops an assistant checking (human)/(review) items). Only adds; never removes a rule of yours.\n");
  const result = installGuardrails(process.cwd(), { local: parsed.local === true, approvalHook: parsed["approval-hook"] === true });
  if (result.error) { console.error(result.error); process.exitCode = 1; return; }
  const total = denyRules().length;
  console.log(result.rulesAdded.length
    ? `✓ Added ${result.rulesAdded.length} of ${total} deny rules to ${result.settingsFile}`
    : `✓ ${result.settingsFile} already has all ${total} deny rules`);
  if (result.hookFile) {
    const messages = { created: "✓ Installed", updated: "✓ Updated", "up-to-date": "✓ Up to date:", modified: "! Edited, left as is:" };
    console.log(`${messages[result.hookFile.status]} ${result.hookFile.path}`);
    console.log(result.hookRegistered ? `✓ Registered the approval guard as a PreToolUse hook in ${result.settingsFile}` : `✓ The approval guard is already registered`);
    console.log("\nThe hook is a mitigation, not a guarantee: a shell command can still change tasks.md. Restart Claude Code to load it.");
  }
  printNext("git diff .claude/", "aief doctor");
}
