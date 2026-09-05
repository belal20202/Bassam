/**
 * بسام (Bassam Runner) - SaveManager
 * Robust LocalStorage persistence with data validation, backup, and corrupted data recovery.
 */

const SaveManager = {
  STORAGE_KEY: "bassam_runner_save_v1",
  BACKUP_KEY: "bassam_runner_backup_v1",

  // Default clean save structure
  getDefaultData() {
    return {
      version: CONFIG.VERSION,
      playerName: "بسام",
      coins: 0,
      score: 0,
      bestScore: 0,
      distance: 0,
      bestDistance: 0,
      level: 1,
      xp: 0,
      ownedClothes: ["casual"],
      selectedClothes: "casual",
      powerUpLevels: {
        shield: 1,
        magnet: 1,
        slowmo: 1,
        multiplier: 1,
        boost: 1
      },
      missions: {
        lastResetDate: new Date().toDateString(),
        progress: {}
      },
      dailyReward: {
        lastClaimDate: null,
        currentDay: 1
      },
      settings: {
        sfx: true,
        music: true,
        volume: 80,
        graphics: "high"
      },
      language: "ar",
      totalRuns: 0
    };
  },

  // In-memory fallback if localStorage is disabled or restricted
  _memoryFallback: {},
  _getItem(key) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
    } catch (_) {}
    return this._memoryFallback[key] || null;
  },
  _setItem(key, value) {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch (_) {}
    this._memoryFallback[key] = value;
  },

  // Active in-memory state
  data: null,

  // Initialize and load saved state
  init() {
    this.data = this.load();
    return this.data;
  },

  // Load and validate from LocalStorage
  load() {
    try {
      const raw = this._getItem(this.STORAGE_KEY);
      if (!raw) {
        return this.createAndSaveDefault();
      }

      const parsed = JSON.parse(raw);
      const validated = this.validateAndSanitize(parsed);
      
      // Save sanitized copy as backup
      this.backup(validated);
      return validated;
    } catch (err) {
      console.warn("Error reading save data. Attempting backup restore...", err);
      return this.restoreFromBackup();
    }
  },

  // Save current in-memory state to LocalStorage
  save() {
    if (!this.data) return false;
    try {
      this.validateAndSanitize(this.data);
      const serialized = JSON.stringify(this.data);
      this._setItem(this.STORAGE_KEY, serialized);
      return true;
    } catch (err) {
      console.error("Failed to save game state:", err);
      return false;
    }
  },

  // Backup store
  backup(data) {
    try {
      this._setItem(this.BACKUP_KEY, JSON.stringify(data));
    } catch (e) {
      // Storage might be full or disabled, safely ignore
    }
  },

  // Restore from backup or fallback to fresh default
  restoreFromBackup() {
    try {
      const backupRaw = this._getItem(this.BACKUP_KEY);
      if (backupRaw) {
        const parsed = JSON.parse(backupRaw);
        return this.validateAndSanitize(parsed);
      }
    } catch (e) {
      console.error("Backup corrupted as well. Creating fresh state.");
    }
    return this.createAndSaveDefault();
  },

  createAndSaveDefault() {
    const fresh = this.getDefaultData();
    this.data = fresh;
    this.save();
    return fresh;
  },

  // Sanitize values to prevent cheating, negative coins, invalid types
  validateAndSanitize(data) {
    const defaults = this.getDefaultData();
    if (!data || typeof data !== "object") return defaults;

    // Coins sanity check
    if (typeof data.coins !== "number" || isNaN(data.coins) || data.coins < 0 || data.coins > 999999999) {
      data.coins = 0;
    } else {
      data.coins = Math.floor(data.coins);
    }

    // Scores & distances
    data.bestScore = Math.max(0, Math.min(99999999, Number(data.bestScore) || 0));
    data.bestDistance = Math.max(0, Math.min(9999999, Number(data.bestDistance) || 0));

    // Level & XP
    data.level = Math.max(1, Math.min(100, Number(data.level) || 1));
    data.xp = Math.max(0, Number(data.xp) || 0);

    // Clothes
    if (!Array.isArray(data.ownedClothes) || data.ownedClothes.length === 0) {
      data.ownedClothes = ["casual"];
    }
    if (!data.ownedClothes.includes("casual")) {
      data.ownedClothes.unshift("casual");
    }
    if (!data.ownedClothes.includes(data.selectedClothes)) {
      data.selectedClothes = "casual";
    }

    // Power-up levels
    if (!data.powerUpLevels || typeof data.powerUpLevels !== "object") {
      data.powerUpLevels = { ...defaults.powerUpLevels };
    } else {
      for (const key of ["shield", "magnet", "slowmo", "multiplier", "boost"]) {
        const lvl = Number(data.powerUpLevels[key]) || 1;
        data.powerUpLevels[key] = Math.max(1, Math.min(5, lvl));
      }
    }

    // Daily reward & missions
    if (!data.dailyReward || typeof data.dailyReward !== "object") {
      data.dailyReward = { ...defaults.dailyReward };
    }
    if (!data.missions || typeof data.missions !== "object") {
      data.missions = { ...defaults.missions };
    }
    if (!data.settings || typeof data.settings !== "object") {
      data.settings = { ...defaults.settings };
    }

    // Player name
    if (typeof data.playerName !== "string" || !data.playerName.trim()) {
      data.playerName = "بسام";
    } else {
      data.playerName = data.playerName.trim().substring(0, 15);
    }

    return data;
  },

  // Convenient Economy Getters / Modifiers
  getCoins() {
    return this.data ? this.data.coins : 0;
  },

  addCoins(amount) {
    if (!this.data) return;
    const add = Math.max(0, Math.floor(amount));
    this.data.coins += add;
    this.save();
    return this.data.coins;
  },

  spendCoins(amount) {
    if (!this.data) return false;
    const cost = Math.max(0, Math.floor(amount));
    if (this.data.coins >= cost) {
      this.data.coins -= cost;
      this.save();
      return true;
    }
    return false;
  },

  // Add XP and handle level-up calculation
  addXP(amount) {
    if (!this.data) return false;
    this.data.xp += Math.max(0, Math.floor(amount));
    let leveledUp = false;
    
    // Level formula: level * 200 XP needed per level
    let neededXp = this.data.level * 250;
    while (this.data.xp >= neededXp) {
      this.data.xp -= neededXp;
      this.data.level++;
      neededXp = this.data.level * 250;
      leveledUp = true;
      // Level-up coin bonus
      this.data.coins += this.data.level * 100;
    }
    this.save();
    return leveledUp;
  },

  // Record Run Stats
  recordRun(score, distance, coinsCollected) {
    if (!this.data) return { isNewBestScore: false, isNewBestDist: false };

    let isNewBestScore = false;
    let isNewBestDist = false;

    if (score > this.data.bestScore) {
      this.data.bestScore = score;
      isNewBestScore = true;
    }
    if (distance > this.data.bestDistance) {
      this.data.bestDistance = distance;
      isNewBestDist = true;
    }

    this.data.totalRuns = (this.data.totalRuns || 0) + 1;
    this.addCoins(coinsCollected);
    this.save();

    return { isNewBestScore, isNewBestDist };
  }
};
