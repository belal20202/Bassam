/**
 * بسام (Bassam Runner) - Master Game Orchestrator
 * High-performance 60FPS loop, 3D perspective camera, touch/keyboard controls,
 * state machine (Loading, Menu, Playing, Paused, GameOver), and difficulty scaling.
 */

class Game {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    this.ctx = this.canvas.getContext("2d");

    // Camera in world 3D space
    this.camera = {
      x: 0,
      y: -110, // Camera elevation above ground
      z: -160  // Behind Bassam
    };

    // Core Game States
    this.state = "loading"; // "loading" | "menu" | "playing" | "paused" | "gameover"

    // Dynamic Run Metrics
    this.speed = CONFIG.PHYSICS.INITIAL_SPEED;
    this.distance = 0;
    this.score = 0;
    this.coinsRun = 0;
    this.multiplier = 1;
    this.lastTime = 0;

    // Subsystems
    SaveManager.init();
    this.world = new WorldManager(this);
    this.player = new Player(this);
    this.enemy = new EnemyPursuer(this);
    this.obstacles = new ObstacleManager(this.world);
    this.powerups = new PowerUpManager(this);
    this.missions = new MissionsManager(this);
    this.shop = new ShopManager(this);
    this.rewards = new DailyRewardsManager(this);
    this.leaderboard = new LeaderboardManager(this);
    this.ui = new UIManager(this);

    // Bind controls
    this.initControls();
    this.handleResize();
    window.addEventListener("resize", () => this.handleResize());

