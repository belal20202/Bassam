/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerData, SkillId } from '../types';
import { SKILL_DEFINITIONS, getSkillUpgradeCost, getSkillValue } from '../data/skills';
import { X, Zap, ArrowUpCircle, Magnet, Shield, Flame, Activity, ChevronsDown, Check } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface SkillsModalProps {
  playerData: PlayerData;
  onClose: () => void;
  onUpgradeSkill: (skillId: SkillId, cost: number) => void;
}

export const SkillsModal: React.FC<SkillsModalProps> = ({
  playerData,
  onClose,
  onUpgradeSkill,
}) => {
  const getSkillIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'ArrowUpCircle': return <ArrowUpCircle className="w-4 h-4 text-emerald-400" />;
      case 'Magnet': return <Magnet className="w-4 h-4 text-yellow-400" />;
      case 'Shield': return <Shield className="w-4 h-4 text-cyan-400" />;
      case 'Flame': return <Flame className="w-4 h-4 text-red-400" />;
      case 'Activity': return <Activity className="w-4 h-4 text-indigo-400" />;
      case 'ChevronsDown': return <ChevronsDown className="w-4 h-4 text-purple-400" />;
      default: return <Zap className="w-4 h-4 text-amber-400" />;
    }
  };

  const handleUpgrade = (skillId: SkillId, cost: number) => {
    if (playerData.iqd < cost) return;
    audioManager.playLevelUp();
    onUpgradeSkill(skillId, cost);
  };

  return (
    <div id="skills-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">تطوير مهارات بسام</h2>
              <p className="text-[11px] text-slate-400">ترقية قدرات الركض والقفز والمغناطيس بالدينار</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Balance Badge */}
            <div className="flex items-center gap-1.5 bg-amber-950/70 border border-amber-500/40 px-2.5 py-1 rounded-xl shadow-inner">
              <div className="w-4 h-4 rounded-full bg-yellow-400 text-slate-950 flex items-center justify-center text-[9px] font-black">
                د.ع
              </div>
              <span className="font-mono font-bold text-yellow-300 text-xs">
                {playerData.iqd.toLocaleString('en-US')}
              </span>
            </div>

            <button
              onClick={() => {
                audioManager.playButtonClick();
                onClose();
              }}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Skills List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
          {Object.values(SKILL_DEFINITIONS).map((skill) => {
            const currentLevel = playerData.skills[skill.id] || 1;
            const isMaxLevel = currentLevel >= skill.maxLevel;
            const upgradeCost = getSkillUpgradeCost(skill.id, currentLevel);
            const canAfford = playerData.iqd >= upgradeCost;
            const currentValue = getSkillValue(skill.id, currentLevel);
            const nextValue = getSkillValue(skill.id, currentLevel + 1);

            return (
              <div
                key={skill.id}
                className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-slate-600 transition-all"
              >
                {/* Skill Info */}
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-950/60 border border-slate-700 flex items-center justify-center shrink-0">
                    {getSkillIcon(skill.icon)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-xs text-white truncate">{skill.name}</h3>
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                        مستوى {currentLevel}/{skill.maxLevel}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{skill.description}</p>
                    
                    {/* Current Effect Tag */}
                    <div className="mt-1 text-[10px] font-semibold text-emerald-400">
                      {skill.effectName}: <span className="font-mono text-white font-bold">{currentValue}{skill.effectUnit}</span>
                      {!isMaxLevel && (
                        <span className="text-slate-400 mr-1.5 text-[9px]">
                          (التالي: <span className="text-amber-400 font-mono font-bold">{nextValue}{skill.effectUnit}</span>)
                        </span>
                      )}
                    </div>

                    {/* Level Progress Dots */}
                    <div className="flex items-center gap-1 mt-1.5 max-w-xs">
                      {Array.from({ length: skill.maxLevel }).map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 flex-1 rounded-full transition-all ${
                            idx < currentLevel
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-300'
                              : 'bg-slate-700'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                {/* Upgrade Button */}
                <div className="w-full sm:w-auto shrink-0 flex justify-end">
                  {isMaxLevel ? (
                    <div className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 px-3 py-1.5 rounded-xl text-[11px] font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>المستوى الأقصى</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleUpgrade(skill.id, upgradeCost)}
                      disabled={!canAfford}
                      className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
                        canAfford
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-sm active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span>ترقية</span>
                      <span className="font-mono font-bold text-[11px]">({upgradeCost.toLocaleString('en-US')} د.ع)</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
