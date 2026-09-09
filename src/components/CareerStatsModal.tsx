/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { PlayerData, BiomeType } from '../types';
import { X, TrendingUp, BarChart3 } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface CareerStatsModalProps {
  playerData: PlayerData;
  onClose: () => void;
}

const BIOME_NAMES: Record<BiomeType, { title: string; district: string; color: string }> = {
  KARKH_MANSOUR: { title: 'حي المنصور', district: 'الكرخ', color: 'from-amber-500 to-yellow-400' },
  KARKH_KADHIMIYA: { title: 'الكاظمية والأسواق التراثية', district: 'الكرخ', color: 'from-emerald-500 to-teal-400' },
  KARKH_YARMOUK_DORA: { title: 'اليرموك والدورة', district: 'الكرخ', color: 'from-orange-500 to-amber-600' },
  KARKH_JADRIYA_BRIDGE: { title: 'جسر الجادرية ونهر دجلة', district: 'الكرخ', color: 'from-blue-500 to-cyan-400' },
  RUSAFA_MUTANABBI_QISHLA: { title: 'شارع المتنبي وبرج القشلة', district: 'الرصافة', color: 'from-amber-600 to-yellow-600' },
  RUSAFA_RASHEED_TAHRIR: { title: 'شارع الرشيد وساحة التحرير', district: 'الرصافة', color: 'from-red-500 to-rose-400' },
  RUSAFA_KARRADA_NIGHT: { title: 'الكرادة الشرقية', district: 'الرصافة', color: 'from-purple-500 to-indigo-400' },
  RUSAFA_ADHAMIYA_RIVER: { title: 'الأعظمية وكورنيش دجلة', district: 'الرصافة', color: 'from-sky-500 to-blue-600' },
  RUSAFA_PALESTINE_ZAYOUNA: { title: 'شارع فلسطين وزيونة', district: 'الرصافة', color: 'from-emerald-600 to-green-500' },
  KARKH_AMIRIYAH_KHADRAA: { title: 'العامرية وحي الخضراء', district: 'الكرخ', color: 'from-lime-500 to-emerald-400' },
  RUSAFA_SALIHIYA_SINAK: { title: 'الصالحية وجسر السنك', district: 'الرصافة', color: 'from-teal-500 to-cyan-400' },
  KARKH_SAYDIYA_BAYAA: { title: 'السيدية والبياع', district: 'الكرخ', color: 'from-yellow-500 to-amber-600' },
  KARKH_GHAZALIYA_SHUULA: { title: 'الغزالية والشعلة', district: 'الكرخ', color: 'from-purple-600 to-pink-500' },
  RUSAFA_BAB_SHARQI_SAADOUN: { title: 'الباب الشرقي والسعدون', district: 'الرصافة', color: 'from-rose-500 to-red-600' },
  RUSAFA_ZAAFARANIYA_DIYALA: { title: 'الزعفرانية ونهر ديالى', district: 'الرصافة', color: 'from-emerald-500 to-teal-600' },
  KARKH_HAI_ALJAMIA: { title: 'حي الجامعة', district: 'الكرخ', color: 'from-cyan-500 to-blue-500' },
};

