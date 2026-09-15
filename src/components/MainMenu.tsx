/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { PlayerData, GameState } from '../types';
import { getRequiredXPForLevel } from '../storage/storage';
import { TITLES_LIST, getPlayerTitleById } from '../data/titles';
import { Play, Zap, CheckSquare, Trophy, ShoppingBag, Settings, Crown } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface MainMenuProps {
  playerData: PlayerData;
  onNavigate: (state: GameState) => void;
  onStartGame: (isHeadstart?: boolean) => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  playerData,
  onNavigate,
  onStartGame,
}) => {
  const currentLevelReqXP = getRequiredXPForLevel(playerData.level);
  const xpPercent = Math.min((playerData.xp / currentLevelReqXP) * 100, 100);

  const activeTitleObj = getPlayerTitleById(playerData.activeTitleId);

  const handleStart = () => {
    audioManager.playButtonClick();
    onStartGame();
  };

  const handleNav = (state: GameState) => {
    audioManager.playButtonClick();
    onNavigate(state);
  };

  const dailyChallenges = playerData.dailyChallenges || [];
  const claimableCount = dailyChallenges.filter((c) => c.isCompleted && !c.isClaimed).length;

  return (
    <div id="main-menu-screen" className="absolute inset-0 z-20 flex flex-col justify-between items-center p-3.5 sm:p-5 bg-gradient-to-b from-slate-950/75 via-slate-900/30 to-slate-950/85 backdrop-blur-[2px] overflow-y-auto">
      {/* Top Bar: Player Level, Title & IQD Balance - Centered with max-w-4xl */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 w-full max-w-4xl">
        {/* Level & Active Title */}
        <div className="flex items-center gap-2">
          {/* Level Box - Strictly Fixed Dimensions & Zero-Shift Stability */}
          <div className="flex items-center gap-2 bg-slate-900/90 border border-amber-500/30 px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md shrink-0">
            {/* The single yellow badge containing ONLY 'المستوى' as requested */}
            <div className="flex items-center justify-center px-2.5 h-8 rounded-lg bg-gradient-to-r from-amber-500 to-yellow-300 text-slate-950 font-black text-xs shadow-sm shrink-0">
              <span>المستوى</span>
            </div>
            <div className="flex flex-col w-[124px] shrink-0">
              <div className="flex justify-between items-baseline text-[10px] font-bold text-slate-200 gap-1.5">
                <span className="text-amber-300 font-mono font-bold text-xs min-w-[24px] tabular-nums text-right shrink-0">
                  {playerData.level >= 100 ? '100' : playerData.level}
                </span>
                <span className="text-slate-400 font-mono text-[9px] tabular-nums truncate text-left">
                  {playerData.level >= 100 ? 'الحد الأقصى' : `${playerData.xp.toLocaleString('en-US')}/${currentLevelReqXP.toLocaleString('en-US')}`}
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-950 rounded-full mt-0.5 overflow-hidden border border-slate-700/80">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 rounded-full transition-all duration-300"
                  style={{ width: `${playerData.level >= 100 ? 100 : xpPercent}%` }}
                />
              </div>
              <span className="text-[8px] text-slate-400 font-bold mt-0.5 truncate text-right">
                {playerData.level >= 100 ? 'الحد الأقصى 100' : `بقي ${Math.max(0, currentLevelReqXP - playerData.xp)} للـ ${playerData.level + 1}`}
              </span>
            </div>
          </div>

          {/* Active Title */}
          <button
            id="btn-open-titles"
            onClick={() => handleNav('TITLES')}
            className="flex items-center gap-1.5 bg-slate-900/90 border border-amber-500/40 hover:border-amber-400 px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md transition-all group max-w-[170px] sm:max-w-[220px]"
          >
            <span className="text-sm shrink-0 group-hover:scale-110 transition-transform">
              {activeTitleObj.badge}
            </span>
            <span className="text-[11px] font-bold text-amber-300 group-hover:text-white transition-colors truncate">
              {activeTitleObj.name}
            </span>
            <Crown className="w-3 h-3 text-amber-400 opacity-80 shrink-0" />
          </button>
        </div>

        {/* High Score & IQD Currency */}
        <div className="flex items-center gap-2">
          {/* Best Record */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-700/80 px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md">
            <Trophy className="w-3.5 h-3.5 text-yellow-400" />
            <div className="flex items-baseline gap-1">
              <span className="text-xs font-bold text-white font-mono">
                {playerData.highScoreDistance.toLocaleString('en-US')}
              </span>
              <span className="text-[10px] text-amber-400 font-bold">متر</span>
            </div>
          </div>

          {/* Iraqi Dinar Currency */}
          <button
            id="btn-open-shop-currency"
            onClick={() => handleNav('SHOP')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-amber-950/90 to-yellow-950/90 border border-amber-500/50 hover:border-amber-400 px-2.5 py-1.5 rounded-xl shadow-lg backdrop-blur-md transition-all group"
          >
            <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center text-slate-950 font-black text-[9px] shadow-sm">
              د.ع
            </div>
            <span className="text-xs font-black text-yellow-300 font-mono">
              {playerData.iqd.toLocaleString('en-US')}
            </span>
          </button>
        </div>
      </div>

      {/* Center: Title & Action Area */}
      <div className="flex flex-col items-center justify-center my-auto py-2 text-center">
        {/* Main Title: Bassam */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow-[0_4px_24px_rgba(245,158,11,0.5)] tracking-tight mb-3">
          Bassam
        </h1>

        {/* Start Game Button */}
        <div className="flex flex-col items-center gap-2">
          <button
            id="btn-start-run"
            onClick={handleStart}
            className="group relative flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 px-12 sm:px-16 py-3.5 rounded-2xl font-black text-xl sm:text-2xl shadow-[0_0_35px_rgba(245,158,11,0.45)] hover:shadow-[0_0_50px_rgba(245,158,11,0.7)] hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <Play className="w-6 h-6 fill-slate-950 group-hover:translate-x-0.5 transition-transform" />
            <span>ابدأ الركض</span>
          </button>
        </div>
      </div>

      {/* Bottom Main Navigation Menu - 4 Balanced Clean Tabs */}
      <div className="w-full max-w-md mx-auto grid grid-cols-4 gap-2">
        {/* Shop Button */}
        <button
          id="btn-menu-shop"
          onClick={() => handleNav('SHOP')}
          className="flex flex-col items-center justify-center gap-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-700/80 hover:border-amber-500/50 p-2.5 rounded-xl shadow-md backdrop-blur-md transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-purple-500/20 text-purple-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <ShoppingBag className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-200">المتجر</span>
        </button>

        {/* Skills Button */}
        <button
          id="btn-menu-skills"
          onClick={() => handleNav('SKILLS')}
          className="flex flex-col items-center justify-center gap-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-700/80 hover:border-amber-500/50 p-2.5 rounded-xl shadow-md backdrop-blur-md transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Zap className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-200">المهارات</span>
        </button>

        {/* 10 Daily Challenges Button */}
        <button
          id="btn-menu-missions"
          onClick={() => handleNav('MISSIONS')}
          className="relative flex flex-col items-center justify-center gap-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-700/80 hover:border-amber-500/50 p-2.5 rounded-xl shadow-md backdrop-blur-md transition-all group"
        >
          {claimableCount > 0 && (
            <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          )}
          <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <CheckSquare className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-200">التحديات</span>
        </button>

        {/* Settings Button */}
        <button
          id="btn-menu-settings"
          onClick={() => handleNav('SETTINGS')}
          className="flex flex-col items-center justify-center gap-1 bg-slate-900/90 hover:bg-slate-800 active:scale-95 border border-slate-700/80 hover:border-slate-500 p-2.5 rounded-xl shadow-md backdrop-blur-md transition-all group"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-700/50 text-slate-400 flex items-center justify-center group-hover:scale-105 transition-transform">
            <Settings className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-200">الإعدادات</span>
        </button>
      </div>
    </div>
  );
};
