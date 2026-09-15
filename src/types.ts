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
  | 'SUNNY_MORNING'      // صباح مشمس وجميل
  | 'NOON_BRIGHT'        // شمس ساطعة
  | 'GOLDEN_SUNSET'      // غروب ذهبي
  | 'LIGHT_RAIN_MIST'    // أمطار خفيفة ورذاذ منعش
  | 'BAGHDAD_STORM'      // أمطار رعدية مع لمعان البرق
  | 'BAGHDAD_DUST_STORM' // عاصفة ترابية دافئة
  | 'SNOW_FLURRY'        // ثلوج شتوية بيضاء نقية
  | 'KARRADA_NIGHT';     // ليل جميل ونجوم ساطعة

export type BiomeType = 
  // المحافظات العراقية الـ 18 الرسمية (18 Iraqi Governorates)
  | 'BAGHDAD'          // بغداد - دار السلام والعاصمة
  | 'BASRA'            // البصرة - ثغر العراق الباسم والفيحاء
  | 'NINEVEH'          // نينوى - الموصل الحدباء وأم الربيعين
  | 'ERBIL'            // أربيل - هولير وقلعة التاريخ
  | 'SULAYMANIYAH'     // السليمانية - عروس كردستان والثقافة
  | 'DUHOK'            // دهوك - جبال وسحر الشمال
  | 'KIRKUK'           // كركوك - مدينة التآخي والنفط
  | 'BABYLON'          // بابل - الحلة ومهد الحضارات
  | 'KARBALA'          // كربلاء - قباب المجد وقدسية التاريخ
  | 'NAJAF'            // النجف - وادي السلام وأصالة العلم
  | 'ANBAR'            // الأنبار - الرمادي وأصالة الفرات
  | 'DIYALA'           // ديالى - بعقوبة وبساتين البرتقال
  | 'SALADIN'          // صلاح الدين - تكريت ومئذنة سامراء الملوية
  | 'WASIT'            // واسط - الكوت وسد دجلة الخالد
  | 'MAYSAN'           // ميسان - العمارة وسحر الأهوار العريقة
  | 'DHI_QAR'          // ذي قار - الناصرية وحضارة أور السومرية
  | 'MUTHANNA'         // المثنى - السماوة وعبق الصحراء وبحيرة ساوة
  | 'QADISIYYAH'       // القادسية / الديوانية
  | 'DIWANIYAH';       // الديوانية - نخيل الفرات الأوسط ومدينة الكرم

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

// ==================== UNITY-COMPATIBLE CHARACTER ANATOMY & APPEARANCE ====================
export interface CharacterAppearance {
  // Facial Structure (هيكل وتفاصيل الوجه)
  eyeColor: {
    r: number;
    g: number;
    b: number;
    hex: string;
    label: string;
  };
  noseScale: number;
  mouthScale: number;
  earSize: number;

  // Body Proportions (أبعاد وتناسق الجسم)
  heightMeters: number;
  bodyFatPercentage: number;
  hasFiveFingersPerHand: boolean;
}

export interface CharacterProfile {
  characterName: string;
  age: number;
  description: string;
  appearance: CharacterAppearance;
}

export const DEFAULT_CHARACTER_PROFILE: CharacterProfile = {
  characterName: 'بسام',
  age: 22,
  description: 'شاب ببنية وجسم طبيعي',
  appearance: {
    eyeColor: {
      r: 0.25,
      g: 0.15,
      b: 0.05,
      hex: '#40260d',
      label: 'بني طبيعي',
    },
    noseScale: 1.0,
    mouthScale: 1.0,
    earSize: 1.0,
    heightMeters: 1.78,
    bodyFatPercentage: 15.0,
    hasFiveFingersPerHand: true,
  },
};

export interface GameSettings {
  musicVolume: number;     // 0 - 1
  sfxVolume: number;       // 0 - 1
  graphicsQuality: 'MEDIUM' | 'ULTRA';
  cameraShake: boolean;
  hapticFeedback: boolean;
  sensitivity: number;     // 1 - 5
  invertControls?: boolean; // عودة حركة اللاعب يمين/يسار
}

export interface PlayerTitle {
  id: string;
  name: string;
  description: string;
  requirementDescription: string;
  badge: string; // Icon or emoji
  rarity: 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';
  requiredLevel?: number;
  isUnlocked: boolean;
  unlockedAt?: number;
}

export interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  badge?: string;
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