export const CareerStatsModal: React.FC<CareerStatsModalProps> = ({ playerData, onClose }) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'HISTORY' | 'BIOMES'>('OVERVIEW');

  // Prepare Biomes data sorted by visits
  const biomeVisitsList = Object.entries(playerData.biomeVisits || {}).map(([key, count]) => {
    const biomeKey = key as BiomeType;
    const info = BIOME_NAMES[biomeKey] || { title: key, district: 'بغداد', color: 'from-slate-500 to-slate-400' };
    const numCount = typeof count === 'number' ? count : 0;
    return {
      key: biomeKey,
      title: info.title,
      district: info.district,
      color: info.color,
      count: numCount,
    };
  }).sort((a, b) => b.count - a.count);

  const totalBiomeVisits = biomeVisitsList.reduce((acc, b) => acc + b.count, 0) || 1;
  const topBiome = biomeVisitsList[0];

  // Career Runs History
  const history = playerData.careerHistory || [];
  const maxDistanceInHistory = Math.max(...history.map((h) => h.distance), 100);

  return (
    <div id="career-stats-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">سجل الإحصائيات</h2>
              <p className="text-[11px] text-slate-400">تطور أدائك ومناطق بغداد الأكثر زيارة</p>
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

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 gap-1 p-2 bg-slate-950/60 border-b border-slate-800 text-center">
          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveTab('OVERVIEW');
            }}
            className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'OVERVIEW'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            الملخص
          </button>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveTab('HISTORY');
            }}
            className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            مخطط الجولات
          </button>
          <button
            onClick={() => {
              audioManager.playButtonClick();
              setActiveTab('BIOMES');
            }}
            className={`py-1.5 rounded-lg font-bold text-xs transition-all ${
              activeTab === 'BIOMES'
                ? 'bg-amber-500 text-slate-950 font-black shadow-sm'
                : 'bg-slate-800/80 text-slate-400 hover:text-white'
            }`}
          >
            المناطق
          </button>
        </div>

        {/* Content Body */}
        <div className="p-3 sm:p-4 overflow-y-auto flex-1 space-y-3 custom-scrollbar">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-3">
              {/* Primary Key Metrics Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium">إجمالي المسافة</span>
                  <span className="text-base font-black text-amber-400 font-mono mt-0.5">
                    {(playerData.totalDistance || 0).toLocaleString('en-US')} م
                  </span>
                </div>

                <div className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium">الدنانير</span>
                  <span className="text-base font-black text-yellow-300 font-mono mt-0.5">
                    {(playerData.totalCoinsCollected || 0).toLocaleString('en-US')}
                  </span>
                </div>

                <div className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium">القفزات</span>
                  <span className="text-base font-black text-blue-400 font-mono mt-0.5">
                    {(playerData.totalJumps || 0).toLocaleString('en-US')}
                  </span>
                </div>

                <div className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl flex flex-col">
                  <span className="text-[10px] text-slate-400 font-medium">المراوغات</span>
                  <span className="text-base font-black text-emerald-400 font-mono mt-0.5">
                    {((playerData.totalSlides || 0) + (playerData.totalObstaclesAvoided || 0)).toLocaleString('en-US')}
                  </span>
                </div>
              </div>

              {/* Secondary Highlights */}
              <div className="bg-slate-800/60 border border-slate-700/60 p-3 rounded-xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 text-base">
                    🏛️
                  </div>
                  <div>
                    <span className="text-[10px] text-amber-300/80 font-bold block">المنطقة الأكثر زيارة</span>
                    <span className="text-xs font-bold text-white">
                      {topBiome?.title || 'حي المنصور'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-center">
                  <div className="bg-slate-900/80 border border-slate-700 px-2 py-1 rounded-lg text-[10px]">
                    <span className="text-slate-400 block">الجولات:</span>
                    <strong className="text-white font-mono">{playerData.totalRuns}</strong>
                  </div>
                  <div className="bg-slate-900/80 border border-slate-700 px-2 py-1 rounded-lg text-[10px]">
                    <span className="text-slate-400 block">المستوى:</span>
                    <strong className="text-amber-400 font-mono">{playerData.level}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORY GRAPH */}
          {activeTab === 'HISTORY' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">المسافات في آخر 20 جولة</h3>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                  <BarChart3 className="w-3 h-3" />
                  <span>الأعلى: {playerData.highScoreDistance.toLocaleString('en-US')} م</span>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="bg-slate-800/40 border border-dashed border-slate-700 rounded-xl p-6 text-center text-xs text-slate-400">
                  لا توجد جولات مسجلة بعد. ابدأ جولة جديدة وسيتم رسم تطورك هنا!
                </div>
              ) : (
                <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 sm:p-4">
                  {/* Visual Bar Chart */}
                  <div className="h-32 sm:h-40 flex items-end gap-1 pt-4 pb-1 px-1 border-b border-slate-800">
                    {history.map((run, idx) => {
                      const heightPercent = Math.max(Math.min((run.distance / (maxDistanceInHistory || 1)) * 100, 100), 8);
                      const isBest = run.distance === playerData.highScoreDistance && playerData.highScoreDistance > 0;
                      return (
                        <div key={run.id || idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          <div
                            className={`w-full rounded-t transition-all ${
                              isBest
                                ? 'bg-gradient-to-t from-amber-600 to-yellow-300'
                                : 'bg-gradient-to-t from-blue-700 to-cyan-400'
                            }`}
                            style={{ height: `${heightPercent}%` }}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: BIOMES VISITS */}
          {activeTab === 'BIOMES' && (
            <div className="space-y-2">
              {biomeVisitsList.map((biome) => {
                const percentage = Math.round((biome.count / totalBiomeVisits) * 100) || 0;
                return (
                  <div
                    key={biome.key}
                    className="bg-slate-800/70 border border-slate-700/60 p-2.5 rounded-xl flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${biome.color}`} />
                        <span className="font-bold text-white text-[11px]">{biome.title}</span>
                      </div>
                      <span className="text-[11px] font-bold text-amber-400 font-mono">{biome.count.toLocaleString('en-US')} مرة</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1 bg-slate-950 rounded-full overflow-hidden">
                      <div
                        className={`h-full bg-gradient-to-r ${biome.color} rounded-full`}
                        style={{ width: `${Math.max(percentage, 3)}%` }}
                      />
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
