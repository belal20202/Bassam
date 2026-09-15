/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ActivePowerUp, BiomeType, WeatherType, PlayerTitle, PlayerData } from '../types';
import { 
  Pause, Zap, Shield, Magnet, ArrowUpCircle, Clock, Sparkles, CloudRain, Sun, CloudLightning, Wind, Moon
} from 'lucide-react';
import { audioManager } from '../engine/audio';

interface InGameHUDProps {
  distance: number;
  coins: number;
  activePowerUps: ActivePowerUp[];
  biome: BiomeType;
  multiplier: number;
  weather: WeatherType;
  equippedTitle?: PlayerTitle;
  playerData: PlayerData;
  onPause: () => void;
  onClaimDailyChallenge?: (challengeId: string, rewardIQD: number, rewardXP: number) => void;
  onClaimMission?: (missionId: string, rewardIQD: number, rewardXP: number) => void;
}

const BIOME_NAMES: Record<BiomeType, string> = {
  BAGHDAD: 'بغداد',
  BASRA: 'البصرة',
  NINEVEH: 'نينوى',
  ERBIL: 'أربيل',
  SULAYMANIYAH: 'السليمانية',
  DUHOK: 'دهوك',
  KIRKUK: 'كركوك',
  BABYLON: 'بابل',
  KARBALA: 'كربلاء',
  NAJAF: 'النجف',
  ANBAR: 'الأنبار',
  DIYALA: 'ديالى',
  SALADIN: 'صلاح الدين',
  WASIT: 'واسط',
  MAYSAN: 'ميسان',
  DHI_QAR: 'ذي قار',
  MUTHANNA: 'المثنى',
  QADISIYYAH: 'الديوانية',
  DIWANIYAH: 'الديوانية',
};

const WEATHER_SYMBOLS: Record<WeatherType, string> = {
  SUNNY_MORNING: '☀️',
  NOON_BRIGHT: '☀️',
  GOLDEN_SUNSET: '🌅',
  LIGHT_RAIN_MIST: '🌧️',
  BAGHDAD_STORM: '⛈️',
  BAGHDAD_DUST_STORM: '🌪️',
  SNOW_FLURRY: '❄️',
  KARRADA_NIGHT: '🌙✨',
};

