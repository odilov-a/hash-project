export const storage = {
  prefix: "cryptokit_",

  save(key, data) {
    try {
      const json = JSON.stringify(data);
      localStorage.setItem(this.prefix + key, json);
      return true;
    } catch (e) {
      console.error("Storage save failed:", e);
      return false;
    }
  },

  get(key, defaultValue = null) {
    try {
      const json = localStorage.getItem(this.prefix + key);
      return json ? JSON.parse(json) : defaultValue;
    } catch (e) {
      console.error("Storage get failed:", e);
      return defaultValue;
    }
  },

  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key);
      return true;
    } catch (e) {
      console.error("Storage remove failed:", e);
      return false;
    }
  },

  clear() {
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith(this.prefix)) {
          localStorage.removeItem(key);
        }
      });
      return true;
    } catch (e) {
      console.error("Storage clear failed:", e);
      return false;
    }
  },

  has(key) {
    return localStorage.getItem(this.prefix + key) !== null;
  },

  getAllKeys() {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith(this.prefix)) {
        keys.push(key.substring(this.prefix.length));
      }
    }
    return keys;
  },

  saveHistory(toolName, data) {
    const history = this.get("history", {});
    if (!history[toolName]) {
      history[toolName] = [];
    }

    history[toolName].unshift({
      timestamp: Date.now(),
      data: data,
    });

    history[toolName] = history[toolName].slice(0, 20);
    this.save("history", history);
  },

  getHistory(toolName) {
    const history = this.get("history", {});
    return history[toolName] || [];
  },

  clearHistory(toolName) {
    const history = this.get("history", {});
    if (toolName) {
      delete history[toolName];
    } else {
      this.remove("history");
      return;
    }
    this.save("history", history);
  },

  saveFavorite(toolName, data) {
    const favorites = this.get("favorites", {});
    if (!favorites[toolName]) {
      favorites[toolName] = [];
    }
    favorites[toolName].unshift({
      id: Date.now(),
      name: data.name || toolName,
      data: data,
      timestamp: Date.now(),
    });
    this.save("favorites", favorites);
  },

  getFavorites(toolName) {
    const favorites = this.get("favorites", {});
    return favorites[toolName] || [];
  },

  removeFavorite(toolName, id) {
    const favorites = this.get("favorites", {});
    if (favorites[toolName]) {
      favorites[toolName] = favorites[toolName].filter((f) => f.id !== id);
      this.save("favorites", favorites);
    }
  },

  saveSettings(settings) {
    this.save("settings", settings);
  },

  getSettings() {
    return this.get("settings", {
      theme: "light",
      language: "en",
      autoGenerate: false,
      copyOnGenerate: true,
      notification: true,
      saveHistory: true,
    });
  },

  getSetting(key, defaultValue = null) {
    const settings = this.getSettings();
    return settings[key] ?? defaultValue;
  },

  setSetting(key, value) {
    const settings = this.getSettings();
    settings[key] = value;
    this.saveSettings(settings);
  },

  exportData() {
    const data = {
      version: "1.0",
      exported: new Date().toISOString(),
      history: this.get("history", {}),
      favorites: this.get("favorites", {}),
      settings: this.getSettings(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      if (data.history) this.save("history", data.history);
      if (data.favorites) this.save("favorites", data.favorites);
      if (data.settings) this.save("settings", data.settings);
      return true;
    } catch (e) {
      console.error("Import failed:", e);
      return false;
    }
  },
};

export default storage;
