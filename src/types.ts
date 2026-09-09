/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type GameState = 
  | 'MENU'
  | 'PLAYING'
  | 'PAUSED'
  | 'GAMEOVER'
  | 'SKILLS'
  | 'MISSIONS'
  | 'ACHIEVEMENTS'
  | 'SHOP'
  | 'SETTINGS'
  | 'CHARACTER_INSPECT'
  | 'CAREER_STATS'
  | 'TITLES';

export type Lane = -1 | 0 | 1; // Left (-1), Middle (0), Right (1)

export type WeatherType = 
  | 'SUNNY_MORNING'      // صباح بغدادي مشمس وجميل
  | 'NOON_BRIGHT'        // ظهيرة بغداد الساطعة
  | 'GOLDEN_SUNSET'      // غروب دجلة الذهبي
  | 'LIGHT_RAIN_MIST'    // رذاذ منعش وضباب خفيف
  | 'BAGHDAD_STORM'      // أمطار رعدية موسمية مع برق
  | 'BAGHDAD_DUST_STORM' // عاصفة ترابية وغبار بغدادي متصاعد
  | 'KARRADA_NIGHT';     // ليل الكرادة وأنوار النيون

export type BiomeType = 
  // دول عربية (Arab Countries)
  | 'EGYPT_CAIRO'              // 🇪🇬 مصر - القاهرة
  | 'UAE_DUBAI'                // 🇦🇪 الإمارات - دبي
  | 'SAUDI_RIYADH'             // 🇸🇦 السعودية - الرياض
  | 'MOROCCO_MARRAKESH'        // 🇲🇦 المغرب - مراكش
  | 'QATAR_DOHA'               // 🇶🇦 قطر - الدوحة
  | 'JORDAN_AMMAN'             // 🇯🇴 الأردن - عمّان
  | 'LEBANON_BEIRUT'           // 🇱🇧 لبنان - بيروت
  | 'IRAQ_BAGHDAD'             // 🇮🇶 العراق - بغداد
  | 'KUWAIT_CITY'              // 🇰🇼 الكويت
  | 'OMAN_MUSCAT'              // 🇴🇲 سلطنة عمان - مسقط
  | 'ALGERIA_ALGIERS'          // 🇩🇿 الجزائر
  | 'TUNISIA_TUNIS'            // 🇹🇳 تونس
  // دول وعواصم عالمية (International Capitals)
  | 'JAPAN_TOKYO'              // 🇯🇵 اليابان - طوكيو
  | 'FRANCE_PARIS'             // 🇫🇷 فرنسا - باريس
  | 'UK_LONDON'                // 🇬🇧 بريطانيا - لندن
  | 'USA_NEWYORK'              // 🇺🇸 أمريكا - نيويورك
  | 'BRAZIL_RIO'               // 🇧🇷 البرازيل - ريو دي جانيرو
  | 'SPAIN_MADRID'             // 🇪🇸 إسبانيا - مدريد
  | 'ITALY_ROME'               // 🇮🇹 إيطاليا - روما
  | 'GERMANY_BERLIN';          // 🇩🇪 ألمانيا - برلين

export type PowerUpType = 
  | 'MAGNET'         // مغناطيس العملات
  | 'SHIELD'         // درع حماية
  | 'MULTIPLIER'     // مضاعف العملات 2X
  | 'TURBO_SPEED'    // سرعة خارقة وتجاوز العقبات
  | 'SUPER_JUMP'     // قفزة خارقة عالية جداً
  | 'TIME_SLOW';      // إبطاء الزمن

export interface ActivePowerUp {
  type: PowerUpType;
  duration: number;      // total seconds
  remainingTime: number; // remaining seconds
  level: number;
}

export type SkillId = 
  | 'speed'
  | 'jump'
  | 'magnet'
  | 'shield'
  | 'energy'
  | 'balance'
  | 'slide';

export interface SkillDefinition {
  id: SkillId;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  maxLevel: number;
  baseCost: number;
  costMultiplier: number;
  effectName: string;
  effectUnit: string;
  baseValue: number;
  valuePerLevel: number;
}

export type ItemCategory = 'OUTFIT' | 'SHOES' | 'TRAIL' | 'ACCESSORY' | 'BOOSTER';

