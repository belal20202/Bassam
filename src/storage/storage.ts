/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerData, SkillId, RunStats, Mission, Achievement, BiomeType } from '../types';
import { INITIAL_MISSIONS } from '../data/missions';
import { INITIAL_ACHIEVEMENTS } from '../data/achievements';
import { evaluateUnlockedTitles } from '../data/titles';
import { generateDailyChallenges, processDailyChallengesProgression, verifyAndRefreshDailyChallenges } from '../data/dailyChallenges';

const STORAGE_KEY = 'HAMOUDI_RUNNER_V1_SAVE';

export const DEFAULT_PLAYER_DATA: PlayerData = {
  iqd: 500, // مكافأة البداية الترحيبية لبسام 500 دينار
  xp: 0,
  level: 0,
  highScoreDistance: 0,
  highScoreCoins: 0,
  totalRuns: 0,
  totalDistance: 0,
  totalCoinsCollected: 0,
  totalObstaclesAvoided: 0,
  totalJumps: 0,
  totalSlides: 0,
  
  // Career Stats & Biomes (18 Iraqi Governorates)
  biomeVisits: {
    BAGHDAD: 0,
    BASRA: 0,
    NINEVEH: 0,
    ERBIL: 0,
    SULAYMANIYAH: 0,
    DUHOK: 0,
    KIRKUK: 0,
    BABYLON: 0,
    KARBALA: 0,
    NAJAF: 0,
    ANBAR: 0,
    DIYALA: 0,
    SALADIN: 0,
    WASIT: 0,
    MAYSAN: 0,
    DHI_QAR: 0,
    MUTHANNA: 0,
    QADISIYYAH: 0,
    DIWANIYAH: 0,
  },
  careerHistory: [],
  
  // Titles System
  activeTitleId: 'title_starter',
  unlockedTitles: ['title_starter'],
  
  // Daily Challenges System
  dailyChallenges: generateDailyChallenges(),
  lastDailyChallengeReset: Date.now(),

  skills: {
    speed: 1,
    jump: 1,
    magnet: 1,
    shield: 1,
    energy: 1,
    balance: 1,
    slide: 1,
  },
  unlockedItems: [
    'outfit_classic_sport',
    'shoes_classic_runner',
    'trail_dust_clean',
    'acc_none',
  ],
  customization: {
    equippedOutfit: 'outfit_classic_sport',
    equippedShoes: 'shoes_classic_runner',
    equippedTrail: 'trail_dust_clean',
    equippedAccessory: 'acc_none',
  },
  missions: INITIAL_MISSIONS,
  achievements: INITIAL_ACHIEVEMENTS,
  settings: {
    musicVolume: 0.7,
    sfxVolume: 0.85,
    graphicsQuality: 'ULTRA',
    cameraShake: true,
    hapticFeedback: true,
    sensitivity: 3,
    invertControls: true,
  },
  lastDailyReset: Date.now(),
  reviveTokens: 1, // 1 free revive heart for new runners
};

/**
 * Calculate XP required for a given level (calibrated for levels 0 to 100).
 */
export function getRequiredXPForLevel(level: number): number {
  const safeLevel = Math.max(0, Math.min(100, level));
  return 100 + safeLevel * 20;
}

/**
 * Get detailed level and XP progression data for levels 0 to 100
 */
export function getLevelProgress(level: number, xp: number): {
  currentLevel: number;
  currentXP: number;
  requiredXP: number;
  remainingXP: number;
  percent: number;
} {
  const currentLevel = Math.max(0, Math.min(100, level));
  const requiredXP = getRequiredXPForLevel(currentLevel);
  const currentXP = currentLevel >= 100 ? requiredXP : Math.max(0, Math.min(requiredXP, xp));
  const remainingXP = currentLevel >= 100 ? 0 : Math.max(0, requiredXP - currentXP);
  const percent = currentLevel >= 100 ? 100 : Math.min(100, Math.max(0, Math.round((currentXP / requiredXP) * 100)));
  return { currentLevel, currentXP, requiredXP, remainingXP, percent };
}

/**
 * Merge existing saved missions with latest mission template to preserve progress while adding new missions
 */
