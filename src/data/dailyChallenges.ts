/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyChallenge, PlayerData, RunStats } from '../types';

export const DAILY_CHALLENGES_POOL: Omit<DailyChallenge, 'currentValue' | 'isCompleted' | 'isClaimed' | 'expiresAt'>[] = [
  {
    id: 'daily_dist_1200',
    title: 'انطلاقة الصباح البغدادي',
    description: 'اقطع مسافة 1,200 متر في جولة واحدة عبر شوارع بغداد.',
    targetType: 'DISTANCE_SINGLE',
    targetValue: 1200,
    rewardIQD: 3500,
    rewardXP: 600,
  },
  {
    id: 'daily_coins_2000',
    title: 'جامع الدنانير اليومي',
    description: 'اجمع 2,000 دينار عراقي من الشوارع خلال اليوم.',
    targetType: 'COINS_TOTAL',
    targetValue: 2000,
    rewardIQD: 4000,
    rewardXP: 750,
  },
  {
    id: 'daily_jumps_25',
    title: 'بهلوان جسور الكرخ',
    description: 'اقفز 25 قفزة ناجحة فوق الحواجز والسيارات.',
    targetType: 'JUMPS_TOTAL',
    targetValue: 25,
    rewardIQD: 3000,
    rewardXP: 500,
  },
  {
    id: 'daily_slides_15',
    title: 'انزلاق المتنبي الحذر',
    description: 'انزلق 15 مرة تحت العوائق والشاحنات.',
    targetType: 'SLIDES_TOTAL',
    targetValue: 15,
    rewardIQD: 3000,
    rewardXP: 500,
  },
  {
    id: 'daily_powerups_5',
    title: 'سيد القدرات الخارقة',
    description: 'استخدم 5 بلورات طاقة خاصة (مغناطيس، درع، توربو، إلخ).',
    targetType: 'POWERUPS_TOTAL',
    targetValue: 5,
    rewardIQD: 3500,
    rewardXP: 650,
  },
  {
    id: 'daily_dodge_30',
    title: 'مراوغ تكسيات الرصافة',
    description: 'تفادَ 30 سيارة وعائقاً في الشوارع بنجاح.',
    targetType: 'DODGE_CARS',
    targetValue: 30,
    rewardIQD: 4500,
    rewardXP: 800,
  },
  {
    id: 'daily_dist_2000',
    title: 'ماراثون دجلة الأسطوري',
    description: 'حقق 2,000 متر في جولة واحدة دون استسلام.',
    targetType: 'DISTANCE_SINGLE',
    targetValue: 2000,
    rewardIQD: 6000,
    rewardXP: 1200,
  },
  {
    id: 'daily_coins_4000',
    title: 'كنز أسواق الكاظمية',
    description: 'اجمع 4,000 دينار عراقي إجمالية من رحلاتك اليومية.',
    targetType: 'COINS_TOTAL',
    targetValue: 4000,
    rewardIQD: 7000,
    rewardXP: 1500,
  },
];

/**
 * Generates 3 fresh daily challenges for the next 24-hour cycle.
 */
export function generateDailyChallenges(now: number = Date.now()): DailyChallenge[] {
  // Set expiration to next 24-hour boundary (or 24h from now)
  const nextReset = getNext24HourTimestamp(now);
  
  // Deterministic or pseudo-random selection of 3 unique challenges
  const dayIndex = Math.floor(now / (24 * 60 * 60 * 1000));
  const pool = [...DAILY_CHALLENGES_POOL];
  
  // Shuffle based on day index
  const selected: DailyChallenge[] = [];
  for (let i = 0; i < 3; i++) {
    const idx = (dayIndex * 3 + i) % pool.length;
    const item = pool[idx];
    selected.push({
      ...item,
      currentValue: 0,
      isCompleted: false,
      isClaimed: false,
      expiresAt: nextReset,
    });
  }

  return selected;
}

export function getNext24HourTimestamp(now: number = Date.now()): number {
  const d = new Date(now);
  d.setUTCHours(24, 0, 0, 0); // Next UTC midnight
  return d.getTime();
}

/**
 * Check if 24 hours have elapsed and refresh daily challenges if needed.
 */
export function verifyAndRefreshDailyChallenges(player: PlayerData, now: number = Date.now()): PlayerData {
  const lastReset = player.lastDailyChallengeReset || 0;
  const nextReset = getNext24HourTimestamp(lastReset);

  // If challenges are empty or expired
  if (!player.dailyChallenges || player.dailyChallenges.length === 0 || now >= nextReset) {
    const newChallenges = generateDailyChallenges(now);
    return {
      ...player,
      dailyChallenges: newChallenges,
      lastDailyChallengeReset: now,
    };
  }

  return player;
}

/**
 * Progress daily challenges based on run stats.
 */
export function processDailyChallengesProgression(
  challenges: DailyChallenge[],
  stats: RunStats
): { updatedChallenges: DailyChallenge[]; newlyCompletedCount: number } {
  let newlyCompletedCount = 0;

  const updatedChallenges = challenges.map((ch) => {
    if (ch.isCompleted) return ch;

    let addVal = 0;
    switch (ch.targetType) {
      case 'DISTANCE_SINGLE':
        addVal = Math.round(stats.distance);
        // Single run distance check
        if (addVal >= ch.targetValue) {
          newlyCompletedCount++;
          return {
            ...ch,
            currentValue: ch.targetValue,
            isCompleted: true,
          };
        }
        return {
          ...ch,
          currentValue: Math.max(ch.currentValue, addVal),
        };

      case 'COINS_TOTAL':
        addVal = stats.coinsCollected;
        break;
      case 'JUMPS_TOTAL':
        addVal = stats.jumpsPerformed;
        break;
      case 'SLIDES_TOTAL':
        addVal = stats.slidesPerformed;
        break;
      case 'POWERUPS_TOTAL':
        addVal = stats.powerUpsUsed;
        break;
      case 'DODGE_CARS':
        addVal = stats.obstaclesDodged;
        break;
      default:
        break;
    }

    const newVal = Math.min(ch.targetValue, ch.currentValue + addVal);
    const completed = newVal >= ch.targetValue;
    if (completed && !ch.isCompleted) {
      newlyCompletedCount++;
    }

    return {
      ...ch,
      currentValue: newVal,
      isCompleted: completed,
    };
  });

  return { updatedChallenges, newlyCompletedCount };
}