export interface ShopItem {
  id: string;
  category: ItemCategory;
  name: string;
  description: string;
  price: number;
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  colorHex: string;
  secondaryColorHex?: string;
  perkDescription?: string;
  iconName?: string;
  isUnlockedDefault?: boolean;
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  category: 'DAILY' | 'WEEKLY' | 'LIFETIME';
  targetType: 
    | 'DISTANCE' 
    | 'COINS' 
    | 'JUMP_OBSTACLES' 
    | 'SLIDE_OBSTACLES' 
    | 'USE_POWERUPS' 
    | 'NO_HIT_DISTANCE'
    | 'UPGRADE_SKILLS'
    | 'COLLECT_MAGNET'
    | 'SCORE_RUN';
  targetValue: number;
  currentValue: number;
  rewardIQD: number;
  rewardXP: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  targetValue: number;
  currentValue: number;
  rewardIQD: number;
  rewardXP: number;
  isUnlocked: boolean;
  isClaimed: boolean;
}

export interface PlayerCustomization {
  equippedOutfit: string;
  equippedShoes: string;
  equippedTrail: string;
  equippedAccessory: string;
}

export interface GameSettings {
  musicVolume: number;     // 0 - 1
  sfxVolume: number;       // 0 - 1
  graphicsQuality: 'MEDIUM' | 'ULTRA';
  cameraShake: boolean;
  hapticFeedback: boolean;
  sensitivity: number;     // 1 - 5
}

export interface PlayerTitle {
  id: string;
  name: string;
  description: string;
  requirementDescription: string;
  badge: string; // Icon or emoji
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  isUnlocked: boolean;
  unlockedAt?: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  targetType: 
    | 'DISTANCE_SINGLE'
    | 'COINS_TOTAL'
    | 'JUMPS_TOTAL'
    | 'SLIDES_TOTAL'
    | 'POWERUPS_TOTAL'
    | 'DODGE_CARS'
    | 'SURVIVE_WEATHER';
  targetValue: number;
  currentValue: number;
  rewardIQD: number;
  rewardXP: number;
  isCompleted: boolean;
  isClaimed: boolean;
  expiresAt: number; // timestamp
}

export interface CareerRunHistoryItem {
  id: string;
  timestamp: number;
  distance: number;
  coins: number;
  jumps: number;
  slides: number;
  dodged: number;
  primaryBiome: BiomeType;
}

export interface PlayerData {
  iqd: number;                  // رصيد الدينار العراقي
  xp: number;                   // نقاط الخبرة
  level: number;                // مستوى اللاعب
  highScoreDistance: number;    // أفضل مسافة بالمتر
  highScoreCoins: number;       // أكبر عدد دنانير في جولة واحدة
  totalRuns: number;            // عدد الجولات الإجمالي
  totalDistance: number;        // المسافة التراكمية
  totalCoinsCollected: number;  // مجموع الدنانير المجمعة
  totalObstaclesAvoided: number;
  totalJumps: number;           // إجمالي القفزات الناجحة في المسيرة
  totalSlides: number;          // إجمالي الانزلاقات الناجحة في المسيرة
  
  // Career Stats & Biome tracking
  biomeVisits: Record<BiomeType, number>; // مرات زيارة كل منطقة
  careerHistory: CareerRunHistoryItem[];  // سجل آخر الجولات للرسوم البيانية
  
  // Titles System
  activeTitleId: string;        // المعرف للقب النشط حالياً
  unlockedTitles: string[];     // قائمة معرفات الألقاب المفتوحة
  
  // Daily Challenges System (24h timer)
  dailyChallenges: DailyChallenge[];
  lastDailyChallengeReset: number; // timestamp
  
  skills: Record<SkillId, number>; // current level 1 to 10
  unlockedItems: string[];         // list of shop item IDs
  customization: PlayerCustomization;
  
  missions: Mission[];
  achievements: Achievement[];
  settings: GameSettings;
  
  lastDailyReset: number; // timestamp
  reviveTokens: number;
}

export interface RunStats {
  distance: number;
  coinsCollected: number;
  score: number;
  xpEarned: number;
  obstaclesDodged: number;
  powerUpsUsed: number;
  jumpsPerformed: number;
  slidesPerformed: number;
  biomeChangedCount: number;
  visitedBiomes: BiomeType[];
  isNewRecord: boolean;
}
