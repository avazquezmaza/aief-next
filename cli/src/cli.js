import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

function exists(target) {
  return fs.existsSync(path.resolve(target));
}

function writeFile(filePath, content, overwrite = false) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (overwrite || !fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content, "utf8");
  }
}

function slugify(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function run(command, args = [], options = {}) {
  return spawnSync(command, args, {
    stdio: options.stdio || "pipe",
    shell: process.platform === "win32",
    encoding: "utf8"
  });
}

function commandExists(command) {
  const checker = process.platform === "win32" ? "where" : "which";
  const result = run(checker, [command]);
  return result.status === 0;
}

function nextChangeId(changesDir) {
  fs.mkdirSync(changesDir, { recursive: true });
  const numbers = fs.readdirSync(changesDir)
    .map((name) => Number((name.match(/^(\d+)/) || [])[1]))
    .filter((n) => Number.isFinite(n));
  const next = numbers.length ? Math.max(...numbers) + 1 : 1;
  return String(next).padStart(4, "0");
}

function projectFiles(projectName) {
  return {
    "README.md": `# ${projectName}

This project uses AIEF.

## Workflow

Idea -> Spec -> Tasks -> Build -> Verify -> Evidence
`,
    "AGENTS.md": `# Project Agent Instructions

AI assists. Humans decide.

## Rules

- Read the active Change before editing.
- Read \`spec.md\` before implementation.
- Read \`tasks.md\` before changing files.
- Keep changes small.
- Do not modify unrelated files.
- Update \`evidence.md\` before completion.
`,
    "CLAUDE.md": "# Claude Instructions\n\nFollow `AGENTS.md`.\n",
    "GEMINI.md": "# Gemini Instructions\n\nFollow `AGENTS.md`.\n",
    "CODEX.md": "# Codex Instructions\n\nFollow `AGENTS.md`.\n",
    "CURSOR.md": "# Cursor Instructions\n\nFollow `AGENTS.md`.\n",
    "changes/README.md": "# Changes\n\nCreate one folder per meaningful unit of work.\n",
    "knowledge/README.md": "# Knowledge\n\nCapture decisions, lessons learned, and constraints here.\n",
    "src/README.md": "# Source\n\nPlace implementation code here.\n",
    "tests/README.md": "# Tests\n\nPlace automated tests here.\n"
  };
}

function changeFiles(id, slug, title = "") {
  const displayTitle = title || slug;
  return {
    "change.md": `# Change

## ID

\`${id}-${slug}\`

## Objective

${displayTitle}

## Scope

### In scope

-

### Out of scope

-

## Success Criteria

-
`,
    "spec.md": `# Specification

## Goal

What should be true after this Change?

## Requirements

-

## Acceptance Criteria

- [ ]

## Constraints

-

## Assumptions

-
`,
    "tasks.md": `# Tasks

## Implementation

- [ ]

## Documentation

- [ ]

## Verification

- [ ]

## Evidence

- [ ] Update \`evidence.md\`
`,
    "evidence.md": `# Evidence

## Summary

What changed?

## Verification

How was it verified?

## Results

-

## Known Issues

-

## Lessons Learned

-
`
  };
}

function help() {
  console.log(`AIEF CLI

Usage:
  aief help
  aief doctor
  aief status
  aief init <project-name>
  aief new-change <name>
  aief propose <idea>
  aief use-profile <profile>
  aief verify
  aief release <version>

Examples:
  aief doctor
  aief status
  aief init inventory-api
  aief new-change add-login
  aief propose "Add login"
  aief use-profile developer
  aief verify
  aief release 0.1.0
`);
}

function initProject(name) {
  const projectName = name || "aief-project";
  const projectPath = path.resolve(projectName);

  if (fs.existsSync(projectPath)) {
    console.error(`Project already exists: ${projectPath}`);
    process.exitCode = 1;
    return;
  }

  for (const [file, content] of Object.entries(projectFiles(projectName))) {
    writeFile(path.join(projectPath, file), content);
  }

  console.log(`Created AIEF project: ${projectPath}`);
  console.log("Next:");
  console.log(`  cd ${projectName}`);
  console.log("  aief new-change my-first-change");
}

function createChange(name, options = {}) {
  const slug = slugify(name);
  if (!slug) {
    console.error("Change name is required.");
    process.exitCode = 1;
    return null;
  }

  const changesDir = path.resolve("changes");
  const id = nextChangeId(changesDir);
  const changeDir = path.join(changesDir, `${id}-${slug}`);

  for (const [file, content] of Object.entries(changeFiles(id, slug, options.title || name))) {
    writeFile(path.join(changeDir, file), content);
  }

  console.log(`Created Change: ${path.relative(process.cwd(), changeDir)}`);
  return changeDir;
}

function newChange(name) {
  createChange(name);
}

function propose(ideaParts) {
  const idea = Array.isArray(ideaParts) ? ideaParts.join(" ") : String(ideaParts || "");
  const slug = slugify(idea);

  if (!slug) {
    console.error("Proposal idea is required.");
    console.error('Example: aief propose "Add login"');
    process.exitCode = 1;
    return;
  }

  console.log(`Preparing proposal for: ${idea}`);

  const hasOpenSpec = commandExists("openspec");
  const hasOpsx = commandExists("opsx");

  if (hasOpenSpec) {
    console.log("OpenSpec detected. Attempting to delegate proposal creation.");
    const result = run("openspec", ["propose", idea], { stdio: "inherit" });
    if (result.status === 0) {
      console.log("OpenSpec proposal completed.");
      return;
    }
    console.warn("OpenSpec command did not complete successfully. Falling back to AIEF Change skeleton.");
  } else if (hasOpsx) {
    console.log("opsx detected. Attempting to delegate proposal creation.");
    const result = run("opsx", ["propose", idea], { stdio: "inherit" });
    if (result.status === 0) {
      console.log("OpenSpec proposal completed.");
      return;
    }
    console.warn("opsx command did not complete successfully. Falling back to AIEF Change skeleton.");
  } else {
    console.log("OpenSpec was not detected. Falling back to AIEF Change skeleton.");
    console.log("Install OpenSpec if you want structured proposal generation.");
  }

  const changeDir = createChange(slug, { title: idea });

  if (changeDir) {
    writeFile(
      path.join(changeDir, "proposal.md"),
      `# Proposal

## Idea

${idea}

## Why

-

## What Changes

-

## Impact

-
`
    );
    console.log("Created local proposal.md inside the Change.");
  }
}

function useProfile(profile) {
  const selected = slugify(profile || "developer");
  console.log(`Use AGENTS.md.

Act as the ${selected} profile.

Work only on the active Change.

Before editing:
1. Read change.md
2. Read spec.md
3. Read tasks.md

After editing:
1. Verify acceptance criteria
2. Update evidence.md
`);
}

function getChangeDirs() {
  const changesPath = path.resolve("changes");
  if (!fs.existsSync(changesPath)) return [];
  return fs.readdirSync(changesPath)
    .filter((name) => fs.statSync(path.join(changesPath, name)).isDirectory())
    .map((name) => path.join(changesPath, name));
}

function checkChange(changeDir) {
  const required = ["change.md", "spec.md", "tasks.md", "evidence.md"];
  const missing = [];
  const empty = [];

  for (const file of required) {
    const full = path.join(changeDir, file);
    if (!fs.existsSync(full)) {
      missing.push(file);
    } else if (!fs.readFileSync(full, "utf8").trim()) {
      empty.push(file);
    }
  }

  return { missing, empty };
}

function verify() {
  const required = ["README.md", "AGENTS.md", "changes"];
  let ok = true;

  console.log("AIEF verification");

  for (const item of required) {
    if (exists(item)) {
      console.log(`✓ ${item}`);
    } else {
      console.error(`✗ Missing: ${item}`);
      ok = false;
    }
  }

  if (exists("knowledge")) {
    console.log("✓ knowledge/");
  } else {
    console.warn("! Recommended but missing: knowledge/");
  }

  const changes = getChangeDirs();
  if (!changes.length) {
    console.warn("! No Changes found under changes/");
  }

  for (const changeDir of changes) {
    const name = path.relative(process.cwd(), changeDir);
    const result = checkChange(changeDir);

    if (!result.missing.length && !result.empty.length) {
      console.log(`✓ ${name}`);
    } else {
      ok = false;
      for (const file of result.missing) console.error(`✗ ${name}/${file} missing`);
      for (const file of result.empty) console.error(`✗ ${name}/${file} empty`);
    }
  }

  if (ok) {
    console.log("AIEF verification passed.");
  } else {
    console.error("AIEF verification failed.");
    process.exitCode = 1;
  }
}

function status() {
  console.log("AIEF status");

  const checks = [
    ["README", exists("README.md")],
    ["AGENTS", exists("AGENTS.md")],
    ["Navigator", exists("NAVIGATOR.md") || exists("docs/navigator/README.md")],
    ["Changes", exists("changes")],
    ["Knowledge", exists("knowledge")],
    ["Profiles", exists("profiles")],
    ["OpenSpec adapter", exists("adapters/openspec")],
    ["Specboot adapter", exists("adapters/specboot")]
  ];

  for (const [name, ok] of checks) {
    console.log(`${ok ? "✓" : "!"} ${name}`);
  }

  const changes = getChangeDirs();
  console.log(`Changes: ${changes.length}`);

  for (const changeDir of changes.slice(-5)) {
    console.log(`- ${path.relative(process.cwd(), changeDir)}`);
  }
}

function doctor() {
  console.log("AIEF doctor");

  const checks = [
    ["git", commandExists("git")],
    ["node", commandExists("node")],
    ["npm", commandExists("npm")],
    ["openspec", commandExists("openspec") || commandExists("opsx")],
    ["npx", commandExists("npx")]
  ];

  for (const [name, ok] of checks) {
    console.log(`${ok ? "✓" : "!"} ${name}`);
  }

  console.log("");
  console.log("Project:");
  status();

  console.log("");
  console.log("Notes:");
  console.log("- OpenSpec is optional.");
  console.log("- Specboot can be run with npx when needed.");
  console.log("- AIEF works without external tools.");
}

function release(version) {
  const cleanVersion = String(version || "").replace(/^v/, "");
  if (!cleanVersion) {
    console.error("Version is required. Example: aief release 0.1.0");
    process.exitCode = 1;
    return;
  }

  const file = path.join("releases", `v${cleanVersion}.md`);
  writeFile(file, `# Release v${cleanVersion}

## Summary

Describe the release.

## Included Changes

-

## Verification

-

## Known Issues

-

## Approval

- [ ] Human owner approved release.
`);

  console.log(`Created release notes: ${file}`);
}

export function main(args) {
  const [command, ...rest] = args;

  switch (command) {
    case "help":
    case undefined:
      help();
      break;
    case "doctor":
      doctor();
      break;
    case "status":
      status();
      break;
    case "init":
      initProject(rest[0]);
      break;
    case "new-change":
      newChange(rest.join(" "));
      break;
    case "propose":
      propose(rest);
      break;
    case "use-profile":
      useProfile(rest[0]);
      break;
    case "verify":
      verify();
      break;
    case "release":
      release(rest[0]);
      break;
    default:
      console.error(`Unknown command: ${command}`);
      help();
      process.exitCode = 1;
  }
}
