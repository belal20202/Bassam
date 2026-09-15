/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { GameSettings } from '../types';
import { X, Settings, Volume2, Music, Monitor, Smartphone, RefreshCw, Info } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface SettingsModalProps {
  settings: GameSettings;
  onClose: () => void;
  onUpdateSettings: (newSettings: Partial<GameSettings>) => void;
  onResetProgress: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onClose,
  onUpdateSettings,
  onResetProgress,
}) => {
  const handleMusicChange = (val: number) => {
    onUpdateSettings({ musicVolume: val });
    audioManager.setVolumes(val, settings.sfxVolume);
  };

  const handleSfxChange = (val: number) => {
    onUpdateSettings({ sfxVolume: val });
    audioManager.setVolumes(settings.musicVolume, val);
    audioManager.playButtonClick();
  };

  const handleReset = () => {
    if (window.confirm('هل أنت متأكد من إعادة ضبط تقدم بسام والبدء من الصفر؟')) {
      onResetProgress();
    }
  };

  return (
    <div id="settings-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">إعدادات اللعبة</h2>
              <p className="text-[11px] text-slate-400">تخصيص الصوت والرسوميات والأداء</p>
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

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 flex-1 text-right custom-scrollbar">
          {/* Audio Section */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5" />
              <span>الصوت والموسيقى</span>
            </h3>

            {/* Music */}
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-200 font-semibold">
                <Music className="w-3.5 h-3.5 text-slate-400" />
                <span>موسيقى الركض</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.musicVolume}
                onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
                className="w-28 accent-amber-500 cursor-pointer"
              />
            </div>

            {/* SFX */}
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-200 font-semibold">
                <Volume2 className="w-3.5 h-3.5 text-slate-400" />
                <span>المؤثرات الصوتية</span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={settings.sfxVolume}
                onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                className="w-28 accent-amber-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Graphics Quality */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
              <Monitor className="w-3.5 h-3.5" />
              <span>جودة الرسوميات (محسنة لأجهزة أندرويد الحديثة والمتوسطة)</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              {(['MEDIUM', 'ULTRA'] as const).map((q) => (
                <button
                  key={q}
                  onClick={() => {
                    audioManager.playButtonClick();
                    onUpdateSettings({ graphicsQuality: q });
                  }}
                  className={`py-2 rounded-xl font-bold text-xs transition-all ${
                    settings.graphicsQuality === q
                      ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-800 text-slate-400 hover:text-white border border-slate-700'
                  }`}
                >
                  {q === 'ULTRA' ? 'فائقة (60 FPS - أندرويد متطور)' : 'متوسطة (سلسة ومتوازنة)'}
                </button>
              ))}
            </div>
          </div>

          {/* Gameplay Dynamics */}
          <div className="space-y-2">
            <h3 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5" />
              <span>تجربة اللعب والتحكم</span>
            </h3>

            {/* Inverted Controls Toggle */}
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-200 font-medium block">عكس حركة اللاعب (سحب يسار للذهاب يميناً)</span>
                <span className="text-[10px] text-amber-400">مفعّل لتحدي وتحكم ديناميكي أسهل</span>
              </div>
              <button
                onClick={() => {
                  audioManager.playButtonClick();
                  onUpdateSettings({ invertControls: !(settings.invertControls ?? true) });
                }}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  (settings.invertControls ?? true) ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    (settings.invertControls ?? true) ? 'translate-x-0' : '-translate-x-5'
                  }`}
                />
              </button>
            </div>

            {/* Camera Shake */}
            <div className="bg-slate-800/60 p-2.5 rounded-xl border border-slate-700/60 flex items-center justify-between">
              <span className="text-xs text-slate-200 font-medium">اهتزاز الكاميرا الواقعي</span>
              <button
                onClick={() => {
                  audioManager.playButtonClick();
                  onUpdateSettings({ cameraShake: !settings.cameraShake });
                }}
                className={`w-10 h-5 rounded-full transition-colors relative p-0.5 ${
                  settings.cameraShake ? 'bg-amber-500' : 'bg-slate-700'
                }`}
              >
                <div
                  className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    settings.cameraShake ? 'translate-x-0' : '-translate-x-5'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Game Info & Developer Card */}
          <div className="bg-slate-950/75 p-3.5 rounded-xl border border-amber-500/20 text-[11px] text-slate-300 space-y-2">
            <div className="flex items-center justify-between font-bold text-amber-300">
              <div className="flex items-center gap-1.5">
                <Info className="w-4 h-4 text-amber-400" />
                <span className="text-xs">معلومات اللعبة والمطور</span>
              </div>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-md font-mono font-bold">
                v2.0
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div>اسم اللعبة: <strong className="text-white font-bold">Bassam</strong></div>
              <div>المطور والمصمم: <strong className="text-amber-400 font-bold">بلال النعيمي</strong></div>
              <div>رقم الإصدار: <strong className="text-slate-200 font-mono">2.0</strong></div>
              <div>دعم الأجهزة: <strong className="text-emerald-400">أندرويد متطور ومتوسط</strong></div>
              <div>المحافظات: <strong className="text-slate-200">18 محافظة عراقية (كل 1500م)</strong></div>
              <div>العملة: <strong className="text-yellow-300 font-bold">1 عملة = 250 د.ع</strong></div>
            </div>
          </div>

          {/* Danger Zone: Reset */}
          <div className="pt-1">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-1.5 bg-red-950/30 hover:bg-red-900/40 text-red-400 border border-red-800/50 py-2 rounded-xl font-bold text-[11px] transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>إعادة ضبط تقدم اللعبة بالكامل</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
