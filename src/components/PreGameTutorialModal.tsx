/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, Play, Sparkles, Zap, ShieldAlert } from 'lucide-react';
import { audioManager } from '../engine/audio';

interface PreGameTutorialModalProps {
  onStart: () => void;
}

export const PreGameTutorialModal: React.FC<PreGameTutorialModalProps> = ({ onStart }) => {
  const [countdown, setCountdown] = useState<number>(5);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          audioManager.playButtonClick();
          onStart();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onStart]);

  const handleStartNow = () => {
    audioManager.playButtonClick();
    onStart();
  };

  return (
    <div
      id="pre-game-tutorial-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-7 shadow-[0_0_50px_rgba(245,158,11,0.3)] flex flex-col items-center text-center">
        {/* Glow Header */}
        <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-400/40 px-4 py-1 rounded-full text-xs font-black text-amber-300 mb-3 shadow-md">
          <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
          <span>توجيهات التحكم قبل الانطلاق</span>
        </div>

        <h2 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-500 drop-shadow-md mb-4">
          التحكم باللمس أو الكيبورد
        </h2>

        {/* 4 Controls Grid */}
        <div className="grid grid-cols-2 gap-3 w-full mb-5 text-right">
          {/* Left Move */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white">يسار</div>
              <div className="text-[10px] text-slate-400">سحب يساراً أو A</div>
            </div>
          </div>

          {/* Right Move */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shrink-0">
              <ArrowRight className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-white">يمين</div>
              <div className="text-[10px] text-slate-400">سحب يميناً أو D</div>
            </div>
          </div>

          {/* Jump */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
              <ArrowUp className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-emerald-300">قفز</div>
              <div className="text-[10px] text-slate-400">سحب لأعلى أو W</div>
            </div>
          </div>

          {/* Slide */}
          <div className="bg-slate-950/80 border border-slate-800 p-3 rounded-2xl flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sky-400 shrink-0">
              <ArrowDown className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-black text-sky-300">انزلاق</div>
              <div className="text-[10px] text-slate-400">سحب لأسفل أو S</div>
            </div>
          </div>
        </div>

        {/* Launch Button */}
        <button
          id="btn-confirm-tutorial-start"
          onClick={handleStartNow}
          className="w-full group relative flex items-center justify-center gap-3 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 py-3.5 sm:py-4 rounded-2xl font-black text-lg sm:text-xl shadow-[0_0_30px_rgba(245,158,11,0.5)] hover:shadow-[0_0_40px_rgba(245,158,11,0.8)] active:scale-95 transition-all"
        >
          <Play className="w-6 h-6 fill-slate-950 group-hover:scale-110 transition-transform" />
          <span>انطلق الآن ({countdown}ث)</span>
        </button>
      </div>
    </div>
  );
};
