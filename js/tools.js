// ============================================================
// tools.js — tool registry. Each entry has render() -> HTML and
// setup() -> event wiring. Keyed by the data-tool id in index.html.
// ============================================================

import { ui } from "./ui.js";
import { crypto, storage, utils } from "./core.js";

// Run an async tool action with consistent loading + error handling,
// so individual tools stay focused on their own logic (DRY).
const withLoading = async (message, action) => {
  ui.showLoading(message);
  try {
    await action();
  } catch (e) {
    ui.showToast(e.message || "Operation failed", "error");
    console.error(e);
  } finally {
    ui.hideLoading();
  }
};

export const tools = {
  "secret-key": {
    name: "Secret Key Generator",
    icon: "",
    render() {
      return ui.createCard(
        "Secret Key Generator",
        "",
        `
          <div class="options-group">
            <div class="options-title">Key Type</div>
            ${ui.createAlgorithmButtons(
              "key-type-selector",
              ["Random", "AES Key", "JWT Secret", "API Key", "HMAC Secret"],
              "Random",
            )}
          </div>
          ${ui.createSlider("key-length", "Key Length (bytes)", 8, 512, 32, "In hexadecimal format")}
          <button class="btn btn-primary w-full" id="generate-key" style="margin-bottom: var(--spacing-lg);">
            Generate Key
          </button>
          ${ui.createOutput("key-output", "Generated Key")}
        `,
      );
    },
    setup() {
      ui.setupAlgorithmButtons("key-type-selector");
      ui.setupSlider("key-length");
      document.getElementById("generate-key")?.addEventListener("click", () => {
        const length = parseInt(document.getElementById("key-length").value, 10);
        const keyType = ui.getActiveAlgorithm("key-type-selector");
        const key = utils.randomBytes(length);
        ui.setOutput("key-output", key);
        storage.saveHistory("secret-key", { key, keyType, length });
        ui.showToast("Key generated successfully", "success");
      });
    },
  },

  password: {
    name: "Password Generator",
    icon: "",
    render() {
      return ui.createCard(
        "Password Generator",
        "",
        `
          ${ui.createSlider("password-length", "Password Length", 8, 128, 16)}
          <div class="options-group">
            <div class="options-title">Character Types</div>
            ${ui.createCheckboxGroup("password-options", [
              { id: "use-uppercase", label: "Uppercase (A-Z)", checked: true },
              { id: "use-lowercase", label: "Lowercase (a-z)", checked: true },
              { id: "use-numbers", label: "Numbers (0-9)", checked: true },
              { id: "use-symbols", label: "Symbols (!@#$...)", checked: true },
              { id: "exclude-similar", label: "Exclude Similar (il1Lo0)", checked: false },
            ])}
          </div>
          ${ui.createStrengthMeter("password-strength")}
          <button class="btn btn-primary w-full" id="generate-password" style="margin-bottom: var(--spacing-lg);">
            Generate Password
          </button>
          ${ui.createOutput("password-output", "Generated Password")}
        `,
      );
    },
    setup() {
      ui.setupSlider("password-length");
      document.getElementById("generate-password")?.addEventListener("click", () => {
        const length = parseInt(document.getElementById("password-length").value, 10);
        const options = ui.getCheckboxGroupValues("password-options");
        try {
          const password = crypto.generatePassword(length, {
            uppercase: options["use-uppercase"],
            lowercase: options["use-lowercase"],
            numbers: options["use-numbers"],
            symbols: options["use-symbols"],
            excludeSimilar: options["exclude-similar"],
          });
          ui.setOutput("password-output", password);
          ui.updateStrengthMeter(
            "password-strength",
            utils.getPasswordStrength(password).level,
          );
          storage.saveHistory("password", { length });
          ui.showToast("Password generated successfully", "success");
        } catch (e) {
          ui.showToast(e.message, "error");
        }
      });
    },
  },

  hash: {
    name: "Hash Generator",
    icon: "",
    render() {
      return ui.createCard(
        "Hash Generator",
        "",
        `
          <div class="form-group">
            <label class="form-label" for="hash-input">Input Text</label>
            <textarea id="hash-input" class="form-input form-textarea" placeholder="Enter text to hash..."></textarea>
          </div>
          <div class="options-group">
            <div class="options-title">Hash Algorithms</div>
            ${ui.createAlgorithmButtons(
              "hash-algo-selector",
              ["SHA256", "SHA512", "SHA1", "MD5", "SHA384", "SHA224", "SHA3-256", "SHA3-512"],
              "SHA256",
            )}
          </div>
          <button class="btn btn-primary w-full" id="generate-hash" style="margin-bottom: var(--spacing-lg);">
            Generate Hash
          </button>
          ${ui.createOutput("hash-output", "Hash Output")}
        `,
      );
    },
    setup() {
      ui.setupAlgorithmButtons("hash-algo-selector");
      const input = document.getElementById("hash-input");

      const generate = () => {
        if (!input.value) {
          ui.showToast("Please enter text to hash", "error");
          return;
        }
        const algo = ui.getActiveAlgorithm("hash-algo-selector");
        return withLoading(`Hashing with ${algo}...`, async () => {
          const result = await crypto.hash(algo, input.value);
          ui.setOutput("hash-output", result);
          storage.saveHistory("hash", { algo });
        });
      };

      document.getElementById("generate-hash")?.addEventListener("click", generate);
      input?.addEventListener("input", utils.debounce(generate, 500));
    },
  },

  "hash-detect": {
    name: "Hash Detector",
    icon: "",
    render() {
      return ui.createCard(
        "Hash Detector",
        "",
        `
          <div class="form-group">
            <label class="form-label" for="detect-input">Paste Hash</label>
            <input type="text" id="detect-input" class="form-input" placeholder="Paste a hash to detect its type...">
          </div>
          ${ui.createOutput("detect-output", "Detected Hash Types")}
        `,
      );
    },
    setup() {
      const input = document.getElementById("detect-input");
      input?.addEventListener(
        "input",
        utils.debounce((e) => {
          const types = utils.detectHashType(e.target.value);
          const output = document.getElementById("detect-output");
          if (types.length) {
            output.innerHTML = types
              .map(
                (type) =>
                  `<div style="padding: var(--spacing-md); background: rgba(0, 200, 150, 0.1); border-radius: var(--radius-md); margin-bottom: var(--spacing-sm);"><strong>${type}</strong></div>`,
              )
              .join("");
            output.classList.remove("output-empty");
          } else {
            output.textContent = "No matching hash types found";
            output.classList.add("output-empty");
          }
        }, 300),
      );
    },
  },

  aes: {
    name: "AES Encryption",
    icon: "",
    render() {
      return ui.createCard(
        "AES-GCM Encryption",
        "",
        `
          <div class="form-group">
            <label class="form-label" for="aes-input">Text to Encrypt / Decrypt</label>
            <textarea id="aes-input" class="form-input form-textarea" placeholder="Enter text..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="aes-password">Password</label>
            <input type="password" id="aes-password" class="form-input" placeholder="Enter encryption password...">
          </div>
          <div style="margin-bottom: var(--spacing-lg);">
            <button class="btn btn-primary" id="encrypt-btn" style="margin-right: var(--spacing-md);">Encrypt</button>
            <button class="btn btn-secondary" id="decrypt-btn">Decrypt</button>
          </div>
          ${ui.createOutput("aes-output", "Result")}
        `,
      );
    },
    setup() {
      const inputField = document.getElementById("aes-input");
      const passwordField = document.getElementById("aes-password");

      const run = (verb, action) => {
        if (!inputField.value || !passwordField.value) {
          ui.showToast("Please enter text and password", "error");
          return;
        }
        return withLoading(`${verb}...`, async () => {
          const result = await action(inputField.value, passwordField.value);
          ui.setOutput("aes-output", result);
          ui.showToast(`${verb}ed successfully`, "success");
        });
      };

      document
        .getElementById("encrypt-btn")
        ?.addEventListener("click", () => run("Encrypt", crypto.aesGcmEncrypt));
      document
        .getElementById("decrypt-btn")
        ?.addEventListener("click", () => run("Decrypt", crypto.aesGcmDecrypt));
    },
  },

  uuid: {
    name: "UUID Generator",
    icon: "",
    render() {
      return ui.createCard(
        "UUID Generator",
        "",
        `
          <div class="options-group">
            <div class="options-title">UUID Version</div>
            ${ui.createAlgorithmButtons("uuid-version-selector", ["v4"], "v4")}
          </div>
          <button class="btn btn-primary w-full" id="generate-uuid" style="margin-bottom: var(--spacing-lg);">
            Generate UUID
          </button>
          ${ui.createOutput("uuid-output", "Generated UUID")}
        `,
      );
    },
    setup() {
      document.getElementById("generate-uuid")?.addEventListener("click", () => {
        const uuid = crypto.generateUUID();
        ui.setOutput("uuid-output", uuid);
        storage.saveHistory("uuid", { uuid });
        ui.showToast("UUID generated", "success");
      });
    },
  },

  jwt: {
    name: "JWT Tools",
    icon: "",
    render() {
      return ui.createCard(
        "JWT Tools",
        "",
        `
          <div class="form-group">
            <label class="form-label" for="jwt-token">JWT Token</label>
            <textarea id="jwt-token" class="form-input form-textarea" placeholder="Paste JWT token here..."></textarea>
          </div>
          <button class="btn btn-secondary w-full" id="decode-jwt" style="margin-bottom: var(--spacing-lg);">
            Decode JWT
          </button>
          ${ui.createOutput("jwt-output", "Decoded JWT")}
        `,
      );
    },
    setup() {
      document.getElementById("decode-jwt")?.addEventListener("click", () => {
        const token = document.getElementById("jwt-token").value.trim();
        const parts = token.split(".");
        if (parts.length !== 3) {
          ui.showToast("Invalid JWT format", "error");
          return;
        }
        try {
          const decode = (part) => {
            const padded = part + "=".repeat((4 - (part.length % 4)) % 4);
            return JSON.parse(crypto.base64Decode(padded.replace(/-/g, "+").replace(/_/g, "/")));
          };
          const result = {
            header: decode(parts[0]),
            payload: decode(parts[1]),
          };
          ui.setOutput("jwt-output", JSON.stringify(result, null, 2));
          ui.showToast("JWT decoded successfully", "success");
        } catch (e) {
          ui.showToast(`Failed to decode JWT: ${e.message}`, "error");
        }
      });
    },
  },

  base64: {
    name: "Base64 Encoding",
    icon: "",
    render() {
      return ui.createCard(
        "Base64 Encoder/Decoder",
        "",
        `
          <div class="form-group">
            <label class="form-label" for="base64-input">Input</label>
            <textarea id="base64-input" class="form-input form-textarea" placeholder="Enter text to encode or decode..."></textarea>
          </div>
          <div style="margin-bottom: var(--spacing-lg);">
            <button class="btn btn-primary" id="encode-base64" style="margin-right: var(--spacing-md);">Encode</button>
            <button class="btn btn-secondary" id="decode-base64">Decode</button>
          </div>
          ${ui.createOutput("base64-output", "Output")}
        `,
      );
    },
    setup() {
      const input = document.getElementById("base64-input");
      const run = (verb, action) => {
        try {
          ui.setOutput("base64-output", action(input.value));
          ui.showToast(`${verb}d successfully`, "success");
        } catch {
          ui.showToast(`${verb} failed`, "error");
        }
      };
      document
        .getElementById("encode-base64")
        ?.addEventListener("click", () => run("Encode", crypto.base64Encode));
      document
        .getElementById("decode-base64")
        ?.addEventListener("click", () => run("Decode", crypto.base64Decode));
    },
  },

  hmac: {
    name: "HMAC",
    icon: "",
    render() {
      return ui.createCard(
        "HMAC Generator",
        "",
        `
          <div class="form-group">
            <label class="form-label" for="hmac-input">Message</label>
            <textarea id="hmac-input" class="form-input form-textarea" placeholder="Enter message..."></textarea>
          </div>
          <div class="form-group">
            <label class="form-label" for="hmac-key">Secret Key</label>
            <input type="password" id="hmac-key" class="form-input" placeholder="Enter secret key...">
          </div>
          <div class="options-group">
            <div class="options-title">Algorithm</div>
            ${ui.createAlgorithmButtons("hmac-algo-selector", ["SHA256", "SHA512", "SHA1"], "SHA256")}
          </div>
          <button class="btn btn-primary w-full" id="generate-hmac" style="margin-bottom: var(--spacing-lg);">
            Generate HMAC
          </button>
          ${ui.createOutput("hmac-output", "HMAC")}
        `,
      );
    },
    setup() {
      ui.setupAlgorithmButtons("hmac-algo-selector");
      document.getElementById("generate-hmac")?.addEventListener("click", () => {
        const message = document.getElementById("hmac-input").value;
        const key = document.getElementById("hmac-key").value;
        if (!message || !key) {
          ui.showToast("Please enter message and key", "error");
          return;
        }
        const algo = ui.getActiveAlgorithm("hmac-algo-selector");
        return withLoading("Generating HMAC...", async () => {
          ui.setOutput("hmac-output", await crypto.hmac(algo, message, key));
          ui.showToast("HMAC generated", "success");
        });
      });
    },
  },

  encoding: {
    name: "Encoding Tools",
    icon: "",
    render() {
      return ui.createCard(
        "Encoding Tools",
        "",
        `
          <div class="form-group">
            <label class="form-label" for="encoding-input">Input</label>
            <textarea id="encoding-input" class="form-input form-textarea" placeholder="Enter text..."></textarea>
          </div>
          <div class="options-group">
            <div class="options-title">Encoding Type</div>
            ${ui.createAlgorithmButtons("encoding-type-selector", ["Hex", "URL", "HTML"], "Hex")}
          </div>
          <div style="margin-bottom: var(--spacing-lg);">
            <button class="btn btn-primary" id="encode-btn" style="margin-right: var(--spacing-md);">Encode</button>
            <button class="btn btn-secondary" id="decode-btn">Decode</button>
          </div>
          ${ui.createOutput("encoding-output", "Output")}
        `,
      );
    },
    setup() {
      ui.setupAlgorithmButtons("encoding-type-selector");
      const input = document.getElementById("encoding-input");

      const CODERS = {
        Hex: { encode: crypto.hexEncode, decode: crypto.hexDecode },
        URL: { encode: utils.urlEncode, decode: utils.urlDecode },
        HTML: { encode: utils.htmlEncode, decode: utils.htmlDecode },
      };

      const run = (direction) => {
        const type = ui.getActiveAlgorithm("encoding-type-selector");
        try {
          ui.setOutput("encoding-output", CODERS[type][direction](input.value));
          ui.showToast(`${direction === "encode" ? "Encoded" : "Decoded"} successfully`, "success");
        } catch {
          ui.showToast("Operation failed", "error");
        }
      };

      document.getElementById("encode-btn")?.addEventListener("click", () => run("encode"));
      document.getElementById("decode-btn")?.addEventListener("click", () => run("decode"));
    },
  },

  random: {
    name: "Random Generator",
    icon: "",
    render() {
      return ui.createCard(
        "Random Generator",
        "",
        `
          ${ui.createSlider("random-bytes-length", "Random Bytes Length", 1, 256, 32)}
          <button class="btn btn-primary w-full" id="generate-random" style="margin-bottom: var(--spacing-lg);">
            Generate Random Bytes
          </button>
          ${ui.createOutput("random-output", "Random Hex Output")}
        `,
      );
    },
    setup() {
      ui.setupSlider("random-bytes-length");
      document.getElementById("generate-random")?.addEventListener("click", () => {
        const length = parseInt(document.getElementById("random-bytes-length").value, 10);
        ui.setOutput("random-output", utils.randomBytes(length));
        storage.saveHistory("random", { length });
        ui.showToast("Random bytes generated", "success");
      });
    },
  },

  json: {
    name: "JSON Formatter",
    icon: "",
    render() {
      return ui.createCard(
        "JSON Formatter",
        "{ }",
        `
          <div class="form-group">
            <label class="form-label" for="json-input">JSON Input</label>
            <textarea id="json-input" class="form-input form-textarea" placeholder="Paste JSON..."></textarea>
          </div>
          <div style="margin-bottom: var(--spacing-lg);">
            <button class="btn btn-primary" id="format-json" style="margin-right: var(--spacing-md);">Format</button>
            <button class="btn btn-secondary" id="minify-json">Minify</button>
          </div>
          ${ui.createOutput("json-output", "Output")}
        `,
      );
    },
    setup() {
      const input = document.getElementById("json-input");
      document.getElementById("format-json")?.addEventListener("click", () => {
        ui.setOutput("json-output", utils.formatJSON(input.value));
        ui.showToast("Formatted", "success");
      });
      document.getElementById("minify-json")?.addEventListener("click", () => {
        ui.setOutput("json-output", utils.minifyJSON(input.value));
        ui.showToast("Minified", "success");
      });
    },
  },

  checksum: {
    name: "File Checksum",
    icon: "",
    render() {
      return ui.createCard(
        "File Checksum",
        "",
        `
          <div class="dropzone" id="file-dropzone">
            <div class="dropzone-icon">Select</div>
            <p class="dropzone-text">Drop file here or click to select</p>
            <p class="dropzone-hint">Supports any file type</p>
            <input type="file" id="file-input" style="display: none;">
          </div>
          ${ui.createOutput("checksum-output", "Checksums")}
        `,
      );
    },
    setup() {
      const dropzone = document.getElementById("file-dropzone");
      const fileInput = document.getElementById("file-input");

      const handleFile = (file) =>
        withLoading("Computing checksums...", async () => {
          const buffer = await file.arrayBuffer();
          const text = new TextDecoder().decode(new Uint8Array(buffer));
          const [sha256, sha512, md5] = await Promise.all([
            crypto.hash("SHA256", text),
            crypto.hash("SHA512", text),
            crypto.hash("MD5", text),
          ]);
          const output = document.getElementById("checksum-output");
          output.innerHTML = `
            <div style="margin-bottom: var(--spacing-md);">
              <strong>File:</strong> ${utils.htmlEncode(file.name)}<br>
              <strong>Size:</strong> ${utils.formatBytes(file.size)}
            </div>
            <div class="hash-list">
              <div class="hash-item"><div class="hash-name">SHA256</div><div class="hash-value">${sha256}</div></div>
              <div class="hash-item"><div class="hash-name">SHA512</div><div class="hash-value">${sha512}</div></div>
              <div class="hash-item"><div class="hash-name">MD5</div><div class="hash-value">${md5}</div></div>
            </div>
          `;
          output.classList.remove("output-empty");
          ui.showToast("Checksums computed", "success");
        });

      dropzone?.addEventListener("click", () => fileInput?.click());
      dropzone?.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("dragover");
      });
      dropzone?.addEventListener("dragleave", () => dropzone.classList.remove("dragover"));
      dropzone?.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("dragover");
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
      });
      fileInput?.addEventListener("change", (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
      });
    },
  },

  "rsa-keys": {
    name: "RSA Key Generator",
    icon: "",
    render() {
      return ui.createCard(
        "RSA Key Generator",
        "",
        `
          <div class="options-group">
            <div class="options-title">Key Size</div>
            ${ui.createAlgorithmButtons("rsa-size-selector", ["2048", "3072", "4096"], "2048")}
          </div>
          <button class="btn btn-primary w-full" id="generate-rsa" style="margin-bottom: var(--spacing-lg);">
            Generate RSA Key Pair
          </button>
          <div id="rsa-output" style="display: none;">
            <div style="margin-bottom: var(--spacing-lg);">
              <label class="form-label">Public Key (PEM)</label>
              <div class="key-display" id="public-key-display"></div>
              <button class="btn btn-secondary" id="copy-public" style="margin-top: var(--spacing-md);">Copy Public Key</button>
            </div>
            <div>
              <label class="form-label">Private Key (PEM)</label>
              <div class="key-display" id="private-key-display"></div>
              <button class="btn btn-secondary" id="copy-private" style="margin-top: var(--spacing-md);">Copy Private Key</button>
            </div>
          </div>
        `,
      );
    },
    setup() {
      ui.setupAlgorithmButtons("rsa-size-selector");
      document.getElementById("generate-rsa")?.addEventListener("click", () => {
        const size = parseInt(ui.getActiveAlgorithm("rsa-size-selector"), 10);
        return withLoading("Generating RSA key pair... This may take a moment...", async () => {
          const keyPair = await crypto.generateRSAKeyPair(size);
          const publicKeyPem = await crypto.exportPublicKeyPEM(keyPair.publicKey);
          const privateKeyPem = await crypto.exportPrivateKeyPEM(keyPair.privateKey);

          document.getElementById("public-key-display").textContent = publicKeyPem;
          document.getElementById("private-key-display").textContent = privateKeyPem;
          document.getElementById("rsa-output").style.display = "block";

          document
            .getElementById("copy-public")
            ?.addEventListener("click", () => ui.copyToClipboard(publicKeyPem));
          document
            .getElementById("copy-private")
            ?.addEventListener("click", () => ui.copyToClipboard(privateKeyPem));

          ui.showToast("RSA key pair generated", "success");
        });
      });
    },
  },

  "ecc-keys": {
    name: "ECC Key Generator",
    icon: "",
    render() {
      return ui.createCard(
        "ECC Key Generator",
        "",
        `
          <div class="options-group">
            <div class="options-title">Curve</div>
            ${ui.createAlgorithmButtons("ecc-curve-selector", ["P256", "P384", "P521", "Ed25519"], "P256")}
          </div>
          <button class="btn btn-primary w-full" id="generate-ecc" style="margin-bottom: var(--spacing-lg);">
            Generate ECC Key Pair
          </button>
          ${ui.createInfoBox("ECC keys are not yet supported in this version. Use RSA keys for now.")}
        `,
      );
    },
    setup() {
      ui.setupAlgorithmButtons("ecc-curve-selector");
      document.getElementById("generate-ecc")?.addEventListener("click", () => {
        ui.showToast("ECC key generation coming soon!", "error");
      });
    },
  },
};

export default tools;
