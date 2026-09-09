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
  EGYPT_CAIRO: 'مصر - القاهرة 🇪🇬',
  UAE_DUBAI: 'الإمارات - دبي 🇦🇪',
  SAUDI_RIYADH: 'السعودية - الرياض 🇸🇦',
  MOROCCO_MARRAKESH: 'المغرب - مراكش 🇲🇦',
  QATAR_DOHA: 'قطر - الدوحة 🇶🇦',
  JORDAN_AMMAN: 'الأردن - عمّان 🇯🇴',
  LEBANON_BEIRUT: 'لبنان - بيروت 🇱🇧',
  IRAQ_BAGHDAD: 'العراق - بغداد 🇮🇶',
  KUWAIT_CITY: 'الكويت - العاصمة 🇰🇼',
  OMAN_MUSCAT: 'عُمان - مسقط 🇴🇲',
  ALGERIA_ALGIERS: 'الجزائر - العاصمة 🇩🇿',
  TUNISIA_TUNIS: 'تونس - الخضراء 🇹🇳',
  JAPAN_TOKYO: 'اليابان - طوكيو 🇯🇵',
  FRANCE_PARIS: 'فرنسا - باريس 🇫🇷',
  UK_LONDON: 'بريطانيا - لندن 🇬🇧',
  USA_NEWYORK: 'أمريكا - نيويورك 🇺🇸',
  BRAZIL_RIO: 'البرازيل - ريو 🇧🇷',
  SPAIN_MADRID: 'إسبانيا - مدريد 🇪🇸',
  ITALY_ROME: 'إيطاليا - روما 🇮🇹',
  GERMANY_BERLIN: 'ألمانيا - برلين 🇩🇪',
};

const WEATHER_INFO: Record<WeatherType, { name: string; icon: string; color: string }> = {
  SUNNY_MORNING: { name: 'صباح مشمس منعش', icon: '☀️', color: 'text-amber-300' },
  NOON_BRIGHT: { name: 'شمس الظهيرة المشرقة', icon: '☀️', color: 'text-yellow-300' },
  GOLDEN_SUNSET: { name: 'شفق الغروب الذهبي', icon: '🌅', color: 'text-orange-400' },
  LIGHT_RAIN_MIST: { name: 'رذاذ وضباب خفيف', icon: '🌧️', color: 'text-blue-300' },
  BAGHDAD_STORM: { name: 'أمطار رعدية معتدلة', icon: '⛈️', color: 'text-indigo-300' },
  BAGHDAD_DUST_STORM: { name: 'نسيم الصحراء الدافئ', icon: '🌪️', color: 'text-amber-400' },
  KARRADA_NIGHT: { name: 'أنوار النيون الليلية', icon: '🌙', color: 'text-purple-300' },
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
      weatherTimerRef.current = setTimeout(() => {
        setShowSideWeather(false);
      }, 5000);
    }
  }, [weather]);

  const handlePauseClick = () => {
    audioManager.playButtonClick();
    onPause();
  };

  const getPowerUpIcon = (type: string) => {
    switch (type) {
      case 'MAGNET': return <Magnet className="w-3.5 h-3.5 text-yellow-400" />;
      case 'SHIELD': return <Shield className="w-3.5 h-3.5 text-cyan-400" />;
      case 'TURBO_SPEED': return <Zap className="w-3.5 h-3.5 text-red-400 animate-pulse" />;
      case 'SUPER_JUMP': return <ArrowUpCircle className="w-3.5 h-3.5 text-emerald-400" />;
      case 'TIME_SLOW': return <Clock className="w-3.5 h-3.5 text-indigo-400" />;
      default: return <Sparkles className="w-3.5 h-3.5 text-amber-400" />;
    }
  };

  const getPowerUpLabel = (type: string) => {
    switch (type) {
      case 'MAGNET': return 'مغناطيس';
      case 'SHIELD': return 'درع';
      case 'TURBO_SPEED': return 'سرعة';
      case 'SUPER_JUMP': return 'قفزة';
      case 'TIME_SLOW': return 'إبطاء';
      default: return 'مضاعف';
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

        {/* Center Section: Country / World City & Active Power-Ups */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {/* Current Country / City */}
          <div className="flex items-center gap-1 bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 rounded-lg text-[11px] font-bold text-amber-300 whitespace-nowrap shrink-0">
            <span>📍</span>
            <span>{BIOME_NAMES[biome] || 'العالم العربي'}</span>
          </div>

          {/* Active Power-ups */}
          {activePowerUps.map((power) => (
            <div
              key={power.type}
              className="flex items-center gap-1 bg-slate-800/90 border border-slate-600 px-1.5 py-0.5 rounded-lg text-[10px] font-bold text-slate-200 shrink-0"
            >
              {getPowerUpIcon(power.type)}
              <span className="hidden sm:inline">{getPowerUpLabel(power.type)}</span>
              <span className="font-mono text-amber-300">{Math.ceil(power.remainingTime)}ث</span>
            </div>
          ))}
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

      {/* Side Weather Notification - Positioned laterally so top stats text is never obstructed */}
      <div className="absolute top-16 right-3 pointer-events-auto flex flex-col items-end gap-1">
        {showSideWeather ? (
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-700/80 shadow-xl backdrop-blur-md px-3 py-1.5 rounded-xl transition-all duration-300 animate-in fade-in slide-in-from-right-3">
            <span className="text-base">{weatherData.icon}</span>
            <div className="flex flex-col text-right">
              <span className="text-[9px] text-slate-400 font-bold">الطقس الحالي</span>
              <span className={`text-[11px] font-bold ${weatherData.color}`}>
                {weatherData.name}
              </span>
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
