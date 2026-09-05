/**
 * بسام (Bassam Runner) - Offline Leaderboard Engine
 * Realistic Arabic community rankings integrated with the player's high score.
 */

class LeaderboardManager {
  constructor(game) {
    this.game = game;
    this.storageKey = "bassam_leaderboard_v1";
    this.defaultLeaders = [
      { name: "سيف البغدادي 🇮🇶", score: 48200, distance: 4820 },
      { name: "أحمد العراقي ⚡", score: 39500, distance: 3950 },
      { name: "عمر البصري 🏆", score: 31200, distance: 3120 },
      { name: "طارق الكعبي 🚀", score: 25400, distance: 2540 },
      { name: "يوسف نينوى 🌟", score: 19800, distance: 1980 },
      { name: "علي الكرخي 💫", score: 15600, distance: 1560 },
      { name: "زينب الرسامة 🎨", score: 12400, distance: 1240 },
      { name: "حيدر السريع 🐆", score: 9800, distance: 980 },
      { name: "مصطفى البطل 🔥", score: 7500, distance: 750 },
      { name: "نور الدين 🌙", score: 4200, distance: 420 }
    ];
  }

  // Get combined leaderboard sorted with the current player
  getLeaderboard() {
    let board = [...this.defaultLeaders];
    const playerBest = SaveManager.data?.bestScore || 0;
    const playerDist = SaveManager.data?.bestDistance || 0;
    const playerName = (SaveManager.data?.playerName || "بسام") + " (أنت)";

    // Insert player's entry
    board.push({
      name: playerName,
      score: playerBest,
      distance: playerDist,
      isPlayer: true
    });

    // Sort descending by score
    board.sort((a, b) => b.score - a.score);

    // Limit to top 15
    return board.slice(0, 15);
  }
}
