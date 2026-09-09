/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SkillDefinition, SkillId } from '../types';

export const SKILL_DEFINITIONS: Record<SkillId, SkillDefinition> = {
  speed: {
    id: 'speed',
    name: 'السرعة الفائقة والتربو',
    description: 'زيادة مدة السرعة الخارقة (التربو) ومضاعف النقاط، تبدأ من 3 ثوانٍ وتزداد تصاعدياً.',
    icon: 'Zap',
    maxLevel: 10,
    baseCost: 55000,
    costMultiplier: 1.8,
    effectName: 'مدة التربو وسرعة الانطلاق',
    effectUnit: ' ثانية',
    baseValue: 3.0,
    valuePerLevel: 2.5, // Level 1: 3.0s, Level 10: 25.5s
  },
  jump: {
    id: 'jump',
    name: 'القفز الخارق المعزز',
    description: 'تمديد مدة قدرة القفز العالي فوق الشاحنات، تبدأ من 3 ثوانٍ وتزداد مع كل ترقية.',
    icon: 'ArrowUpCircle',
    maxLevel: 10,
    baseCost: 50000,
    costMultiplier: 1.78,
    effectName: 'مدة وقوة القفزة الخارقة',
    effectUnit: ' ثانية',
    baseValue: 3.0,
    valuePerLevel: 2.2, // Level 1: 3.0s, Level 10: 22.8s
  },
  magnet: {
    id: 'magnet',
    name: 'المغناطيس الكهرومغناطيسي الذهبي',
    description: 'تمديد مدة جذب الدنانير التلقائي، تبدأ من 3 ثوانٍ وتزداد تصاعدياً حتى 28 ثانية.',
    icon: 'Magnet',
    maxLevel: 10,
    baseCost: 65000,
    costMultiplier: 1.82,
    effectName: 'مدة عمل المغناطيس الخارق',
    effectUnit: ' ثانية',
    baseValue: 3.0,
    valuePerLevel: 2.7, // Level 1: 3.0s, Level 10: 27.3s
  },
  shield: {
    id: 'shield',
    name: 'درع الصمود الفولاذي',
    description: 'تمديد مدة درع الحماية ضد الاصطدام، تبدأ من 3 ثوانٍ وتزداد تصاعدياً حتى 30 ثانية.',
    icon: 'Shield',
    maxLevel: 10,
    baseCost: 75000,
    costMultiplier: 1.85,
    effectName: 'مدة حماية الدرع الفولاذي',
    effectUnit: ' ثانية',
    baseValue: 3.0,
    valuePerLevel: 3.0, // Level 1: 3.0s, Level 10: 30.0s
  },
  energy: {
    id: 'energy',
    name: 'مضاعف الدنانير 2X',
    description: 'تمديد مدة مضاعفة الدنانير (2X)، تبدأ من 3 ثوانٍ وتزداد مع كل مستوى ترقية.',
    icon: 'Flame',
    maxLevel: 10,
    baseCost: 60000,
    costMultiplier: 1.8,
    effectName: 'مدة مضاعف الدنانير',
    effectUnit: ' ثانية',
    baseValue: 3.0,
    valuePerLevel: 2.5, // Level 1: 3.0s, Level 10: 25.5s
  },
  balance: {
    id: 'balance',
    name: 'إبطاء الزمن والتوازن',
    description: 'تمديد مدة قدرة إبطاء الزمن والمناورة السلسة، تبدأ من 3 ثوانٍ وتزداد تصاعدياً.',
    icon: 'Activity',
    maxLevel: 10,
    baseCost: 48000,
    costMultiplier: 1.75,
    effectName: 'مدة إبطاء الزمن والرشاقة',
    effectUnit: ' ثانية',
    baseValue: 3.0,
    valuePerLevel: 2.0, // Level 1: 3.0s, Level 10: 21.0s
  },
  slide: {
    id: 'slide',
    name: 'الانزلاق الفولاذي السريع',
    description: 'تمديد مدة وسرعة الانزلاق تحت الحواجز المنخفضة، تبدأ من 3 ثوانٍ وتزداد تصاعدياً.',
    icon: 'ChevronsDown',
    maxLevel: 10,
    baseCost: 45000,
    costMultiplier: 1.75,
    effectName: 'مدة وسلاسة الانزلاق',
    effectUnit: ' ثانية',
    baseValue: 3.0,
    valuePerLevel: 2.0, // Level 1: 3.0s, Level 10: 21.0s
  },
};

export function getSkillCost(skillId: SkillId, currentLevel: number): number {
  const def = SKILL_DEFINITIONS[skillId];
  if (!def) return 10000;
  return Math.round(def.baseCost * Math.pow(def.costMultiplier, currentLevel - 1));
}

export const getSkillUpgradeCost = getSkillCost;

export function getSkillValue(skillId: SkillId, currentLevel: number): number {
  const def = SKILL_DEFINITIONS[skillId];
  if (!def) return 0;
  return Number((def.baseValue + (currentLevel - 1) * def.valuePerLevel).toFixed(1));
}
