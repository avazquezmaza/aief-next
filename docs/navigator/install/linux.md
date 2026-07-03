# Linux Setup

Use this guide for Linux.

## 1. Install Git and Node.js

Debian/Ubuntu example:

```bash
sudo apt update
sudo apt install -y git nodejs npm
```

Verify:

```bash
git --version
node --version
npm --version
```

## 2. Clone AIEF

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
```

## 3. Test the AIEF CLI

```bash
node cli/bin/aief.js help
```

Optional:

```bash
chmod +x cli/bin/aief.js
```

## 4. Create a project

```bash
node cli/bin/aief.js init demo-project
cd demo-project
node ../cli/bin/aief.js new-change add-login
node ../cli/bin/aief.js verify
```

## 5. Optional Alias

```bash
alias aief="node /home/$USER/PRS/claude-code/AIEF/aief-next/cli/bin/aief.js"
```

Then:

```bash
aief new-change add-login
```

## 6. Optional: OpenSpec

```bash
npm install -g @fission-ai/openspec
```

## 7. Optional: Specboot

```bash
npx @lidr/lidr-specboot
```
