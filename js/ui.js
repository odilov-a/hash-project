export const ui = {
  init() {
    this.setupSearch();
    this.setupSidebar();
  },

  // ---------- Chrome: search, sidebar ----------
  setupSearch() {
    const searchInput = document.getElementById("search-input");
    searchInput?.addEventListener("input", (e) => {
      const query = e.target.value.toLowerCase();
      document.querySelectorAll(".tool-btn").forEach((btn) => {
        const name = btn.querySelector(".tool-name").textContent.toLowerCase();
        btn.style.display = name.includes(query) ? "" : "none";
      });
    });
  },

  setupSidebar() {
    const toggle = document.getElementById("nav-sidebar-toggle");
    const sidebar = document.querySelector(".sidebar");
    const appContainer = document.querySelector(".app-container");

    // Desktop: hides the sidebar column entirely (.sidebar-collapsed).
    // Mobile: slides the sidebar drawer in/out (.open). Toggled together —
    // each only affects its own breakpoint, so they never conflict.
    toggle?.addEventListener("click", () => {
      appContainer?.classList.toggle("sidebar-collapsed");
      sidebar?.classList.toggle("open");
    });

    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.addEventListener("click", () => sidebar?.classList.remove("open"));
    });

    document.addEventListener("click", (e) => {
      if (!sidebar?.contains(e.target) && !toggle?.contains(e.target)) {
        sidebar?.classList.remove("open");
      }
    });
  },

  setSidebarCollapsed(collapsed) {
    document.querySelector(".app-container")?.classList.toggle("sidebar-collapsed", collapsed);
  },

  setActiveTool(toolName) {
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.tool === toolName);
    });
  },

  renderTool(html) {
    const container = document.getElementById("tool-container");
    if (container) container.innerHTML = html;
  },

  // ---------- Notifications / IO ----------
  showToast(message, type = "success", duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type} animate-slide-in-right`;
    const text = document.createElement("span");
    text.className = "toast-message";
    text.textContent = message; // textContent avoids HTML injection
    toast.append(text);

    document.getElementById("toast-container")?.appendChild(toast);
    setTimeout(() => {
      toast.classList.replace("animate-slide-in-right", "animate-slide-out-right");
      setTimeout(() => toast.remove(), 300);
    }, duration);
  },

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast("Copied to clipboard!", "success");
      return true;
    } catch {
      this.showToast("Failed to copy", "error");
      return false;
    }
  },

  downloadFile(content, filename, mimeType = "text/plain") {
    const url = URL.createObjectURL(new Blob([content], { type: mimeType }));
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    this.showToast(`Downloaded ${filename}`, "success");
  },

  // ---------- Output area ----------
  createOutput(id = "output", label = "Output") {
    return `
      <div class="output-container">
        <label class="output-label" for="${id}">${label}</label>
        <div class="output-wrapper">
          <div id="${id}" class="output-content output-empty">${OUTPUT_PLACEHOLDER}</div>
        </div>
        <div class="output-actions">
          <button class="btn btn-secondary btn-copy" data-output="${id}">Copy</button>
          <button class="btn btn-secondary btn-download" data-output="${id}">Download</button>
          <button class="btn btn-secondary btn-clear" data-output="${id}">Clear</button>
        </div>
      </div>
    `;
  },

  // Write a value into an output area (shared by every tool).
  setOutput(id, value) {
    const el = document.getElementById(id);
    if (!el) return;
    el.textContent = value;
    el.classList.remove("output-empty");
  },

  setupOutputHandlers() {
    document.querySelectorAll(".btn-copy").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const output = document.getElementById(btn.dataset.output);
        if (output && !output.classList.contains("output-empty")) {
          await this.copyToClipboard(output.textContent);
          btn.classList.add("copy-animating");
          setTimeout(() => btn.classList.remove("copy-animating"), 300);
        }
      });
    });

    document.querySelectorAll(".btn-download").forEach((btn) => {
      btn.addEventListener("click", () => {
        const output = document.getElementById(btn.dataset.output);
        if (output && !output.classList.contains("output-empty")) {
          this.downloadFile(output.textContent, `output-${Date.now()}.txt`);
        }
      });
    });

    document.querySelectorAll(".btn-clear").forEach((btn) => {
      btn.addEventListener("click", () => {
        const output = document.getElementById(btn.dataset.output);
        if (output) {
          output.textContent = OUTPUT_PLACEHOLDER;
          output.classList.add("output-empty");
        }
      });
    });
  },

  // ---------- Component factories ----------
  createCard(title, icon, content) {
    return `
      <div class="card">
        <div class="card-header">
          <h2 class="card-title">
            <span class="card-icon">${icon}</span>
            ${title}
          </h2>
        </div>
        <div class="card-body">${content}</div>
      </div>
    `;
  },

  createStrengthMeter(id = "strength") {
    return `
      <div class="strength-meter" id="${id}">
        <div class="strength-bar"><div class="strength-fill"></div></div>
        <span class="strength-label">—</span>
      </div>
    `;
  },

  updateStrengthMeter(id, label) {
    const meter = document.getElementById(id);
    if (!meter) return;
    const fill = meter.querySelector(".strength-fill");
    const labelEl = meter.querySelector(".strength-label");
    fill.className = `strength-fill ${label}`;
    labelEl.className = `strength-label ${label}`;
    labelEl.textContent = label.charAt(0).toUpperCase() + label.slice(1);
  },

  createAlgorithmButtons(id, algorithms, active = null) {
    return `
      <div class="algorithm-selector" id="${id}">
        ${algorithms
          .map(
            (algo) => `
          <button class="algo-btn ${active === algo ? "active" : ""}" data-algo="${algo}">
            ${algo}
          </button>`,
          )
          .join("")}
      </div>
    `;
  },

  getActiveAlgorithm(id) {
    return document.querySelector(`#${id} .algo-btn.active`)?.dataset.algo || null;
  },

  setupAlgorithmButtons(id, callback) {
    const container = document.getElementById(id);
    if (!container) return;
    const buttons = container.querySelectorAll(".algo-btn");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => {
        buttons.forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        callback?.(btn.dataset.algo);
      });
    });
  },

  createCheckboxGroup(id, options) {
    return `
      <div class="checkbox-group" id="${id}">
        ${options
          .map(
            (opt) => `
          <div class="checkbox-item">
            <input type="checkbox" id="${opt.id}" class="checkbox-input" ${opt.checked ? "checked" : ""} />
            <label class="checkbox-label" for="${opt.id}">${opt.label}</label>
          </div>`,
          )
          .join("")}
      </div>
    `;
  },

  getCheckboxGroupValues(id) {
    const group = document.getElementById(id);
    if (!group) return {};
    const result = {};
    group.querySelectorAll('input[type="checkbox"]').forEach((input) => {
      result[input.id] = input.checked;
    });
    return result;
  },

  createSlider(id, label, min = 8, max = 128, value = 32, helper = "") {
    return `
      <div class="form-group">
        <label class="form-label" for="${id}">
          ${label}: <span id="${id}-value">${value}</span>
          ${helper ? `<span class="form-label-helper">${helper}</span>` : ""}
        </label>
        <input type="range" id="${id}" class="slider" min="${min}" max="${max}" value="${value}" />
      </div>
    `;
  },

  setupSlider(id, callback) {
    const slider = document.getElementById(id);
    if (!slider) return;
    slider.addEventListener("input", (e) => {
      const display = document.getElementById(`${id}-value`);
      if (display) display.textContent = e.target.value;
      callback?.(parseInt(e.target.value, 10));
    });
  },

  // ---------- Code viewer (per-tool "how this works" panel) ----------
  createCodePanel(id) {
    return `
      <div class="code-panel" id="${id}">
        <div class="tabs">
          <button class="tab-btn active" data-tab="real">Runs in this app</button>
          <button class="tab-btn" data-tab="explain">How it works</button>
        </div>
        <div class="tab-content active" data-pane="real"><pre class="code-block"></pre></div>
        <div class="tab-content" data-pane="explain"><pre class="code-block"></pre></div>
        <p class="code-panel-note"></p>
      </div>
    `;
  },

  setCodePanel(id, { real, explain, note = "" }) {
    const panel = document.getElementById(id);
    if (!panel) return;
    panel.querySelector('[data-pane="real"] .code-block').textContent = real;
    panel.querySelector('[data-pane="explain"] .code-block').textContent = explain;
    panel.querySelector(".code-panel-note").textContent = note;
  },

  setupCodeTabs(id) {
    const panel = document.getElementById(id);
    if (!panel) return;
    const tabs = panel.querySelectorAll(".tab-btn");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        tabs.forEach((t) => t.classList.remove("active"));
        tab.classList.add("active");
        panel.querySelectorAll(".tab-content").forEach((pane) => {
          pane.classList.toggle("active", pane.dataset.pane === tab.dataset.tab);
        });
      });
    });
  },

  showLoading(message = "Loading...") {
    const loading = document.createElement("div");
    loading.id = "loading-indicator";
    loading.className = "animate-scale-in";
    loading.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div class="spinner" style="display: inline-block; margin-bottom: 1rem;"></div>
        <p style="color: var(--text-secondary);"></p>
      </div>
    `;
    loading.querySelector("p").textContent = message;
    document.getElementById("tool-container")?.appendChild(loading);
  },

  hideLoading() {
    document.getElementById("loading-indicator")?.remove();
  },
};

const OUTPUT_PLACEHOLDER = 'Click "Generate" to see output';

export default ui;
