/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerTitle, PlayerData } from '../types';

export const TITLES_LIST: Omit<PlayerTitle, 'isUnlocked'>[] = [
  {
    id: 'title_novice_runner',
    name: 'ابن العراق البار',
    description: 'انطلاقة بسام الأصيلة من أرض الرافدين ودجلة والفرات.',
    requirementDescription: 'متاح للجميع كبداية الرحلة',
    badge: '🇮🇶',
    rarity: 'COMMON',
  },
  {
    id: 'title_mansour_veteran',
    name: 'صقر الرافدين السريع',
    description: 'خبير في السرعة وقطع المسافات الطويلة عبر المحافظات العراقية.',
    requirementDescription: 'اقطع مسافة إجمالية تتجاوز 5,000 متر',
    badge: '🦅',
    rarity: 'RARE',
  },
  {
    id: 'title_dinar_collector',
    name: 'خازن الذهب العراقي',
    description: 'خبير في التقاط الدنانير والكنوز التراثية العراقية الأصيلة.',
    requirementDescription: 'اجمع أكثر من 15,000 دينار في مسيرتك',
    badge: '💰',
    rarity: 'RARE',
  },
  {
    id: 'title_karrada_king',
    name: 'طواف المحافظات الـ 18',
    description: 'يجوب كافة محافظات العراق الـ 18 من الشمال إلى الجنوب.',
    requirementDescription: 'انتقل بين المحافظات 10 مرات على الأقل',
    badge: '🗺️',
    rarity: 'RARE',
  },
  {
    id: 'title_mutanabbi_poet',
    name: 'فارس المتنبي الأديب',
    description: 'رشاقة وقفز احترافي مستوحى من فكر وأصالة شارع المتنبي.',
    requirementDescription: 'قم بإجراء 50 قفزة ناجحة في المسيرة',
    badge: '📜',
    rarity: 'EPIC',
  },
  {
    id: 'title_ghost_dodger',
    name: 'شبح شارع الرشيد',
    description: 'يراوغ كل العوائق والسيارات بخفة نادرة في أزقة بغداد.',
    requirementDescription: 'تفادَ أكثر من 150 عائق وسيارة في المسيرة',
    badge: '⚡',
    rarity: 'EPIC',
  },
  {
    id: 'title_storm_chaser',
    name: 'قاهر عواصف الصحراء',
    description: 'ثابت كالنخيل أمام موجات الغبار وعواصف بادية العراق.',
    requirementDescription: 'حقق مسافة تتجاوز 2,500 متر في ركضة واحدة',
    badge: '🌪️',
    rarity: 'EPIC',
  },
  {
    id: 'title_adhimiya_legend',
    name: 'سيد جسور دجلة والفرات',
    description: 'تاريخ عريق من العبور والبطولة فوق أقدس أنهار العراق.',
    requirementDescription: 'خض 15 جولة ركض ناجحة في مسيرتك',
    badge: '🌉',
    rarity: 'EPIC',
  },
  {
    id: 'title_master_of_baghdad',
    name: 'أسد بابل الخالد',
    description: 'رمز القوة والعزيمة المستمد من حضارة بلاد ما بين النهرين.',
    requirementDescription: 'احصل على المستوى 10 وحقق مسافة 5,000م في جولة واحدة',
    badge: '🦁',
    rarity: 'LEGENDARY',
  },
  {
    id: 'title_tigris_champion',
    name: 'فهد أهوار الجنوب',
    description: 'سرعة وقوة خارقة بين قصب الأهوار وشط العرب الأصيل.',
    requirementDescription: 'أكمل 25 جولة ركض في مسيرتك الكلية',
    badge: '🐆',
    rarity: 'LEGENDARY',
  },
  {
    id: 'title_grand_champion_2026',
    name: 'بطل العراق الأسطوري 2026',
    description: 'الوسام الشرفي الأسمى الممنوح لأفضل عداء في جمهورية العراق.',
    requirementDescription: 'احصل على 100,000 نقطة إجمالية في مسيرتك',
    badge: '👑',
    rarity: 'LEGENDARY',
  },
];

/**
 * Evaluates unlocked titles based on PlayerData progression.
 */
export function evaluateUnlockedTitles(player: PlayerData): string[] {
  const unlocked = new Set<string>(player.unlockedTitles || ['title_novice_runner']);
  unlocked.add('title_novice_runner'); // always unlocked

  if (player.totalDistance >= 5000) {
    unlocked.add('title_mansour_veteran');
  }
  if (player.totalCoinsCollected >= 15000) {
    unlocked.add('title_dinar_collector');
  }
  const totalVisits = Object.values(player.biomeVisits || {}).reduce((a, b) => a + b, 0);
  if (totalVisits >= 10) {
    unlocked.add('title_karrada_king');
  }
  if ((player.totalJumps || 0) >= 50) {
    unlocked.add('title_mutanabbi_poet');
  }
  if (player.totalObstaclesAvoided >= 150) {
    unlocked.add('title_ghost_dodger');
  }
  if (player.highScoreDistance >= 2500) {
    unlocked.add('title_storm_chaser');
  }
  if (player.totalRuns >= 15) {
    unlocked.add('title_adhimiya_legend');
  }
  if (player.level >= 10 && player.highScoreDistance >= 5000) {
    unlocked.add('title_master_of_baghdad');
  }
  if (player.totalRuns >= 25) {
    unlocked.add('title_tigris_champion');
  }
  const totalCareerScore = player.totalDistance + player.totalCoinsCollected * 10;
  if (totalCareerScore >= 100000) {
    unlocked.add('title_grand_champion_2026');
  }

  return Array.from(unlocked);
}

export function getPlayerTitleById(titleId: string): PlayerTitle {
  const found = TITLES_LIST.find((t) => t.id === titleId);
  if (found) {
    return { ...found, isUnlocked: true };
  }
  return {
    id: 'title_novice_runner',
    name: 'العداء العربي الصاعد',
    description: 'انطلاقة بسام الطموحة في مضامير وعواصم العالم.',
    requirementDescription: 'متاح للجميع',
    badge: '🏃',
    rarity: 'COMMON',
    isUnlocked: true,
  };
}
