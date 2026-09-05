/**
 * بسام (Bassam Runner) - Power-ups Engine
 * Handles the 5 active abilities, upgrade levels, timers, and visual auras.
 */

class PowerUpManager {
  constructor(game) {
    this.game = game;
    // Active durations remaining (in seconds)
    this.active = {
      shield: false,
      shieldHits: 0,
      magnet: 0,
      slowmo: 0,
      multiplier: 0,
      boost: 0
    };
  }

  // Reset active power-ups for new run
  reset() {
    this.active.shield = false;
    this.active.shieldHits = 0;
    this.active.magnet = 0;
    this.active.slowmo = 0;
    this.active.multiplier = 0;
    this.active.boost = 0;
  }

  // Calculate duration based on player's upgrade level
  getDuration(type) {
    const config = CONFIG.POWERUPS[type];
    if (!config) return 5;
    const level = SaveManager.data?.powerUpLevels[type] || 1;
    return config.baseDuration + (level - 1) * config.durationPerLevel;
  }

  // Activate a collected power-up
  activate(type) {
    const duration = this.getDuration(type);
    AudioManager.playPowerup();

    switch (type) {
      case "shield":
        this.active.shield = true;
        this.active.shieldHits = 1;
        this.game.missions.track("shield_use", 1);
        break;
      case "magnet":
        this.active.magnet = duration;
        this.game.missions.track("magnet_use", 1);
        break;
      case "slowmo":
        this.active.slowmo = duration;
        break;
      case "multiplier":
        this.active.multiplier = duration;
        break;
      case "boost":
        this.active.boost = duration;
        // Boost also pushes pursuer far back
        this.game.enemy.pushBack(45);
        break;
    }

    this.game.missions.track("powerup_collect", 1);
    this.game.ui.showPowerupBanner(type, duration);
  }

  // Per-frame update (delta in seconds)
  update(dt) {
    // Decrement timers
    if (this.active.magnet > 0) {
      this.active.magnet = Math.max(0, this.active.magnet - dt);
    }
    if (this.active.slowmo > 0) {
      this.active.slowmo = Math.max(0, this.active.slowmo - dt);
    }
    if (this.active.multiplier > 0) {
      this.active.multiplier = Math.max(0, this.active.multiplier - dt);
    }
    if (this.active.boost > 0) {
      this.active.boost = Math.max(0, this.active.boost - dt);
    }

    // Magnet behavior: attract nearby coins in world
    if (this.isMagnetActive()) {
      const magnetRange = 450;
      for (const coin of this.game.world.coins) {
        if (!coin.collected && coin.z > this.game.player.z - 20 && coin.z < this.game.player.z + magnetRange) {
          // Pull coin towards player's lane and position
          coin.laneX = Utils.lerp(coin.laneX, this.game.player.currentLaneX, dt * 8);
          coin.y = Utils.lerp(coin.y, this.game.player.y, dt * 8);
          coin.z = Utils.lerp(coin.z, this.game.player.z, dt * 6);
        }
      }
    }
  }

  // Status checks
  isShieldActive() {
    return this.active.shield && this.active.shieldHits > 0;
  }

  isMagnetActive() {
    return this.active.magnet > 0;
  }

  isSlowMoActive() {
    return this.active.slowmo > 0;
  }

  isMultiplierActive() {
    return this.active.multiplier > 0;
  }

  isBoostActive() {
    return this.active.boost > 0;
  }

  // Shield absorbs impact
  consumeShield() {
    if (this.active.shield) {
      this.active.shieldHits--;
      if (this.active.shieldHits <= 0) {
        this.active.shield = false;
      }
      AudioManager.playShieldBreak();
      this.game.world.addExplosion(
        this.game.player.currentLaneX,
        this.game.player.y - 30,
        this.game.player.z,
        "#38bdf8",
        30
      );
      return true;
    }
    return false;
  }

  // Upgrade powerup level in shop
  upgrade(type) {
    const config = CONFIG.POWERUPS[type];
    if (!config) return false;
    const currentLevel = SaveManager.data.powerUpLevels[type] || 1;
    if (currentLevel >= config.maxLevel) return false;

    const costIndex = currentLevel - 1;
    const cost = config.upgradeCosts[costIndex];

    if (SaveManager.spendCoins(cost)) {
      SaveManager.data.powerUpLevels[type] = currentLevel + 1;
      SaveManager.save();
      AudioManager.playPurchase();
      return true;
    }
    return false;
  }
}
