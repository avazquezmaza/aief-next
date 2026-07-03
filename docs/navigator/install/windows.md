# Windows Setup

Use this guide for Windows with PowerShell.

## 1. Install Git

Install Git for Windows.

After installation:

```powershell
git --version
```

## 2. Install Node.js

Install Node.js LTS.

Verify:

```powershell
node --version
npm --version
```

## 3. Clone AIEF

```powershell
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
```

## 4. Test the AIEF CLI

```powershell
node .\cli\bin\aief.js help
```

## 5. Create a project

```powershell
node .\cli\bin\aief.js init demo-project
cd demo-project
node ..\cli\bin\aief.js new-change add-login
node ..\cli\bin\aief.js verify
```

## 6. Optional: OpenSpec

Install OpenSpec only if you want structured specification support.

```powershell
npm install -g @fission-ai/openspec
```

## 7. Optional: Specboot

Run Specboot only if you want to bootstrap or compare agent instruction files.

```powershell
npx @lidr/lidr-specboot
```

## Notes

If PowerShell blocks scripts, run commands using `node` directly as shown above.
