/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { DailyChallenge, PlayerData, RunStats } from '../types';

export const DAILY_CHALLENGES_POOL: (Omit<DailyChallenge, 'currentValue' | 'isCompleted' | 'isClaimed' | 'expiresAt'> & { badge: string })[] = [
  {
    id: 'daily_dist_800',
    title: 'انطلاقة الصباح البغدادي',
    description: 'اقطع مسافة 800 متر في جولة واحدة عبر شوارع بغداد العريقة.',
    targetType: 'DISTANCE_SINGLE',
    targetValue: 800,
    rewardIQD: 15000,
    rewardXP: 1200,
    badge: '🏃',
  },
  {
    id: 'daily_coins_1500',
    title: 'جامع الدنانير اليومي',
    description: 'اجمع 1,500 دينار عراقي من أزقة وأسواق المدينة.',
    targetType: 'COINS_TOTAL',
    targetValue: 1500,
    rewardIQD: 18000,
    rewardXP: 1400,
    badge: '💰',
  },
  {
    id: 'daily_jumps_20',
    title: 'بهلوان جسور الكرخ',
    description: 'اقفز 20 قفزة رشيقة ناجحة فوق الحواجز والسيارات.',
    targetType: 'JUMPS_TOTAL',
    targetValue: 20,
    rewardIQD: 14000,
    rewardXP: 1100,
    badge: '🦘',
  },
  {
    id: 'daily_slides_15',
    title: 'انزلاق المتنبي الحذر',
    description: 'انزلق 15 مرة تحت العوائق المرورية والشاحنات.',
    targetType: 'SLIDES_TOTAL',
    targetValue: 15,
    rewardIQD: 14000,
    rewardXP: 1100,
    badge: '⚡',
  },
  {
    id: 'daily_powerups_4',
    title: 'سيد القدرات الخارقة',
    description: 'استخدم 4 بلورات طاقة خاصة (مغناطيس، درع، توربو، إلخ).',
    targetType: 'POWERUPS_TOTAL',
    targetValue: 4,
    rewardIQD: 16000,
    rewardXP: 1300,
    badge: '💎',
  },
  {
    id: 'daily_dodge_25',
    title: 'مراوغ تكسيات الرصافة',
    description: 'تفادَ 25 سيارة وتكتك وعائقاً في الشوارع بنجاح تام.',
    targetType: 'DODGE_CARS',
    targetValue: 25,
    rewardIQD: 20000,
    rewardXP: 1600,
    badge: '🚕',
  },
  {
    id: 'daily_dist_1500',
    title: 'ماراثون دجلة الأسطوري',
    description: 'حقق 1,500 متر في جولة واحدة حماسية دون استسلام.',
    targetType: 'DISTANCE_SINGLE',
    targetValue: 1500,
    rewardIQD: 25000,
    rewardXP: 2000,
    badge: '🏅',
  },
  {
    id: 'daily_coins_3000',
    title: 'كنز أسواق الكاظمية',
    description: 'اجمع 3,000 دينار عراقي إجمالية من رحلاتك وجولاتك اليومية.',
    targetType: 'COINS_TOTAL',
    targetValue: 3000,
    rewardIQD: 28000,
    rewardXP: 2200,
    badge: '👑',
  },
  {
    id: 'daily_jumps_35',
    title: 'صقر قفزات الديوانية',
    description: 'نفذ 35 قفزة هوائية فوق السيارات وعوائق الطريق.',
    targetType: 'JUMPS_TOTAL',
    targetValue: 35,
    rewardIQD: 22000,
    rewardXP: 1800,
    badge: '🦅',
  },
  {
    id: 'daily_slides_25',
    title: 'انسيابية شوارع البصرة',
    description: 'انزلق 25 مرة بسرعة تحت حواجز البناء وأعمدة الإنارة.',
    targetType: 'SLIDES_TOTAL',
    targetValue: 25,
    rewardIQD: 22000,
    rewardXP: 1800,
    badge: '🌊',
  },
  {
    id: 'daily_powerups_8',
    title: 'طاقة نينوى المتجددة',
    description: 'التقط 8 بلورات طاقة متنوعة أثناء الجري السريع.',
    targetType: 'POWERUPS_TOTAL',
    targetValue: 8,
    rewardIQD: 26000,
    rewardXP: 2100,
    badge: '🔮',
  },
  {
    id: 'daily_dodge_45',
    title: 'خبير تفادي أربيل',
    description: 'راوغ وتفادَ 45 سيارة وعائقاً في حركة السير السريعة.',
    targetType: 'DODGE_CARS',
    targetValue: 45,
    rewardIQD: 30000,
    rewardXP: 2500,
    badge: '🚗',
  },
  {
    id: 'daily_dist_2500',
    title: 'عداء بابل التاريخي',
    description: 'اركض 2,500 متر في جولة فردية شجاعة.',
    targetType: 'DISTANCE_SINGLE',
    targetValue: 2500,
    rewardIQD: 35000,
    rewardXP: 2800,
    badge: '🏛️',
  },
  {
    id: 'daily_coins_5000',
    title: 'خزينة النجف الذهبية',
    description: 'اجمع 5,000 دينار عراقي من الشوارع خلال اليوم.',
    targetType: 'COINS_TOTAL',
    targetValue: 5000,
    rewardIQD: 40000,
    rewardXP: 3200,
    badge: '🪙',
  },
  {
    id: 'daily_dist_3000',
    title: 'قاهر مسافات الأنبار',
    description: 'اقطع مسافة 3,000 متر كاملة في سباق حماسي متواصل.',
    targetType: 'DISTANCE_SINGLE',
    targetValue: 3000,
    rewardIQD: 45000,
    rewardXP: 3600,
    badge: '🌟',
  },
];

export function getNext24HourTimestamp(now: number = Date.now()): number {
  const d = new Date(now);
  d.setUTCHours(24, 0, 0, 0); // Next UTC midnight
  return d.getTime();
}

/**
 * Generates strictly 10 distinct daily challenges for the 24-hour cycle.
 * Challenges are uniquely determined per calendar day and regenerate every 24 hours.
 */
export function generateDailyChallenges(now: number = Date.now()): DailyChallenge[] {
  const nextReset = getNext24HourTimestamp(now);
  const dayIndex = Math.floor(now / (24 * 60 * 60 * 1000));
  
  // Create a day-deterministic shuffle of the challenges pool
  const pool = [...DAILY_CHALLENGES_POOL];
  const shuffled: typeof pool = [];
  
  // Linear congruential generator for stable deterministic shuffle per day
  let seed = Math.abs((dayIndex * 1664525 + 1013904223) | 0);
  const nextRand = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };

  const poolCopy = [...pool];
  while (poolCopy.length > 0) {
    const pickIdx = Math.floor(nextRand() * poolCopy.length);
    shuffled.push(poolCopy.splice(pickIdx, 1)[0]);
  }

  // Pick exactly 10 distinct challenges
  const count = 10;
  const selected: DailyChallenge[] = [];
  for (let i = 0; i < count && i < shuffled.length; i++) {
    const item = shuffled[i];
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

/**
 * Check if 24 hours have elapsed and refresh daily challenges to 10 new challenges if needed.
 */
export function verifyAndRefreshDailyChallenges(player: PlayerData, now: number = Date.now()): PlayerData {
  const lastReset = player.lastDailyChallengeReset || 0;
  const nextReset = getNext24HourTimestamp(lastReset);

  // If challenges are empty, not 10 in length, or expired after 24h
  if (!player.dailyChallenges || player.dailyChallenges.length !== 10 || now >= nextReset) {
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
