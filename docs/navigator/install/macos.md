# macOS Setup

Use this guide for macOS.

## 1. Install Homebrew

If Homebrew is not installed, install it from the official Homebrew site.

## 2. Install Git and Node.js

```bash
brew install git node
```

Verify:

```bash
git --version
node --version
npm --version
```

## 3. Clone AIEF

```bash
git clone https://github.com/avazquezmaza/aief-next.git
cd aief-next
```

## 4. Test the AIEF CLI

```bash
node cli/bin/aief.js help
```

Optional:

```bash
chmod +x cli/bin/aief.js
```

## 5. Create a project

```bash
node cli/bin/aief.js init demo-project
cd demo-project
node ../cli/bin/aief.js new-change add-login
node ../cli/bin/aief.js verify
```

## 6. Optional: OpenSpec

```bash
npm install -g @fission-ai/openspec
```

## 7. Optional: Specboot

```bash
npx @lidr/lidr-specboot
```
