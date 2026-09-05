/**
 * بسام (Bassam Runner) - Master UI & Screen Controller
 * Orchestrates screens, HUD metrics, modals, comic speech bubbles,
 * shop catalog rendering, settings toggles, and user inputs.
 */

class UIManager {
  constructor(game) {
    this.game = game;

    // Screens
    this.screens = {
      loading: document.getElementById("loading-screen"),
      mainMenu: document.getElementById("main-menu"),
      hud: document.getElementById("game-hud"),
      gameOver: document.getElementById("game-over-screen")
    };

    // Modals
    this.modals = {
      pause: document.getElementById("pause-modal"),
      shop: document.getElementById("shop-modal"),
      missions: document.getElementById("missions-modal"),
      rewards: document.getElementById("rewards-modal"),
      leaderboard: document.getElementById("leaderboard-modal"),
      settings: document.getElementById("settings-modal"),
      howToPlay: document.getElementById("how-to-play-modal"),
      about: document.getElementById("about-modal"),
      chestReward: document.getElementById("reward-popup") || document.getElementById("chest-reward-modal")
    };

    // HUD Elements
    this.hudScore = document.getElementById("hud-score");
    this.hudMultiplier = document.getElementById("hud-multiplier");
    this.hudCoins = document.getElementById("hud-coins");
    this.hudDistance = document.getElementById("hud-distance");
    this.hudEnvName = document.getElementById("hud-env-name");
    this.hudPursuerWarning = document.getElementById("hud-pursuer-alert") || document.getElementById("hud-pursuer-warning");
    this.hudPowerupsContainer = document.getElementById("hud-powerups");
    this.comicBubble = document.getElementById("hud-comic-bubble") || document.getElementById("comic-bubble-ingame");
    this.comicBubbleText = document.getElementById("hud-comic-text") || document.getElementById("comic-bubble-text");

    // Menu Elements
    this.menuCoins = document.getElementById("menu-coins");
    this.menuPlayerName = document.getElementById("menu-player-name");
    this.menuPlayerLevel = document.getElementById("menu-level") || document.getElementById("menu-player-level");
    this.menuXpBar = document.getElementById("menu-xp-fill") || document.getElementById("menu-xp-bar");
    this.menuActiveCostumeName = document.getElementById("menu-outfit-name") || document.getElementById("menu-active-costume-name");
    this.missionsBadge = document.getElementById("missions-badge");
    this.rewardsBadge = document.getElementById("rewards-badge");

    // Game Over Elements
    this.goScore = document.getElementById("go-score");
    this.goBestScore = document.getElementById("go-best-score");
    this.goDistance = document.getElementById("go-distance");
    this.goCoins = document.getElementById("go-coins");
    this.goXpGained = document.getElementById("go-xp-text") || document.getElementById("go-xp-gained");
    this.goLevelNum = document.getElementById("go-level-num");
    this.goLevelBar = document.getElementById("go-xp-bar") || document.getElementById("go-level-bar");
    this.goNewRecordBanner = document.getElementById("game-over-new-record") || document.getElementById("go-new-record-banner");

    this.initEventListeners();
  }

  // Switch visible screen
  showScreen(screenName) {
    Object.values(this.screens).forEach(s => s && s.classList.remove("active"));
    if (this.screens[screenName]) {
      this.screens[screenName].classList.add("active");
    }
  }

  // Open modal
  openModal(modalName) {
    if (this.modals[modalName]) {
      this.modals[modalName].classList.remove("hidden");
      AudioManager.playClick();
    }
  }

  // Close modal
  closeModal(modalName) {
    if (this.modals[modalName]) {
      this.modals[modalName].classList.add("hidden");
      AudioManager.playClick();
    }
    this.refreshMenuData();
  }

  // Close all open modals
  closeAllModals() {
    Object.values(this.modals).forEach(m => m && m.classList.add("hidden"));
  }

  // Refresh user data on Menu
  refreshMenuData() {
    const data = SaveManager.data;
    if (!data) return;

    if (this.menuCoins) this.menuCoins.textContent = Utils.formatNumber(data.coins);
    if (this.menuPlayerName) this.menuPlayerName.textContent = data.playerName || "بسام";
    if (this.menuPlayerLevel) this.menuPlayerLevel.textContent = `مستوى ${data.level}`;

    const neededXp = data.level * 250;
    const pct = Math.min(100, Math.floor((data.xp / neededXp) * 100));
    if (this.menuXpBar) this.menuXpBar.style.width = `${pct}%`;

    const activeOutfit = CONFIG.CLOTHES.find(c => c.id === data.selectedClothes);
    if (this.menuActiveCostumeName && activeOutfit) {
      this.menuActiveCostumeName.textContent = activeOutfit.name;
    }

    this.updateMissionBadge();
    this.updateRewardsBadge();
    this.renderMenuCharacter();
  }

