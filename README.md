# Hash — Crypto Workbench

A 100% client-side cryptography toolkit: generate keys, hashes, and passwords; encrypt with AES-GCM; decode JWTs; encode/decode Base64, hex, URL, and HTML — and see the exact JavaScript behind every algorithm. Vanilla HTML5, CSS3, and ES6 modules. No framework, no bundler, no `package.json`, no build step.

## Features

- **100% client-side** — every operation runs in your browser; no backend, no data transmission
- **Code viewer** — most tools show the literal source that ran (`Runs in this app`) alongside a plain-language walkthrough (`How it works`)
- **History** — last 20 results per tool saved to `localStorage`
- **Copy / download / clear** on every output
- **Toast notifications** for success and error feedback

## Quick Start

ES modules require a real HTTP origin — opening `index.html` directly via `file://` will break module loading.

```bash
python -m http.server 8000
# or: npx http-server
```

Then open `http://localhost:8000`.

## Tools

### Key Generation
- **Secret Key** — random hex keys (8–512 bytes)
- **Password** — configurable length and character sets, with a strength meter
- **RSA Keys** — RSA-OAEP key pairs (2048/3072/4096-bit), exported as PEM
- **UUID** — UUID v4 via `crypto.randomUUID()`

### Hashing
- **Hash Generator** — SHA-1/224/256/384/512, MD5, SHA3-256/512
- **Hash Detector** — guesses hash type from length/format
- **HMAC** — HMAC-SHA1/256/512
- **Checksum** — SHA-256/512 and MD5 for an uploaded file

### Encryption
- **AES Encryption** — AES-256-GCM with PBKDF2 (100,000 rounds) key derivation
- **JWT Tools** — decode a JWT's header and payload

### Encoding
- **Base64** — encode/decode
- **Encodings** — Hex, URL (percent-encoding), HTML entities

### Utilities
- **Random Generator** — random hex bytes
- **JSON Formatter** — format/minify JSON
- **QR Code** — encode text or a URL as a scannable QR code, with adjustable error-correction level and PNG download

## Project Structure

```
hash-project/
├── index.html                        # Entry point; loads js/app.js as a module
├── css/
│   ├── style.css                     # Layout + CSS variables
│   ├── components.css                # Component-specific styles
│   └── animations.css                # Transitions and keyframes
├── js/
│   ├── app.js                        # Bootstrap: wires sidebar navigation, loads the last-used tool
│   ├── ui.js                         # View layer: DOM components, toasts, output area, code viewer
│   ├── core.js                       # Pure logic: crypto, hashing, encoding, storage (no DOM)
│   ├── tools.js                      # Tool registry — one entry per sidebar tool
│   └── snippets.js                   # Source for the per-tool "how it works" code viewer
├── vendor/
│   └── bootstrap-icons/              # Vendored locally (no CDN dependency for icons)
└── MANIFEST.md
```

See [CLAUDE.md](CLAUDE.md) for the full architecture breakdown and conventions for adding a new tool.

## Security & Privacy

- **No backend** — all code runs in your browser; nothing you enter is ever transmitted
- **No cookies or tracking**
- **History is optional and local** — stored in `localStorage`, never sent anywhere
- **Web Crypto native**: SHA-1/256/384/512, HMAC, AES-GCM, RSA-OAEP, PBKDF2, and UUID v4 all work fully offline
- **CDN-dependent algorithms**: MD5, SHA-224, and SHA3-256/512 lazy-load [CryptoJS](https://cdnjs.com/libraries/crypto-js) on first use; the QR Code tool lazy-loads [qrcode-generator](https://cdnjs.com/libraries/qrcode-generator). Both only work when the CDN is reachable — everything else on this page works with no network access at all

## Browser Support

Any modern browser with Web Crypto API support: Chrome, Firefox, Safari, Edge (desktop and mobile).

## Deployment

No build step — copy the files to any static host (GitHub Pages, Netlify, Vercel, or a plain web server) as-is.

## License

MIT License.
