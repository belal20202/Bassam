/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import { PlayerData, RunStats } from '../types';
import confetti from 'canvas-confetti';
import { RotateCcw, Home, Trophy, Coins } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface GameOverModalProps {
  runStats: RunStats;
  playerData: PlayerData;
  onPlayAgain: () => void;
  onReturnHome: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  runStats,
  playerData,
  onPlayAgain,
  onReturnHome,
}) => {
  useEffect(() => {
    if (runStats.isNewRecord) {
      audioManager.playLevelUp();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {
        // Safe fallback
      }
    }
  }, [runStats.isNewRecord]);

  const handlePlayAgain = () => {
    audioManager.playButtonClick();
    onPlayAgain();
  };

  const handleReturnHome = () => {
    audioManager.playButtonClick();
    onReturnHome();
  };

  return (
    <div id="game-over-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/90 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-6 flex flex-col items-center text-center">
        {/* Title Header */}
        {runStats.isNewRecord ? (
          <div className="mb-3">
            <div className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-3 py-0.5 rounded-full font-black text-xs shadow-md">
              <Trophy className="w-3.5 h-3.5" />
              <span>رقم قياسي جديد!</span>
            </div>
            <h2 className="text-xl font-black text-white mt-1.5">جولة ركض ممتازة</h2>
          </div>
        ) : (
          <div className="mb-3">
            <span className="text-[11px] font-bold text-amber-400">انتهت الجولة الحالية</span>
            <h2 className="text-xl font-black text-white mt-0.5">محاولة بطولية يا بسام!</h2>
          </div>
        )}

        {/* Clean Statistics Cards */}
        <div className="w-full grid grid-cols-3 gap-2 my-3">
          {/* Distance */}
          <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 font-bold">المسافة</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-base font-black text-white font-mono">
                {Math.round(runStats.distance).toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-amber-400 font-bold">متر</span>
            </div>
          </div>

          {/* Coins */}
          <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 font-bold">الدنانير</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-base font-black text-yellow-300 font-mono">
                +{runStats.coinsCollected.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-yellow-400 font-bold">د.ع</span>
            </div>
          </div>

          {/* XP */}
          <div className="bg-slate-800/90 border border-slate-700 p-2.5 rounded-xl flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 font-bold">الخبرة</span>
            <div className="flex items-baseline gap-0.5 mt-0.5">
              <span className="text-base font-black text-blue-400 font-mono">
                +{runStats.xpEarned.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-blue-300 font-bold">XP</span>
            </div>
          </div>
        </div>

        {/* Level & XP Progression Card */}
        {(() => {
          const reqXP = 100 + Math.max(0, Math.min(100, playerData.level)) * 20;
          const currXP = Math.min(playerData.xp, reqXP);
          const remXP = playerData.level >= 100 ? 0 : Math.max(0, reqXP - currXP);
          const percent = playerData.level >= 100 ? 100 : Math.round((currXP / reqXP) * 100);
          return (
            <div className="w-full bg-slate-800/80 border border-blue-500/30 p-2.5 rounded-xl mb-3 text-right">
              <div className="flex items-center justify-between text-xs font-bold mb-1">
                <span className="text-amber-300">المستوى {playerData.level >= 100 ? '100 (الحد الأقصى)' : playerData.level}</span>
                <span className="text-blue-300 font-mono text-[11px]">{currXP}/{reqXP} XP ({percent}%)</span>
              </div>
              <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-700">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 to-amber-400 rounded-full transition-all duration-500"
                  style={{ width: `${percent}%` }}
                />
              </div>
              {playerData.level < 100 && (
                <p className="text-[10px] text-slate-300 mt-1">
                  تبقى <strong className="text-amber-400 font-bold font-mono">{remXP}</strong> نقطة XP لبلوغ المستوى {playerData.level + 1}
                </p>
              )}
            </div>
          );
        })()}

        {/* Balance & Best Record Summary */}
        <div className="w-full flex items-center justify-between bg-slate-950/70 border border-slate-800 px-3 py-2 rounded-xl text-[11px] text-slate-300 mb-4">
          <div className="flex items-center gap-1">
            <Trophy className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span>أفضل مسافة: <strong className="text-white font-mono">{playerData.highScoreDistance.toLocaleString('en-US')} م</strong></span>
          </div>
          <div className="flex items-center gap-1">
            <Coins className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
            <span>الرصيد: <strong className="text-yellow-300 font-mono">{playerData.iqd.toLocaleString('en-US')} د.ع</strong></span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="w-full grid grid-cols-2 gap-2">
          <button
            id="btn-gameover-playagain"
            onClick={handlePlayAgain}
            className="flex items-center justify-center gap-1.5 bg-gradient-to-r from-amber-500 to-yellow-400 hover:brightness-110 text-slate-950 py-2.5 rounded-xl font-black text-xs shadow-sm active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة الركض</span>
          </button>

          <button
            id="btn-gameover-home"
            onClick={handleReturnHome}
            className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white py-2.5 rounded-xl font-bold text-xs border border-slate-700 active:scale-95 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>القائمة الرئيسية</span>
          </button>
        </div>
      </div>
    </div>
  );
};
