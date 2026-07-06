import { ui } from "./ui.js";
import { storage } from "./storage.js";
import { utils } from "./utils.js";
import { crypto } from "./crypto.js";
import { tools } from "./tools.js";

class CryptoKit {
  constructor() {
    this.currentTool = null;
    this.tools = tools;
  }

  init() {
    console.log("CryptoKit initializing...");
    ui.init();
    this.loadSettings();
    this.setupToolNavigation();
    const defaultTool = storage.getSetting("lastTool", "secret-key");
    this.loadTool(defaultTool);
    console.log("CryptoKit initialized!");
  }

  loadSettings() {
    const settings = storage.getSettings();
  }

  setupToolNavigation() {
    const toolBtns = document.querySelectorAll(".tool-btn");
    toolBtns.forEach((btn) => {
      btn.addEventListener("click", (e) => {
        const toolName = btn.dataset.tool;
        this.loadTool(toolName);
        storage.setSetting("lastTool", toolName);
      });
    });
  }

  async loadTool(toolName) {
    const tool = this.tools[toolName];
    if (!tool) {
      utils.showToast("Tool not found", "error");
      return;
    }
    ui.setActiveTool(toolName);
    this.currentTool = toolName;
    const html = await tool.render();
    ui.renderTool(html);
    await tool.setup();
    ui.setupOutputHandlers();
    ui.setupTabs();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const app = new CryptoKit();
  app.init();
});
