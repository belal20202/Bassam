/**
 * بسام (Bassam Runner) - Daily Rewards Calendar System
 * 7-Day login streak tracker with real calendar date persistence and rewards payout.
 */

class DailyRewardsManager {
  constructor(game) {
    this.game = game;
    this.rewards = CONFIG.DAILY_REWARDS;
    this.syncDailyStreak();
  }

  // Synchronize streak based on calendar day
  syncDailyStreak() {
    const today = new Date().toDateString();
    const lastClaim = SaveManager.data.dailyReward?.lastClaimDate;

    if (!lastClaim) {
      // First time playing: Day 1 ready to claim
      return;
    }

    if (lastClaim === today) {
      // Already claimed today
      return;
    }

    const lastDate = new Date(lastClaim);
    const currentDate = new Date(today);
    const diffDays = Math.floor((currentDate - lastDate) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day login!
      let nextDay = (SaveManager.data.dailyReward.currentDay || 1) + 1;
      if (nextDay > 7) nextDay = 1; // Loop 7-day cycle
      SaveManager.data.dailyReward.currentDay = nextDay;
      SaveManager.save();
    } else if (diffDays > 1) {
      // Streak broken, reset to Day 1
      SaveManager.data.dailyReward.currentDay = 1;
      SaveManager.save();
    }
  }

  // Is reward claimable today?
  canClaimToday() {
    const today = new Date().toDateString();
    return SaveManager.data.dailyReward?.lastClaimDate !== today;
  }

  getCurrentDay() {
    return SaveManager.data.dailyReward?.currentDay || 1;
  }

  // Claim today's gift
  claimToday() {
    if (!this.canClaimToday()) {
      return { success: false, msg: "لقد استلمت مكافأة اليوم بالفعل! عُد غداً." };
    }

    const currentDay = this.getCurrentDay();
    const rewardItem = this.rewards[currentDay - 1];
    if (!rewardItem) return { success: false, msg: "خطأ في بيانات المكافأة" };

    const today = new Date().toDateString();
    SaveManager.data.dailyReward.lastClaimDate = today;

    let claimResult = "";

    if (rewardItem.type === "coins") {
      SaveManager.addCoins(rewardItem.value);
      claimResult = `حصلت على ${rewardItem.value} عملة ذهبية!`;
    } else if (rewardItem.type === "powerup") {
      // Boost powerup level or coins
      SaveManager.addCoins(300);
      claimResult = `حصلت على ترقية مجانية ومكافأة 300 عملة!`;
    } else if (rewardItem.type === "chest") {
      SaveManager.addCoins(600);
      claimResult = `حصلت على هدية الصندوق و600 عملة!`;
    } else if (rewardItem.type === "costume") {
      if (!SaveManager.data.ownedClothes.includes(rewardItem.value)) {
        SaveManager.data.ownedClothes.push(rewardItem.value);
        claimResult = `تهانينا الكبرى! حصلت على زي أسطوري: ${rewardItem.label}!`;
      } else {
        SaveManager.addCoins(2000);
        claimResult = `حصلت على 2,000 عملة بديلة لأنك تملك الزي مسبقاً!`;
      }
    }

    SaveManager.save();
    AudioManager.playPurchase();

    return {
      success: true,
      day: currentDay,
      reward: rewardItem,
      message: claimResult
    };
  }
}
