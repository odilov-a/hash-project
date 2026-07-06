import { storage } from "./core.js";
import { ui } from "./ui.js";
import { tools } from "./tools.js";

class CryptoKit {
  constructor() {
    this.currentTool = null;
    this.tools = tools;
  }

  init() {
    ui.init();
    this.setupToolNavigation();
    this.loadTool(storage.getSetting("lastTool", "secret-key"));
  }

  setupToolNavigation() {
    document.querySelectorAll(".tool-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this.loadTool(btn.dataset.tool);
        storage.setSetting("lastTool", btn.dataset.tool);
      });
    });
  }

  async loadTool(toolName) {
    const tool = this.tools[toolName];
    if (!tool) {
      ui.showToast("Tool not found", "error");
      return;
    }
    ui.setActiveTool(toolName);
    this.currentTool = toolName;
    ui.renderTool(tool.render());
    await tool.setup();
    ui.setupOutputHandlers();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CryptoKit().init();
});
