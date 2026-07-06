export const utils = {
    copyToClipboard(text) {
        return navigator.clipboard.writeText(text).then(() => {
            this.showToast('Copied to clipboard!', 'success');
            return true;
        }).catch(() => {
            this.showToast('Failed to copy', 'error');
            return false;
        });
    },

    showToast(message, type = 'success', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} animate-slide-in-right`;
        const icon = type === 'success' ? '✓' : '⚠️';
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${message}</span>
        `;
        const container = document.getElementById('toast-container');
        container.appendChild(toast);
        setTimeout(() => {
            toast.classList.remove('animate-slide-in-right');
            toast.classList.add('animate-slide-out-right');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },

    downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showToast(`Downloaded ${filename}`, 'success');
    },

    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * Math.pow(10, dm)) / Math.pow(10, dm) + ' ' + sizes[i];
    },

    randomBytes(length = 32) {
        const bytes = new Uint8Array(length);
        crypto.getRandomValues(bytes);
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    hexToBytes(hex) {
        const bytes = [];
        for (let i = 0; i < hex.length; i += 2) {
            bytes.push(parseInt(hex.substr(i, 2), 16));
        }
        return new Uint8Array(bytes);
    },

    bytesToHex(bytes) {
        return Array.from(bytes)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    },

    bytesToBase64(bytes) {
        let binary = '';
        for (let i = 0; i < bytes.byteLength; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
    },

    base64ToBytes(base64) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes;
    },

    stringToBytes(str) {
        return new TextEncoder().encode(str);
    },

    bytesToString(bytes) {
        return new TextDecoder().decode(bytes);
    },

    calculateEntropy(password) {
        let charsetSize = 0;
        if (/[a-z]/.test(password)) charsetSize += 26;
        if (/[A-Z]/.test(password)) charsetSize += 26;
        if (/[0-9]/.test(password)) charsetSize += 10;
        if (/[^a-zA-Z0-9]/.test(password)) charsetSize += 32;
        const entropy = password.length * Math.log2(charsetSize);
        return Math.round(entropy);
    },

    getPasswordStrength(password) {
        if (!password || password.length < 8) return { level: 'weak', score: 0 };
        if (password.length < 12) return { level: 'fair', score: 1 };
        if (password.length < 16) return { level: 'good', score: 2 };
        return { level: 'strong', score: 3 };
    },

    detectHashType(hash) {
        hash = hash.toLowerCase().trim();
        const patterns = {
            'MD5': /^[a-f0-9]{32}$/,
            'SHA1': /^[a-f0-9]{40}$/,
            'SHA224': /^[a-f0-9]{56}$/,
            'SHA256': /^[a-f0-9]{64}$/,
            'SHA384': /^[a-f0-9]{96}$/,
            'SHA512': /^[a-f0-9]{128}$/,
            'BLAKE2b-256': /^[a-f0-9]{64}$/,
            'BLAKE2b-512': /^[a-f0-9]{128}$/,
        };

        const matches = [];
        for (const [type, pattern] of Object.entries(patterns)) {
            if (pattern.test(hash)) {
                matches.push(type);
            }
        }
        return matches;
    },

    deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj.getTime());
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Object) {
            const cloned = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    cloned[key] = this.deepClone(obj[key]);
                }
            }
            return cloned;
        }
    },

    validateEmail(email) {
        const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return regex.test(email);
    },

    validateURL(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    },

    formatJSON(json) {
        try {
            const parsed = typeof json === 'string' ? JSON.parse(json) : json;
            return JSON.stringify(parsed, null, 2);
        } catch (e) {
            return 'Invalid JSON';
        }
    },

    minifyJSON(json) {
        try {
            const parsed = typeof json === 'string' ? JSON.parse(json) : json;
            return JSON.stringify(parsed);
        } catch (e) {
            return 'Invalid JSON';
        }
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    formatDate(date) {
        return new Date(date).toLocaleString();
    },

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    truncate(str, length = 50) {
        if (str.length > length) {
            return str.substring(0, length) + '...';
        }
        return str;
    },

    isMobile() {
        return window.innerWidth <= 768;
    },

    getQueryParam(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param);
    },

    urlEncode(str) {
        return encodeURIComponent(str);
    },

    urlDecode(str) {
        return decodeURIComponent(str);
    },

    htmlEncode(str) {
        const textarea = document.createElement('textarea');
        textarea.textContent = str;
        return textarea.innerHTML;
    },

    htmlDecode(str) {
        const textarea = document.createElement('textarea');
        textarea.innerHTML = str;
        return textarea.textContent;
    },
};

export default utils;