function mergeMissions(saved: Mission[] | undefined): Mission[] {
  if (!saved || !saved.length) return INITIAL_MISSIONS;
  const map = new Map<string, Mission>();
  for (const m of saved) {
    map.set(m.id, m);
  }
  return INITIAL_MISSIONS.map((template) => {
    const existing = map.get(template.id);
    if (!existing) return template;
    return {
      ...template,
      currentValue: existing.currentValue ?? 0,
      isCompleted: existing.isCompleted ?? false,
      isClaimed: existing.isClaimed ?? false,
    };
  });
}

/**
 * Merge existing saved achievements with latest achievement template
 */
function mergeAchievements(saved: Achievement[] | undefined): Achievement[] {
  if (!saved || !saved.length) return INITIAL_ACHIEVEMENTS;
  const map = new Map<string, Achievement>();
  for (const a of saved) {
    map.set(a.id, a);
  }
  return INITIAL_ACHIEVEMENTS.map((template) => {
    const existing = map.get(template.id);
    if (!existing) return template;
    return {
      ...template,
      currentValue: existing.currentValue ?? 0,
      isUnlocked: existing.isUnlocked ?? false,
      isClaimed: existing.isClaimed ?? false,
    };
  });
}

export function loadPlayerData(): PlayerData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      savePlayerData(DEFAULT_PLAYER_DATA);
      return { ...DEFAULT_PLAYER_DATA };
    }
    const parsed = JSON.parse(raw);
    
    // Merge deeply with default structure to prevent missing keys on updates
    const initialData: PlayerData = {
      ...DEFAULT_PLAYER_DATA,
      ...parsed,
      iqd: typeof parsed.iqd === 'number' ? parsed.iqd : DEFAULT_PLAYER_DATA.iqd,
      xp: typeof parsed.xp === 'number' ? parsed.xp : DEFAULT_PLAYER_DATA.xp,
      level: typeof parsed.level === 'number' ? parsed.level : DEFAULT_PLAYER_DATA.level,
      highScoreDistance: typeof parsed.highScoreDistance === 'number' ? parsed.highScoreDistance : 0,
      highScoreCoins: typeof parsed.highScoreCoins === 'number' ? parsed.highScoreCoins : 0,
      totalRuns: typeof parsed.totalRuns === 'number' ? parsed.totalRuns : 0,
      totalDistance: typeof parsed.totalDistance === 'number' ? parsed.totalDistance : 0,
      totalCoinsCollected: typeof parsed.totalCoinsCollected === 'number' ? parsed.totalCoinsCollected : 0,
      totalObstaclesAvoided: typeof parsed.totalObstaclesAvoided === 'number' ? parsed.totalObstaclesAvoided : 0,
      totalJumps: typeof parsed.totalJumps === 'number' ? parsed.totalJumps : 0,
      totalSlides: typeof parsed.totalSlides === 'number' ? parsed.totalSlides : 0,
      
      biomeVisits: {
        ...DEFAULT_PLAYER_DATA.biomeVisits,
        ...(parsed.biomeVisits || {}),
      },
      careerHistory: Array.isArray(parsed.careerHistory) ? parsed.careerHistory : [],
      activeTitleId: typeof parsed.activeTitleId === 'string' ? parsed.activeTitleId : 'title_novice_runner',
      unlockedTitles: Array.isArray(parsed.unlockedTitles) ? parsed.unlockedTitles : ['title_novice_runner'],
      
      dailyChallenges: Array.isArray(parsed.dailyChallenges) ? parsed.dailyChallenges : generateDailyChallenges(),
      lastDailyChallengeReset: typeof parsed.lastDailyChallengeReset === 'number' ? parsed.lastDailyChallengeReset : Date.now(),

      reviveTokens: typeof parsed.reviveTokens === 'number' ? parsed.reviveTokens : 1,
      skills: { ...DEFAULT_PLAYER_DATA.skills, ...(parsed.skills || {}) },
      unlockedItems: Array.isArray(parsed.unlockedItems) && parsed.unlockedItems.length ? parsed.unlockedItems : DEFAULT_PLAYER_DATA.unlockedItems,
      customization: { ...DEFAULT_PLAYER_DATA.customization, ...(parsed.customization || {}) },
      settings: { ...DEFAULT_PLAYER_DATA.settings, ...(parsed.settings || {}) },
      missions: mergeMissions(parsed.missions),
      achievements: mergeAchievements(parsed.achievements),
    };

    // Check & Refresh 24h Daily Challenges if needed
    const verified = verifyAndRefreshDailyChallenges(initialData);

    // Sanitize legacy outfit & title
    if (!verified.customization.equippedOutfit || verified.customization.equippedOutfit === 'outfit_baghdadi_dishdasha') {
      verified.customization.equippedOutfit = 'outfit_classic_sport';
    }
    if (!verified.unlockedItems.includes('outfit_classic_sport')) {
      verified.unlockedItems.push('outfit_classic_sport');
    }
    if (verified.activeTitleId === 'title_novice_runner') {
      verified.activeTitleId = 'title_starter';
    }

    // Evaluate titles unlock status
    verified.unlockedTitles = evaluateUnlockedTitles(verified);

    return verified;
  } catch (e) {
    console.warn('Failed to load player data, using defaults:', e);
    return { ...DEFAULT_PLAYER_DATA };
  }
}

