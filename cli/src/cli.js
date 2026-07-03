import fs from "node:fs";
import path from "node:path";

function writeFile(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  if (!fs.existsSync(filePath)) {
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

## Structure

\`\`\`text
.
├── README.md
├── AGENTS.md
├── changes/
├── knowledge/
├── src/
└── tests/
\`\`\`
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

function changeFiles(id, slug) {
  return {
    "change.md": `# Change

## ID
\`${id}-${slug}\`

## Objective

Describe what this Change should achieve.

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
  aief init <project-name>
  aief new-change <name>
  aief use-profile <profile>
  aief verify
  aief release <version>

Examples:
  aief init inventory-api
  aief new-change add-login
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

function newChange(name) {
  const slug = slugify(name);
  if (!slug) {
    console.error("Change name is required.");
    process.exitCode = 1;
    return;
  }

  const changesDir = path.resolve("changes");
  const id = nextChangeId(changesDir);
  const changeDir = path.join(changesDir, `${id}-${slug}`);

  for (const [file, content] of Object.entries(changeFiles(id, slug))) {
    writeFile(path.join(changeDir, file), content);
  }

  console.log(`Created Change: ${path.relative(process.cwd(), changeDir)}`);
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

function verify() {
  const required = [
    "README.md",
    "AGENTS.md",
    "changes"
  ];

  let ok = true;

  for (const item of required) {
    if (!fs.existsSync(path.resolve(item))) {
      console.error(`Missing: ${item}`);
      ok = false;
    }
  }

  if (!fs.existsSync(path.resolve("knowledge"))) {
    console.warn("Recommended but missing: knowledge/");
  }

  if (ok) {
    console.log("AIEF verification passed.");
  } else {
    console.error("AIEF verification failed.");
    process.exitCode = 1;
  }
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
    case "init":
      initProject(rest[0]);
      break;
    case "new-change":
      newChange(rest.join(" "));
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
