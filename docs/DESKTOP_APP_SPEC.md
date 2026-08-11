# Desktop App Development Specification

> **Status**: Future Development
> **Priority**: After Live and Analysis sections are complete
> **Recommended Approach**: Tauri (for both macOS and Windows)

## Why Tauri?

Tauri is the recommended approach for converting this F1 Dashboard into a native desktop application:

| Feature | Tauri | Electron |
|---------|-------|----------|
| Bundle Size | ~10-20 MB | ~150+ MB |
| Memory Usage | Lower (native webview) | Higher (bundled Chromium) |
| Startup Time | Faster | Slower |
| macOS Support | WebKit (native) | Chromium |
| Windows Support | WebView2 (native) | Chromium |
| Linux Support | WebKitGTK | Chromium |
| Backend Language | Rust | Node.js |
| Security | Stronger isolation | Less isolated |

## Prerequisites

### Development Environment

**macOS:**
```bash
# Install Xcode Command Line Tools
xcode-select --install

# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

**Windows:**
```powershell
# Install Visual Studio Build Tools (C++ workload)
# Install WebView2 (usually pre-installed on Windows 10/11)
# Install Rust from https://rustup.rs
```

### Project Requirements

- Node.js 18+
- Rust 1.70+
- pnpm/npm/yarn

## Implementation Plan

### Phase 1: Prepare Next.js for Static Export

The current Next.js app uses server-side features that need adaptation for Tauri.

#### 1.1 Update `next.config.js`

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  // Disable image optimization (requires server)
  images: {
    unoptimized: true,
  },
  // Ensure trailing slashes for static file serving
  trailingSlash: true,
}

module.exports = nextConfig
```

#### 1.2 Audit Server-Side Features

Review and adapt these patterns:
- [ ] API routes (`/api/*`) - Move to Tauri Rust commands or external API
- [ ] Server Components - Convert to Client Components where needed
- [ ] `getServerSideProps` - Replace with client-side data fetching
- [ ] Middleware - Handle in Tauri or remove

#### 1.3 Data Fetching Strategy

Since the F1 Dashboard fetches live data, consider:

**Option A: Direct API Calls (Recommended)**
- Fetch F1 data directly from client using existing APIs
- No CORS issues in Tauri (native app)

**Option B: Tauri Rust Commands**
- Create Rust functions for data fetching
- Better performance and error handling
- More complex to implement

### Phase 2: Initialize Tauri

#### 2.1 Install Tauri CLI

```bash
# In the project root
cd apps/web
pnpm add -D @tauri-apps/cli@latest
```

#### 2.2 Initialize Tauri Project

```bash
pnpm tauri init
```

Configuration prompts:
- **App name**: F1 Dashboard
- **Window title**: F1 Dashboard
- **Web assets location**: `../out` (Next.js static export directory)
- **Dev server URL**: `http://localhost:3000`
- **Dev command**: `pnpm dev`
- **Build command**: `pnpm build`

#### 2.3 Project Structure After Init

```
apps/web/
├── src/                    # Next.js source
├── src-tauri/              # Tauri source (new)
│   ├── Cargo.toml          # Rust dependencies
│   ├── tauri.conf.json     # Tauri configuration
│   ├── src/
│   │   └── main.rs         # Rust entry point
│   └── icons/              # App icons
├── package.json
└── next.config.js
```

### Phase 3: Configure Tauri

