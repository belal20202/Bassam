/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerData, PlayerTitle } from '../types';
import { TITLES_LIST } from '../data/titles';
import { X, Award, CheckCircle2, Lock, Sparkles, Crown } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface TitlesModalProps {
  playerData: PlayerData;
  onClose: () => void;
  onSelectTitle: (titleId: string) => void;
}

const RARITY_STYLES = {
  COMMON: {
    border: 'border-slate-700/80',
    bg: 'bg-slate-800/70',
    badgeBg: 'bg-slate-700/50 text-slate-300',
    label: 'عادي',
  },
  RARE: {
    border: 'border-blue-500/40',
    bg: 'bg-slate-800/70',
    badgeBg: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
    label: 'نادر',
  },
  EPIC: {
    border: 'border-purple-500/40',
    bg: 'bg-slate-800/70',
    badgeBg: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
    label: 'ملحمي',
  },
  LEGENDARY: {
    border: 'border-amber-500/50',
    bg: 'bg-slate-800/70 shadow-sm',
    badgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
    label: 'أسطوري',
  },
};

export const TitlesModal: React.FC<TitlesModalProps> = ({
  playerData,
  onClose,
  onSelectTitle,
}) => {
  const unlockedSet = new Set(playerData.unlockedTitles || ['title_novice_runner']);
  const activeTitle = playerData.activeTitleId || 'title_novice_runner';

  const handleEquip = (titleId: string) => {
    if (!unlockedSet.has(titleId)) return;
    audioManager.playPowerUp();
    onSelectTitle(titleId);
  };

  return (
    <div id="titles-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <Crown className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">الألقاب الفخرية</h2>
              <p className="text-[11px] text-slate-400">ألقاب مميزة تمنحك مكانة خاصة في بغداد</p>
            </div>
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

        {/* Current Active Title Banner */}
        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {TITLES_LIST.find((t) => t.id === activeTitle)?.badge || '🏃'}
            </span>
            <div>
              <span className="text-[9px] text-slate-400 block leading-tight">اللقب الحالي</span>
              <span className="text-xs sm:text-sm font-black text-amber-400">
                {TITLES_LIST.find((t) => t.id === activeTitle)?.name || 'عداء مبتدئ'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md border border-slate-700">
            {unlockedSet.size} / {TITLES_LIST.length} متاح
          </span>
        </div>

        {/* Titles List Grid */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
          {TITLES_LIST.map((title) => {
            const isUnlocked = unlockedSet.has(title.id);
            const isActive = activeTitle === title.id;
            const style = RARITY_STYLES[title.rarity] || RARITY_STYLES.COMMON;

            return (
              <div
                key={title.id}
                onClick={() => isUnlocked && handleEquip(title.id)}
                className={`border rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all ${
                  style.border
                } ${style.bg} ${
                  isUnlocked ? 'cursor-pointer hover:border-amber-500/50' : 'opacity-60'
                } ${isActive ? 'ring-1.5 ring-amber-400' : ''}`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-center text-xl shrink-0">
                    {title.badge}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h3 className="font-bold text-xs text-white truncate">{title.name}</h3>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${style.badgeBg}`}>
                        {style.label}
                      </span>
                    </div>

                    <p className="text-[10px] text-slate-300 mt-0.5 truncate">{title.description}</p>
                    
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400">
                      <span className="text-slate-500">الفتح:</span>
                      <span className="truncate">{title.requirementDescription}</span>
                    </div>
                  </div>
                </div>

                {/* Status / Equip Action */}
                <div className="shrink-0 w-full sm:w-auto flex justify-end">
                  {isActive ? (
                    <div className="flex items-center gap-1 bg-amber-500 text-slate-950 px-2.5 py-1 rounded-lg font-black text-[11px] shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>مفعل</span>
                    </div>
                  ) : isUnlocked ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEquip(title.id);
                      }}
                      className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-white px-3 py-1 rounded-lg font-bold text-xs border border-slate-700 transition-colors"
                    >
                      تفعيل
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 bg-slate-950/80 text-slate-500 px-2.5 py-1 rounded-lg text-[10px] font-mono border border-slate-800">
                      <Lock className="w-3 h-3" />
                      <span>مقفل</span>
                    </div>
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
