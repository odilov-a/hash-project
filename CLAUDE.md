# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Hash — a 100% client-side cryptography toolkit (key/hash/password generation, AES-GCM, HMAC, JWT decode, encoding). Vanilla HTML5 + CSS3 + ES6 modules. No framework, no bundler, no `package.json`, **no build step**.

## Running

Serve the directory over static HTTP (ES modules require it — opening `index.html` via `file://` breaks module loading):

```bash
python -m http.server 8000   # then open http://localhost:8000
# or: npx http-server
```

There is no test runner, linter, or CI. MANIFEST.md references a `test-crypto.js` suite that does not exist in the repo.

## Architecture

Entry point is `index.html`, which loads only `js/app.js` (`type="module"`); app.js imports the rest. Five JS modules in four layers:

- **app.js** — bootstrap. `CryptoKit` class: on `DOMContentLoaded` wires sidebar `.tool-btn` clicks to `loadTool()` and restores the last tool from storage. `loadTool()` calls `tool.render()` → injects HTML → `tool.setup()` → `ui.setupOutputHandlers()`.
- **tools.js** — the `tools` registry: object keyed by tool id, each `{ name, icon, render(), setup() }`. `render()` returns an HTML string from `ui.*` factories; `setup()` binds events and calls `crypto`/`storage`. Shared `withLoading(message, action)` wraps every async tool action with loading + try/catch/toast, so tools stay small. Write output via `ui.setOutput(id, value)` rather than repeating DOM writes.
- **ui.js** — view layer. Search/sidebar chrome (including sidebar hide/show), DOM notifications (`showToast`, `copyToClipboard`, `downloadFile`), the output area (`createOutput`/`setOutput`/`setupOutputHandlers`), the per-tool code viewer (`createCodePanel`/`setCodePanel`/`setupCodeTabs`), and component factories (`createCard`, `createSlider`, `createAlgorithmButtons`, `createCheckboxGroup`, `createStrengthMeter`, `showLoading`). No core import.
- **core.js** — pure logic layer, no DOM rendering. Exports three singletons:
  - `utils` — byte/hex/base64 conversion, `randomBytes` (hex), URL/HTML encode, `formatBytes`, password strength, `detectHashType`, JSON format/minify, `debounce`.
  - `crypto` — `hash(algo, data)` and `hmac(algo, data, key)` dispatch through the `HASHERS`/`HMAC_HASHES` maps (keyed by the exact UI label — no fragile string munging); AES-GCM with PBKDF2 key derivation; RSA keygen + PEM export; `generateUUID` (native `crypto.randomUUID`); base64/hex encode/decode; `generateQRMatrix` returns a boolean module matrix. Web Crypto (`subtle`) covers SHA-1/256/384/512, HMAC, AES, RSA, PBKDF2; **CryptoJS** (lazy-loaded once from CDN) covers MD5, SHA-224, SHA3-256/512; **qrcode-generator** (also lazy-loaded once from CDN, same `loadX()` promise-memoization pattern as CryptoJS) backs QR encoding.
  - `storage` — namespaced localStorage (`cryptokit_` prefix): `save`/`get`, per-tool `saveHistory` (20 entries), and `getSettings`/`getSetting`/`setSetting`.
- **snippets.js** — hand-maintained source for the per-tool code viewer (`ui.createCodePanel`), kept separate so core.js's dispatch maps stay free of documentation strings. Each algorithm entry has `real` (literal code copied from core.js), `explain` (conceptual walkthrough), and `note` (one-line fact: digest size, family, status). Update this when changing an algorithm's implementation in core.js, or the code viewer goes stale.

CSS is split by concern and linked unconditionally: `style.css` (layout + CSS variables), `components.css`, `animations.css`. Light theme only — no dark mode (despite README mentioning one). `index.html` also pulls in Google Fonts and a local `vendor/bootstrap-icons/` stylesheet for icons — the "no CDN dependency" convention below is about crypto behavior (CryptoJS), not styling assets.

## Adding or wiring a tool

A tool is live only when **both** exist and the ids match:
1. A `data-tool="<id>"` button in the `index.html` sidebar.
2. A `tools['<id>']` entry in `js/tools.js` with `render()` + `setup()`.

If a sidebar button's `data-tool` has no matching registry entry, `loadTool()` shows a "Tool not found" toast — verify the registry entry exists before assuming a tool works.

## Conventions

- Layering: `core.js` never touches the DOM for rendering; `ui.js` owns all view/DOM; `tools.js` composes the two. Keep new pure logic in core, new components in ui.
- Add hash/HMAC algorithms by extending the `HASHERS`/`HMAC_HASHES` maps in core.js, keyed by the exact UI label — do not build method names from strings.
- Build DOM through `ui.*` factories; write results via `ui.setOutput`; wrap async work in `withLoading`.
- No CDN dependency except the lazy CryptoJS and qrcode-generator loads; keep the app self-contained and offline-capable otherwise. **CryptoJS-backed algorithms (MD5, SHA-224, SHA3) and the QR Code tool only work when their CDN is reachable** — Web Crypto algorithms work fully offline.
- All crypto stays client-side — never introduce network calls that transmit user input.
