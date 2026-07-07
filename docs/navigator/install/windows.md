# Windows Setup

Use this guide for Windows with PowerShell. Canonical install reference: [Bootstrap Experience](../../bootstrap.md).

## 1. Install Git

Install Git for Windows.

After installation:

```powershell
git --version
```

## 2. Install Node.js

Install Node.js LTS (Node >= 18 required).

Verify:

```powershell
node --version
npm --version
```

## 3. Clone and install AIEF

```powershell
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
npm install     # no dependencies to download; validates the package
npm link        # installs a global `aief` command
```

## 4. Verify the CLI and your environment

```powershell
aief --help
aief doctor     # required / recommended / optional tools
```

Prefer not to link globally? Run it directly instead:

```powershell
node .\cli\bin\aief.js <command>
```

## 5. Initialize a project

```powershell
aief init my-project        # new project skeleton
cd my-project
aief new-change add-login
aief verify
```

Or, inside an existing project: `aief init` (no argument — visible structure only, application code untouched).

## 6. Optional: OpenSpec

Install OpenSpec only if you want structured specification support.

```powershell
npm install -g @fission-ai/openspec@latest
```

## 7. Optional: SpecBoot

Run SpecBoot only if you want to bootstrap or compare agent instruction files.

```powershell
npx @lidr/lidr-specboot
```

## Notes

If PowerShell blocks scripts (`aief.ps1` execution policy), run commands using `node` directly as shown above.
