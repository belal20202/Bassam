/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerData, Achievement } from '../types';
import { X, Trophy, Footprints, MapPin, Crown, Coins, Sparkles, Car, Award, Zap, ShieldCheck, Check } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface AchievementsModalProps {
  playerData: PlayerData;
  onClose: () => void;
  onClaimAchievement: (achievementId: string, rewardIQD: number, rewardXP: number) => void;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({
  playerData,
  onClose,
  onClaimAchievement,
}) => {
  const getAchIcon = (icon: string) => {
    switch (icon) {
      case 'Footprints': return <Footprints className="w-4 h-4 text-amber-400" />;
      case 'MapPin': return <MapPin className="w-4 h-4 text-blue-400" />;
      case 'Trophy': return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 'Crown': return <Crown className="w-4 h-4 text-amber-300" />;
      case 'Coins': return <Coins className="w-4 h-4 text-yellow-400" />;
      case 'Sparkles': return <Sparkles className="w-4 h-4 text-purple-400" />;
      case 'Car': return <Car className="w-4 h-4 text-red-400" />;
      case 'Award': return <Award className="w-4 h-4 text-emerald-400" />;
      case 'Zap': return <Zap className="w-4 h-4 text-amber-400" />;
      case 'ShieldCheck': return <ShieldCheck className="w-4 h-4 text-cyan-400" />;
      default: return <Trophy className="w-4 h-4 text-amber-400" />;
    }
  };

  const handleClaim = (ach: Achievement) => {
    audioManager.playMissionClaim();
    onClaimAchievement(ach.id, ach.rewardIQD, ach.rewardXP);
  };

  return (
    <div id="achievements-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Trophy className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">إنجازات عداء بغداد</h2>
              <p className="text-[11px] text-slate-400">سجل الأرقام القياسية والمفاخر الرياضية لبسام</p>
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

        {/* Achievements Grid */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2 flex-1 custom-scrollbar">
          {playerData.achievements.map((ach) => {
            const progress = Math.min((ach.currentValue / ach.targetValue) * 100, 100);

            return (
              <div
                key={ach.id}
                className="bg-slate-800/70 border border-slate-700/60 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-slate-950/70 border border-slate-700 flex items-center justify-center shrink-0">
                    {getAchIcon(ach.icon)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1.5">
                      <h3 className="font-bold text-xs text-white truncate">{ach.title}</h3>
                      <span className="text-[10px] font-mono font-bold text-slate-400 shrink-0">
                        {Math.round(ach.currentValue).toLocaleString('en-US')}/{ach.targetValue.toLocaleString('en-US')}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-300 mt-0.5 truncate">{ach.description}</p>

                    {/* Progress Bar */}
                    <div className="w-full h-1.5 bg-slate-950 rounded-full mt-1.5 overflow-hidden border border-slate-700">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Rewards */}
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold">
                      <span className="text-yellow-400">+{ach.rewardIQD.toLocaleString('en-US')} د.ع</span>
                      <span className="text-emerald-400">+{ach.rewardXP.toLocaleString('en-US')} XP</span>
                    </div>
                  </div>
                </div>

                {/* Action button */}
                <div className="shrink-0 w-full sm:w-auto flex justify-end">
                  {ach.isClaimed ? (
                    <div className="flex items-center justify-center gap-1 bg-slate-950/60 border border-slate-800 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-bold">
                      <Check className="w-3 h-3" />
                      <span>مكتمل</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaim(ach)}
                      disabled={!ach.isUnlocked}
                      className={`w-full sm:w-auto flex items-center justify-center gap-1 px-3 py-1 rounded-lg font-bold text-xs transition-all ${
                        ach.isUnlocked
                          ? 'bg-gradient-to-r from-emerald-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-sm active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <span>{ach.isUnlocked ? 'استلام' : 'مغلق'}</span>
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