    // Start loading simulation
    this.simulateLoading();
  }

  // Handle high-DPI responsive canvas scaling
  handleResize() {
    const container = document.querySelector(".game-app");
    const rect = container.getBoundingClientRect();

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2 for performance
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;

    this.virtualWidth = rect.width;
    this.virtualHeight = rect.height;

    this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
    this.ctx.scale(dpr, dpr);
  }

  // Smooth loading bar simulation with informative phases
  simulateLoading() {
    let progress = 0;
    const fillEl = document.getElementById("loading-bar") || document.getElementById("loading-bar-fill");
    const labelEl = document.getElementById("loading-text") || document.getElementById("loading-label");

    const messages = [
      { at: 0, text: "جاري تجهيز شوارع بغداد التراثية... 🏙️" },
      { at: 25, text: "تحميل أزياء بسام والعملات الذهبية... 🪙" },
      { at: 50, text: "«يا بسام... أسرع قبل ما يصيدك!» 💨" },
      { at: 75, text: "ضبط المؤثرات الصوتية والعوائق... 🎵" },
      { at: 92, text: "اللمسات الأخيرة... جاهز للانطلاق! 🚀" }
    ];

    const getMsg = (p) => {
      let cur = messages[0].text;
      for (const m of messages) {
        if (p >= m.at) cur = m.text;
      }
      return `${cur} (${Math.min(100, Math.round(p))}%)`;
    };

    const interval = setInterval(() => {
      progress += Utils.randInt(5, 12);
      const capped = Math.min(100, progress);

      if (fillEl) fillEl.style.width = `${capped}%`;
      if (labelEl) labelEl.textContent = getMsg(capped);

      if (progress >= 100) {
        clearInterval(interval);
        if (labelEl) labelEl.textContent = "جاهز للانطلاق! 🏃‍♂️";

        // Notify Android container if present
        if (window.AndroidBridge && typeof window.AndroidBridge.onGameReady === "function") {
          try {
            window.AndroidBridge.onGameReady();
          } catch (_) {}
        }

        setTimeout(() => {
          this.state = "menu";
          this.ui.showScreen("mainMenu");
          this.ui.refreshMenuData();
        }, 350);
      }
    }, 90);
  }

  // Keyboard & Touch Gesture Controls
  initControls() {
    // 1. Keyboard Controls
    window.addEventListener("keydown", (e) => {
      if (this.state !== "playing") return;

      switch (e.code) {
        case "ArrowLeft":
        case "KeyA":
          // Left lane switch
          this.player.moveLeft();
          break;

        case "ArrowRight":
        case "KeyD":
          // Right lane switch
          this.player.moveRight();
          break;

        case "ArrowUp":
        case "KeyW":
        case "Space":
          e.preventDefault();
          this.player.jump();
          break;

        case "ArrowDown":
        case "KeyS":
          e.preventDefault();
          this.player.slide();
          break;

        case "KeyP":
        case "Escape":
          this.pauseRun();
          break;
      }
    });

    // 2. Mobile Touch Swipe Controls
    const touchZone = document.getElementById("touch-zone");
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const onTouchStart = (e) => {
      const touch = e.touches ? e.touches[0] : e;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchStartTime = Date.now();
    };

    const onTouchEnd = (e) => {
      if (this.state !== "playing") return;
      const touch = e.changedTouches ? e.changedTouches[0] : e;
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      const dt = Date.now() - touchStartTime;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const minSwipeDist = 28;

      if (Math.max(absX, absY) > minSwipeDist) {
        if (absX > absY) {
          // Horizontal Swipe
          if (dx > 0) {
            this.player.moveRight();
          } else {
            this.player.moveLeft();
          }
        } else {
          // Vertical Swipe
          if (dy < 0) {
            this.player.jump();
          } else {
            this.player.slide();
          }
        }
      }
    };

    if (touchZone) {
      touchZone.addEventListener("touchstart", onTouchStart, { passive: true });
      touchZone.addEventListener("touchend", onTouchEnd, { passive: true });
      // Mouse drag emulation for desktop testing
      let isMouseDown = false;
      touchZone.addEventListener("mousedown", (e) => {
        isMouseDown = true;
        onTouchStart(e);
      });
      window.addEventListener("mouseup", (e) => {
        if (isMouseDown) {
          isMouseDown = false;
          onTouchEnd(e);
        }
      });
    }
  }

  // Start a new endless run
  startRun() {
    this.speed = CONFIG.PHYSICS.INITIAL_SPEED;
    this.distance = 0;
    this.score = 0;
    this.coinsRun = 0;
    this.multiplier = 1;

    this.player.reset();
    this.enemy.reset();
    this.obstacles.reset();
    this.world.reset();
    this.powerups.reset();

    this.camera.z = -160;
    this.state = "playing";

    this.ui.closeAllModals();
    this.ui.showScreen("hud");

    AudioManager.init();
    if (SaveManager.data.settings.music) {
      AudioManager.startMusic();
    }

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // Pause active run
  pauseRun() {
    if (this.state !== "playing") return;
    this.state = "paused";
    AudioManager.stopMusic();

    // Update pause modal metrics
    document.getElementById("pause-score").textContent = Utils.formatNumber(this.score);
    document.getElementById("pause-distance").textContent = Utils.formatDistance(this.distance);
    document.getElementById("pause-coins").textContent = Utils.formatNumber(this.coinsRun);

    this.ui.syncSettingsUI();
    this.ui.openModal("pause");
  }

  // Resume paused run
  resumeRun() {
    if (this.state !== "paused") return;
    this.ui.closeModal("pause");
    this.state = "playing";
    if (SaveManager.data.settings.music) {
      AudioManager.startMusic();
    }
    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // Quit run and return to menu
  quitRun() {
    this.state = "menu";
    AudioManager.stopMusic();
    this.ui.closeAllModals();
    this.ui.showScreen("mainMenu");
    this.ui.refreshMenuData();
  }

  // Game Over trigger
  gameOver(reason = "اصطدام!") {
    if (this.state !== "playing") return;
    this.state = "gameover";
    AudioManager.stopMusic();
    AudioManager.playCrash();

    // Track total distance & score in missions
    this.missions.track("distance", Math.floor(this.distance));
    this.missions.track("score", Math.floor(this.score));
    this.missions.track("runs_played", 1);

    // Add XP: 1 XP per 10m + 2 XP per coin
    const xpGained = Math.floor(this.distance / 10) + (this.coinsRun * 2);
    SaveManager.addXP(xpGained);

    // Save run high scores & bank coins
    const runResult = SaveManager.recordRun(this.score, this.distance, this.coinsRun);

    // Show Game Over UI
    this.ui.showGameOverModal({
      score: this.score,
      distance: this.distance,
      coins: this.coinsRun,
      xpGained,
      isNewBestScore: runResult.isNewBestScore,
      reason
    });
  }

  // ==========================================
  // MASTER GAME LOOP
  // ==========================================
  gameLoop(currentTime) {
    if (this.state !== "playing") return;

    // Delta time in seconds (capped to prevent huge leaps when tab sleeps)
    const rawDt = (currentTime - this.lastTime) / 1000;
    const dt = Math.min(rawDt, 0.05);
    this.lastTime = currentTime;

    // 1. Slow motion effect modifier
    const speedFactor = this.powerups.isSlowMoActive() ? 0.55 : (this.powerups.isBoostActive() ? 1.45 : 1.0);
    const effectiveDt = dt * speedFactor;

    // 2. Progressive difficulty acceleration
    this.speed = Math.min(
      CONFIG.PHYSICS.MAX_SPEED,
      CONFIG.PHYSICS.INITIAL_SPEED + (this.distance / 100) * CONFIG.PHYSICS.SPEED_ACCELERATION
    );

    const stepSpeed = this.speed * (this.player.isStumbling ? CONFIG.PHYSICS.STUMBLE_SLOWDOWN : 1.0);
    const forwardStep = stepSpeed * effectiveDt;

    // 3. Move Bassam forward
    this.player.z += forwardStep;
    this.distance += forwardStep * 0.1; // Distance in meters
    this.score += forwardStep * 0.25 * this.multiplier;

    // 4. Update camera
    this.camera.z = this.player.z - 150;
    this.camera.x = Utils.lerp(this.camera.x, this.player.currentLaneX * 0.4, dt * 6);
    this.camera.y = -115 + (this.player.y * 0.3); // Gentle tilt on jump

    // 5. Update Subsystems
    this.player.update(effectiveDt, stepSpeed);
    this.enemy.update(effectiveDt, this.player, stepSpeed);
    this.world.update(effectiveDt, this.player.z);
    this.obstacles.update(this.player.z, effectiveDt);
    this.powerups.update(effectiveDt);

    // 6. Check Obstacle Collisions
    this.checkCollisions();

    // 7. Update HUD
    this.updateHUD(effectiveDt);

    // 8. Render Complete 3D Scene
    this.render();

    // Request next frame
    requestAnimationFrame((t) => this.gameLoop(t));
  }

  // Collision handling logic
  checkCollisions() {
    for (let i = this.obstacles.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles.obstacles[i];

      if (Utils.checkRunnerCollision(this.player, obs)) {
        // Boost smash: destroys obstacles instantly
        if (this.powerups.isBoostActive()) {
          this.world.addExplosion(obs.laneX, 0, obs.z, "#f97316", 20);
          this.obstacles.obstacles.splice(i, 1);
          continue;
        }

        // Shield protection: absorbs impact
        if (this.powerups.consumeShield()) {
          this.obstacles.obstacles.splice(i, 1);
          this.player.stumble();
          this.enemy.approachOnStumble();
          continue;
        }

        // Stumble grazing check
        if (!this.player.isStumbling && Math.abs(this.player.z - obs.z) < 20) {
          // If close call on edge of lane
          const laneDiff = Math.abs(this.player.currentLaneX - obs.laneX);
          if (laneDiff > 25 && laneDiff <= 45) {
            this.player.stumble();
            this.enemy.approachOnStumble();
            this.obstacles.obstacles.splice(i, 1);
            continue;
          }
        }

        // Direct fatal collision
        this.gameOver("اصطدمت بعائق في الطريق!");
        return;
      }
    }
  }

  // Update in-game HUD indicators
  updateHUD(dt) {
    if (this.ui.hudScore) this.ui.hudScore.textContent = Utils.formatNumber(this.score);
    if (this.ui.hudCoins) this.ui.hudCoins.textContent = Utils.formatNumber(this.coinsRun);
    if (this.ui.hudDistance) this.ui.hudDistance.textContent = Utils.formatDistance(this.distance);

    if (this.ui.hudEnvName) {
      const env = CONFIG.ENVIRONMENTS[this.world.currentEnvIndex];
      if (env) this.ui.hudEnvName.textContent = env.name;
    }

    if (this.ui.hudPursuerWarning) {
      if (this.enemy.isAlert) {
        this.ui.hudPursuerWarning.classList.remove("hidden");
      } else {
        this.ui.hudPursuerWarning.classList.add("hidden");
      }
    }

    this.ui.updatePowerupHUD(dt);
  }

  // Render Pipeline
  render() {
    const w = this.virtualWidth;
    const h = this.virtualHeight;

    this.ctx.clearRect(0, 0, w, h);

    // 1. Render World & Scenery
    this.world.render(this.ctx, this.camera, w, h);

    // 2. Render Obstacles
    this.obstacles.render(this.ctx, this.camera, w, h);

    // 3. Render Pursuer Enemy
    this.enemy.render(this.ctx, this.camera, w, h);

    // 4. Render Bassam Player
    this.player.render(this.ctx, this.camera, w, h);
  }
}

// Global bootstrap with fallback
function initBassamGame() {
  if (!window.game) {
    try {
      window.game = new Game();
    } catch (err) {
      console.error("Error creating Bassam Game instance:", err);
    }
  }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  initBassamGame();
} else {
  window.addEventListener("DOMContentLoaded", initBassamGame);
}
