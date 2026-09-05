/**
 * بسام (Bassam Runner) - Missions System
 * Daily mission generation, progress tracking, automatic daily rollover,
 * reward claiming with XP & coin payouts, and UI badge synchronization.
 */

class MissionsManager {
  constructor(game) {
    this.game = game;
    this.missions = CONFIG.DAILY_MISSIONS;
    this.checkDailyReset();
  }

  // Check if today is a new calendar day and reset missions if so
  checkDailyReset() {
    const today = new Date().toDateString();
    if (!SaveManager.data.missions) {
      SaveManager.data.missions = { lastResetDate: today, progress: {} };
    }

    if (SaveManager.data.missions.lastResetDate !== today) {
      // New day: reset progress
      SaveManager.data.missions.lastResetDate = today;
      SaveManager.data.missions.progress = {};
      for (const m of this.missions) {
        SaveManager.data.missions.progress[m.id] = { current: 0, claimed: false };
      }
      SaveManager.save();
    } else {
      // Ensure all mission IDs exist in progress map
      for (const m of this.missions) {
        if (!SaveManager.data.missions.progress[m.id]) {
          SaveManager.data.missions.progress[m.id] = { current: 0, claimed: false };
        }
      }
    }
  }

  // Increment mission progress by type
  track(type, amount) {
    if (!SaveManager.data?.missions?.progress) return;
    let anyCompleted = false;

    for (const m of this.missions) {
      if (m.type === type) {
        const item = SaveManager.data.missions.progress[m.id];
        if (item && !item.claimed && item.current < m.target) {
          item.current = Math.min(m.target, item.current + amount);
          if (item.current >= m.target) {
            anyCompleted = true;
          }
        }
      }
    }

    SaveManager.save();
    if (anyCompleted && this.game.ui) {
      this.game.ui.updateMissionBadge();
    }
  }

  // Get count of unclaimed completed missions for badge display
  getUnclaimedCount() {
    let count = 0;
    const prog = SaveManager.data?.missions?.progress || {};
    for (const m of this.missions) {
      const item = prog[m.id];
      if (item && item.current >= m.target && !item.claimed) {
        count++;
      }
    }
    return count;
  }

  // Claim mission reward
  claim(missionId) {
    const mission = this.missions.find(m => m.id === missionId);
    if (!mission) return false;

    const item = SaveManager.data?.missions?.progress[missionId];
    if (item && item.current >= mission.target && !item.claimed) {
      item.claimed = true;
      SaveManager.addCoins(mission.rewardCoins);
      SaveManager.addXP(mission.rewardXp);
      SaveManager.save();
      AudioManager.playPurchase();
      return true;
    }
    return false;
  }
}
