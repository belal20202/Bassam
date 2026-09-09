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
  BAGHDAD: 'محافظة بغداد 🇮🇶',
  BASRA: 'محافظة البصرة 🇮🇶',
  NINEVEH: 'محافظة نينوى 🇮🇶',
  ERBIL: 'محافظة أربيل 🇮🇶',
  SULAYMANIYAH: 'محافظة السليمانية 🇮🇶',
  DUHOK: 'محافظة دهوك 🇮🇶',
  KIRKUK: 'محافظة كركوك 🇮🇶',
  BABYLON: 'محافظة بابل 🇮🇶',
  KARBALA: 'محافظة كربلاء 🇮🇶',
  NAJAF: 'محافظة النجف 🇮🇶',
  ANBAR: 'محافظة الأنبار 🇮🇶',
  DIYALA: 'محافظة ديالى 🇮🇶',
  SALADIN: 'محافظة صلاح الدين 🇮🇶',
  WASIT: 'محافظة واسط 🇮🇶',
  MAYSAN: 'محافظة ميسان 🇮🇶',
  DHI_QAR: 'محافظة ذي قار 🇮🇶',
  MUTHANNA: 'محافظة المثنى 🇮🇶',
  QADISIYYAH: 'محافظة القادسية 🇮🇶',
};

const WEATHER_INFO: Record<WeatherType, { name: string; alertText: string; icon: string; color: string; border: string }> = {
  SUNNY_MORNING: { name: 'صباح بغدادي مشمس', alertText: 'أجواء مشمسة صافية ورؤية مثالية', icon: '☀️', color: 'text-amber-300', border: 'border-amber-500/40' },
  NOON_BRIGHT: { name: 'شمس الظهيرة الساطعة', alertText: 'حرارة معتدلة وطريق مفتوح', icon: '☀️', color: 'text-yellow-300', border: 'border-yellow-500/40' },
  GOLDEN_SUNSET: { name: 'غروب دجلة والفرات الذهبي', alertText: 'إضاءة ذهبية ساحرة على الجسور', icon: '🌅', color: 'text-orange-400', border: 'border-orange-500/40' },
  LIGHT_RAIN_MIST: { name: 'رذاذ دجلة وضباب منعش', alertText: 'رذاذ منعش يبلل الأسفلت', icon: '🌧️', color: 'text-blue-300', border: 'border-blue-500/40' },
  BAGHDAD_STORM: { name: 'أمطار ورعد ولمعان البرق', alertText: 'أمطار قوية ولمعان برق خفيف', icon: '⛈️', color: 'text-indigo-300', border: 'border-indigo-500/40' },
  BAGHDAD_DUST_STORM: { name: 'موجة غبار وعاصفة ترابية', alertText: 'تنبيه: موجة تراب نشطة، انتبه للعوائق!', icon: '🌪️', color: 'text-amber-400', border: 'border-amber-500/60' },
  KARRADA_NIGHT: { name: 'ليل الكرادة وأنوار النيون', alertText: 'ليالٍ بغدادية متوهجة بأنوار النيون', icon: '🌙', color: 'text-purple-300', border: 'border-purple-500/40' },
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
  const prevWeatherRef = useRef<WeatherType>(weather);
  const weatherTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (prevWeatherRef.current !== weather) {
      prevWeatherRef.current = weather;
      setShowSideWeather(true);
      if (weatherTimerRef.current) clearTimeout(weatherTimerRef.current);
      // Auto-hide side weather notification after exactly 3 seconds as requested
      weatherTimerRef.current = setTimeout(() => {
        setShowSideWeather(false);
      }, 3000);
    }
  }, [weather]);

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

  const weatherData = WEATHER_INFO[weather] || WEATHER_INFO.SUNNY_MORNING;

  return (
    <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between p-2.5 sm:p-3 select-none">
      {/* Top Single Horizontal Navigation and Stats Bar - Kept clean and unobstructed */}
      <div className="w-full flex items-center justify-between gap-2 bg-slate-900/90 backdrop-blur-md border border-slate-700/80 px-3 py-1.5 rounded-xl shadow-lg">
        {/* Right Section: Distance & Currency Balance */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Distance */}
          <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700/60">
            <span className="text-xs text-amber-400">🏃</span>
            <span className="text-xs font-bold text-white font-mono">{Math.round(distance)}</span>
            <span className="text-[10px] text-slate-300 font-semibold">م</span>
          </div>

          {/* Dinars Currency */}
          <div className="flex items-center gap-1 bg-slate-800/90 px-2 py-0.5 rounded-lg border border-slate-700/60">
            <span className="text-xs">💰</span>
            <span className="text-xs font-bold text-yellow-300 font-mono">{coins.toLocaleString('en-US')}</span>
            <span className="text-[10px] text-yellow-400 font-semibold">د.ع</span>
          </div>
        </div>

        {/* Center Section: Current Iraqi Governorate */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1 bg-amber-500/20 border border-amber-400/40 px-3 py-1 rounded-lg text-xs font-bold text-amber-300 whitespace-nowrap shadow-sm">
            <span>📍</span>
            <span>{BIOME_NAMES[biome] || 'محافظة بغداد 🇮🇶'}</span>
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

      {/* Right Side: Weather Notification Alert (Auto-disappears after 3 seconds) */}
      <div className="absolute top-16 right-3 pointer-events-auto flex flex-col items-end gap-1 max-w-[220px]">
        {showSideWeather ? (
          <div className={`flex items-start gap-2 bg-slate-950/95 border ${weatherData.border} shadow-2xl backdrop-blur-md p-2.5 rounded-xl transition-all duration-300 animate-in fade-in slide-in-from-right-3`}>
            <span className="text-xl shrink-0 mt-0.5">{weatherData.icon}</span>
            <div className="flex flex-col text-right">
              <div className="flex items-center justify-between gap-2">
                <span className={`text-[11px] font-black ${weatherData.color}`}>
                  {weatherData.name}
                </span>
                <span className="text-[9px] font-mono text-slate-400 bg-slate-800 px-1 rounded">3ث</span>
              </div>
              <p className="text-[10px] text-slate-300 mt-0.5 leading-snug">
                {weatherData.alertText}
              </p>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSideWeather(true)}
            className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/70 shadow-md backdrop-blur-sm text-sm transition-transform active:scale-95"
            title="عرض حالة الطقس"
          >
            <span>{weatherData.icon}</span>
          </button>
        )}
      </div>

      {/* Empty bottom spacer */}
      <div className="h-1" />
    </div>
  );
};
