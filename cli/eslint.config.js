// Change 0119: CI ran only tests, no static analysis. This is intentionally
// minimal — eslint:recommended over the CLI's own ESM source, Node globals,
// nothing project-specific layered on top. Scope: cli/src and cli/bin only
// (examples/todo-app is a separate project with its own toolchain — see
// change.md's Out of scope).
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
    ignores: ["node_modules/", "tests/tmp/"]
  }
];
