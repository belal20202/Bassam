/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerData, DailyChallenge } from '../types';
import { X, CheckSquare, Gift, Sparkles, Check, Clock, Calendar, Trophy, Flame } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface MissionsModalProps {
  playerData: PlayerData;
  onClose: () => void;
  onClaimMission: (missionId: string, rewardIQD: number, rewardXP: number) => void;
  onClaimDailyChallenge?: (challengeId: string, rewardIQD: number, rewardXP: number) => void;
}

export const MissionsModal: React.FC<MissionsModalProps> = ({
  playerData,
  onClose,
  onClaimMission,
  onClaimDailyChallenge,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  // 24h Countdown Timer calculation (exact time until next 24h reset boundary)
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setUTCHours(24, 0, 0, 0);
      const diffMs = Math.max(0, nextMidnight.getTime() - now.getTime());
      
      const hours = Math.floor(diffMs / (1000 * 60 * 60));
      const mins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diffMs % (1000 * 60)) / 1000);
      
      setTimeLeft(
        `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const dailyChallenges = playerData.dailyChallenges || [];
  const completedCount = dailyChallenges.filter((c) => c.isCompleted).length;
  const claimedCount = dailyChallenges.filter((c) => c.isClaimed).length;

  const handleClaimChallenge = (challenge: DailyChallenge) => {
    audioManager.playMissionClaim();
    if (onClaimDailyChallenge) {
      onClaimDailyChallenge(challenge.id, challenge.rewardIQD, challenge.rewardXP);
    }
  };

  return (
    <div id="missions-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh]">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/30 to-yellow-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Flame className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-white leading-tight">التحديات اليومية الـ 10</h2>
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] px-2 py-0.5 rounded-full font-bold">
                  {completedCount}/10 مكتمل
                </span>
              </div>
              <p className="text-[11px] text-slate-400">10 تحديات حصرية تتجدد بالكامل كل 24 ساعة</p>
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

        {/* 24h Countdown Banner */}
        <div className="bg-gradient-to-r from-amber-950/40 via-yellow-950/30 to-amber-950/40 border-b border-amber-500/20 px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-amber-400 text-xs font-bold">
            <Calendar className="w-3.5 h-3.5" />
            <span>تتجدد وتتغير يومياً كل 24 ساعة</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-yellow-300 bg-slate-950/80 px-2.5 py-1 rounded-lg border border-amber-500/40 shadow-inner">
            <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>{timeLeft}</span>
          </div>
        </div>

        {/* 10 Challenges Content List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
          {dailyChallenges.map((challenge, idx) => {
            const progress = Math.min((challenge.currentValue / challenge.targetValue) * 100, 100);
            return (
              <div
                key={challenge.id}
                className={`bg-slate-800/75 border transition-all rounded-xl p-3 flex items-center justify-between gap-3 ${
                  challenge.isCompleted
                    ? 'border-amber-500/40 bg-slate-800/90'
                    : 'border-slate-700/70 hover:border-slate-600'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-slate-900 border border-amber-500/30 flex items-center justify-center text-xs font-black text-amber-400 shrink-0">
                        {idx + 1}
                      </span>
                      {challenge.badge && (
                        <span className="text-base shrink-0">{challenge.badge}</span>
                      )}
                      <h3 className="font-bold text-xs sm:text-sm text-white break-words leading-snug">
                        {challenge.title}
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-bold text-amber-400 shrink-0 whitespace-nowrap bg-slate-950/70 px-2 py-0.5 rounded-md border border-slate-700/80">
                      {Math.round(challenge.currentValue).toLocaleString('en-US')}/{challenge.targetValue.toLocaleString('en-US')}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed break-words">
                    {challenge.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-950 rounded-full mt-2 overflow-hidden border border-slate-700">
                    <div
                      className={`h-full transition-all duration-300 ${
                        challenge.isCompleted
                          ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-300'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>

                  {/* Rewards */}
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-bold">
                    <span className="text-yellow-400 flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      +{challenge.rewardIQD.toLocaleString('en-US')} د.ع
                    </span>
                    <span className="text-blue-400 flex items-center gap-1">
                      <Gift className="w-3.5 h-3.5" />
                      +{challenge.rewardXP.toLocaleString('en-US')} XP
                    </span>
                  </div>
                </div>

                {/* Claim / Status Button */}
                <div className="shrink-0">
                  {challenge.isClaimed ? (
                    <div className="flex items-center justify-center gap-1 bg-slate-950/80 border border-slate-800 text-emerald-400 px-3 py-1.5 rounded-lg text-[11px] font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>تم</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaimChallenge(challenge)}
                      disabled={!challenge.isCompleted}
                      className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                        challenge.isCompleted
                          ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-lg active:scale-95'
                          : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                      }`}
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>{challenge.isCompleted ? 'استلام' : 'متابعة'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Summary */}
        <div className="p-3 bg-slate-950/90 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>أكمل الـ 10 تحديات يومياً لمضاعفة ثروتك وخبرتك!</span>
          </div>
          <span className="font-mono text-amber-300 font-bold">
            {claimedCount}/10 مستلمة
          </span>
        </div>
      </div>
    </div>
  );
};
