import { storage } from './storage.js';
import { utils } from './utils.js';

export const ui = {
    init() {
        this.setupTheme();
        this.setupSearch();
        this.setupSidebar();
    },

    setupTheme() {
        const theme = storage.getSetting('theme', 'light');
        this.setTheme(theme);

        const themeToggle = document.getElementById('theme-toggle');
        themeToggle?.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
            storage.setSetting('theme', newTheme);
        });
    },

    setTheme(theme) {
        if (theme === 'dark') {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.removeAttribute('data-theme');
        }
    },

    // Search
    setupSearch() {
        const searchInput = document.getElementById('search-input');
        if (!searchInput) return;

        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const toolBtns = document.querySelectorAll('.tool-btn');

            toolBtns.forEach(btn => {
                const name = btn.querySelector('.tool-name').textContent.toLowerCase();
                btn.style.display = name.includes(query) ? '' : 'none';
            });
        });
    },

    // Sidebar
    setupSidebar() {
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');

        sidebarToggle?.addEventListener('click', () => {
            sidebar?.classList.toggle('open');
        });

        // Close on tool click
        const toolBtns = document.querySelectorAll('.tool-btn');
        toolBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                if (sidebar?.classList.contains('open')) {
                    sidebar.classList.remove('open');
                }
            });
        });

        // Close on outside click
        document.addEventListener('click', (e) => {
            if (!sidebar?.contains(e.target) && !sidebarToggle?.contains(e.target)) {
                sidebar?.classList.remove('open');
            }
        });
    },

    // Set active tool
    setActiveTool(toolName) {
        const buttons = document.querySelectorAll('.tool-btn');
        buttons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === toolName) {
                btn.classList.add('active');
            }
        });
    },

    // Render tool HTML
    renderTool(html) {
        const container = document.getElementById('tool-container');
        if (container) {
            container.innerHTML = html;
        }
    },

    // Create card
    createCard(title, icon, content) {
        return `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">
                        <span class="card-icon">${icon}</span>
                        ${title}
                    </h2>
                </div>
                <div class="card-body">
                    ${content}
                </div>
            </div>
        `;
    },

    // Create output area
    createOutput(id = 'output', label = 'Output') {
        return `
            <div class="output-container">
                <label class="output-label" for="${id}">${label}</label>
                <div class="output-wrapper">
                    <div id="${id}" class="output-content output-empty">
                        Click "Generate" to see output
                    </div>
                </div>
                <div class="output-actions">
                    <button class="btn btn-secondary btn-copy" data-output="${id}">
                        Copy
                    </button>
                    <button class="btn btn-secondary btn-download" data-output="${id}">
                        Download
                    </button>
                    <button class="btn btn-secondary btn-clear" data-output="${id}">
                        Clear
                    </button>
                </div>
            </div>
        `;
    },

    // Setup output handlers
    setupOutputHandlers() {
        // Copy button
        document.querySelectorAll('.btn-copy').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const outputId = btn.dataset.output;
                const output = document.getElementById(outputId);
                if (output && !output.classList.contains('output-empty')) {
                    await utils.copyToClipboard(output.textContent);
                    btn.classList.add('copy-animating');
                    setTimeout(() => btn.classList.remove('copy-animating'), 300);
                }
            });
        });

        // Download button
        document.querySelectorAll('.btn-download').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const outputId = btn.dataset.output;
                const output = document.getElementById(outputId);
                if (output && !output.classList.contains('output-empty')) {
                    utils.downloadFile(output.textContent, `output-${Date.now()}.txt`);
                }
            });
        });

        // Clear button
        document.querySelectorAll('.btn-clear').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const outputId = btn.dataset.output;
                const output = document.getElementById(outputId);
                if (output) {
                    output.textContent = 'Click "Generate" to see output';
                    output.classList.add('output-empty');
                }
            });
        });
    },

    // Create strength meter
    createStrengthMeter(id = 'strength') {
        return `
            <div class="strength-meter" id="${id}">
                <div class="strength-bar">
                    <div class="strength-fill"></div>
                </div>
                <span class="strength-label">—</span>
            </div>
        `;
    },

    // Update strength meter
    updateStrengthMeter(id, score, label) {
        const meter = document.getElementById(id);
        if (!meter) return;

        const fill = meter.querySelector('.strength-fill');
        const labelEl = meter.querySelector('.strength-label');

        fill.className = `strength-fill ${label}`;
        labelEl.className = `strength-label ${label}`;
        labelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
    },

    // Create algorithm buttons
    createAlgorithmButtons(id, algorithms, active = null) {
        return `
            <div class="algorithm-selector" id="${id}">
                ${algorithms.map(algo => `
                    <button class="algo-btn ${active === algo ? 'active' : ''}" data-algo="${algo}">
                        ${algo}
                    </button>
                `).join('')}
            </div>
        `;
    },

    // Get active algorithm
    getActiveAlgorithm(id) {
        const active = document.querySelector(`#${id} .algo-btn.active`);
        return active?.dataset.algo || null;
    },

    // Setup algorithm buttons
    setupAlgorithmButtons(id, callback) {
        const container = document.getElementById(id);
        if (!container) return;

        const buttons = container.querySelectorAll('.algo-btn');
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                buttons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                callback?.(btn.dataset.algo);
            });
        });
    },

    // Create form group
    createFormGroup(label, inputId, inputType = 'text', placeholder = '', helper = '') {
        return `
            <div class="form-group">
                <label class="form-label" for="${inputId}">
                    ${label}
                    ${helper ? `<span class="form-label-helper">${helper}</span>` : ''}
                </label>
                <input
                    type="${inputType}"
                    id="${inputId}"
                    class="form-input"
                    placeholder="${placeholder}"
                />
            </div>
        `;
    },

    // Create checkbox group
    createCheckboxGroup(id, options) {
        return `
            <div class="checkbox-group" id="${id}">
                ${options.map(opt => `
                    <div class="checkbox-item">
                        <input
                            type="checkbox"
                            id="${opt.id}"
                            class="checkbox-input"
                            ${opt.checked ? 'checked' : ''}
                        />
                        <label class="checkbox-label" for="${opt.id}">${opt.label}</label>
                    </div>
                `).join('')}
            </div>
        `;
    },

    // Get checkbox group values
    getCheckboxGroupValues(id) {
        const group = document.getElementById(id);
        if (!group) return {};

        const result = {};
        group.querySelectorAll('input[type="checkbox"]').forEach(input => {
            result[input.id] = input.checked;
        });
        return result;
    },

    // Create slider
    createSlider(id, label, min = 8, max = 128, value = 32, helper = '') {
        return `
            <div class="form-group">
                <label class="form-label" for="${id}">
                    ${label}: <span id="${id}-value">${value}</span>
                    ${helper ? `<span class="form-label-helper">${helper}</span>` : ''}
                </label>
                <input
                    type="range"
                    id="${id}"
                    class="slider"
                    min="${min}"
                    max="${max}"
                    value="${value}"
                />
            </div>
        `;
    },

    // Setup slider
    setupSlider(id, callback) {
        const slider = document.getElementById(id);
        if (!slider) return;

        slider.addEventListener('input', (e) => {
            const valueDisplay = document.getElementById(`${id}-value`);
            if (valueDisplay) {
                valueDisplay.textContent = e.target.value;
            }
            callback?.(parseInt(e.target.value));
        });
    },

    // Create info box
    createInfoBox(message, type = 'info') {
        const icon = type === 'info' ? 'ℹ️' : '⚠️';
        const className = type === 'info' ? 'info-box' : 'warning-box';
        const textClassName = type === 'info' ? 'info-text' : 'warning-text';
        const iconClassName = type === 'info' ? 'info-icon' : 'warning-icon';

        return `
            <div class="${className}">
                <span class="${iconClassName}">${icon}</span>
                <p class="${textClassName}">${message}</p>
            </div>
        `;
    },

    // Show loading indicator
    showLoading(message = 'Loading...') {
        const loading = document.createElement('div');
        loading.id = 'loading-indicator';
        loading.className = 'animate-scale-in';
        loading.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div class="spinner" style="display: inline-block; margin-bottom: 1rem;"></div>
                <p style="color: var(--text-secondary);">${message}</p>
            </div>
        `;
        document.getElementById('tool-container')?.appendChild(loading);
    },

    // Hide loading indicator
    hideLoading() {
        document.getElementById('loading-indicator')?.remove();
    },

    // Create badge
    createBadge(text, type = 'primary') {
        return `<span class="badge badge-${type}">${text}</span>`;
    },

    // Create tabs
    createTabs(id, tabs, activeTab = null) {
        const active = activeTab || tabs[0]?.id;
        return `
            <div class="tabs">
                ${tabs.map(tab => `
                    <button class="tab-btn ${tab.id === active ? 'active' : ''}" data-tab="${tab.id}">
                        ${tab.label}
                    </button>
                `).join('')}
            </div>
            ${tabs.map(tab => `
                <div class="tab-content ${tab.id === active ? 'active' : ''}" id="tab-${tab.id}">
                    ${tab.content}
                </div>
            `).join('')}
        `;
    },

    // Setup tabs
    setupTabs() {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabId = btn.dataset.tab;
                const container = btn.closest('.tabs')?.parentElement;

                // Deactivate all
                container?.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                container?.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

                // Activate selected
                btn.classList.add('active');
                document.getElementById(`tab-${tabId}`)?.classList.add('active');
            });
        });
    }
};

export default ui;
