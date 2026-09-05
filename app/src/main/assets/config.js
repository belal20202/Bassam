/**
 * بسام (Bassam Runner) - Master Configuration
 * All game settings, economy, costumes, power-ups, and environments.
 */

const CONFIG = {
  // Identity
  GAME_TITLE: "بسام",
  GAME_TITLE_EN: "Bassam Runner",
  DEVELOPER: "بلال النعيمي",
  YEAR: 2026,
  VERSION: "1.0.0",
  MADE_IN: "صنع في العراق 🇮🇶",

  // Economy & Currency (Easily customizable)
  CURRENCY_NAME: "عملة بسام",
  CURRENCY_SYMBOL: "🪙",

  // Canvas & Resolution
  CANVAS_VIRTUAL_WIDTH: 480,
  CANVAS_VIRTUAL_HEIGHT: 854,
  TARGET_FPS: 60,

  // Lanes & Coordinates
  LANES: {
    LEFT: -1,
    CENTER: 0,
    RIGHT: 1
  },
  LANE_DISTANCE_X: 95, // 3D Perspective separation

  // Speeds & Physics
  PHYSICS: {
    INITIAL_SPEED: 420,
    MAX_SPEED: 920,
    SPEED_ACCELERATION: 1.8, // Speed increase per 100 meters
    JUMP_VELOCITY: 580,
    GRAVITY: 1550,
    SLIDE_DURATION: 0.75, // Seconds
    ROLL_RECOVERY: 0.25,
    STUMBLE_SLOWDOWN: 0.65, // Fraction of speed remaining on stumble
    STUMBLE_DURATION: 1.2,
    ENEMY_DEFAULT_DISTANCE: 70, // Units behind player
    ENEMY_CAUGHT_THRESHOLD: 10,
    ENEMY_STUMBLE_APPROACH: 30, // Moves closer on error
    ENEMY_RECEDE_SPEED: 12      // Recedes back gradually
  },

  // Environments (Shift smoothly as distance progresses)
  ENVIRONMENTS: [
    {
      id: "residential",
      name: "الحي السكني",
      minDist: 0,
      maxDist: 1000,
      skyGradient: ["#38bdf8", "#bae6fd"],
      roadColor: "#334155",
      curbColor: "#f59e0b",
      sidewalkColor: "#cbd5e1",
      buildingsStyle: "residential",
      timeOfDay: "day"
    },
    {
      id: "commercial",
      name: "المنطقة التجارية",
      minDist: 1000,
      maxDist: 2000,
      skyGradient: ["#60a5fa", "#93c5fd"],
      roadColor: "#1e293b",
      curbColor: "#ef4444",
      sidewalkColor: "#94a3b8",
      buildingsStyle: "commercial",
      timeOfDay: "day"
    },
    {
      id: "souq",
      name: "السوق الشعبي",
      minDist: 2000,
      maxDist: 3000,
      skyGradient: ["#fb923c", "#fcd34d"],
      roadColor: "#475569",
      curbColor: "#d97706",
      sidewalkColor: "#e2e8f0",
      buildingsStyle: "souq",
      timeOfDay: "sunset"
    },
    {
      id: "boulevard",
      name: "الشارع الرئيسي",
      minDist: 3000,
      maxDist: 4000,
      skyGradient: ["#c084fc", "#f472b6"],
      roadColor: "#1e1b4b",
      curbColor: "#a855f7",
      sidewalkColor: "#64748b",
      buildingsStyle: "boulevard",
      timeOfDay: "sunset"
    },
    {
      id: "modern",
      name: "المنطقة الحديثة",
      minDist: 4000,
      maxDist: 5000,
      skyGradient: ["#0f172a", "#1e1b4b"],
      roadColor: "#090d16",
      curbColor: "#38bdf8",
      sidewalkColor: "#334155",
      buildingsStyle: "modern",
      timeOfDay: "night"
    },
    {
      id: "hyperspeed",
      name: "تحدي الأساطير السريع",
      minDist: 5000,
      maxDist: Infinity,
      skyGradient: ["#18052e", "#3b0764"],
      roadColor: "#050508",
      curbColor: "#ec4899",
      sidewalkColor: "#1f1d36",
      buildingsStyle: "neon",
      timeOfDay: "night"
    }
  ],

  // 20 Complete Outfits for Bassam
  CLOTHES: [
    {
      id: "casual",
      name: "بسام الكاجوال",
      desc: "الزي اليومي المريح لبسام في الحي",
      price: 0,
      rarity: "common",
      colors: { shirt: "#ffffff", pants: "#0288d1", shoes: "#374151", hair: "#111827", cap: null }
    },
    {
      id: "sporty",
      name: "بسام الرياضي",
      desc: "طقم ركض خفيف وسريع للحركات الرشيقة",
      price: 250,
      rarity: "common",
      colors: { shirt: "#ef4444", pants: "#1f2937", shoes: "#ffffff", hair: "#111827", cap: "#ef4444" }
    },
    {
      id: "winter",
      name: "بسام الشتوي",
      desc: "سترة صوفية دافئة ووشاح أنيق",
      price: 450,
      rarity: "common",
      colors: { shirt: "#3b82f6", pants: "#475569", shoes: "#78350f", hair: "#111827", cap: "#1e3a8a" }
    },
    {
      id: "traveler",
      name: "بسام الرحالة",
      desc: "حقيبة ظهر وجاهز لاستكشاف كل المدن",
      price: 700,
      rarity: "rare",
      colors: { shirt: "#d97706", pants: "#78350f", shoes: "#451a03", hair: "#111827", cap: "#92400e" }
    },
    {
      id: "student",
      name: "بسام الطالب",
      desc: "حقيبة مدرسية وعزيمة للتفوق",
      price: 900,
      rarity: "rare",
      colors: { shirt: "#10b981", pants: "#1e293b", shoes: "#0f172a", hair: "#111827", cap: null }
    },
    {
      id: "footballer",
      name: "بسام لاعب الكرة",
      desc: "قميص منتخب الأبطال مع حذاء سريع",
      price: 1200,
      rarity: "rare",
      colors: { shirt: "#16a34a", pants: "#ffffff", shoes: "#eab308", hair: "#111827", cap: null }
    },
    {
      id: "businessman",
      name: "بسام رجل الأعمال",
      desc: "بدلة رسمية فاخرة مع ربطة عنق",
      price: 1600,
      rarity: "rare",
      colors: { shirt: "#0f172a", pants: "#0f172a", shoes: "#000000", hair: "#111827", cap: null }
    },
    {
      id: "adventurer",
      name: "بسام المغامر",
      desc: "ملابس استكشاف المغامرات في الوديان",
      price: 2100,
      rarity: "rare",
      colors: { shirt: "#854d0e", pants: "#a16207", shoes: "#713f12", hair: "#111827", cap: "#ca8a04" }
    },
    {
      id: "desert",
      name: "بسام الصحراوي",
      desc: "ثوب عربي مريح مع كوفية تراثية أصيلة",
      price: 2600,
      rarity: "epic",
      colors: { shirt: "#fef3c7", pants: "#fef3c7", shoes: "#b45309", hair: "#111827", cap: "#dc2626" }
    },
    {
      id: "night",
      name: "بسام الليلي",
      desc: "ألوان خفية مموهة لسرعة الجري في الظلام",
      price: 3200,
      rarity: "epic",
      colors: { shirt: "#1e1b4b", pants: "#0f172a", shoes: "#312e81", hair: "#111827", cap: "#4338ca" }
    },
    {
      id: "golden",
      name: "بسام الذهبي",
      desc: "درع ذهبي لامع يشع بريقاً مع كل خطوة",
      price: 4000,
      rarity: "epic",
      colors: { shirt: "#eab308", pants: "#ca8a04", shoes: "#a16207", hair: "#facc15", cap: "#fef08a" }
    },
    {
      id: "fire",
      name: "بسام الناري",
      desc: "لهب حارق ينبثق من أقدام بسام أثناء الركض",
      price: 5000,
      rarity: "epic",
      colors: { shirt: "#dc2626", pants: "#991b1b", shoes: "#f97316", hair: "#ea580c", cap: "#ef4444" }
    },
    {
      id: "lightning",
      name: "بسام البرق",
      desc: "صواعق كهربية زرقاء ترافقه أينما حل",
      price: 6200,
      rarity: "epic",
      colors: { shirt: "#0284c7", pants: "#0369a1", shoes: "#38bdf8", hair: "#7dd3fc", cap: "#0ea5e9" }
    },
    {
      id: "legendary",
      name: "بسام الأسطوري",
      desc: "زي أسطوري مصنوع من خيوط النصر",
      price: 7800,
      rarity: "legendary",
      colors: { shirt: "#7c3aed", pants: "#5b21b6", shoes: "#a78bfa", hair: "#c4b5fd", cap: "#8b5cf6" }
    },
    {
      id: "royal",
      name: "بسام الملكي",
      desc: "بشت ملكي مطرز بماء الذهب الخالص",
      price: 9500,
      rarity: "legendary",
      colors: { shirt: "#18181b", pants: "#18181b", shoes: "#eab308", hair: "#111827", cap: "#d97706" }
    },
    {
      id: "speedster",
      name: "بسام السريع",
      desc: "بزة أيروديناميكية تقلل احتكاك الهواء",
      price: 11500,
      rarity: "legendary",
      colors: { shirt: "#10b981", pants: "#047857", shoes: "#34d399", hair: "#6ee7b7", cap: "#059669" }
    },
    {
      id: "scifi",
      name: "بسام الفضائي",
      desc: "بدلة فضاء سايبر متطورة مع خوذة ضوئية",
      price: 13500,
      rarity: "legendary",
      colors: { shirt: "#06b6d4", pants: "#0e7490", shoes: "#22d3ee", hair: "#67e8f9", cap: "#0891b2" }
    },
    {
      id: "shadow",
      name: "بسام الظل",
      desc: "تخفٍ أسطوري يترك أثراً دخانياً أسود",
      price: 16000,
      rarity: "legendary",
      colors: { shirt: "#09090b", pants: "#09090b", shoes: "#27272a", hair: "#18181b", cap: "#3f3f46" }
    },
    {
      id: "rare_champion",
      name: "بسام النادر",
      desc: "زي أبطال الميادين العربية التاريخية",
      price: 19000,
      rarity: "legendary",
      colors: { shirt: "#b91c1c", pants: "#1e3a8a", shoes: "#f59e0b", hair: "#111827", cap: "#b91c1c" }
    },
    {
      id: "ultimate",
      name: "بسام الأسطوري النهائي",
      desc: "التاج الذهبي والهالة الملكية، قمة الإنجاز!",
      price: 25000,
      rarity: "legendary",
      colors: { shirt: "#ffd700", pants: "#800080", shoes: "#ffffff", hair: "#ffd700", cap: "#ffffff" }
    }
  ],

  // 5 Upgradable Power-ups
  POWERUPS: {
    shield: {
      id: "shield",
      name: "الدرع الواقي",
      desc: "يحمي بسام من اصطدام مفاجئ واحد",
      icon: "🛡️",
      maxLevel: 5,
      baseDuration: 6, // Seconds or hits
      durationPerLevel: 2,
      upgradeCosts: [200, 450, 800, 1500]
    },
    magnet: {
      id: "magnet",
      name: "مغناطيس العملات",
      desc: "يجذب كل العملات الذهبية المحيطة لبسام",
      icon: "🧲",
      maxLevel: 5,
      baseDuration: 5,
      durationPerLevel: 1.8,
      upgradeCosts: [180, 400, 750, 1400]
    },
    slowmo: {
      id: "slowmo",
      name: "الإبطاء الزمني",
      desc: "يبطئ سرعة اللعبة لتفادي أصعب العقبات",
      icon: "⏱️",
      maxLevel: 5,
      baseDuration: 2.5,
      durationPerLevel: 1.5,
      upgradeCosts: [220, 500, 900, 1600]
    },
    multiplier: {
      id: "multiplier",
      name: "مضاعف العملات",
      desc: "يضاعف قيمة العملات المجمعة x2",
      icon: "✖️2",
      maxLevel: 5,
      baseDuration: 6,
      durationPerLevel: 2.0,
      upgradeCosts: [250, 550, 1000, 1800]
    },
    boost: {
      id: "boost",
      name: "الاندفاع الخارق (Boost)",
      desc: "اندفاع ناري صاروخي وسرعة هائلة مع حماية تامة",
      icon: "🚀",
      maxLevel: 5,
      baseDuration: 3.5,
      durationPerLevel: 1.2,
      upgradeCosts: [350, 750, 1400, 2400]
    }
  },

  // 10 Daily Missions
  DAILY_MISSIONS: [
    { id: "m1", title: "اركض لمسافة 1,000 متر", target: 1000, type: "distance", rewardCoins: 150, rewardXp: 80 },
    { id: "m2", title: "اجمع 300 عملة ذهبية", target: 300, type: "coins", rewardCoins: 200, rewardXp: 100 },
    { id: "m3", title: "اقفز 30 مرة فوق الحواجز", target: 30, type: "jumps", rewardCoins: 120, rewardXp: 60 },
    { id: "m4", title: "انزلق 20 مرة تحت العوائق", target: 20, type: "slides", rewardCoins: 130, rewardXp: 70 },
    { id: "m5", title: "استخدم الدرع الواقي مرتين", target: 2, type: "shield_use", rewardCoins: 180, rewardXp: 90 },
    { id: "m6", title: "استخدم المغناطيس 3 مرات", target: 3, type: "magnet_use", rewardCoins: 190, rewardXp: 95 },
    { id: "m7", title: "اجمع 5 قدرات خارقة", target: 5, type: "powerup_collect", rewardCoins: 220, rewardXp: 110 },
    { id: "m8", title: "اركض لمسافة 2,500 متر", target: 2500, type: "distance", rewardCoins: 350, rewardXp: 180 },
    { id: "m9", title: "حقّق نتيجة 10,000 نقطة", target: 10000, type: "score", rewardCoins: 300, rewardXp: 150 },
    { id: "m10", title: "العب 3 جولات ركض", target: 3, type: "runs_played", rewardCoins: 140, rewardXp: 70 }
  ],

  // 7-Day Daily Rewards
  DAILY_REWARDS: [
    { day: 1, type: "coins", value: 100, icon: "🪙", label: "100 عملة" },
    { day: 2, type: "coins", value: 200, icon: "🪙", label: "200 عملة" },
    { day: 3, type: "coins", value: 350, icon: "🪙", label: "350 عملة" },
    { day: 4, type: "powerup", value: "shield", icon: "🛡️", label: "درع مطور" },
    { day: 5, type: "coins", value: 600, icon: "🪙", label: "600 عملة" },
    { day: 6, type: "chest", value: "rare", icon: "📦", label: "صندوق نادر" },
    { day: 7, type: "costume", value: "desert", icon: "👑", label: "زي بسام الصحراوي" }
  ],

  // 4 Mystery Chests
  CHESTS: [
    {
      id: "normal",
      name: "صندوق عادي",
      price: 300,
      icon: "📦",
      oddsDesc: "عملات (150-400) أو فرصة زي شائع",
      coinMin: 150,
      coinMax: 400,
      outfitChance: 0.15,
      outfitPool: ["sporty", "winter"]
    },
    {
      id: "rare",
      name: "صندوق نادر",
      price: 800,
      icon: "🎁",
      oddsDesc: "عملات (500-1100) أو فرصة زي نادر",
      coinMin: 500,
      coinMax: 1100,
      outfitChance: 0.28,
      outfitPool: ["traveler", "student", "footballer"]
    },
    {
      id: "epic",
      name: "صندوق ملحمي",
      price: 1800,
      icon: "💎",
      oddsDesc: "عملات (1200-2800) أو فرصة زي ملحمي",
      coinMin: 1200,
      coinMax: 2800,
      outfitChance: 0.40,
      outfitPool: ["desert", "night", "golden", "fire"]
    },
    {
      id: "legendary",
      name: "صندوق أسطوري",
      price: 4000,
      icon: "👑",
      oddsDesc: "عملات (3000-7000) أو فرصة زي أسطوري",
      coinMin: 3000,
      coinMax: 7000,
      outfitChance: 0.60,
      outfitPool: ["legendary", "royal", "speedster", "scifi", "ultimate"]
    }
  ]
};

// Freeze config object to prevent runtime mutations
if (typeof Object.freeze === 'function') {
  Object.freeze(CONFIG);
}
