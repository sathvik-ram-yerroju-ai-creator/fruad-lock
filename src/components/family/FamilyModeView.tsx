'use client';

import React from 'react';
import { Users, PhoneCall, ShieldAlert, ArrowLeft, AlertOctagon, CheckCircle2 } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface FamilyModeViewProps {
  onExitFamilyMode: () => void;
  onOpenMessageScanner: () => void;
}

export function FamilyModeView({ onExitFamilyMode, onOpenMessageScanner }: FamilyModeViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 max-w-xl mx-auto pb-16">
      {/* Top Banner */}
      <div className="p-4 rounded-2xl bg-amber-500/20 border-2 border-amber-400 text-amber-200 flex items-center justify-between shadow-[0_0_25px_rgba(245,158,11,0.3)]">
        <div className="flex items-center gap-2.5">
          <Users className="w-7 h-7 text-amber-300 shrink-0" />
          <div>
            <h2 className="text-lg font-extrabold text-amber-100">{t.family.bannerTitle}</h2>
            <p className="text-xs text-amber-300 font-medium">High contrast, simplified safety mode</p>
          </div>
        </div>
        <button
          onClick={onExitFamilyMode}
          className="px-3 py-1.5 rounded-xl bg-amber-950 border border-amber-400/60 text-amber-200 text-xs font-bold hover:bg-amber-900 transition-colors"
        >
          {t.family.exitFamilyMode}
        </button>
      </div>

      {/* 5 Simple Rules in High Contrast Cards */}
      <div className="space-y-3">
        <div className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
          <AlertOctagon className="w-5 h-5 text-red-400" />
          <span>5 Rules to Protect Yourself:</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-red-500/60 text-base font-bold text-red-100 flex items-center gap-3 shadow-lg">
          <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-mono shrink-0">1</span>
          <span>{t.family.rule1}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-amber-500/60 text-base font-bold text-amber-100 flex items-center gap-3 shadow-lg">
          <span className="w-8 h-8 rounded-full bg-amber-600 text-white flex items-center justify-center font-mono shrink-0">2</span>
          <span>{t.family.rule2}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-red-500/60 text-base font-bold text-red-100 flex items-center gap-3 shadow-lg">
          <span className="w-8 h-8 rounded-full bg-red-600 text-white flex items-center justify-center font-mono shrink-0">3</span>
          <span>{t.family.rule3}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-red-500/80 text-base font-bold text-white flex items-center gap-3 shadow-lg">
          <span className="w-8 h-8 rounded-full bg-red-700 text-white flex items-center justify-center font-mono shrink-0">4</span>
          <span>{t.family.rule4}</span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900 border-2 border-emerald-500/60 text-base font-bold text-emerald-100 flex items-center gap-3 shadow-lg">
          <span className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-mono shrink-0">5</span>
          <span>{t.family.rule5}</span>
        </div>
      </div>

      {/* Big Emergency Action Buttons */}
      <div className="space-y-3 pt-2">
        <a
          href="tel:1930"
          className="w-full py-4 px-5 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all animate-pulse"
        >
          <PhoneCall className="w-6 h-6" />
          <span>{t.family.callCyberPoliceButton}</span>
        </a>

        <button
          onClick={onOpenMessageScanner}
          className="w-full py-4 px-5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-extrabold text-base sm:text-lg flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(0,240,255,0.4)] transition-all"
        >
          <ShieldAlert className="w-6 h-6" />
          <span>Check a Message for Me</span>
        </button>
      </div>
    </div>
  );
}
