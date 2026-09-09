/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Play, RotateCcw, Home, Volume2, VolumeX } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface PauseModalProps {
  onResume: () => void;
  onRestart: () => void;
  onHome: () => void;
  musicVolume: number;
  sfxVolume: number;
  onToggleSound: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  onResume,
  onRestart,
  onHome,
  musicVolume,
  sfxVolume,
  onToggleSound,
}) => {
  const isMuted = musicVolume === 0 && sfxVolume === 0;

  return (
    <div id="pause-modal" className="fixed inset-0 z-30 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-xs sm:max-w-sm rounded-2xl shadow-2xl overflow-hidden p-4 sm:p-5 flex flex-col items-center text-center">
        <h2 className="text-lg font-bold text-white mb-4">اللعبة متوقفة مؤقتاً</h2>

        {/* Buttons List */}
        <div className="w-full space-y-2">
          <button
            onClick={() => {
              audioManager.playButtonClick();
              onResume();
            }}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-sm active:scale-95 transition-all"
          >
            <Play className="w-4 h-4 fill-slate-950" />
            <span>متابعة الركض</span>
          </button>

          <button
            onClick={() => {
              audioManager.playButtonClick();
              onRestart();
            }}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl font-bold text-xs border border-slate-700 active:scale-95 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة من البداية</span>
          </button>

          <button
            onClick={() => {
              audioManager.playButtonClick();
              onHome();
            }}
            className="w-full flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl font-bold text-xs border border-slate-700 active:scale-95 transition-all"
          >
            <Home className="w-3.5 h-3.5" />
            <span>القائمة الرئيسية</span>
          </button>

          <button
            onClick={() => {
              audioManager.playButtonClick();
              onToggleSound();
            }}
            className="w-full flex items-center justify-center gap-1.5 bg-slate-950/60 hover:bg-slate-950 text-slate-300 py-1.5 rounded-xl font-medium text-[11px] border border-slate-800 transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
            <span>{isMuted ? 'إلغاء كتم الصوت' : 'كتم الصوت'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
