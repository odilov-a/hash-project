const subtleHashReal = `// core.js
const subtleHash = async (name, data) => {
  const buffer = await subtle.digest(name, utils.stringToBytes(data));
  return utils.bytesToHex(new Uint8Array(buffer));
};

SHA256: (d) => subtleHash("SHA-256", d)`;

const merkleDamgardExplain = (rounds, note) => `1. Pad the message so its length is a multiple of the block size
    (append a 1 bit, zero bits, then the original bit-length).
2. Split the padded message into fixed-size blocks.
3. Run each block through ${rounds} of mixing (shifts, rotations,
    XOR, modular addition) with the previous block's output —
    this chaining is the "Merkle–Damgård construction".
4. The final chaining value, formatted as hex, is the digest.
${note}`;

export const snippets = {
  hash: {
    SHA256: {
      real: subtleHashReal,
      explain: merkleDamgardExplain(
        "64 rounds of SHA-256's compression function",
        "Still considered cryptographically strong; the default choice for new code.",
      ),
      note: "256-bit digest · 64 hex chars · SHA-2 family · Web Crypto native",
    },
    SHA384: {
      real: subtleHashReal.replace("SHA-256", "SHA-384"),
      explain: merkleDamgardExplain(
        "80 rounds of SHA-512's compression function, truncated to 384 bits",
        "Same internals as SHA-512 with different initial values and a truncated output.",
      ),
      note: "384-bit digest · 96 hex chars · SHA-2 family · Web Crypto native",
    },
    SHA512: {
      real: subtleHashReal.replace("SHA-256", "SHA-512"),
      explain: merkleDamgardExplain(
        "80 rounds operating on 64-bit words instead of 32-bit",
        "Larger internal state than SHA-256 — often faster on 64-bit CPUs despite the bigger output.",
      ),
      note: "512-bit digest · 128 hex chars · SHA-2 family · Web Crypto native",
    },
    SHA1: {
      real: subtleHashReal.replace("SHA-256", "SHA-1"),
      explain: merkleDamgardExplain(
        "80 rounds of SHA-1's compression function",
        "Broken: a practical collision (SHAttered, 2017) exists. Kept here for legacy/compat use only.",
      ),
      note: "160-bit digest · 40 hex chars · SHA-1 family · broken since 2017",
    },
    MD5: {
      real: `// core.js — CryptoJS loaded lazily from CDN (Web Crypto has no MD5)
MD5: async (d) => (await loadCryptoJS()).MD5(d).toString()`,
      explain: merkleDamgardExplain(
        "4 rounds of 16 operations each, over 128 bits of state",
        "Broken: collisions are trivial to generate in seconds. Never use for security — checksums/dedup only.",
      ),
      note: "128-bit digest · 32 hex chars · needs CryptoJS CDN · broken since 2004",
    },
    SHA224: {
      real: `// core.js — CryptoJS loaded lazily from CDN (Web Crypto has no SHA-224)
SHA224: async (d) => (await loadCryptoJS()).SHA224(d).toString()`,
      explain: merkleDamgardExplain(
        "64 rounds of SHA-256's compression function, truncated to 224 bits",
        "Same internals as SHA-256 with different initial values and a truncated output.",
      ),
      note: "224-bit digest · 56 hex chars · needs CryptoJS CDN",
    },
    "SHA3-256": {
      real: `// core.js — CryptoJS loaded lazily from CDN (Web Crypto has no SHA-3)
"SHA3-256": async (d) =>
  (await loadCryptoJS()).SHA3(d, { outputLength: 256 }).toString()`,
      explain: `1. Absorb: XOR the padded message, block by block, into a 1600-bit state.
2. Between blocks, scramble the whole state with the Keccak-f
   permutation (5 internal step types repeated 24 rounds).
3. Squeeze: read 256 bits out of the state as the digest.
This "sponge construction" is structurally different from SHA-2's
Merkle–Damgård chaining — a different family, not just a bigger SHA-2.`,
      note: "256-bit digest · 64 hex chars · Keccak/sponge family · needs CryptoJS CDN",
    },
    "SHA3-512": {
      real: `// core.js — CryptoJS loaded lazily from CDN (Web Crypto has no SHA-3)
"SHA3-512": async (d) =>
  (await loadCryptoJS()).SHA3(d, { outputLength: 512 }).toString()`,
      explain: `Same Keccak sponge construction as SHA3-256 (absorb → permute →
squeeze), just squeezing out 512 bits instead of 256. The larger
output costs some speed but doubles the collision resistance margin.`,
      note: "512-bit digest · 128 hex chars · Keccak/sponge family · needs CryptoJS CDN",
    },
  },

  hmac: {
    SHA256: {
      real: `// core.js
const HMAC_HASHES = { SHA256: "SHA-256", SHA512: "SHA-512", SHA1: "SHA-1" };

async hmac(algo, data, key) {
  const hash = HMAC_HASHES[algo];
  const cryptoKey = await subtle.importKey(
    "raw", utils.stringToBytes(key), { name: "HMAC", hash }, false, ["sign"],
  );
  const signature = await subtle.sign("HMAC", cryptoKey, utils.stringToBytes(data));
  return utils.bytesToHex(new Uint8Array(signature));
}`,
      explain: `HMAC(key, msg) = H( (key ⊕ opad) || H( (key ⊕ ipad) || msg ) )
— hash the message together with the key twice, using two different
padding constants (ipad/opad) to separate the "inner" and "outer" hash.
Unlike a plain hash, only someone holding the key can produce a
matching HMAC — it proves both integrity AND authenticity.`,
      note: "HMAC-SHA256 · 256-bit tag · Web Crypto native",
    },
    SHA512: {
      real: `// core.js — same generic hmac(), parameterized by algo
async hmac(algo, data, key) {
  const hash = HMAC_HASHES[algo]; // "SHA-512"
  const cryptoKey = await subtle.importKey(
    "raw", utils.stringToBytes(key), { name: "HMAC", hash }, false, ["sign"],
  );
  const signature = await subtle.sign("HMAC", cryptoKey, utils.stringToBytes(data));
  return utils.bytesToHex(new Uint8Array(signature));
}`,
      explain: `Same inner/outer double-hash construction as HMAC-SHA256, just built
on top of SHA-512 instead. HMAC(key, msg) = H((key⊕opad) || H((key⊕ipad) || msg)).`,
      note: "HMAC-SHA512 · 512-bit tag · Web Crypto native",
    },
    SHA1: {
      real: `// core.js — same generic hmac(), parameterized by algo
async hmac(algo, data, key) {
  const hash = HMAC_HASHES[algo]; // "SHA-1"
  const cryptoKey = await subtle.importKey(
    "raw", utils.stringToBytes(key), { name: "HMAC", hash }, false, ["sign"],
  );
  const signature = await subtle.sign("HMAC", cryptoKey, utils.stringToBytes(data));
  return utils.bytesToHex(new Uint8Array(signature));
}`,
      explain: `Same construction as the others, built on SHA-1. Note: HMAC-SHA1 is
still considered structurally sound even though plain SHA-1 is broken —
HMAC's security doesn't rely on collision-resistance the same way a
bare hash does. Prefer SHA-256/512 for new systems regardless.`,
      note: "HMAC-SHA1 · 160-bit tag · Web Crypto native",
    },
  },

  aes: {
    _: {
      real: `// core.js
const deriveAesKey = async (password, salt, usages) => {
  const baseKey = await subtle.importKey(
    "raw", utils.stringToBytes(password), "PBKDF2", false, ["deriveKey"],
  );
  return subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
    baseKey, { name: "AES-GCM", length: 256 }, false, usages,
  );
};

async aesGcmEncrypt(data, password) {
  const salt = wc.getRandomValues(new Uint8Array(16));
  const iv = wc.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKey(password, salt, ["encrypt"]);
  const encrypted = await subtle.encrypt({ name: "AES-GCM", iv }, key, utils.stringToBytes(data));
  // Output format: [salt(16)][iv(12)][ciphertext]
  return utils.bytesToBase64(/* salt + iv + encrypted, concatenated */);
}`,
      explain: `1. PBKDF2 stretches your password + a random salt into a 256-bit key
   (100,000 rounds of SHA-256) — this is what makes a short, guessable
   password safe to use as an encryption key.
2. AES-GCM encrypts the data AND produces an authentication tag in one
   step, so tampering with the ciphertext is detected on decrypt
   (unlike plain AES-CBC, which only hides data, not tamper-proofs it).
3. The random salt + IV (nonce) are prepended to the output, since the
   decryptor needs them and they don't need to be secret.`,
      note: "AES-256-GCM · PBKDF2 (100k rounds) key derivation · Web Crypto native",
    },
  },

  "rsa-keys": {
    _: {
      real: `// core.js
generateRSAKeyPair(bits = 2048) {
  return subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: bits,
      publicExponent: new Uint8Array([1, 0, 1]), // 65537
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );
}

const pemFormat = (label, base64) =>
  \`-----BEGIN \${label}-----\\n\${base64.match(/.{1,64}/g).join("\\n")}\\n-----END \${label}-----\`;`,
      explain: `RSA's security rests on how hard it is to factor the product of two
large random primes back into those primes. modulusLength (2048/3072/
4096) is the bit-length of that product — bigger means harder to
factor but slower. The public exponent 65537 (0x10001) is the
near-universal default: large enough to resist small-exponent attacks,
small enough to keep encryption fast. OAEP is a padding scheme applied
before encryption so that ciphertexts don't leak structure an attacker
could exploit (a real risk with unpadded "textbook RSA").`,
      note: "RSA-OAEP · SHA-256 · PEM-encoded SPKI/PKCS8 export · Web Crypto native",
    },
  },

  base64: {
    _: {
      real: `// core.js
base64Encode: (str) => btoa(unescape(encodeURIComponent(str))),
base64Decode: (str) => decodeURIComponent(escape(atob(str))),`,
      explain: `Base64 maps every 3 input bytes to 4 output characters drawn from a
64-character alphabet (A–Z, a–z, 0–9, +, /), padding with "=" when the
input isn't a multiple of 3 bytes. It's an encoding, not encryption —
anyone can decode it; it exists to make arbitrary binary data safe to
put in text-only contexts (URLs, JSON, email). The encodeURIComponent/
escape dance here exists only because JS's own atob/btoa work on
Latin-1 bytes, not UTF-8 — that wrapper lets multi-byte characters
round-trip correctly.`,
      note: "RFC 4648 Base64 · reversible encoding, not encryption",
    },
  },

  qr: {
    _: {
      real: `// core.js — qrcode-generator loaded lazily from CDN
async generateQRMatrix(text, errorCorrectionLevel = "M") {
  const qrcodeLib = await loadQRCodeLib();
  const qr = qrcodeLib(0, errorCorrectionLevel); // typeNumber 0 = auto-size
  qr.addData(text);
  qr.make();
  const size = qr.getModuleCount();
  const matrix = Array.from({ length: size }, (_, row) =>
    Array.from({ length: size }, (_, col) => qr.isDark(row, col)),
  );
  return { size, matrix };
}

// ui.js — draws the boolean matrix onto a <canvas>
renderQRMatrix(canvasId, { size, matrix }, scale = 8) {
  const ctx = canvas.getContext("2d");
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (matrix[row][col]) ctx.fillRect(col * scale, row * scale, scale, scale);
    }
  }
}`,
      explain: `1. Your text is packed into a bitstream and split across 8-bit
   codewords, using the most compact mode that fits (numeric →
   alphanumeric → byte).
2. Reed–Solomon error-correction codewords are appended, so the
   code still scans even if part of it is dirty, torn, or covered
   by a logo — the "L/M/Q/H" level controls how much redundancy
   you trade for data capacity.
3. Data + EC codewords are placed into a square grid around three
   fixed finder patterns (the corner squares) following a
   zig-zag fill rule, then one of 8 mask patterns is applied to
   avoid patterns that confuse scanners.
4. Each grid cell becomes a black (dark) or white (light) module —
   that boolean matrix is what gets painted to the canvas.`,
      note: "ISO/IEC 18004 QR Code · Reed–Solomon EC · needs qrcode-generator CDN",
    },
  },

  encoding: {
    Hex: {
      real: `// core.js
hexEncode(str) {
  return Array.from(str, (c) => c.charCodeAt(0).toString(16).padStart(2, "0")).join("");
},
hexDecode(hex) {
  let result = "";
  for (let i = 0; i < hex.length; i += 2) {
    result += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
  }
  return result;
}`,
      explain: `Every character's byte value is written as two base-16 digits
(00–ff). It's a direct, reversible 1:1 mapping — no compression, no
alphabet tricks — which is why hex output is always exactly double
the length of the input.`,
      note: "Base-16 encoding · output is always 2× input length",
    },
    URL: {
      real: `// core.js
urlEncode: (str) => encodeURIComponent(str),
urlDecode: (str) => decodeURIComponent(str),`,
      explain: `Percent-encoding: any character that isn't safe inside a URL
component gets replaced with %XX, where XX is that byte's hex value
(space → %20, & → %26, etc.). Keeps arbitrary text safe to embed in a
query string or path segment without colliding with URL syntax.`,
      note: "RFC 3986 percent-encoding · browser-native encodeURIComponent",
    },
    HTML: {
      real: `// core.js
htmlEncode(str) {
  const el = document.createElement("textarea");
  el.textContent = str;
  return el.innerHTML;
},
htmlDecode(str) {
  const el = document.createElement("textarea");
  el.innerHTML = str;
  return el.textContent;
}`,
      explain: `Rather than hand-write an entity table, this leans on the browser: set
a <textarea>'s textContent (which never interprets markup), then read
back .innerHTML — the browser itself escapes <, >, &, quotes, etc. into
their HTML entities (&lt; &gt; &amp; ...). Decoding runs the same trick
in reverse. Guarantees the result matches exactly what the browser's
own parser considers safe.`,
      note: "HTML entity encoding · delegates to the browser's own escaping",
    },
  },
};

export default snippets;
