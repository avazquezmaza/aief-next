// Command handler: new-change (modularization, third slice). Zero
// dependency on any other command handler — only the shared kernel.
import path from "node:path";
import { parseArgs, createChange, printNext } from "./shared.js";

export function newChange(args) { const parsed = parseArgs("new-change", args); if (!parsed) return; const dir = createChange(parsed._.join(" "), { type: parsed.type || "general" }); if (dir) printNext("edit change.md and spec.md", `aief prompt --change ${path.basename(dir)}`); }
