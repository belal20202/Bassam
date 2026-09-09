/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { PlayerData, Mission, DailyChallenge } from '../types';
import { X, CheckSquare, Gift, Sparkles, Check, Clock, Calendar } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'DAILY_CHALLENGES' | 'DAILY' | 'WEEKLY' | 'LIFETIME'>('DAILY_CHALLENGES');
  const [timeLeft, setTimeLeft] = useState<string>('');

  // 24h Countdown Timer calculation
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const nextMidnight = new Date();
      nextMidnight.setHours(24, 0, 0, 0);
      const diffMs = nextMidnight.getTime() - now.getTime();
      
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

  const filteredMissions = playerData.missions.filter((m) => m.category === activeTab);
  const dailyChallenges = playerData.dailyChallenges || [];

  const handleClaim = (mission: Mission) => {
    audioManager.playMissionClaim();
    onClaimMission(mission.id, mission.rewardIQD, mission.rewardXP);
  };

  const handleClaimChallenge = (challenge: DailyChallenge) => {
    audioManager.playMissionClaim();
    if (onClaimDailyChallenge) {
      onClaimDailyChallenge(challenge.id, challenge.rewardIQD, challenge.rewardXP);
    }
  };

  return (
    <div id="missions-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Compact Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">المهام والتحديات</h2>
              <p className="text-[11px] text-slate-400">أهداف يومية لكسب الدنانير ونقاط الخبرة</p>
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

        {/* Compact Category Tabs */}
        <div className="grid grid-cols-4 gap-1 p-2 bg-slate-950/60 border-b border-slate-800 text-center">
          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveTab('DAILY_CHALLENGES');
            }}
            className={`py-1.5 px-1 rounded-lg font-bold text-[11px] transition-all flex flex-col items-center justify-center ${
              activeTab === 'DAILY_CHALLENGES'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            <span>تحديات اليوم</span>
          </button>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveTab('DAILY');
            }}
            className={`py-1.5 px-1 rounded-lg font-bold text-[11px] transition-all ${
              activeTab === 'DAILY'
                ? 'bg-blue-600 text-white font-black shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            يومية
          </button>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveTab('WEEKLY');
            }}
            className={`py-1.5 px-1 rounded-lg font-bold text-[11px] transition-all ${
              activeTab === 'WEEKLY'
                ? 'bg-blue-600 text-white font-black shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            أسبوعية
          </button>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveTab('LIFETIME');
            }}
            className={`py-1.5 px-1 rounded-lg font-bold text-[11px] transition-all ${
              activeTab === 'LIFETIME'
                ? 'bg-blue-600 text-white font-black shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            دائمة
          </button>
        </div>

        {/* 24h Countdown Banner */}
        {activeTab === 'DAILY_CHALLENGES' && (
          <div className="bg-amber-950/30 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-amber-400 text-[11px] font-bold">
              <Calendar className="w-3.5 h-3.5" />
              <span>تتجدد كل 24 ساعة</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-yellow-300 bg-slate-950/80 px-2 py-0.5 rounded-md border border-amber-500/30">
              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>{timeLeft}</span>
            </div>
          </div>
        )}

        {/* Content List */}
        <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 custom-scrollbar">
          {/* TAB 1: DAILY 24H ROTATING CHALLENGES */}
          {activeTab === 'DAILY_CHALLENGES' && (
            <div className="space-y-2">
              {dailyChallenges.map((challenge) => {
                const progress = Math.min((challenge.currentValue / challenge.targetValue) * 100, 100);
                return (
                  <div
                    key={challenge.id}
                    className="bg-slate-800/70 border border-slate-700/70 hover:border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-3 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-lg shrink-0">{challenge.badge}</span>
                          <h3 className="font-bold text-xs sm:text-sm text-white break-words leading-snug">{challenge.title}</h3>
                        </div>
                        <span className="text-xs font-mono font-bold text-amber-400 shrink-0 whitespace-nowrap bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                          {Math.round(challenge.currentValue).toLocaleString('en-US')}/{challenge.targetValue.toLocaleString('en-US')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed break-words">{challenge.description}</p>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-950 rounded-full mt-2 overflow-hidden border border-slate-700">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 transition-all duration-300"
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

                    {/* Claim Button */}
                    <div className="shrink-0">
                      {challenge.isClaimed ? (
                        <div className="flex items-center justify-center gap-1 bg-slate-950/60 border border-slate-800 text-slate-500 px-2.5 py-1.5 rounded-lg text-[10px] font-bold">
                          <Check className="w-3 h-3" />
                          <span>مكتمل</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaimChallenge(challenge)}
                          disabled={!challenge.isCompleted}
                          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                            challenge.isCompleted
                              ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 hover:brightness-110 shadow-sm active:scale-95'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Gift className="w-3 h-3" />
                          <span>{challenge.isCompleted ? 'استلام' : 'متابعة'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* STANDARD MISSIONS TABS */}
          {activeTab !== 'DAILY_CHALLENGES' && (
            <div className="space-y-2">
              {filteredMissions.map((mission) => {
                const progress = Math.min((mission.currentValue / mission.targetValue) * 100, 100);
                return (
                  <div
                    key={mission.id}
                    className="bg-slate-800/70 border border-slate-700/70 rounded-xl p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-bold text-xs sm:text-sm text-white break-words leading-snug">{mission.title}</h3>
                        <span className="text-xs font-mono font-bold text-slate-300 shrink-0 whitespace-nowrap bg-slate-950/60 px-2 py-0.5 rounded-md border border-slate-700/60">
                          {Math.round(mission.currentValue).toLocaleString('en-US')}/{mission.targetValue.toLocaleString('en-US')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1.5 leading-relaxed break-words">{mission.description}</p>

                      {/* Progress Bar */}
                      <div className="w-full h-1.5 bg-slate-950 rounded-full mt-2 overflow-hidden border border-slate-700">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Rewards preview */}
                      <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] font-bold">
                        <span className="text-yellow-400 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" />
                          +{mission.rewardIQD.toLocaleString('en-US')} د.ع
                        </span>
                        <span className="text-blue-400 flex items-center gap-1">
                          <Gift className="w-3.5 h-3.5" />
                          +{mission.rewardXP.toLocaleString('en-US')} XP
                        </span>
                      </div>
                    </div>

                    {/* Claim Button */}
                    <div className="shrink-0">
                      {mission.isClaimed ? (
                        <div className="flex items-center justify-center gap-1 bg-slate-950/60 border border-slate-800 text-slate-500 px-2.5 py-1.5 rounded-lg text-[10px] font-bold">
                          <Check className="w-3 h-3" />
                          <span>مكتمل</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleClaim(mission)}
                          disabled={!mission.isCompleted}
                          className={`flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg font-bold text-[11px] transition-all ${
                            mission.isCompleted
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 text-slate-950 hover:brightness-110 shadow-sm active:scale-95'
                              : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed opacity-60'
                          }`}
                        >
                          <Gift className="w-3 h-3" />
                          <span>{mission.isCompleted ? 'استلام' : 'متابعة'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
