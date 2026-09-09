// Change 0119: CI ran only tests, no static analysis. This is intentionally
// minimal — eslint:recommended over the CLI's own ESM source, Node globals,
// nothing project-specific layered on top. Scope: cli/src and cli/bin only
// (examples/todo-app is a separate project with its own toolchain — see
// change.md's Out of scope).
//
// Change 0128: architecture fitness functions — docs/architecture.md's
// layer model (CLI Commands -> Application Services -> Domain Models /
// Registries & Providers -> Repository) is enforced here, not only
// documented, so a future edit that quietly reverses a dependency fails
// `npm run lint` instead of drifting silently. Two invariants, matched
// against import specifiers exactly as written in source (no resolver
// plugin needed for relative-path imports within cli/src):
//   - Domain Models never import Application Services or CLI Commands.
//   - Application Services never import CLI Commands.
// A third, unrelated invariant this project already states in prose
// (Hooks are observation-only, never execution — docs/architecture.md/
// AGENTS.md) is enforced the same way: a Hook may read the filesystem to
// observe it, never write to it.
import js from "@eslint/js";

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        console: "readonly",
        process: "readonly",
        Buffer: "readonly",
        __dirname: "readonly",
        __filename: "readonly",
        URL: "readonly",
        setTimeout: "readonly",
        clearTimeout: "readonly"
      }
    },
    rules: {
      // Node's own convention for an intentionally-unused catch binding —
      // this codebase uses bare `catch {}` (no binding) throughout for
      // exactly this reason, but a few call sites do need the error
      // (e.g. err.message); underscore-prefixed args are the escape hatch.
      "no-unused-vars": ["error", { argsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }]
    }
  },
  {
    files: ["src/core/domain/**/*.js"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["../services/*", "../services/**", "../../commands/*", "../../commands/**"],
            message: "Domain Models must not import Application Services or CLI Commands (docs/architecture.md's layer model) — services and commands depend on domain, never the reverse."
          }
        ]
      }]
    }
  },
  {
    files: ["src/core/services/**/*.js"],
    rules: {
      "no-restricted-imports": ["error", {
        patterns: [
          {
            group: ["../../commands/*", "../../commands/**"],
            message: "Application Services must not import CLI Commands (docs/architecture.md's layer model) — commands depend on services, never the reverse."
          }
        ]
      }]
    }
  },
  {
    // Hooks observe; they do not act (docs/architecture.md, AGENTS.md).
    // Reading the filesystem to report a fact is fine; writing to it is
    // exactly the boundary this project has always drawn in prose —
    // enforced here so a future Hook can't quietly cross it.
    files: ["src/hooks/**/*.js"],
    rules: {
      "no-restricted-properties": ["error",
        ...["writeFileSync", "appendFileSync", "unlinkSync", "rmSync", "rmdirSync", "mkdirSync", "renameSync", "chmodSync", "chownSync", "copyFileSync", "truncateSync", "symlinkSync", "linkSync"].map((property) => ({
          object: "fs",
          property,
          message: "Hooks are observation-only (docs/architecture.md) — a Hook must not mutate the filesystem. Move the write into the service/command that consumes the Hook's result."
        }))
      ]
    }
  },
  {
    ignores: ["node_modules/", "tests/tmp/"]
  }
];
