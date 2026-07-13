const wc = globalThis.crypto;
const subtle = wc.subtle;

export const utils = {
  stringToBytes: (str) => new TextEncoder().encode(str),
  bytesToString: (bytes) => new TextDecoder().decode(bytes),

  bytesToHex(bytes) {
    return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
  },

  bytesToBase64(bytes) {
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return btoa(binary);
  },

  base64ToBytes(base64) {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  },

  randomBytes(length = 32) {
    const bytes = new Uint8Array(length);
    wc.getRandomValues(bytes);
    return utils.bytesToHex(bytes);
  },

  urlEncode: (str) => encodeURIComponent(str),
  urlDecode: (str) => decodeURIComponent(str),

  htmlEncode(str) {
    const el = document.createElement("textarea");
    el.textContent = str;
    return el.innerHTML;
  },

  htmlDecode(str) {
    const el = document.createElement("textarea");
    el.innerHTML = str;
    return el.textContent;
  },

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${parseFloat(value.toFixed(decimals))} ${sizes[i]}`;
  },

  getPasswordStrength(password) {
    if (!password || password.length < 8) return { level: "weak", score: 0 };
    if (password.length < 12) return { level: "fair", score: 1 };
    if (password.length < 16) return { level: "good", score: 2 };
    return { level: "strong", score: 3 };
  },

  detectHashType(hash) {
    const value = hash.toLowerCase().trim();
    const patterns = {
      MD5: /^[a-f0-9]{32}$/,
      SHA1: /^[a-f0-9]{40}$/,
      SHA224: /^[a-f0-9]{56}$/,
      SHA256: /^[a-f0-9]{64}$/,
      SHA384: /^[a-f0-9]{96}$/,
      SHA512: /^[a-f0-9]{128}$/,
    };
    return Object.entries(patterns)
      .filter(([, pattern]) => pattern.test(value))
      .map(([type]) => type);
  },

  formatJSON(json, indent = 2) {
    try {
      const parsed = typeof json === "string" ? JSON.parse(json) : json;
      return JSON.stringify(parsed, null, indent);
    } catch {
      return "Invalid JSON";
    }
  },

  minifyJSON(json) {
    try {
      const parsed = typeof json === "string" ? JSON.parse(json) : json;
      return JSON.stringify(parsed);
    } catch {
      return "Invalid JSON";
    }
  },

  debounce(func, wait) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },
};

// ---------------------------------------------------------------------------
// crypto — hashing, HMAC, AES-GCM, RSA, encoding
// ---------------------------------------------------------------------------

// Lazy-load CryptoJS from CDN once, for algorithms Web Crypto lacks.
const loadCryptoJS = (() => {
  let promise;
  return () =>
    (promise ??= new Promise((resolve, reject) => {
      if (globalThis.CryptoJS) return resolve(globalThis.CryptoJS);
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js";
      script.onload = () => resolve(globalThis.CryptoJS);
      script.onerror = () => reject(new Error("Failed to load CryptoJS"));
      document.head.appendChild(script);
    }));
})();

// Lazy-load the qrcode-generator library from CDN once — same pattern as
// loadCryptoJS, since encoding QR's Reed-Solomon error correction isn't
// something to hand-roll here.
const loadQRCodeLib = (() => {
  let promise;
  return () =>
    (promise ??= new Promise((resolve, reject) => {
      if (globalThis.qrcode) return resolve(globalThis.qrcode);
      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/qrcode-generator/1.4.4/qrcode.min.js";
      script.onload = () => resolve(globalThis.qrcode);
      script.onerror = () => reject(new Error("Failed to load QR code library"));
      document.head.appendChild(script);
    }));
})();

const subtleHash = async (name, data) => {
  const buffer = await subtle.digest(name, utils.stringToBytes(data));
  return utils.bytesToHex(new Uint8Array(buffer));
};

// Keyed by the exact label shown in the UI — no fragile string munging.
const HASHERS = {
  SHA256: (d) => subtleHash("SHA-256", d),
  SHA384: (d) => subtleHash("SHA-384", d),
  SHA512: (d) => subtleHash("SHA-512", d),
  SHA1: (d) => subtleHash("SHA-1", d),
  MD5: async (d) => (await loadCryptoJS()).MD5(d).toString(),
  SHA224: async (d) => (await loadCryptoJS()).SHA224(d).toString(),
  "SHA3-256": async (d) =>
    (await loadCryptoJS()).SHA3(d, { outputLength: 256 }).toString(),
  "SHA3-512": async (d) =>
    (await loadCryptoJS()).SHA3(d, { outputLength: 512 }).toString(),
};

const HMAC_HASHES = { SHA256: "SHA-256", SHA512: "SHA-512", SHA1: "SHA-1" };

// Derive a 256-bit AES-GCM key from a password + salt via PBKDF2,
// so any password length works (not just exact 16/32-byte keys).
const deriveAesKey = async (password, salt, usages) => {
  const baseKey = await subtle.importKey(
    "raw",
    utils.stringToBytes(password),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    usages,
  );
};

const pemFormat = (label, base64) =>
  `-----BEGIN ${label}-----\n${base64.match(/.{1,64}/g).join("\n")}\n-----END ${label}-----`;

export const crypto = {
  hash(algo, data) {
    const hasher = HASHERS[algo];
    if (!hasher) throw new Error(`Unsupported hash algorithm: ${algo}`);
    return hasher(data);
  },

  async hmac(algo, data, key) {
    const hash = HMAC_HASHES[algo];
    if (!hash) throw new Error(`Unsupported HMAC algorithm: ${algo}`);
    const cryptoKey = await subtle.importKey(
      "raw",
      utils.stringToBytes(key),
      { name: "HMAC", hash },
      false,
      ["sign"],
    );
    const signature = await subtle.sign(
      "HMAC",
      cryptoKey,
      utils.stringToBytes(data),
    );
    return utils.bytesToHex(new Uint8Array(signature));
  },

  async aesGcmEncrypt(data, password) {
    const salt = wc.getRandomValues(new Uint8Array(16));
    const iv = wc.getRandomValues(new Uint8Array(12));
    const key = await deriveAesKey(password, salt, ["encrypt"]);
    const encrypted = await subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      utils.stringToBytes(data),
    );
    // Output format: [salt(16)][iv(12)][ciphertext]
    const combined = new Uint8Array(
      salt.length + iv.length + encrypted.byteLength,
    );
    combined.set(salt);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);
    return utils.bytesToBase64(combined);
  },

  async aesGcmDecrypt(encrypted, password) {
    try {
      const combined = utils.base64ToBytes(encrypted);
      const salt = combined.slice(0, 16);
      const iv = combined.slice(16, 28);
      const ciphertext = combined.slice(28);
      const key = await deriveAesKey(password, salt, ["decrypt"]);
      const decrypted = await subtle.decrypt(
        { name: "AES-GCM", iv },
        key,
        ciphertext,
      );
      return utils.bytesToString(new Uint8Array(decrypted));
    } catch {
      throw new Error("Decryption failed — wrong password or corrupt data");
    }
  },

  generatePassword(length = 16, options = {}) {
    const {
      uppercase = true,
      lowercase = true,
      numbers = true,
      symbols = true,
      excludeSimilar = false,
    } = options;
    let chars = "";
    if (uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
    if (numbers) chars += "0123456789";
    if (symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
    if (excludeSimilar) chars = chars.replace(/[ilLoO0]/g, "");
    if (!chars) throw new Error("Select at least one character type");

    const randomValues = new Uint32Array(length);
    wc.getRandomValues(randomValues);
    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars[randomValues[i] % chars.length];
    }
    return password;
  },

  generateRSAKeyPair(bits = 2048) {
    return subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: bits,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );
  },

  async exportPublicKeyPEM(publicKey) {
    const exported = await subtle.exportKey("spki", publicKey);
    return pemFormat("PUBLIC KEY", utils.bytesToBase64(new Uint8Array(exported)));
  },

  async exportPrivateKeyPEM(privateKey) {
    const exported = await subtle.exportKey("pkcs8", privateKey);
    return pemFormat(
      "PRIVATE KEY",
      utils.bytesToBase64(new Uint8Array(exported)),
    );
  },

  generateUUID: () => wc.randomUUID(),

  base64Encode: (str) => btoa(unescape(encodeURIComponent(str))),
  base64Decode: (str) => decodeURIComponent(escape(atob(str))),

  hexEncode(str) {
    return Array.from(str, (c) =>
      c.charCodeAt(0).toString(16).padStart(2, "0"),
    ).join("");
  },

  hexDecode(hex) {
    let result = "";
    for (let i = 0; i < hex.length; i += 2) {
      result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  },

  // Returns a boolean module matrix; ui.js turns it into pixels/canvas.
  async generateQRMatrix(text, errorCorrectionLevel = "M") {
    if (!text) throw new Error("Enter text to encode");
    const qrcodeLib = await loadQRCodeLib();
    const qr = qrcodeLib(0, errorCorrectionLevel); // typeNumber 0 = auto-size
    qr.addData(text);
    qr.make();
    const size = qr.getModuleCount();
    const matrix = Array.from({ length: size }, (_, row) =>
      Array.from({ length: size }, (_, col) => qr.isDark(row, col)),
    );
    return { size, matrix };
  },
};

// ---------------------------------------------------------------------------
// storage — namespaced localStorage for settings and per-tool history
// ---------------------------------------------------------------------------
const PREFIX = "cryptokit_";
const DEFAULT_SETTINGS = {
  language: "en",
  saveHistory: true,
};

export const storage = {
  save(key, data) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(data));
      return true;
    } catch (e) {
      console.error("Storage save failed:", e);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const json = localStorage.getItem(PREFIX + key);
      return json ? JSON.parse(json) : defaultValue;
    } catch (e) {
      console.error("Storage get failed:", e);
      return defaultValue;
    }
  },

  saveHistory(toolName, data, limit = 20) {
    const history = this.get("history", {});
    history[toolName] = [
      { timestamp: Date.now(), data },
      ...(history[toolName] || []),
    ].slice(0, limit);
    this.save("history", history);
  },

  getSettings() {
    return { ...DEFAULT_SETTINGS, ...this.get("settings", {}) };
  },

  getSetting(key, defaultValue = null) {
    return this.getSettings()[key] ?? defaultValue;
  },

  setSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.save("settings", settings);
  },
};
