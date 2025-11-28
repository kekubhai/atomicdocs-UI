# Release Process

## Overview

AtomicDocs uses GitHub Actions to automatically build cross-platform binaries and publish to NPM. This ensures users can install the package without needing Go installed on their machine.

## Architecture

```
User installs npm package
    ↓
Package includes pre-built Go binaries for all platforms
    ↓
JavaScript detects user's OS/architecture
    ↓
Spawns correct binary (Windows/macOS/Linux, x64/arm64)
    ↓
Go server runs on localhost:6174
    ↓
User's Express/Hono app sends routes to Go server
    ↓
Go analyzes code and generates OpenAPI spec
    ↓
Swagger UI served at /docs
```

## Supported Platforms

- **Windows**: x64, arm64
- **macOS**: x64 (Intel), arm64 (M1/M2/M3)
- **Linux**: x64, arm64

## CI/CD Workflows

### 1. Test Workflow (`test.yml`)

**Triggers:** Push to main/develop, Pull Requests

**What it does:**
- Builds Go server
- Runs Go tests
- Tests Express.js integration
- Tests Hono integration
- Validates /docs endpoint works

**Purpose:** Ensure code quality before merging

---

### 2. Release Workflow (`release.yml`)

**Triggers:** Git tag push (e.g., `v1.0.0`)

**What it does:**
1. Checks out code
2. Sets up Go 1.22
3. Builds 6 binaries in parallel:
   - `atomicdocs-win-x64.exe`
   - `atomicdocs-win-arm64.exe`
   - `atomicdocs-darwin-x64`
   - `atomicdocs-darwin-arm64`
   - `atomicdocs-linux-x64`
   - `atomicdocs-linux-arm64`
4. Strips debug symbols (`-ldflags="-s -w"`) for smaller size
5. Uploads binaries as artifacts
6. Packages everything into `npm/atomicdocs/bin/`

**Purpose:** Build production-ready binaries for all platforms

---

### 3. NPM Publish Workflow (`npm-publish.yml`)

**Triggers:** After `release.yml` completes successfully

**What it does:**
1. Downloads all 6 binaries from previous workflow
2. Verifies all binaries exist
3. Updates package version from git tag
4. Publishes `atomicdocs` package to NPM
5. Publishes `atomicdocs-hono` package to NPM

**Purpose:** Distribute packages to NPM registry

---

## How to Release

### Step 1: Update Version

```bash
# Update version in package.json files
cd npm/atomicdocs
npm version 1.0.0 --no-git-tag-version

cd ../atomicdocs-hono
npm version 1.0.0 --no-git-tag-version
```

### Step 2: Commit Changes

```bash
git add .
git commit -m "Release v1.0.0"
git push origin main
```

### Step 3: Create Git Tag

```bash
git tag v1.0.0
git push origin v1.0.0
```

### Step 4: Wait for CI/CD

1. **release.yml** runs (~5 minutes)
   - Builds all binaries
   - Creates artifacts

2. **npm-publish.yml** runs (~2 minutes)
   - Downloads binaries
   - Publishes to NPM

### Step 5: Verify

```bash
npm view atomicdocs version
npm view atomicdocs-hono version
```

---

## GitHub Secrets Required

Add these secrets in GitHub repo settings:

- `NPM_TOKEN`: NPM access token for publishing
  - Get from: https://www.npmjs.com/settings/YOUR_USERNAME/tokens
  - Type: Automation token

---

## Package Structure

### atomicdocs (Main Package)

```
atomicdocs/
├── index.js              # Express middleware
├── package.json
└── bin/
    ├── atomicdocs-win-x64.exe
    ├── atomicdocs-win-arm64.exe
    ├── atomicdocs-darwin-x64
    ├── atomicdocs-darwin-arm64
    ├── atomicdocs-linux-x64
    └── atomicdocs-linux-arm64
```

**Size:** ~50MB (all binaries included)

### atomicdocs-hono (Hono Package)

```
atomicdocs-hono/
├── index.mjs             # Hono middleware (ES module)
└── package.json
```

**Size:** ~5KB (depends on atomicdocs for binaries)

---

## User Installation

### Express.js

```bash
npm install atomicdocs
```

```javascript
const atomicdocs = require('atomicdocs');
app.use(atomicdocs());
```

### Hono

```bash
npm install atomicdocs atomicdocs-hono
```

```typescript
import { atomicDocs } from 'atomicdocs-hono';
app.use('*', atomicDocs(app, 3000));
```

**No Go installation required!** ✅

---

## Troubleshooting

### Binary not found error

**Cause:** Platform not supported or binary missing

**Fix:** Check `process.platform` and `process.arch` match supported platforms

### Permission denied error

**Cause:** Binary not executable (Linux/macOS)

**Fix:** CI automatically runs `chmod +x`, but if manual install:
```bash
chmod +x node_modules/atomicdocs/bin/atomicdocs-*
```

### Port 6174 already in use

**Cause:** Another AtomicDocs instance running

**Fix:** Kill existing process or change port in code

---

## Development

### Local Testing

```bash
# Build all binaries locally
GOOS=windows GOARCH=amd64 go build -o npm/atomicdocs/bin/atomicdocs-win-x64.exe cmd/server/main.go
GOOS=darwin GOARCH=arm64 go build -o npm/atomicdocs/bin/atomicdocs-darwin-arm64 cmd/server/main.go
GOOS=linux GOARCH=amd64 go build -o npm/atomicdocs/bin/atomicdocs-linux-x64 cmd/server/main.go

# Test locally
cd examples/express-demo
npm install
npm start
```

### Testing CI Locally

Use [act](https://github.com/nektos/act):

```bash
act -j build -W .github/workflows/release.yml
```

---

## Features

### What AtomicDocs Provides

#### Core
- **Zero-config setup** - Just `app.use(atomicdocs())` and you're done
- **Auto route detection** - Automatically discovers all GET/POST/PUT/DELETE/PATCH routes
- **Smart schema extraction** - Analyzes handler code to extract request body parameters
- **OpenAPI 3.0 spec** - Generates valid OpenAPI 3.0 JSON
- **Interactive Swagger UI** - Full-featured UI with "Try it out" functionality
- **Real-time API testing** - Test APIs directly from browser
- **Cross-platform** - Works on Windows, macOS, Linux (x64 & arm64)
- **No Go installation required** - Pre-built binaries included
- **Blazing fast** - Built with Go and fasthttp
- **Lightweight** - Minimal memory footprint

#### Supported Frameworks
- Express.js
- Hono

#### Schema Detection
- Detects `const { x, y } = req.body` (Express)
- Detects `const { x, y } = await c.req.json()` (Hono)
- Path parameters (`:id`, `:userId`)
- Smart type inference (age → integer, price → number)
- Smart example values (email → user@example.com)
- Schemas section at bottom (like FastAPI)

#### HTTP Methods
- GET, POST, PUT, DELETE, PATCH

#### Response Codes
- 200, 201, 400, 401, 404

---

## Version History

### v1.0.0 - Initial Release

**What's included:**
- Express.js support
- Hono support
- OpenAPI 3.0 generation
- Swagger UI with Try-it-out
- Auto schema extraction from handler code
- Cross-platform binaries (Windows/macOS/Linux, x64/arm64)
- Smart type inference
- Path parameter detection
- Schemas section display

---