#### 3.1 `tauri.conf.json` Configuration

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/schema.json",
  "build": {
    "beforeBuildCommand": "pnpm build",
    "beforeDevCommand": "pnpm dev",
    "devPath": "http://localhost:3000",
    "distDir": "../out"
  },
  "package": {
    "productName": "F1 Dashboard",
    "version": "0.1.0"
  },
  "tauri": {
    "allowlist": {
      "all": false,
      "http": {
        "all": true,
        "request": true,
        "scope": ["https://*", "http://*"]
      },
      "window": {
        "all": true
      },
      "shell": {
        "open": true
      }
    },
    "bundle": {
      "active": true,
      "category": "Sports",
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "com.f1dashboard.app",
      "targets": "all",
      "macOS": {
        "minimumSystemVersion": "10.15"
      },
      "windows": {
        "webviewInstallMode": {
          "type": "embedBootstrapper"
        }
      }
    },
    "windows": [
      {
        "title": "F1 Dashboard",
        "width": 1400,
        "height": 900,
        "minWidth": 1024,
        "minHeight": 768,
        "resizable": true,
        "fullscreen": false
      }
    ]
  }
}
```

#### 3.2 App Icons

Generate icons in multiple sizes:
- `32x32.png`
- `128x128.png`
- `128x128@2x.png`
- `icon.icns` (macOS)
- `icon.ico` (Windows)

Use a tool like [tauri-icon](https://github.com/nicklasaven/tauri-icon) or create manually.

### Phase 4: Add Native Features (Optional)

#### 4.1 System Tray

```rust
// src-tauri/src/main.rs
use tauri::{CustomMenuItem, SystemTray, SystemTrayMenu};

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("show", "Show Dashboard"))
        .add_item(CustomMenuItem::new("quit", "Quit"));

    let system_tray = SystemTray::new().with_menu(tray_menu);

    tauri::Builder::default()
        .system_tray(system_tray)
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

#### 4.2 Global Shortcuts

```rust
use tauri::GlobalShortcutManager;

// Register Cmd+Shift+F (Mac) or Ctrl+Shift+F (Windows) to show app
app.global_shortcut_manager()
    .register("CmdOrCtrl+Shift+F", || {
        // Show window
    });
```

#### 4.3 Notifications

```rust
use tauri::api::notification::Notification;

Notification::new(&app.config().tauri.bundle.identifier)
    .title("Race Starting Soon!")
    .body("Australian GP starts in 15 minutes")
    .show();
```

### Phase 5: Build and Package

#### 5.1 Development

```bash
# Run in development mode
pnpm tauri dev
```

#### 5.2 Production Build

```bash
# Build for current platform
pnpm tauri build

# Output locations:
# macOS: src-tauri/target/release/bundle/dmg/
# Windows: src-tauri/target/release/bundle/msi/
```

#### 5.3 Cross-Platform Builds

For CI/CD, use GitHub Actions:

```yaml
# .github/workflows/release.yml
name: Release Desktop App

on:
  push:
    tags:
      - 'v*'

jobs:
  build:
    strategy:
      matrix:
        platform: [macos-latest, windows-latest]
    runs-on: ${{ matrix.platform }}

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install Rust
        uses: dtolnay/rust-action@stable

      - name: Install dependencies
        run: pnpm install
        working-directory: apps/web

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        with:
          projectPath: apps/web
```

## Package.json Scripts

Add these scripts to `apps/web/package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "build:static": "next build && next export",
    "tauri": "tauri",
    "tauri:dev": "tauri dev",
    "tauri:build": "tauri build"
  }
}
```

## Checklist Before Starting

- [ ] Complete Live section implementation
- [ ] Complete Analysis section implementation
- [ ] Audit all API routes and server-side code
- [ ] Test static export works: `pnpm build:static`
- [ ] Create app icons in all required sizes
- [ ] Set up code signing certificates (for distribution)
  - macOS: Apple Developer account ($99/year)
  - Windows: Code signing certificate

## Estimated Effort

| Task | Effort |
|------|--------|
| Static export conversion | 2-4 hours |
| Tauri setup and config | 1-2 hours |
| Icon creation | 1 hour |
| Testing and debugging | 2-4 hours |
| Native features (optional) | 4-8 hours |
| CI/CD setup | 2-4 hours |
| **Total** | **12-23 hours** |

## Resources

- [Tauri Documentation](https://tauri.app/v1/guides/)
- [Next.js Static Export](https://nextjs.org/docs/pages/building-your-application/deploying/static-exports)
- [Tauri + Next.js Example](https://github.com/tauri-apps/tauri/tree/dev/examples/next)
- [Tauri GitHub Actions](https://github.com/tauri-apps/tauri-action)

## Alternative: Electron (If Needed)

If Tauri doesn't meet requirements (e.g., need Node.js backend), Electron remains viable:

```bash
pnpm add -D electron electron-builder
```

Electron is recommended only if:
- Need Node.js native modules
- Require specific Chromium features
- Team has existing Electron experience

---

*Last updated: January 2026*
