// Command handler: guardrails (Change 0162). `aief guardrails install
// [--local] [--approval-hook] [--assistant claude|gemini]` (Gemini: Change 0166, ADR-042).
import { installGuardrails } from "../core/services/guardrails-installer.js";
import { denyRules, GUARDRAIL_ASSISTANTS } from "../core/domain/guardrails.js";
import { hasAssistant } from "../core/domain/assistant-resolver.js";
import { section, parseArgs, printNext } from "./shared.js";

const USAGE = "Usage: aief guardrails install [--local] [--approval-hook] [--assistant claude|gemini]";

// Returns the assistant to install for, or an error message.
function resolveAssistant(parsed) {
  const assistant = typeof parsed.assistant === "string" ? parsed.assistant.toLowerCase() : "claude";
  if (!GUARDRAIL_ASSISTANTS.includes(assistant)) {
    return { error: hasAssistant(assistant)
      ? `--assistant ${assistant}: no guardrails for ${assistant} yet — AIEF adds them only after a real installation confirms its hook format (ADR-042). Supported: ${GUARDRAIL_ASSISTANTS.join(", ")}.`
      : `--assistant: unknown assistant "${parsed.assistant}". Supported: ${GUARDRAIL_ASSISTANTS.join(", ")}.` };
  }
  if (assistant === "gemini" && parsed.local === true) return { error: "--local applies to Claude Code only; Gemini CLI reads project hooks from .gemini/settings.json." };
  return { assistant };
}

export function guardrails(args) {
  const [subcommand, ...rest] = args;
  if (subcommand !== "install") {
    console.error(USAGE);
    process.exitCode = 1;
    return;
  }
  const parsed = parseArgs("guardrails", rest);
  if (!parsed) return;
  const resolved = resolveAssistant(parsed);
  if (resolved.error) { console.error(resolved.error); process.exitCode = 1; return; }
  const gemini = resolved.assistant === "gemini";
  section("AIEF Guardrails");
  console.log(gemini
    ? "Purpose: add a Gemini CLI hook that stops an assistant checking (human)/(review) items. Only adds; never removes a hook or setting of yours.\n"
    : "Purpose: add Claude Code deny rules for credentials (and, with --approval-hook, a hook that stops an assistant checking (human)/(review) items). Only adds; never removes a rule of yours.\n");
  const result = installGuardrails(process.cwd(), { local: parsed.local === true, approvalHook: parsed["approval-hook"] === true, assistant: resolved.assistant });
  if (result.error) { console.error(result.error); process.exitCode = 1; return; }
  if (gemini) {
    console.log("○ Gemini CLI has no project-level deny list for credentials; only the approval guard is installed (ADR-042)");
  } else {
    const total = denyRules().length;
    console.log(result.rulesAdded.length
      ? `✓ Added ${result.rulesAdded.length} of ${total} deny rules to ${result.settingsFile}`
      : `✓ ${result.settingsFile} already has all ${total} deny rules`);
  }
  if (result.hookFile) {
    const messages = { created: "✓ Installed", updated: "✓ Updated", "up-to-date": "✓ Up to date:", modified: "! Edited, left as is:" };
    console.log(`${messages[result.hookFile.status]} ${result.hookFile.path}`);
    console.log(result.hookRegistered
      ? `✓ Registered the approval guard as a ${gemini ? "BeforeTool" : "PreToolUse"} hook in ${result.settingsFile}`
      : `✓ The approval guard is already registered`);
    console.log(gemini
      ? "\nThe hook is a mitigation, not a guarantee: a shell command can still change tasks.md. Restart Gemini CLI to load it; it runs project hooks only in a trusted folder and warns once about a new hook."
      : "\nThe hook is a mitigation, not a guarantee: a shell command can still change tasks.md. Restart Claude Code to load it.");
  }
  printNext(gemini ? "git diff .gemini/" : "git diff .claude/", "aief doctor");
}
