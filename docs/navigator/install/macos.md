# macOS Setup

Use this guide for macOS. Canonical install reference: [Bootstrap Experience](../../bootstrap.md).

## 1. Install Homebrew

If Homebrew is not installed, install it from the official Homebrew site.

## 2. Install Git and Node.js

Node >= 18 required:

```bash
brew install git node
```

Verify:

```bash
git --version
node --version
npm --version
```

## 3. Clone and install AIEF

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
npm install     # no dependencies to download; validates the package
npm link        # installs a global `aief` command
```

## 4. Verify the CLI and your environment

```bash
aief --help
aief doctor     # required / recommended / optional tools
```

Prefer not to link globally? Run it directly instead:

```bash
node cli/bin/aief.js <command>
```

## 5. Initialize a project

```bash
aief init my-project        # new project skeleton
cd my-project
aief new-change add-login
aief verify
```

Or, inside an existing project: `aief init` (no argument — visible structure only, application code untouched).

## 6. Optional: OpenSpec

```bash
npm install -g @fission-ai/openspec@latest
```

## 7. Optional: SpecBoot

```bash
npx @lidr/lidr-specboot
```
