import { ui } from './ui.js';
import { crypto } from './crypto.js';
import { storage } from './storage.js';
import { utils } from './utils.js';

const createTool = (name, icon) => ({
    name,
    icon,
    render: null,
    setup: null
});

export const tools = {
    'secret-key': {
        name: 'Secret Key Generator',
        icon: '',
        render() {
            return ui.createCard(
                'Secret Key Generator',
                '',
                `
                    <div class="options-group">
                        <div class="options-title">Key Type</div>
                        ${ui.createAlgorithmButtons('key-type-selector', [
                            'Random',
                            'AES Key',
                            'JWT Secret',
                            'API Key',
                            'HMAC Secret'
                        ], 'Random')}
                    </div>
                    ${ui.createSlider('key-length', 'Key Length (bytes)', 8, 512, 32, 'In hexadecimal format')}
                    <div style="margin-bottom: var(--spacing-lg);">
                        <button class="btn btn-primary w-full" id="generate-key" style="margin-bottom: var(--spacing-md);">
                            Generate Key
                        </button>
                    </div>
                    ${ui.createOutput('key-output', 'Generated Key')}
                `
            );
        },
        async setup() {
            ui.setupAlgorithmButtons('key-type-selector', () => {});
            ui.setupSlider('key-length', () => {});
            const generateBtn = document.getElementById('generate-key');
            generateBtn?.addEventListener('click', async () => {
                const length = parseInt(document.getElementById('key-length').value);
                const keyType = ui.getActiveAlgorithm('key-type-selector');
                ui.showLoading('Generating key...');
                try {
                    const key = utils.randomBytes(length);
                    const output = document.getElementById('key-output');
                    output.textContent = key;
                    output.classList.remove('output-empty');
                    storage.saveHistory('secret-key', { key, keyType, length });
                    utils.showToast('Key generated successfully', 'success');
                } catch (e) {
                    utils.showToast('Failed to generate key', 'error');
                    console.error(e);
                } finally {
                    ui.hideLoading();
                }
            });
        }
    },

    'password': {
        name: 'Password Generator',
        icon: '',
        render() {
            return ui.createCard(
                'Password Generator',
                '',
                `
                    ${ui.createSlider('password-length', 'Password Length', 8, 128, 16)}
                    <div class="options-group">
                        <div class="options-title">Character Types</div>
                        ${ui.createCheckboxGroup('password-options', [
                            { id: 'use-uppercase', label: 'Uppercase (A-Z)', checked: true },
                            { id: 'use-lowercase', label: 'Lowercase (a-z)', checked: true },
                            { id: 'use-numbers', label: 'Numbers (0-9)', checked: true },
                            { id: 'use-symbols', label: 'Symbols (!@#$...)', checked: true },
                            { id: 'exclude-similar', label: 'Exclude Similar (il1Lo0)', checked: false }
                        ])}
                    </div>
                    ${ui.createStrengthMeter('password-strength')}
                    <div style="margin-bottom: var(--spacing-lg);">
                        <button class="btn btn-primary w-full" id="generate-password" style="margin-bottom: var(--spacing-md);">
                            Generate Password
                        </button>
                    </div>
                    ${ui.createOutput('password-output', 'Generated Password')}
                `
            );
        },
        async setup() {
            ui.setupSlider('password-length', () => {});
            const generateBtn = document.getElementById('generate-password');
            generateBtn?.addEventListener('click', async () => {
                const length = parseInt(document.getElementById('password-length').value);
                const options = ui.getCheckboxGroupValues('password-options');
                ui.showLoading('Generating password...');
                try {
                    const password = crypto.generatePassword(length, {
                        uppercase: options['use-uppercase'],
                        lowercase: options['use-lowercase'],
                        numbers: options['use-numbers'],
                        symbols: options['use-symbols'],
                        excludeSimilar: options['exclude-similar']
                    });

                    const output = document.getElementById('password-output');
                    output.textContent = password;
                    output.classList.remove('output-empty');

                    const strength = utils.getPasswordStrength(password);
                    const entropy = utils.calculateEntropy(password);
                    ui.updateStrengthMeter('password-strength', entropy, strength.level);

                    storage.saveHistory('password', { password, length });
                    utils.showToast('Password generated successfully', 'success');
                } catch (e) {
                    utils.showToast('Failed to generate password', 'error');
                    console.error(e);
                } finally {
                    ui.hideLoading();
                }
            });
        }
    },

    'hash': {
        name: 'Hash Generator',
        icon: '',
        render() {
            return ui.createCard(
                'Hash Generator',
                '',
                `
                    <div class="form-group">
                        <label class="form-label" for="hash-input">Input Text</label>
                        <textarea id="hash-input" class="form-input form-textarea" placeholder="Enter text to hash..."></textarea>
                    </div>

                    <div class="options-group">
                        <div class="options-title">Hash Algorithms</div>
                        ${ui.createAlgorithmButtons('hash-algo-selector', [
                            'SHA256', 'SHA512', 'SHA1', 'MD5', 'SHA384', 'SHA224', 'SHA3-256', 'SHA3-512'
                        ], 'SHA256')}
                    </div>

                    <button class="btn btn-primary w-full" id="generate-hash" style="margin-bottom: var(--spacing-lg);">
                        Generate Hash
                    </button>

                    ${ui.createOutput('hash-output', 'Hash Output')}
                `
            );
        },
        async setup() {
            ui.setupAlgorithmButtons('hash-algo-selector', () => {});

            const hashInput = document.getElementById('hash-input');
            const generateBtn = document.getElementById('generate-hash');

            const generateHash = async () => {
                const input = hashInput.value;
                if (!input) {
                    utils.showToast('Please enter text to hash', 'error');
                    return;
                }

                const algo = ui.getActiveAlgorithm('hash-algo-selector');
                const methodName = 'hash' + algo.replace('-', '');

                ui.showLoading(`Hashing with ${algo}...`);

                try {
                    const result = await crypto[methodName](input);
                    const output = document.getElementById('hash-output');
                    output.textContent = result;
                    output.classList.remove('output-empty');

                    storage.saveHistory('hash', { input, algo, result });
                } catch (e) {
                    utils.showToast(`Failed to hash: ${e.message}`, 'error');
                    console.error(e);
                } finally {
                    ui.hideLoading();
                }
            };

            generateBtn?.addEventListener('click', generateHash);

            hashInput?.addEventListener('input', utils.debounce(generateHash, 500));
        }
    },

    'hash-detect': {
        name: 'Hash Detector',
        icon: '',
        render() {
            return ui.createCard(
                'Hash Detector',
                '',
                `
                    <div class="form-group">
                        <label class="form-label" for="detect-input">Paste Hash</label>
                        <input type="text" id="detect-input" class="form-input" placeholder="Paste a hash to detect its type...">
                    </div>

                    ${ui.createOutput('detect-output', 'Detected Hash Types')}
                `
            );
        },
        async setup() {
            const input = document.getElementById('detect-input');

            input?.addEventListener('input', utils.debounce((e) => {
                const hash = e.target.value;
                const types = utils.detectHashType(hash);

                const output = document.getElementById('detect-output');
                if (types.length > 0) {
                    output.innerHTML = types.map(type => `
                        <div style="padding: var(--spacing-md); background: rgba(0, 200, 150, 0.1); border-radius: var(--radius-md); margin-bottom: var(--spacing-sm);">
                            <strong>${type}</strong>
                        </div>
                    `).join('');
                    output.classList.remove('output-empty');
                } else {
                    output.textContent = 'No matching hash types found';
                    output.classList.add('output-empty');
                }
            }, 300));
        }
    },

    'aes': {
        name: 'AES Encryption',
        icon: '',
        render() {
            return ui.createCard(
                'AES-GCM Encryption',
                '',
                `
                    <div class="form-group">
                        <label class="form-label" for="aes-input">Text to Encrypt</label>
                        <textarea id="aes-input" class="form-input form-textarea" placeholder="Enter text to encrypt..."></textarea>
                    </div>

                    <div class="form-group">
                        <label class="form-label" for="aes-password">Password</label>
                        <input type="password" id="aes-password" class="form-input" placeholder="Enter encryption password...">
                    </div>

                    <div style="margin-bottom: var(--spacing-lg);">
                        <button class="btn btn-primary" id="encrypt-btn" style="margin-right: var(--spacing-md);">
                            Encrypt
                        </button>
                        <button class="btn btn-secondary" id="decrypt-btn">
                            Decrypt
                        </button>
                    </div>

                    ${ui.createOutput('aes-output', 'Result')}
                `
            );
        },
        async setup() {
            const inputField = document.getElementById('aes-input');
            const passwordField = document.getElementById('aes-password');
            const encryptBtn = document.getElementById('encrypt-btn');
            const decryptBtn = document.getElementById('decrypt-btn');

            encryptBtn?.addEventListener('click', async () => {
                const input = inputField.value;
                const password = passwordField.value;

                if (!input || !password) {
                    utils.showToast('Please enter text and password', 'error');
                    return;
                }

                ui.showLoading('Encrypting...');

                try {
                    const encrypted = await crypto.aesGcmEncrypt(input, password);
                    const output = document.getElementById('aes-output');
                    output.textContent = encrypted;
                    output.classList.remove('output-empty');

                    utils.showToast('Encrypted successfully', 'success');
                } catch (e) {
                    utils.showToast(`Encryption failed: ${e.message}`, 'error');
                } finally {
                    ui.hideLoading();
                }
            });

            decryptBtn?.addEventListener('click', async () => {
                const encrypted = inputField.value;
                const password = passwordField.value;

                if (!encrypted || !password) {
                    utils.showToast('Please enter encrypted text and password', 'error');
                    return;
                }

                ui.showLoading('Decrypting...');

                try {
                    const decrypted = await crypto.aesGcmDecrypt(encrypted, password);
                    const output = document.getElementById('aes-output');
                    output.textContent = decrypted;
                    output.classList.remove('output-empty');

                    utils.showToast('Decrypted successfully', 'success');
                } catch (e) {
                    utils.showToast(`Decryption failed: ${e.message}`, 'error');
                } finally {
                    ui.hideLoading();
                }
            });
        }
    },

    'uuid': {
        name: 'UUID Generator',
        icon: '',
        render() {
            return ui.createCard(
                'UUID Generator',
                '📮',
                `
                    <div class="options-group">
                        <div class="options-title">UUID Version</div>
                        ${ui.createAlgorithmButtons('uuid-version-selector', [
                            'v4'
                        ], 'v4')}
                    </div>

                    <button class="btn btn-primary w-full" id="generate-uuid" style="margin-bottom: var(--spacing-lg);">
                        Generate UUID
                    </button>

                    ${ui.createOutput('uuid-output', 'Generated UUIDs')}
                `
            );
        },
        async setup() {
            const generateBtn = document.getElementById('generate-uuid');

            generateBtn?.addEventListener('click', () => {
                const uuid = crypto.generateUUIDv4();
                const output = document.getElementById('uuid-output');
                output.textContent = uuid;
                output.classList.remove('output-empty');

                storage.saveHistory('uuid', { uuid, version: 'v4' });
                utils.showToast('UUID generated', 'success');
            });
        }
    },

    // JWT Tools
    'jwt': {
        name: 'JWT Tools',
        icon: '',
        render() {
            return ui.createCard(
                'JWT Tools',
                '⚡',
                `
                    <div class="form-group">
                        <label class="form-label" for="jwt-token">JWT Token</label>
                        <textarea id="jwt-token" class="form-input form-textarea" placeholder="Paste JWT token here..."></textarea>
                    </div>

                    <button class="btn btn-secondary w-full" id="decode-jwt" style="margin-bottom: var(--spacing-lg);">
                        Decode JWT
                    </button>

                    ${ui.createOutput('jwt-output', 'Decoded JWT')}
                `
            );
        },
        async setup() {
            const tokenField = document.getElementById('jwt-token');
            const decodeBtn = document.getElementById('decode-jwt');

            decodeBtn?.addEventListener('click', () => {
                const token = tokenField.value.trim();

                try {
                    const parts = token.split('.');
                    if (parts.length !== 3) {
                        utils.showToast('Invalid JWT format', 'error');
                        return;
                    }

                    const decode = (part) => {
                        const padded = part + '='.repeat((4 - part.length % 4) % 4);
                        return JSON.parse(atob(padded));
                    };

                    const header = decode(parts[0]);
                    const payload = decode(parts[1]);

                    const output = document.getElementById('jwt-output');
                    output.textContent = JSON.stringify({
                        header,
                        payload
                    }, null, 2);
                    output.classList.remove('output-empty');

                    utils.showToast('JWT decoded successfully', 'success');
                } catch (e) {
                    utils.showToast(`Failed to decode JWT: ${e.message}`, 'error');
                }
            });
        }
    },

    // Base64 Encoding
    'base64': {
        name: 'Base64 Encoding',
        icon: '',
        render() {
            return ui.createCard(
                'Base64 Encoder/Decoder',
                '📝',
                `
                    <div class="form-group">
                        <label class="form-label" for="base64-input">Input</label>
                        <textarea id="base64-input" class="form-input form-textarea" placeholder="Enter text to encode or decode..."></textarea>
                    </div>

                    <div style="margin-bottom: var(--spacing-lg);">
                        <button class="btn btn-primary" id="encode-base64" style="margin-right: var(--spacing-md);">
                            Encode
                        </button>
                        <button class="btn btn-secondary" id="decode-base64">
                            Decode
                        </button>
                    </div>

                    ${ui.createOutput('base64-output', 'Output')}
                `
            );
        },
        async setup() {
            const input = document.getElementById('base64-input');
            const encodeBtn = document.getElementById('encode-base64');
            const decodeBtn = document.getElementById('decode-base64');

            encodeBtn?.addEventListener('click', () => {
                try {
                    const encoded = crypto.base64Encode(input.value);
                    const output = document.getElementById('base64-output');
                    output.textContent = encoded;
                    output.classList.remove('output-empty');
                    utils.showToast('Encoded successfully', 'success');
                } catch (e) {
                    utils.showToast('Encoding failed', 'error');
                }
            });

            decodeBtn?.addEventListener('click', () => {
                try {
                    const decoded = crypto.base64Decode(input.value);
                    const output = document.getElementById('base64-output');
                    output.textContent = decoded;
                    output.classList.remove('output-empty');
                    utils.showToast('Decoded successfully', 'success');
                } catch (e) {
                    utils.showToast('Decoding failed', 'error');
                }
            });
        }
    },

    // HMAC
    'hmac': {
        name: 'HMAC',
        icon: '',
        render() {
            return ui.createCard(
                'HMAC Generator',
                '🛡️',
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
                        ${ui.createAlgorithmButtons('hmac-algo-selector', [
                            'SHA256', 'SHA512', 'SHA1'
                        ], 'SHA256')}
                    </div>

                    <button class="btn btn-primary w-full" id="generate-hmac" style="margin-bottom: var(--spacing-lg);">
                        Generate HMAC
                    </button>

                    ${ui.createOutput('hmac-output', 'HMAC')}
                `
            );
        },
        async setup() {
            ui.setupAlgorithmButtons('hmac-algo-selector', () => {});

            const input = document.getElementById('hmac-input');
            const key = document.getElementById('hmac-key');
            const generateBtn = document.getElementById('generate-hmac');

            generateBtn?.addEventListener('click', async () => {
                if (!input.value || !key.value) {
                    utils.showToast('Please enter message and key', 'error');
                    return;
                }

                const algo = ui.getActiveAlgorithm('hmac-algo-selector');

                ui.showLoading('Generating HMAC...');

                try {
                    const methodName = 'hmac' + algo.replace('-', '');
                    const hmac = await crypto[methodName](input.value, key.value);
                    const output = document.getElementById('hmac-output');
                    output.textContent = hmac;
                    output.classList.remove('output-empty');

                    utils.showToast('HMAC generated', 'success');
                } catch (e) {
                    utils.showToast('Failed to generate HMAC', 'error');
                } finally {
                    ui.hideLoading();
                }
            });
        }
    },

    // Encoding Tools
    'encoding': {
        name: 'Encoding Tools',
        icon: '',
        render() {
            return ui.createCard(
                'Encoding Tools',
                '🔤',
                `
                    <div class="form-group">
                        <label class="form-label" for="encoding-input">Input</label>
                        <textarea id="encoding-input" class="form-input form-textarea" placeholder="Enter text..."></textarea>
                    </div>

                    <div class="options-group">
                        <div class="options-title">Encoding Type</div>
                        ${ui.createAlgorithmButtons('encoding-type-selector', [
                            'Hex', 'URL', 'HTML'
                        ], 'Hex')}
                    </div>

                    <div style="margin-bottom: var(--spacing-lg);">
                        <button class="btn btn-primary" id="encode-btn" style="margin-right: var(--spacing-md);">
                            Encode
                        </button>
                        <button class="btn btn-secondary" id="decode-btn">
                            Decode
                        </button>
                    </div>

                    ${ui.createOutput('encoding-output', 'Output')}
                `
            );
        },
        async setup() {
            ui.setupAlgorithmButtons('encoding-type-selector', () => {});

            const input = document.getElementById('encoding-input');
            const encodeBtn = document.getElementById('encode-btn');
            const decodeBtn = document.getElementById('decode-btn');

            encodeBtn?.addEventListener('click', () => {
                const type = ui.getActiveAlgorithm('encoding-type-selector');
                let result;

                try {
                    switch (type) {
                        case 'Hex':
                            result = crypto.hexEncode(input.value);
                            break;
                        case 'URL':
                            result = utils.urlEncode(input.value);
                            break;
                        case 'HTML':
                            result = utils.htmlEncode(input.value);
                            break;
                    }

                    const output = document.getElementById('encoding-output');
                    output.textContent = result;
                    output.classList.remove('output-empty');
                    utils.showToast('Encoded successfully', 'success');
                } catch (e) {
                    utils.showToast('Encoding failed', 'error');
                }
            });

            decodeBtn?.addEventListener('click', () => {
                const type = ui.getActiveAlgorithm('encoding-type-selector');
                let result;

                try {
                    switch (type) {
                        case 'Hex':
                            result = crypto.hexDecode(input.value);
                            break;
                        case 'URL':
                            result = utils.urlDecode(input.value);
                            break;
                        case 'HTML':
                            result = utils.htmlDecode(input.value);
                            break;
                    }

                    const output = document.getElementById('encoding-output');
                    output.textContent = result;
                    output.classList.remove('output-empty');
                    utils.showToast('Decoded successfully', 'success');
                } catch (e) {
                    utils.showToast('Decoding failed', 'error');
                }
            });
        }
    },

    // Random Generator
    'random': {
        name: 'Random Generator',
        icon: '',
        render() {
            return ui.createCard(
                'Random Generator',
                '🎲',
                `
                    ${ui.createSlider('random-bytes-length', 'Random Bytes Length', 1, 256, 32)}

                    <button class="btn btn-primary w-full" id="generate-random" style="margin-bottom: var(--spacing-lg);">
                        Generate Random Bytes
                    </button>

                    ${ui.createOutput('random-output', 'Random Hex Output')}
                `
            );
        },
        async setup() {
            ui.setupSlider('random-bytes-length', () => {});

            const generateBtn = document.getElementById('generate-random');

            generateBtn?.addEventListener('click', () => {
                const length = parseInt(document.getElementById('random-bytes-length').value);
                const random = crypto.randomBytes(length);

                const output = document.getElementById('random-output');
                output.textContent = random;
                output.classList.remove('output-empty');

                storage.saveHistory('random', { random, length });
                utils.showToast('Random bytes generated', 'success');
            });
        }
    },

    // JSON Formatter
    'json': {
        name: 'JSON Formatter',
        icon: '',
        render() {
            return ui.createCard(
                'JSON Formatter',
                '{ }',
                `
                    <div class="form-group">
                        <label class="form-label" for="json-input">JSON Input</label>
                        <textarea id="json-input" class="form-input form-textarea" placeholder="Paste JSON..."></textarea>
                    </div>

                    <div style="margin-bottom: var(--spacing-lg);">
                        <button class="btn btn-primary" id="format-json" style="margin-right: var(--spacing-md);">
                            Format
                        </button>
                        <button class="btn btn-secondary" id="minify-json">
                            Minify
                        </button>
                    </div>

                    ${ui.createOutput('json-output', 'Output')}
                `
            );
        },
        async setup() {
            const input = document.getElementById('json-input');
            const formatBtn = document.getElementById('format-json');
            const minifyBtn = document.getElementById('minify-json');

            formatBtn?.addEventListener('click', () => {
                const formatted = utils.formatJSON(input.value);
                const output = document.getElementById('json-output');
                output.textContent = formatted;
                output.classList.remove('output-empty');
                utils.showToast('Formatted', 'success');
            });

            minifyBtn?.addEventListener('click', () => {
                const minified = utils.minifyJSON(input.value);
                const output = document.getElementById('json-output');
                output.textContent = minified;
                output.classList.remove('output-empty');
                utils.showToast('Minified', 'success');
            });
        }
    },

    // Checksum
    'checksum': {
        name: 'File Checksum',
        icon: '',
        render() {
            return ui.createCard(
                'File Checksum',
                '✓',
                `
                    <div class="dropzone" id="file-dropzone">
                        <div class="dropzone-icon">Select</div>
                        <p class="dropzone-text">Drop file here or click to select</p>
                        <p class="dropzone-hint">Supports any file type</p>
                        <input type="file" id="file-input" style="display: none;">
                    </div>

                    <div class="options-group" id="hash-algo-group" style="display: none;">
                        <div class="options-title">Hash Algorithm</div>
                        ${ui.createAlgorithmButtons('file-hash-algo', [
                            'SHA256', 'SHA512', 'SHA1', 'MD5'
                        ], 'SHA256')}
                    </div>

                    ${ui.createOutput('checksum-output', 'Checksums')}
                `
            );
        },
        async setup() {
            const dropzone = document.getElementById('file-dropzone');
            const fileInput = document.getElementById('file-input');
            const algoGroup = document.getElementById('hash-algo-group');

            ui.setupAlgorithmButtons('file-hash-algo', () => {});

            dropzone?.addEventListener('click', () => fileInput?.click());

            dropzone?.addEventListener('dragover', (e) => {
                e.preventDefault();
                dropzone.classList.add('dragover');
            });

            dropzone?.addEventListener('dragleave', () => {
                dropzone.classList.remove('dragover');
            });

            const handleFile = async (file) => {
                const reader = new FileReader();

                reader.onload = async (e) => {
                    ui.showLoading('Computing checksums...');
                    algoGroup.style.display = 'block';

                    try {
                        const content = e.target.result;
                        const text = new TextDecoder().decode(new Uint8Array(content));

                        const sha256 = await crypto.hashSHA256(text);
                        const sha512 = await crypto.hashSHA512(text);
                        const md5 = await crypto.hashMD5(text);

                        const output = document.getElementById('checksum-output');
                        output.innerHTML = `
                            <div style="margin-bottom: var(--spacing-md);">
                                <strong>File:</strong> ${file.name}<br>
                                <strong>Size:</strong> ${utils.formatBytes(file.size)}
                            </div>
                            <div class="hash-list">
                                <div class="hash-item">
                                    <div class="hash-name">SHA256</div>
                                    <div class="hash-value">${sha256}</div>
                                </div>
                                <div class="hash-item">
                                    <div class="hash-name">SHA512</div>
                                    <div class="hash-value">${sha512}</div>
                                </div>
                                <div class="hash-item">
                                    <div class="hash-name">MD5</div>
                                    <div class="hash-value">${md5}</div>
                                </div>
                            </div>
                        `;
                        output.classList.remove('output-empty');

                        utils.showToast('Checksums computed', 'success');
                    } catch (err) {
                        utils.showToast('Failed to compute checksums', 'error');
                        console.error(err);
                    } finally {
                        ui.hideLoading();
                    }
                };

                reader.readAsArrayBuffer(file);
            };

            fileInput?.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    handleFile(e.target.files[0]);
                }
            });

            dropzone?.addEventListener('drop', (e) => {
                e.preventDefault();
                dropzone.classList.remove('dragover');
                if (e.dataTransfer.files.length > 0) {
                    handleFile(e.dataTransfer.files[0]);
                }
            });
        }
    },

    // RSA Keys
    'rsa-keys': {
        name: 'RSA Key Generator',
        icon: '',
        render() {
            return ui.createCard(
                'RSA Key Generator',
                '🔗',
                `
                    <div class="options-group">
                        <div class="options-title">Key Size</div>
                        ${ui.createAlgorithmButtons('rsa-size-selector', [
                            '2048', '3072', '4096'
                        ], '2048')}
                    </div>

                    <button class="btn btn-primary w-full" id="generate-rsa" style="margin-bottom: var(--spacing-lg);">
                        Generate RSA Key Pair
                    </button>

                    <div id="rsa-output" style="display: none;">
                        <div style="margin-bottom: var(--spacing-lg);">
                            <label class="form-label">Public Key (PEM)</label>
                            <div class="key-display" id="public-key-display"></div>
                            <button class="btn btn-secondary" id="copy-public" style="margin-top: var(--spacing-md);">
                                Copy Public Key
                            </button>
                        </div>

                        <div>
                            <label class="form-label">Private Key (PEM)</label>
                            <div class="key-display" id="private-key-display"></div>
                            <button class="btn btn-secondary" id="copy-private" style="margin-top: var(--spacing-md);">
                                Copy Private Key
                            </button>
                        </div>
                    </div>
                `
            );
        },
        async setup() {
            ui.setupAlgorithmButtons('rsa-size-selector', () => {});

            const generateBtn = document.getElementById('generate-rsa');

            generateBtn?.addEventListener('click', async () => {
                const size = parseInt(ui.getActiveAlgorithm('rsa-size-selector'));

                ui.showLoading('Generating RSA key pair... This may take a moment...');

                try {
                    const keyPair = await crypto.generateRSAKeyPair(size);
                    const publicKeyPem = await crypto.exportPublicKeyPEM(keyPair.publicKey);
                    const privateKeyPem = await crypto.exportPrivateKeyPEM(keyPair.privateKey);

                    document.getElementById('public-key-display').textContent = publicKeyPem;
                    document.getElementById('private-key-display').textContent = privateKeyPem;
                    document.getElementById('rsa-output').style.display = 'block';

                    document.getElementById('copy-public')?.addEventListener('click', async () => {
                        await utils.copyToClipboard(publicKeyPem);
                    });

                    document.getElementById('copy-private')?.addEventListener('click', async () => {
                        await utils.copyToClipboard(privateKeyPem);
                    });

                    utils.showToast('RSA key pair generated', 'success');
                } catch (e) {
                    utils.showToast('Failed to generate RSA keys', 'error');
                    console.error(e);
                } finally {
                    ui.hideLoading();
                }
            });
        }
    },

    // ECC Keys
    'ecc-keys': {
        name: 'ECC Key Generator',
        icon: '',
        render() {
            return ui.createCard(
                'ECC Key Generator',
                '⟳',
                `
                    <div class="options-group">
                        <div class="options-title">Curve</div>
                        ${ui.createAlgorithmButtons('ecc-curve-selector', [
                            'P256', 'P384', 'P521', 'Ed25519'
                        ], 'P256')}
                    </div>

                    <button class="btn btn-primary w-full" id="generate-ecc" style="margin-bottom: var(--spacing-lg);">
                        Generate ECC Key Pair
                    </button>

                    ${ui.createInfoBox('ECC keys are not yet fully supported in this version. Use RSA keys for now.')}
                `
            );
        },
        async setup() {
            ui.setupAlgorithmButtons('ecc-curve-selector', () => {});

            const generateBtn = document.getElementById('generate-ecc');
            generateBtn?.addEventListener('click', () => {
                utils.showToast('ECC key generation coming soon!', 'error');
            });
        }
    }
};

export default tools;