export function savePlayerData(data: PlayerData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save player data:', e);
  }
}

export function addXPAndCheckLevelUp(currentXP: number, currentLevel: number, addedXP: number): { newXP: number; newLevel: number; leveledUp: boolean } {
  let totalXP = currentXP + addedXP;
  let level = Math.max(0, Math.min(100, currentLevel));
  let leveledUp = false;

  while (level < 100) {
    const req = getRequiredXPForLevel(level);
    if (totalXP >= req) {
      totalXP -= req;
      level += 1;
      leveledUp = true;
    } else {
      break;
    }
  }

  if (level >= 100) {
    totalXP = 0;
  }

  return { newXP: totalXP, newLevel: level, leveledUp };
}

/**
 * Update missions, achievements, daily challenges, and career stats after a run
 */
export function processRunProgression(player: PlayerData, stats: RunStats): {
  updatedPlayer: PlayerData;
  newCompletedMissions: string[];
  newUnlockedAchievements: string[];
  newUnlockedTitles: string[];
} {
  const updated: PlayerData = {
    ...player,
    skills: { ...player.skills },
    customization: { ...player.customization },
    unlockedItems: [...player.unlockedItems],
    settings: { ...player.settings },
    biomeVisits: { ...player.biomeVisits },
    careerHistory: [...(player.careerHistory || [])],
  };

  const newCompletedMissions: string[] = [];
  const newUnlockedAchievements: string[] = [];
  const prevTitlesCount = (player.unlockedTitles || []).length;

  // 1. Update cumulative and career stats
  updated.totalRuns += 1;
  updated.totalDistance += Math.round(stats.distance);
  updated.totalCoinsCollected += stats.coinsCollected;
  updated.totalObstaclesAvoided += stats.obstaclesDodged;
  updated.totalJumps = (updated.totalJumps || 0) + stats.jumpsPerformed;
  updated.totalSlides = (updated.totalSlides || 0) + stats.slidesPerformed;
  
  // Track Biome visits
  if (stats.visitedBiomes && stats.visitedBiomes.length > 0) {
    stats.visitedBiomes.forEach((b) => {
      updated.biomeVisits[b] = (updated.biomeVisits[b] || 0) + 1;
    });
  } else {
    // Default to at least Baghdad
    updated.biomeVisits.BAGHDAD = (updated.biomeVisits.BAGHDAD || 0) + 1;
  }

  // Record career history entry (keep last 20 runs for clean graph rendering)
  const historyEntry = {
    id: `run_${Date.now()}`,
    timestamp: Date.now(),
    distance: Math.round(stats.distance),
    coins: stats.coinsCollected,
    jumps: stats.jumpsPerformed,
    slides: stats.slidesPerformed,
    dodged: stats.obstaclesDodged,
    primaryBiome: (stats.visitedBiomes?.[0] as BiomeType) || 'BAGHDAD',
  };
  updated.careerHistory.unshift(historyEntry);
  if (updated.careerHistory.length > 20) {
    updated.careerHistory = updated.careerHistory.slice(0, 20);
  }

  // Persist coins collected in the run to current wallet
  updated.iqd += stats.coinsCollected;

  if (stats.distance > updated.highScoreDistance) {
    updated.highScoreDistance = Math.round(stats.distance);
  }
  if (stats.coinsCollected > updated.highScoreCoins) {
    updated.highScoreCoins = stats.coinsCollected;
  }

  // Add XP from run + bonus
  const { newXP, newLevel } = addXPAndCheckLevelUp(updated.xp, updated.level, stats.xpEarned);
  updated.xp = newXP;
  updated.level = newLevel;

  // 2. Process Daily Challenges
  const { updatedChallenges } = processDailyChallengesProgression(
    updated.dailyChallenges || [],
    stats
  );
  updated.dailyChallenges = updatedChallenges;

  // 3. Process Missions
  updated.missions = updated.missions.map(mission => {
    if (mission.isCompleted) return mission;
    let addValue = 0;
    switch (mission.targetType) {
      case 'DISTANCE':
        addValue = mission.category === 'LIFETIME' ? updated.totalDistance : Math.round(stats.distance);
        break;
      case 'COINS':
        addValue = mission.category === 'LIFETIME' ? updated.totalCoinsCollected : stats.coinsCollected;
        break;
      case 'JUMP_OBSTACLES':
        addValue = stats.jumpsPerformed;
        break;
      case 'SLIDE_OBSTACLES':
        addValue = stats.slidesPerformed;
        break;
      case 'USE_POWERUPS':
        addValue = stats.powerUpsUsed;
        break;
      case 'NO_HIT_DISTANCE':
        addValue = Math.round(stats.distance);
        break;
      case 'UPGRADE_SKILLS':
        const totalUpgrades = Object.values(updated.skills).reduce((acc, lvl) => acc + (lvl - 1), 0);
        return {
          ...mission,
          currentValue: totalUpgrades,
          isCompleted: totalUpgrades >= mission.targetValue,
        };
      default:
        break;
    }

    let newCurrent = mission.currentValue;
    if (mission.category === 'LIFETIME' && (mission.targetType === 'DISTANCE' || mission.targetType === 'COINS')) {
      newCurrent = addValue;
    } else {
      newCurrent = mission.currentValue + addValue;
    }

    const isNowCompleted = newCurrent >= mission.targetValue;
    if (isNowCompleted && !mission.isCompleted) {
      newCompletedMissions.push(mission.title);
    }
    return {
      ...mission,
      currentValue: Math.min(newCurrent, mission.targetValue),
      isCompleted: isNowCompleted,
    };
  });

  // 4. Process Achievements
  updated.achievements = updated.achievements.map(ach => {
    if (ach.isUnlocked) return ach;
    let currentVal = ach.currentValue;
    switch (ach.id) {
      case 'ach_first_steps':
        currentVal = updated.totalRuns;
        break;
      case 'ach_reach_1km':
      case 'ach_reach_2500m':
      case 'ach_reach_5000m':
      case 'ach_reach_10000m':
        currentVal = Math.max(ach.currentValue, Math.round(stats.distance));
        break;
      case 'ach_collect_5000_coins':
      case 'ach_collect_25000_coins':
      case 'ach_collect_100000_coins':
        currentVal = updated.totalCoinsCollected;
        break;
      case 'ach_dodge_100_cars':
      case 'ach_dodge_500_cars':
        currentVal = updated.totalObstaclesAvoided;
        break;
      case 'ach_use_25_powerups':
      case 'ach_use_100_powerups':
        currentVal += stats.powerUpsUsed;
        break;
      case 'ach_reach_level_10':
      case 'ach_reach_level_25':
        currentVal = updated.level;
        break;
      case 'ach_max_one_skill':
        currentVal = Object.values(updated.skills).some(lvl => lvl >= 10) ? 1 : 0;
        break;
      case 'ach_max_all_skills':
        currentVal = Object.values(updated.skills).filter(lvl => lvl >= 10).length;
        break;
      default:
        break;
    }

    const isNowUnlocked = currentVal >= ach.targetValue;
    if (isNowUnlocked && !ach.isUnlocked) {
      newUnlockedAchievements.push(ach.title);
    }
    return {
      ...ach,
      currentValue: currentVal,
      isUnlocked: isNowUnlocked,
    };
  });

  // 5. Evaluate Titles
  const newlyEvaluated = evaluateUnlockedTitles(updated);
  updated.unlockedTitles = newlyEvaluated;
  const newTitlesList: string[] = newlyEvaluated.filter(t => !(player.unlockedTitles || []).includes(t));

  savePlayerData(updated);

  return {
    updatedPlayer: updated,
    newCompletedMissions,
    newUnlockedAchievements,
    newUnlockedTitles: newTitlesList,
  };
}
