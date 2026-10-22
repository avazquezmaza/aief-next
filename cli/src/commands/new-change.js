// Command handler: new-change (modularization, third slice). Zero
// dependency on any other command handler — only the shared kernel.
import path from "node:path";
import { CHANGE_TYPES, normalizeChangeType } from "../core/domain/change.js";
import { parseArgs, createChange, printNext } from "./shared.js";

// Change 0164: `--type` goes through the same closed list `## Type` uses
// (case, accents and aliases ignored), and is refused before any branch or
// file exists when it is unknown. Enrichment has its own command, since its
// Change needs a Requirement Source this scaffold does not have.
function resolveType(raw) {
  if (raw === undefined) return { type: "general" };
  const { type, recognized } = normalizeChangeType(raw);
  if (type === "enrichment") return { error: "--type enrichment: create an Enrichment Change with aief enrich --file <source> instead." };
  if (!type || !recognized) return { error: `--type: unknown type "${raw}". Valid types: ${CHANGE_TYPES.filter((t) => t !== "enrichment").join(", ")}.` };
  return { type };
}

export function newChange(args) {
  const parsed = parseArgs("new-change", args); if (!parsed) return;
  const resolved = resolveType(parsed.type);
  if (resolved.error) { console.error(resolved.error); process.exitCode = 1; return; }
  const dir = createChange(parsed._.join(" "), { type: resolved.type, noBranch: parsed["no-branch"], dependsOn: parsed["depends-on"] });
  if (dir) printNext("edit change.md and spec.md", `aief prompt --change ${path.basename(dir)}`);
}
