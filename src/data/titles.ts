/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { PlayerTitle, PlayerData } from '../types';

/**
 * 20 Fantasy & Mythic Titles calibrated from Level 0 to Level 100.
 * Completely free of traditional royal titles like "سيد" or "سلطان".
 * Difficult to achieve, culminating in the ultimate Level 100 title.
 */
export const TITLES_LIST: (Omit<PlayerTitle, 'isUnlocked'> & { requiredLevel: number })[] = [
  {
    id: 'title_starter',
    name: 'نبض البداية',
    description: 'انطلاقة البداية وشرارة الحماس الأولى لخوض المغامرة واكتشاف الميدان.',
    requirementDescription: 'متاح للجميع كبداية الرحلة البطولية',
    badge: '🌟',
    rarity: 'COMMON',
    requiredLevel: 0,
  },
  {
    id: 'title_lvl_5',
    name: 'صدى الرياح',
    description: 'خفة ورشاقة تجعله ينساب كصدى النسيم الهادئ بين الطرقات.',
    requirementDescription: 'الوصول إلى المستوى 5',
    badge: '🍃',
    rarity: 'COMMON',
    requiredLevel: 5,
  },
  {
    id: 'title_lvl_10',
    name: 'طيف الظلال',
    description: 'سرعة خفية ومراوغات بارعة تسبق أعتى العقبات بحنكة عالية.',
    requirementDescription: 'الوصول إلى المستوى 10',
    badge: '🌫️',
    rarity: 'COMMON',
    requiredLevel: 10,
  },
  {
    id: 'title_lvl_15',
    name: 'شعلة الأفق',
    description: 'وميض متوهج من الطاقة ينير دروب التحدي ويبهر المشاهدين.',
    requirementDescription: 'الوصول إلى المستوى 15',
    badge: '🔥',
    rarity: 'RARE',
    requiredLevel: 15,
  },
  {
    id: 'title_lvl_20',
    name: 'برق الرمال',
    description: 'خطوات رعدية خاطفة تشق المسارات الصحراوية كالصاعقة.',
    requirementDescription: 'الوصول إلى المستوى 20',
    badge: '⚡',
    rarity: 'RARE',
    requiredLevel: 20,
  },
  {
    id: 'title_lvl_25',
    name: 'شهاب الفجر',
    description: 'توهج فلكي مبهر يخطف الأبصار في كل انطلاقة صباحية.',
    requirementDescription: 'الوصول إلى المستوى 25',
    badge: '💫',
    rarity: 'RARE',
    requiredLevel: 25,
  },
  {
    id: 'title_lvl_30',
    name: 'قاهر العواصف',
    description: 'ثبات وإصرار صلب يخترق الرياح العاتية ولا يعرف التراجع.',
    requirementDescription: 'الوصول إلى المستوى 30',
    badge: '🌪️',
    rarity: 'RARE',
    requiredLevel: 30,
  },
  {
    id: 'title_lvl_35',
    name: 'حارس السراب',
    description: 'سرعة سحرية تفوق الوصف تخدع الحواجز وتراوغ الصعاب.',
    requirementDescription: 'الوصول إلى المستوى 35',
    badge: '🔮',
    rarity: 'RARE',
    requiredLevel: 35,
  },
  {
    id: 'title_lvl_40',
    name: 'فارس النيازك',
    description: 'قوة كاسحة تندفع كنيزك ملتهب يشق طريقه في الميدان.',
    requirementDescription: 'الوصول إلى المستوى 40',
    badge: '☄️',
    rarity: 'EPIC',
    requiredLevel: 40,
  },
  {
    id: 'title_lvl_45',
    name: 'نبض الرعد',
    description: 'وثبات مدوية تهز الأرض وتعلن عن حضور بطل لا يُهزم.',
    requirementDescription: 'الوصول إلى المستوى 45',
    badge: '⚡',
    rarity: 'EPIC',
    requiredLevel: 45,
  },
  {
    id: 'title_lvl_50',
    name: 'طائر الفينيق الخالد',
    description: 'رمز الانبعاث والشجاعة الخارقة التي تحول كل عائق إلى نصر مجيد.',
    requirementDescription: 'الوصول إلى المستوى 50',
    badge: '🦅',
    rarity: 'EPIC',
    requiredLevel: 50,
  },
  {
    id: 'title_lvl_55',
    name: 'عين الإعصار',
    description: 'قمة التركيز والهدوء الحاسم في أعتى المنعطفات الصعبة.',
    requirementDescription: 'الوصول إلى المستوى 55',
    badge: '🌀',
    rarity: 'EPIC',
    requiredLevel: 55,
  },
  {
    id: 'title_lvl_60',
    name: 'شبح السرعة القصوى',
    description: 'مناورات خارقة تتخطى حدود الإدراك وتسبق حركة الرياح.',
    requirementDescription: 'الوصول إلى المستوى 60',
    badge: '🥷',
    rarity: 'EPIC',
    requiredLevel: 60,
  },
  {
    id: 'title_lvl_65',
    name: 'نجم المجرة الكوني',
    description: 'إشعاع بطولي يبهر الأرجاء ويقطع آلاف الأمتار بثبات لا ينكسر.',
    requirementDescription: 'الوصول إلى المستوى 65',
    badge: '🌌',
    rarity: 'EPIC',
    requiredLevel: 65,
  },
  {
    id: 'title_lvl_70',
    name: 'صاعقة الفضاء السحيق',
    description: 'سرعة أثيرية كونية تترك خلفها ذيولاً من الضوء الساطع.',
    requirementDescription: 'الوصول إلى المستوى 70',
    badge: '⚡',
    rarity: 'LEGENDARY',
    requiredLevel: 70,
  },
  {
    id: 'title_lvl_75',
    name: 'روح الأزل المتوهجة',
    description: 'طاقة نقية سامية تتحدى الزمن وتثبت ريادة العداء في كل بيئة.',
    requirementDescription: 'الوصول إلى المستوى 75',
    badge: '✨',
    rarity: 'LEGENDARY',
    requiredLevel: 75,
  },
  {
    id: 'title_lvl_80',
    name: 'تنين اللهب الأزرق',
    description: 'هيبة أسطورية لا تُقهر وقوة متقدة تحرق المسافات بلا تعب.',
    requirementDescription: 'الوصول إلى المستوى 80',
    badge: '🐉',
    rarity: 'LEGENDARY',
    requiredLevel: 80,
  },
  {
    id: 'title_lvl_85',
    name: 'صائد الأبعاد الكونية',
    description: 'بطل يجوب عوالم التحدي بحكمة وبراعة واستجابة ردود أفعال مذهلة.',
    requirementDescription: 'الوصول إلى المستوى 85',
    badge: '🪐',
    rarity: 'LEGENDARY',
    requiredLevel: 85,
  },
  {
    id: 'title_lvl_90',
    name: 'إعصار الخلود الأسطوري',
    description: 'عاصفة بطولية خالدة لا تنطفئ حماستها ولا يقف بوجهها أي حاجز.',
    requirementDescription: 'الوصول إلى المستوى 90',
    badge: '💫',
    rarity: 'LEGENDARY',
    requiredLevel: 90,
  },
  {
    id: 'title_lvl_100',
    name: 'أسطورة الأفق اللانهائي',
    description: 'المجد المطلق: بلوغ المستوى 100 ونيل اللقب الخيالي الأعظم في تاريخ اللعبة.',
    requirementDescription: 'الوصول إلى المستوى الأقصى 100',
    badge: '👑',
    rarity: 'LEGENDARY',
    requiredLevel: 100,
  },
];

/**
 * Evaluates unlocked titles based on PlayerData level progression.
 */
export function evaluateUnlockedTitles(player: PlayerData): string[] {
  const unlocked = new Set<string>(player.unlockedTitles || ['title_starter']);
  unlocked.add('title_starter'); // always available

  TITLES_LIST.forEach((title) => {
    if (player.level >= title.requiredLevel) {
      unlocked.add(title.id);
    }
  });

  return Array.from(unlocked);
}

export function getPlayerTitleById(titleId: string): PlayerTitle {
  const found = TITLES_LIST.find((t) => t.id === titleId);
  if (found) {
    return { ...found, isUnlocked: true };
  }
  const fallback = TITLES_LIST[0];
  return {
    ...fallback,
    isUnlocked: true,
  };
}
