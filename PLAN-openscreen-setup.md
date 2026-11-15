# Plan: OpenScreen Repository Setup, Architecture Deep-Dive & Local Host

## Goal
Install and configure [getopenscreen/openscreen](https://github.com/getopenscreen/openscreen) locally inside `.\openscreen` on Windows, establish the native Rust & Electron toolchain, deeply analyze the architecture (Electron main, React renderer, Rust compositor, Windows Graphics Capture), and run the local development desktop application via `npm run dev`.

---

## Architecture Overview (OpenScreen Internals)

OpenScreen is an open-source, high-performance desktop screen recording and video demo suite:
```
┌────────────────────────────────────────────────────────────────────────┐
│                        ELECTRON MAIN PROCESS                           │
│  (Window lifecycle, IPC handlers, native tray, system permissions)     │
└───────────────────▲────────────────────────────────┬───────────────────┘
                    │ IPC (electron-trpc / contextBridge)
                    ▼                                ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│        REACT RENDERER            │ │      RUST COMPOSITOR & CRATES    │
│  - Vite + React + TypeScript     │ │  - crates/ (compositor, export)  │
│  - Timeline & Canvas Editor      │ │  - Windows.Graphics.Capture API  │
│  - Local Whisper Transcription   │ │  - D3D11 GPU Acceleration        │
│  - Auto-Zoom & Cursor Path Smooth│ │  - MP4 / GIF Hardware Encoding   │
└──────────────────────────────────┘ └──────────────────────────────────┘
```

- **Electron Main (`electron/` / `src/main/`):** Manages native windowing, overlay HUDs, system audio capture, and IPC bridge.
- **Frontend Renderer (`src/renderer/`):** Built with Vite, React, Tailwind CSS, and Lucide icons. Powers the timeline editor, webcam PiP framing, and caption editor.
- **Native Rust Engine (`crates/`):** Compiles native dynamic modules via Cargo. Performs pixel-level smoothing, auto-tracking zoom interpolations, and high-speed multi-track video export.
- **Windows Graphics Capture:** Uses direct D3D11 capture sessions to ensure 60fps stutter-free desktop recording on Windows.

---

## Tasks

- [x] **Task 1: Workspace & Git Isolation**
  - Add `/openscreen` to parent `.gitignore` in `DIY-Speaker-website` to prevent nested repo pollution.
  - Clone `https://github.com/getopenscreen/openscreen.git` into `.\openscreen`.
  - *Verify:* `Test-Path .\openscreen\.git` returns True.

- [x] **Task 2: Native Toolchain Verification & Setup**
  - Verify and install Rust (`rustup` / `cargo` with `x86_64-pc-windows-msvc` toolchain) and MSVC C++ build tools.
  - *Verify:* `cargo --version` and `rustc --version` execute successfully in PowerShell (`rustc 1.100.0`, `cargo 1.100.0`).

- [x] **Task 3: Dependency Installation via Strict NPM**
  - Navigate to `.\openscreen` and run `npm install` (per OpenScreen upstream requirements; strict lockfile preservation for `@electron/rebuild`).
  - *Verify:* `node_modules` generated without ABI mismatch errors (950 packages audited).

- [x] **Task 4: Build Native Rust Crates & Windows Helpers**
  - Verified and fetched native Windows binaries via `npm run fetch:ffmpeg` and `npm run fetch:onnxruntime`.
  - *Verify:* Vendored shared FFmpeg DLLs and ONNX Runtime library into `electron/native/bin/win32-x64/`.

- [x] **Task 5: Architecture & Codebase Deep-Dive Documentation**
  - Inspected and documented IPC protocols, recording pipeline, auto-zoom mathematical models, and transcript pipeline in `openscreen/ARCHITECTURE_DEEPDIVE.md`.
  - *Verify:* Architectural mapping documented with file-level call stacks.

- [x] **Task 6: Local Launch & Runtime Verification**
  - Set `OPENSCREEN_DISABLE_CONTENT_PROTECTION=1` (Windows 11 compatibility).
  - Launch application using `npm run dev`.
  - *Verify:* Electron desktop application window opened, Vite dev server activated at `http://localhost:5173/` (HTTP 200), global shortcut `Ctrl+Shift+O` registered.

---

## Done When
- [x] OpenScreen is cloned and isolated in `.\openscreen`.
- [x] Rust and MSVC build tools are operational on Windows.
- [x] Dependencies and native crates build cleanly.
- [x] `npm run dev` launches the functional Electron desktop app.
- [x] Architecture analysis report is written and verified.

---

## Notes & Windows Edge Cases
- **Strict Package Manager:** OpenScreen explicitly prohibits `pnpm` / `yarn` / `bun` because native modules must rebuild against Electron's ABI with `package-lock.json`.
- **Windows Content Protection:** If recording toolbar or HUD is invisible, `OPENSCREEN_DISABLE_CONTENT_PROTECTION=1` must be set prior to launch.