  // Render character on the menu canvas
  renderMenuCharacter() {
    const canvas = document.getElementById("menu-character-canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const outfit = (this.game && this.game.player && this.game.player.outfit) || CONFIG.CLOTHES[0];
    const colors = outfit.colors;

    // Ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
    ctx.beginPath();
    ctx.ellipse(w / 2, h - 22, 45, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    const cx = w / 2;
    const cy = h / 2 - 8;

    // Legs
    ctx.fillStyle = colors.pants;
    ctx.fillRect(cx - 20, cy + 28, 14, 46);
    ctx.fillRect(cx + 6, cy + 28, 14, 46);

    // Shoes
    ctx.fillStyle = colors.shoes;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - 24, cy + 68, 20, 14, 4);
      ctx.roundRect(cx + 4, cy + 68, 20, 14, 4);
    } else {
      ctx.rect(cx - 24, cy + 68, 20, 14);
      ctx.rect(cx + 4, cy + 68, 20, 14);
    }
    ctx.fill();

    // Torso / Shirt
    ctx.fillStyle = colors.shirt;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - 26, cy - 24, 52, 56, 10);
    } else {
      ctx.rect(cx - 26, cy - 24, 52, 56);
    }
    ctx.fill();

    // Iraqi flag pin badge on shirt
    ctx.fillStyle = "#CE1126"; // Red
    ctx.fillRect(cx - 15, cy - 10, 14, 3);
    ctx.fillStyle = "#FFFFFF"; // White
    ctx.fillRect(cx - 15, cy - 7, 14, 3);
    ctx.fillStyle = "#000000"; // Black
    ctx.fillRect(cx - 15, cy - 4, 14, 3);

    // Arms
    ctx.fillStyle = colors.shirt;
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(cx - 38, cy - 20, 12, 38, 5);
      ctx.roundRect(cx + 26, cy - 20, 12, 38, 5);
    } else {
      ctx.rect(cx - 38, cy - 20, 12, 38);
      ctx.rect(cx + 26, cy - 20, 12, 38);
    }
    ctx.fill();

    // Hands
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(cx - 32, cy + 22, 7, 0, Math.PI * 2);
    ctx.arc(cx + 32, cy + 22, 7, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = colors.skin;
    ctx.beginPath();
    ctx.arc(cx, cy - 48, 26, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.arc(cx, cy - 54, 27, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.arc(cx - 8, cy - 48, 3.5, 0, Math.PI * 2);
    ctx.arc(cx + 8, cy - 48, 3.5, 0, Math.PI * 2);
    ctx.fill();

    // Cheerful smile
    ctx.strokeStyle = "#C2410C";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy - 43, 10, 0.15 * Math.PI, 0.85 * Math.PI, false);
    ctx.stroke();
  }

  // Update Missions red notification dot
  updateMissionBadge() {
    if (!this.missionsBadge || !this.game.missions) return;
    const count = this.game.missions.getUnclaimedCount();
    if (count > 0) {
      this.missionsBadge.textContent = count;
      this.missionsBadge.classList.remove("hidden");
    } else {
      this.missionsBadge.classList.add("hidden");
    }
  }

  // Update Rewards notification dot
  updateRewardsBadge() {
    if (!this.rewardsBadge || !this.game.rewards) return;
    if (this.game.rewards.canClaimToday()) {
      this.rewardsBadge.textContent = "!";
      this.rewardsBadge.classList.remove("hidden");
    } else {
      this.rewardsBadge.classList.add("hidden");
    }
  }

  // Show temporary comic speech bubble
  showComicBubble(text, duration = 2.2) {
    if (!this.comicBubble || !this.comicBubbleText) return;
    this.comicBubbleText.textContent = text;
    this.comicBubble.classList.remove("hidden");

    if (this.comicTimeout) clearTimeout(this.comicTimeout);
    this.comicTimeout = setTimeout(() => {
      this.comicBubble.classList.add("hidden");
    }, duration * 1000);
  }

  // Render power-up active timers on HUD
  updatePowerupHUD(dt) {
    if (!this.hudPowerupsContainer) return;
    const activePUs = this.game.powerups.active;
    let html = "";

    const items = [
      { key: "shield", active: activePUs.shield, icon: "🛡️", val: activePUs.shieldHits ? "100%" : "0%" },
      { key: "magnet", active: activePUs.magnet > 0, icon: "🧲", max: this.game.powerups.getDuration("magnet"), cur: activePUs.magnet },
      { key: "slowmo", active: activePUs.slowmo > 0, icon: "⏱️", max: this.game.powerups.getDuration("slowmo"), cur: activePUs.slowmo },
      { key: "multiplier", active: activePUs.multiplier > 0, icon: "✖️2", max: this.game.powerups.getDuration("multiplier"), cur: activePUs.multiplier },
      { key: "boost", active: activePUs.boost > 0, icon: "🚀", max: this.game.powerups.getDuration("boost"), cur: activePUs.boost }
    ];

    for (const it of items) {
      if (it.active) {
        let pct = 100;
        if (it.max) {
          pct = Math.floor((it.cur / it.max) * 100);
        }
        html += `
          <div class="powerup-pill">
            <span class="pu-icon">${it.icon}</span>
            <div class="pu-bar-container">
              <div class="pu-bar-fill" style="width: ${pct}%"></div>
            </div>
          </div>
        `;
      }
    }

    this.hudPowerupsContainer.innerHTML = html;
  }

  // Update Game Over screen metrics
  showGameOverModal(stats) {
    this.closeAllModals();
    this.showScreen("gameOver");

    if (this.goScore) this.goScore.textContent = Utils.formatNumber(stats.score);
    if (this.goBestScore) this.goBestScore.textContent = Utils.formatNumber(SaveManager.data.bestScore);
    if (this.goDistance) this.goDistance.textContent = Utils.formatDistance(stats.distance);
    if (this.goCoins) this.goCoins.textContent = Utils.formatNumber(stats.coins);
    if (this.goXpGained) this.goXpGained.textContent = `+${stats.xpGained} XP`;
    if (this.goLevelNum) this.goLevelNum.textContent = `مستوى ${SaveManager.data.level}`;

    const neededXp = SaveManager.data.level * 250;
    const pct = Math.min(100, Math.floor((SaveManager.data.xp / neededXp) * 100));
    if (this.goLevelBar) this.goLevelBar.style.width = `${pct}%`;

    if (this.goNewRecordBanner) {
      if (stats.isNewBestScore) {
        this.goNewRecordBanner.classList.remove("hidden");
      } else {
        this.goNewRecordBanner.classList.add("hidden");
      }
    }
  }

  // Open & Render Shop Modal
  renderShop() {
    const data = SaveManager.data;
    const shopCoinsEl = document.getElementById("shop-coins-display") || document.getElementById("shop-coins");
    if (shopCoinsEl) shopCoinsEl.textContent = Utils.formatNumber(data.coins);

    // 1. Render Costumes Grid
    const clothesGrid = document.getElementById("clothes-items-container") || document.getElementById("shop-clothes-grid");
    if (clothesGrid) {
      clothesGrid.innerHTML = CONFIG.CLOTHES.map(c => {
        const isOwned = data.ownedClothes.includes(c.id);
        const isEquipped = data.selectedClothes === c.id;
        let actionBtn = "";

        if (isEquipped) {
          actionBtn = `<button class="btn-item-action btn-equipped">مُفعّل حالياً ✅</button>`;
        } else if (isOwned) {
          actionBtn = `<button class="btn-item-action btn-equip" onclick="window.game.ui.onEquipOutfit('${c.id}')">ارتداء الزي 👕</button>`;
        } else {
          actionBtn = `<button class="btn-item-action btn-buy" onclick="window.game.ui.onBuyOutfit('${c.id}')">${Utils.formatNumber(c.price)} 🪙 شراء</button>`;
        }

        return `
          <div class="clothing-card ${isEquipped ? 'equipped' : isOwned ? 'owned' : ''}">
            <span class="rarity-tag rarity-${c.rarity}">${c.rarity.toUpperCase()}</span>
            <div class="clothing-preview-box">
              <span style="font-size: 38px;">🏃</span>
            </div>
            <div class="clothing-name">${c.name}</div>
            <div class="clothing-desc">${c.desc}</div>
            ${actionBtn}
          </div>
        `;
      }).join("");
    }

    // 2. Render Upgrades Tab
    const upgradesList = document.getElementById("upgrades-items-container") || document.getElementById("shop-upgrades-list");
    if (upgradesList) {
      upgradesList.innerHTML = Object.values(CONFIG.POWERUPS).map(pu => {
        const curLvl = data.powerUpLevels[pu.id] || 1;
        const isMax = curLvl >= pu.maxLevel;
        const nextCost = !isMax ? pu.upgradeCosts[curLvl - 1] : 0;

        let dots = "";
        for (let i = 1; i <= pu.maxLevel; i++) {
          dots += `<div class="lvl-dot ${i <= curLvl ? 'filled' : ''}"></div>`;
        }

        let buyBtn = "";
        if (isMax) {
          buyBtn = `<button class="btn-item-action btn-equipped" style="width: auto; padding: 6px 12px;">أقصى مستوى ⭐</button>`;
        } else {
          buyBtn = `<button class="btn-item-action btn-buy" style="width: auto; padding: 6px 14px;" onclick="window.game.ui.onUpgradePowerup('${pu.id}')">${Utils.formatNumber(nextCost)} 🪙 ترقية</button>`;
        }

        return `
          <div class="upgrade-item">
            <div class="upgrade-info">
              <span class="upgrade-icon">${pu.icon}</span>
              <div class="upgrade-details">
                <h4>${pu.name}</h4>
                <p>${pu.desc}</p>
                <div class="level-dots-row">${dots}</div>
              </div>
            </div>
            ${buyBtn}
          </div>
        `;
      }).join("");
    }

    // 3. Render Chests Tab
    const chestsGrid = document.getElementById("chests-items-container") || document.getElementById("shop-chests-grid");
    if (chestsGrid) {
      chestsGrid.innerHTML = CONFIG.CHESTS.map(ch => {
        return `
          <div class="chest-card">
            <span class="chest-icon">${ch.icon}</span>
            <h4>${ch.name}</h4>
            <div class="chest-odds">${ch.oddsDesc}</div>
            <button class="btn-item-action btn-buy" onclick="window.game.ui.onOpenChest('${ch.id}')">
              ${Utils.formatNumber(ch.price)} 🪙 فتح الصندوق
            </button>
          </div>
        `;
      }).join("");
    }
  }

  onBuyOutfit(id) {
    const res = this.game.shop.buyOutfit(id);
    if (res.success) {
      this.renderShop();
      this.refreshMenuData();
    } else {
      alert(res.msg);
    }
  }

  onEquipOutfit(id) {
    if (this.game.shop.equipOutfit(id)) {
      this.renderShop();
      this.refreshMenuData();
    }
  }

  onUpgradePowerup(type) {
    if (this.game.powerups.upgrade(type)) {
      this.renderShop();
      this.refreshMenuData();
    } else {
      alert("رصيد العملات غير كافٍ للترقية!");
    }
  }

  onOpenChest(chestId) {
    const result = this.game.shop.openChest(chestId);
    if (!result) return;
    if (!result.success) {
      alert("رصيد العملات غير كافٍ لفتح هذا الصندوق!");
      return;
    }

    this.renderShop();
    this.refreshMenuData();

    // Show Chest Reward Popup Modal
    const popup = this.modals.chestReward;
    const titleEl = document.getElementById("popup-reward-title") || document.getElementById("chest-popup-title");
    const descEl = document.getElementById("popup-reward-desc") || document.getElementById("chest-popup-desc");
    const iconEl = document.getElementById("popup-reward-icon") || document.getElementById("chest-popup-icon");

    if (titleEl) titleEl.textContent = `مبروك! فتحت ${result.chestName}`;
    if (iconEl) iconEl.textContent = result.icon;

    let desc = `حصلت على ${Utils.formatNumber(result.coins)} عملة ذهبية!`;
    if (result.outfit) {
      desc += `\nومكافأة نادرة جداً: زي ${result.outfit.name}! 🎉`;
    }
    if (descEl) descEl.textContent = desc;

    if (popup) popup.classList.remove("hidden");
  }

  // Render Daily Missions Modal
  renderMissions() {
    const listEl = document.getElementById("missions-container") || document.getElementById("missions-list-container");
    if (!listEl) return;

    listEl.innerHTML = this.game.missions.missions.map(m => {
      const prog = SaveManager.data.missions.progress[m.id] || { current: 0, claimed: false };
      const pct = Math.min(100, Math.floor((prog.current / m.target) * 100));
      const isComplete = prog.current >= m.target;
      const isClaimed = prog.claimed;

      let btn = "";
      if (isClaimed) {
        btn = `<button class="btn-claim-mission" disabled>تم الاستلام ✅</button>`;
      } else if (isComplete) {
        btn = `<button class="btn-claim-mission" onclick="window.game.ui.onClaimMission('${m.id}')">استلام 🎁</button>`;
      } else {
        btn = `<button class="btn-claim-mission" disabled>${prog.current}/${m.target}</button>`;
      }

      return `
        <div class="mission-card">
          <div class="mission-top">
            <span class="mission-title">${m.title}</span>
            <span class="mission-reward">+${m.rewardCoins} 🪙 | +${m.rewardXp} XP</span>
          </div>
          <div class="mission-bottom">
            <div class="mission-progress-bar">
              <div style="width: ${pct}%"></div>
            </div>
            ${btn}
          </div>
        </div>
      `;
    }).join("");
  }

  onClaimMission(id) {
    if (this.game.missions.claim(id)) {
      this.renderMissions();
      this.refreshMenuData();
    }
  }

  // Render 7-Day Rewards Modal
  renderRewards() {
    const gridEl = document.getElementById("rewards-calendar-container") || document.getElementById("daily-rewards-grid");
    const claimBtn = document.getElementById("btn-claim-daily") || document.getElementById("btn-claim-daily-reward");
    if (!gridEl) return;

    const currentDay = this.game.rewards.getCurrentDay();
    const canClaim = this.game.rewards.canClaimToday();

    gridEl.innerHTML = this.game.rewards.rewards.map(r => {
      const isToday = r.day === currentDay;
      const isPast = r.day < currentDay || (isToday && !canClaim);

      return `
        <div class="day-reward-card ${isToday && canClaim ? 'active-today' : ''} ${isPast ? 'claimed' : ''}">
          <span class="day-number">اليوم ${r.day}</span>
          <span class="day-reward-icon">${r.icon}</span>
          <span class="day-value">${r.label}</span>
        </div>
      `;
    }).join("");

    if (claimBtn) {
      claimBtn.disabled = !canClaim;
      claimBtn.textContent = canClaim ? "استلام هدية اليوم 🎁" : "تم الاستلام اليوم! عُد غداً ⏰";
    }
  }

  onClaimDailyReward() {
    const res = this.game.rewards.claimToday();
    if (res.success) {
      alert(res.message);
      this.renderRewards();
      this.refreshMenuData();
    } else {
      alert(res.msg);
    }
  }

  // Render Leaderboard Modal
  renderLeaderboard() {
    const tbody = document.getElementById("leaderboard-body") || document.getElementById("leaderboard-tbody");
    if (!tbody) return;

    const leaders = this.game.leaderboard.getLeaderboard();
    tbody.innerHTML = leaders.map((lead, idx) => {
      const rank = idx + 1;
      const rankBadge = rank <= 3
        ? `<span class="rank-pill rank-${rank}">${rank}</span>`
        : `<span class="rank-pill" style="background:#334155;">${rank}</span>`;

      return `
        <tr style="${lead.isPlayer ? 'background: rgba(245, 124, 0, 0.2); font-weight: 900;' : ''}">
          <td>${rankBadge}</td>
          <td>${lead.name}</td>
          <td>${Utils.formatNumber(lead.score)}</td>
          <td>${Utils.formatDistance(lead.distance)}</td>
        </tr>
      `;
    }).join("");
  }

  // Synchronize Settings inputs with SaveManager
  syncSettingsUI() {
    const settings = SaveManager.data.settings;
    const sfxToggle = document.getElementById("setting-sfx") || document.getElementById("setting-sfx-toggle");
    const musicToggle = document.getElementById("setting-music") || document.getElementById("setting-music-toggle");
    const volumeSlider = document.getElementById("setting-volume") || document.getElementById("setting-volume-slider");
    const graphicsSelect = document.getElementById("setting-graphics") || document.getElementById("setting-graphics-select");
    const playerNameInput = document.getElementById("setting-player-name");

    if (sfxToggle) sfxToggle.checked = settings.sfx;
    if (musicToggle) musicToggle.checked = settings.music;
    if (volumeSlider) volumeSlider.value = settings.volume;
    if (graphicsSelect) graphicsSelect.value = settings.graphics;
    if (playerNameInput) playerNameInput.value = SaveManager.data.playerName || "بسام";

    // Pause audio toggles
    const pauseSfx = document.getElementById("pause-toggle-sfx") || document.getElementById("pause-sfx-btn");
    const pauseMusic = document.getElementById("pause-toggle-music") || document.getElementById("pause-music-btn");
    if (pauseSfx) pauseSfx.classList.toggle("active", settings.sfx);
    if (pauseMusic) pauseMusic.classList.toggle("active", settings.music);
  }

  // Setup DOM Event Listeners
  initEventListeners() {
    // Play button
    const playBtn = document.getElementById("btn-play") || document.getElementById("btn-play-game");
    playBtn?.addEventListener("click", () => {
      AudioManager.init();
      this.game.startRun();
    });

    // Pause & Resume
    document.getElementById("btn-pause")?.addEventListener("click", () => {
      this.game.pauseRun();
    });

    const resumeBtn = document.getElementById("btn-resume") || document.getElementById("btn-resume-run");
    resumeBtn?.addEventListener("click", () => {
      this.game.resumeRun();
    });

    const restartFromPauseBtn = document.getElementById("btn-restart-from-pause");
    restartFromPauseBtn?.addEventListener("click", () => {
      this.game.startRun();
    });

    const quitBtn = document.getElementById("btn-exit-to-menu") || document.getElementById("btn-quit-run");
    quitBtn?.addEventListener("click", () => {
      this.game.quitRun();
    });

    // Game Over buttons
    document.getElementById("btn-play-again")?.addEventListener("click", () => {
      this.game.startRun();
    });

    document.getElementById("btn-go-home")?.addEventListener("click", () => {
      this.game.quitRun();
    });

    document.getElementById("btn-go-shop")?.addEventListener("click", () => {
      this.showScreen("mainMenu");
      this.renderShop();
      this.openModal("shop");
    });

    // Menu Action Buttons
    const shopBtn = document.getElementById("btn-shop") || document.getElementById("btn-open-shop");
    shopBtn?.addEventListener("click", () => {
      this.renderShop();
      this.openModal("shop");
    });

    const missionsBtn = document.getElementById("btn-missions") || document.getElementById("btn-open-missions");
    missionsBtn?.addEventListener("click", () => {
      this.renderMissions();
      this.openModal("missions");
    });

    const rewardsBtn = document.getElementById("btn-rewards") || document.getElementById("btn-open-rewards");
    rewardsBtn?.addEventListener("click", () => {
      this.renderRewards();
      this.openModal("rewards");
    });

    const leaderboardBtn = document.getElementById("btn-leaderboard") || document.getElementById("btn-open-leaderboard");
    leaderboardBtn?.addEventListener("click", () => {
      this.renderLeaderboard();
      this.openModal("leaderboard");
    });

    document.getElementById("btn-chests")?.addEventListener("click", () => {
      this.renderShop();
      this.openModal("shop");
      // switch to chests tab
      document.querySelectorAll(".shop-tab-btn").forEach(b => b.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
      const chestTab = document.querySelector('.shop-tab-btn[data-tab="chests"]');
      if (chestTab) chestTab.classList.add("active");
      const chestContent = document.getElementById("tab-chests");
      if (chestContent) chestContent.classList.add("active");
    });

    const settingsBtn = document.getElementById("btn-settings") || document.getElementById("btn-open-settings");
    settingsBtn?.addEventListener("click", () => {
      this.syncSettingsUI();
      this.openModal("settings");
    });

    const howBtn = document.getElementById("btn-how-to-play") || document.getElementById("btn-open-how-to-play");
    howBtn?.addEventListener("click", () => {
      this.openModal("howToPlay");
    });

    const aboutBtn = document.getElementById("btn-about") || document.getElementById("btn-open-about");
    aboutBtn?.addEventListener("click", () => {
      this.openModal("about");
    });

    const changeCostumeBtn = document.getElementById("btn-quick-wardrobe") || document.getElementById("btn-open-shop-quick") || document.getElementById("btn-change-costume");
    changeCostumeBtn?.addEventListener("click", () => {
      this.renderShop();
      this.openModal("shop");
    });

    // Modal Close Buttons
    document.querySelectorAll(".btn-close-modal").forEach(btn => {
      btn.addEventListener("click", (e) => {
        const modal = e.target.closest(".modal-backdrop");
        if (modal) modal.classList.add("hidden");
        this.refreshMenuData();
      });
    });

    // Shop Tabs Switching
    document.querySelectorAll(".shop-tab-btn").forEach(tabBtn => {
      tabBtn.addEventListener("click", (e) => {
        document.querySelectorAll(".shop-tab-btn").forEach(b => b.classList.remove("active"));
        document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

        e.target.classList.add("active");
        const tabKey = e.target.getAttribute("data-tab");
        const targetContent = document.getElementById(`tab-${tabKey}`);
        if (targetContent) targetContent.classList.add("active");
        AudioManager.playClick();
      });
    });

    // Claim daily reward button
    const claimDailyBtn = document.getElementById("btn-claim-daily") || document.getElementById("btn-claim-daily-reward");
    claimDailyBtn?.addEventListener("click", () => {
      this.onClaimDailyReward();
    });

    // Settings inputs
    const sfxToggle = document.getElementById("setting-sfx") || document.getElementById("setting-sfx-toggle");
    sfxToggle?.addEventListener("change", (e) => {
      SaveManager.data.settings.sfx = e.target.checked;
      SaveManager.save();
      AudioManager.applySettings();
    });

    const musicToggle = document.getElementById("setting-music") || document.getElementById("setting-music-toggle");
    musicToggle?.addEventListener("change", (e) => {
      SaveManager.data.settings.music = e.target.checked;
      SaveManager.save();
      AudioManager.applySettings();
      if (SaveManager.data.settings.music) {
        AudioManager.startMusic();
      } else {
        AudioManager.stopMusic();
      }
    });

    const volSlider = document.getElementById("setting-volume") || document.getElementById("setting-volume-slider");
    volSlider?.addEventListener("input", (e) => {
      SaveManager.data.settings.volume = parseInt(e.target.value, 10);
      SaveManager.save();
      AudioManager.applySettings();
    });

    const gfxSelect = document.getElementById("setting-graphics") || document.getElementById("setting-graphics-select");
    gfxSelect?.addEventListener("change", (e) => {
      SaveManager.data.settings.graphics = e.target.value;
      SaveManager.save();
    });

    const pNameInput = document.getElementById("setting-player-name");
    pNameInput?.addEventListener("change", (e) => {
      const val = e.target.value.trim();
      if (val) {
        SaveManager.data.playerName = val;
        SaveManager.save();
        this.refreshMenuData();
      }
    });

    document.getElementById("btn-save-settings")?.addEventListener("click", () => {
      SaveManager.save();
      this.closeModal("settings");
    });

    // Reset Data button
    document.getElementById("btn-reset-save-data")?.addEventListener("click", () => {
      if (confirm("هل أنت متأكد من رغبتك في إعادة ضبط جميع بيانات اللعبة والبدء من جديد؟")) {
        SaveManager.createAndSaveDefault();
        this.refreshMenuData();
        this.syncSettingsUI();
        this.closeAllModals();
        alert("تمت إعادة تعيين البيانات بنجاح.");
      }
    });

    // Pause Audio Quick Toggles
    const pauseSfxBtn = document.getElementById("pause-toggle-sfx") || document.getElementById("pause-sfx-btn");
    pauseSfxBtn?.addEventListener("click", () => {
      SaveManager.data.settings.sfx = !SaveManager.data.settings.sfx;
      SaveManager.save();
      AudioManager.applySettings();
      this.syncSettingsUI();
    });

    const pauseMusicBtn = document.getElementById("pause-toggle-music") || document.getElementById("pause-music-btn");
    pauseMusicBtn?.addEventListener("click", () => {
      SaveManager.data.settings.music = !SaveManager.data.settings.music;
      SaveManager.save();
      AudioManager.applySettings();
      this.syncSettingsUI();
    });

    // Chest Reward Collect
    const closeRewardBtn = document.getElementById("btn-close-reward-popup") || document.getElementById("btn-claim-chest-reward");
    closeRewardBtn?.addEventListener("click", () => {
      if (this.modals.chestReward) {
        this.modals.chestReward.classList.add("hidden");
      }
    });
  }
}
