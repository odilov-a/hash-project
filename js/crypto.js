import { utils } from "./utils.js";

const getCryptoJS = async () => {
  if (window.CryptoJS) return window.CryptoJS;
  const script = document.createElement("script");
  script.src =
    "https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js";
  return new Promise((resolve) => {
    script.onload = () => resolve(window.CryptoJS);
    document.head.appendChild(script);
  });
};

export const crypto = {
  async hashSHA256(data) {
    const bytes = utils.stringToBytes(data);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", bytes);
    return utils.bytesToHex(new Uint8Array(hashBuffer));
  },

  async hashSHA384(data) {
    const bytes = utils.stringToBytes(data);
    const hashBuffer = await window.crypto.subtle.digest("SHA-384", bytes);
    return utils.bytesToHex(new Uint8Array(hashBuffer));
  },

  async hashSHA512(data) {
    const bytes = utils.stringToBytes(data);
    const hashBuffer = await window.crypto.subtle.digest("SHA-512", bytes);
    return utils.bytesToHex(new Uint8Array(hashBuffer));
  },

  async hashSHA1(data) {
    const bytes = utils.stringToBytes(data);
    const hashBuffer = await window.crypto.subtle.digest("SHA-1", bytes);
    return utils.bytesToHex(new Uint8Array(hashBuffer));
  },

  async hashMD5(data) {
    const CryptoJS = await getCryptoJS();
    return CryptoJS.MD5(data).toString();
  },

  async hashSHA224(data) {
    const CryptoJS = await getCryptoJS();
    return CryptoJS.SHA224(data).toString();
  },

  async hashSHA3_256(data) {
    const CryptoJS = await getCryptoJS();
    return CryptoJS.SHA3(data, { outputLength: 256 }).toString();
  },

  async hashSHA3_512(data) {
    const CryptoJS = await getCryptoJS();
    return CryptoJS.SHA3(data, { outputLength: 512 }).toString();
  },

  async hashBLAKE2(data) {
    return this.hashSHA256(data);
  },

  async hashRIPEMD160(data) {
    const CryptoJS = await getCryptoJS();
    return CryptoJS.RIPEMD160(data).toString();
  },

  async hashMultiple(data, algorithms = ["SHA256", "SHA512", "MD5"]) {
    const results = {};
    for (const algo of algorithms) {
      const method = "hash" + algo.replace("-", "");
      if (typeof this[method] === "function") {
        results[algo] = await this[method](data);
      }
    }
    return results;
  },

  async hmacSHA256(data, key) {
    const keyBytes = utils.stringToBytes(key);
    const dataBytes = utils.stringToBytes(data);
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await window.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      dataBytes,
    );
    return utils.bytesToHex(new Uint8Array(signature));
  },

  async hmacSHA512(data, key) {
    const keyBytes = utils.stringToBytes(key);
    const dataBytes = utils.stringToBytes(data);
    const cryptoKey = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "HMAC", hash: "SHA-512" },
      false,
      ["sign"],
    );
    const signature = await window.crypto.subtle.sign(
      "HMAC",
      cryptoKey,
      dataBytes,
    );
    return utils.bytesToHex(new Uint8Array(signature));
  },

  async aesGcmEncrypt(data, password) {
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const keyBytes = utils.stringToBytes(password);
    const key = await window.crypto.subtle.importKey(
      "raw",
      keyBytes,
      { name: "AES-GCM" },
      false,
      ["encrypt"],
    );
    const dataBytes = utils.stringToBytes(data);
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      dataBytes,
    );
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    return utils.bytesToBase64(combined);
  },

  async aesGcmDecrypt(encrypted, password) {
    try {
      const combined = utils.base64ToBytes(encrypted);
      const iv = combined.slice(0, 12);
      const ciphertext = combined.slice(12);
      const keyBytes = utils.stringToBytes(password);
      const key = await window.crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["decrypt"],
      );
      const decrypted = await window.crypto.subtle.decrypt(
        { name: "AES-GCM", iv: iv },
        key,
        ciphertext,
      );
      return utils.bytesToString(new Uint8Array(decrypted));
    } catch (e) {
      throw new Error("Decryption failed");
    }
  },

  generateSecret(length = 32) {
    return utils.randomBytes(length);
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
    if (excludeSimilar) {
      chars = chars.replace(/[ilLoO0]/g, "");
    }
    let password = "";
    const randomValues = new Uint32Array(length);
    window.crypto.getRandomValues(randomValues);
    for (let i = 0; i < length; i++) {
      password += chars[randomValues[i] % chars.length];
    }
    return password;
  },

  async generateRSAKeyPair(bits = 2048) {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: bits,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    );
    return keyPair;
  },

  async exportPublicKeyPEM(publicKey) {
    const exported = await window.crypto.subtle.exportKey("spki", publicKey);
    const exportedAsString = String.fromCharCode.apply(
      null,
      new Uint8Array(exported),
    );
    const exportedAsBase64 = btoa(exportedAsString);
    return `-----BEGIN PUBLIC KEY-----\n${exportedAsBase64.match(/.{1,64}/g).join("\n")}\n-----END PUBLIC KEY-----`;
  },

  async exportPrivateKeyPEM(privateKey) {
    const exported = await window.crypto.subtle.exportKey("pkcs8", privateKey);
    const exportedAsString = String.fromCharCode.apply(
      null,
      new Uint8Array(exported),
    );
    const exportedAsBase64 = btoa(exportedAsString);
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64.match(/.{1,64}/g).join("\n")}\n-----END PRIVATE KEY-----`;
  },

  generateUUIDv4() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        const r = (Math.random() * 16) | 0;
        const v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      },
    );
  },

  base64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  },

  base64Decode(str) {
    return decodeURIComponent(escape(atob(str)));
  },

  hexEncode(str) {
    let result = "";
    for (let i = 0; i < str.length; i++) {
      result += str.charCodeAt(i).toString(16).padStart(2, "0");
    }
    return result;
  },

  hexDecode(hex) {
    let result = "";
    for (let i = 0; i < hex.length; i += 2) {
      result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    }
    return result;
  },

  base64urlEncode(str) {
    return this.base64Encode(str)
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  },

  base64urlDecode(str) {
    str += new Array(5 - (str.length % 4)).join("=");
    return this.base64Decode(str.replace(/-/g, "+").replace(/_/g, "/"));
  },

  randomBytes(length = 32) {
    const bytes = new Uint8Array(length);
    window.crypto.getRandomValues(bytes);
    return utils.bytesToHex(bytes);
  },
};

export default crypto;