export const InGameHUD: React.FC<InGameHUDProps> = ({
  distance,
  coins,
  activePowerUps,
  biome,
  multiplier,
  weather,
  equippedTitle,
  playerData,
  onPause,
}) => {
  const [showSideWeather, setShowSideWeather] = useState<boolean>(true);
  const weatherTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Governorate auto-hide state: strictly 5 seconds then disappears
  const [showGovernorate, setShowGovernorate] = useState<boolean>(true);
  const biomeTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setShowSideWeather(true);
    if (weatherTimerRef.current) clearTimeout(weatherTimerRef.current);
    // Auto-hide weather icon after exactly 3 seconds as requested (no text, symbol only)
    weatherTimerRef.current = setTimeout(() => {
      setShowSideWeather(false);
    }, 3000);

    return () => {
      if (weatherTimerRef.current) clearTimeout(weatherTimerRef.current);
    };
  }, [weather]);

  useEffect(() => {
    setShowGovernorate(true);
    if (biomeTimerRef.current) clearTimeout(biomeTimerRef.current);
    // Auto-hide governorate name after exactly 5 seconds as requested
    biomeTimerRef.current = setTimeout(() => {
      setShowGovernorate(false);
    }, 5000);

    return () => {
      if (biomeTimerRef.current) clearTimeout(biomeTimerRef.current);
    };
  }, [biome]);

  const handlePauseClick = () => {
    audioManager.playButtonClick();
    onPause();
  };

  const getPowerUpIcon = (type: string) => {
    switch (type) {
      case 'MAGNET': return <Magnet className="w-4 h-4 text-yellow-400" />;
      case 'SHIELD': return <Shield className="w-4 h-4 text-cyan-400" />;
      case 'TURBO_SPEED': return <Zap className="w-4 h-4 text-red-400 animate-pulse" />;
      case 'SUPER_JUMP': return <ArrowUpCircle className="w-4 h-4 text-emerald-400" />;
      case 'TIME_SLOW': return <Clock className="w-4 h-4 text-indigo-400" />;
      default: return <Sparkles className="w-4 h-4 text-amber-400" />;
    }
  };

  const getPowerUpLabel = (type: string) => {
    switch (type) {
      case 'MAGNET': return 'مغناطيس الدنانير';
      case 'SHIELD': return 'درع الحماية';
      case 'TURBO_SPEED': return 'صاروخ السرعة';
      case 'SUPER_JUMP': return 'قفزة فائقة';
      case 'TIME_SLOW': return 'إبطاء الزمن';
      default: return 'مضاعف الدنانير';
    }
  };

  const getPowerUpColor = (type: string) => {
    switch (type) {
      case 'MAGNET': return { border: 'border-yellow-500/60', bg: 'bg-yellow-500', text: 'text-yellow-300' };
      case 'SHIELD': return { border: 'border-cyan-500/60', bg: 'bg-cyan-500', text: 'text-cyan-300' };
      case 'TURBO_SPEED': return { border: 'border-red-500/60', bg: 'bg-red-500', text: 'text-red-300' };
      case 'SUPER_JUMP': return { border: 'border-emerald-500/60', bg: 'bg-emerald-500', text: 'text-emerald-300' };
      case 'TIME_SLOW': return { border: 'border-indigo-500/60', bg: 'bg-indigo-500', text: 'text-indigo-300' };
      default: return { border: 'border-amber-500/60', bg: 'bg-amber-500', text: 'text-amber-300' };
    }
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 sm:p-3 select-none">
      {/* Top Single Horizontal Navigation and Stats Bar - Stable Fixed Dimensions */}
      <div className="w-full flex items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg">
        {/* Right Section: Distance & Currency Balance with Strictly Fixed Dimensions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Distance: strictly fixed width and tabular numbers so it never grows or shifts */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-800/95 px-2.5 py-1 rounded-lg border border-slate-700/70 w-[108px] h-8 shadow-inner overflow-hidden shrink-0">
            <span className="text-xs text-amber-400 shrink-0">🏃</span>
            <span className="text-xs font-bold text-white font-mono tabular-nums text-center flex-1 truncate">
              {Math.round(distance)}
            </span>
            <span className="text-[10px] text-slate-400 font-bold shrink-0">م</span>
          </div>

          {/* Dinars Currency: Perfectly calibrated dimensions and legible tabular numerals */}
          <div className="flex items-center justify-between gap-1.5 bg-slate-800/95 px-2.5 py-1 rounded-lg border border-yellow-500/30 w-[114px] h-8 shadow-inner overflow-hidden shrink-0">
            <span className="text-xs shrink-0">💰</span>
            <span className="text-xs font-black text-yellow-300 font-mono tabular-nums text-center flex-1 truncate">
              {coins.toLocaleString('en-US')}
            </span>
            <span className="text-[10px] text-yellow-400 font-black shrink-0">د.ع</span>
          </div>
        </div>

        {/* Center Section: Level & XP Display */}
        <div className="flex items-center justify-center gap-2 flex-1 min-w-0 h-8 px-1">
          <div className="flex items-center gap-1.5 bg-slate-800/95 px-2 py-1 rounded-lg border border-indigo-500/40 shadow-inner h-8 shrink-0">
            <span className="text-[11px] font-black text-indigo-300 shrink-0">مستوى {playerData.level}</span>
            <div className="w-14 sm:w-20 h-2 bg-slate-700/80 rounded-full overflow-hidden relative shrink-0">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-300 rounded-full"
                style={{ width: `${Math.min(100, Math.max(0, (playerData.xp / Math.max(1, playerData.xpToNextLevel)) * 100))}%` }}
              />
            </div>
            <span className="text-[10px] text-cyan-300 font-mono font-bold shrink-0">
              {playerData.xp}/{playerData.xpToNextLevel} XP
            </span>
          </div>
        </div>

        {/* Left Section: Pause Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            id="btn-pause-game"
            onClick={handlePauseClick}
            className="pointer-events-auto bg-slate-800 hover:bg-slate-700 active:scale-95 text-white p-1.5 rounded-lg border border-slate-600 shadow-sm transition-all flex items-center justify-center"
            title="إيقاف مؤقت"
          >
            <Pause className="w-3.5 h-3.5 text-slate-200" />
          </button>
        </div>
      </div>

      {/* Left Side: Prominent Active Power-Ups Countdown Timers */}
      {activePowerUps.length > 0 && (
        <div className="absolute top-16 left-3 pointer-events-auto flex flex-col gap-2 max-w-[190px]">
          {activePowerUps.map((power) => {
            const colors = getPowerUpColor(power.type);
            const remainingSecs = Math.max(0, power.remainingTime);
            const totalDuration = Math.max(power.duration || 1, remainingSecs);
            const percent = Math.min(100, Math.max(0, (remainingSecs / totalDuration) * 100));

            return (
              <div
                key={power.type}
                className={`bg-slate-950/90 backdrop-blur-md border ${colors.border} p-2 rounded-xl shadow-xl transition-all animate-in fade-in slide-in-from-left-2`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5">
                    {getPowerUpIcon(power.type)}
                    <span className="text-[11px] font-bold text-white leading-tight">
                      {getPowerUpLabel(power.type)}
                    </span>
                  </div>
                  {/* Countdown Timer Display */}
                  <span className={`font-mono font-black text-xs ${colors.text}`}>
                    {remainingSecs.toFixed(1)}ث
                  </span>
                </div>

                {/* Remaining Duration Progress Bar */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${colors.bg} rounded-full transition-all duration-100 ease-linear`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Right Side: Weather Indicator - Symbol ONLY, auto-disappears after 3s without text or seconds countdown */}
      {showSideWeather && (
        <div className="absolute top-16 right-3 pointer-events-none flex items-center justify-center animate-in fade-in zoom-in-75 duration-300">
          <div className="w-12 h-12 rounded-2xl bg-slate-950/90 border border-amber-400/40 shadow-[0_0_20px_rgba(251,191,36,0.35)] backdrop-blur-md flex items-center justify-center text-2xl select-none">
            {WEATHER_SYMBOLS[weather] || '☀️'}
          </div>
        </div>
      )}

      {/* Bottom Floating Governorate Toast Notification (Appears for 5s then disappears gracefully) */}
      {showGovernorate && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 pointer-events-none z-30 flex items-center gap-2.5 bg-slate-950/95 border-2 border-amber-400/80 px-5 py-2.5 rounded-2xl shadow-[0_0_25px_rgba(251,191,36,0.35)] backdrop-blur-md animate-in fade-in slide-in-from-bottom-5 duration-300">
          <span className="text-xl">📍</span>
          <div className="flex flex-col text-right">
            <span className="text-[10px] text-amber-400 font-bold leading-tight">المحافظة الحالية</span>
            <span className="text-sm font-black text-white tracking-wide">{BIOME_NAMES[biome] || 'بغداد'}</span>
          </div>
        </div>
      )}

      {/* Empty bottom spacer */}
      <div className="h-1" />
    </div>
  );
};
