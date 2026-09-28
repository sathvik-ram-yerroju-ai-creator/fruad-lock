'use client';

import React from 'react';
import { Settings, Globe, Users, Shield, Lock, Trash2, ExternalLink } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SupportedLocale } from '@/types/scam';

interface SettingsViewProps {
  onOpenPrivacyCenter: () => void;
  onOpenProtectionCenter: () => void;
  isFamilyMode: boolean;
  onToggleFamilyMode: () => void;
}

export function SettingsView({
  onOpenPrivacyCenter,
  onOpenProtectionCenter,
  isFamilyMode,
  onToggleFamilyMode,
}: SettingsViewProps) {
  const { locale, setLocale, languages, t } = useTranslation();

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          <span>{t.nav.settings}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Manage language, privacy retention, and accessibility preferences.
        </p>
      </div>

      {/* Language Preferences */}
      <div className="p-4 rounded-2xl border border-cyan-500/20 bg-[#0F1A30] space-y-3 shadow-md">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
          <Globe className="w-4 h-4" />
          <span>Select Application Language (14+ Indic & Global):</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLocale(lang.code as SupportedLocale)}
              className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                locale === lang.code
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
              }`}
            >
              <div className="font-semibold">{lang.nativeName}</div>
              <div className="text-[10px] text-slate-400 font-mono">{lang.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Family Mode Toggle */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-[#0F1A30]/80 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-950 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-100 block">
              {t.family.bannerTitle}
            </span>
            <span className="text-[11px] text-slate-400 block mt-0.5">
              Simplified interface with extra large buttons for seniors and children.
            </span>
          </div>
        </div>

        <button
          onClick={onToggleFamilyMode}
          className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
            isFamilyMode ? 'bg-amber-500' : 'bg-slate-800'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
              isFamilyMode ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Centers Navigation */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={onOpenPrivacyCenter}
          className="p-4 rounded-2xl border border-slate-800 bg-[#0F1A30]/80 hover:border-cyan-500/40 text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-200 block group-hover:text-cyan-300">
                {t.privacyCenter.title}
              </span>
              <span className="text-[10px] text-slate-400">
                Retention settings & zero telemetry
              </span>
            </div>
          </div>
          <span className="text-slate-600 group-hover:text-cyan-400">→</span>
        </button>

        <button
          onClick={onOpenProtectionCenter}
          className="p-4 rounded-2xl border border-slate-800 bg-[#0F1A30]/80 hover:border-cyan-500/40 text-left transition-colors flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-slate-200 block group-hover:text-cyan-300">
                {t.protectionCenter.title}
              </span>
              <span className="text-[10px] text-slate-400">
                Device hardware capability matrix
              </span>
            </div>
          </div>
          <span className="text-slate-600 group-hover:text-cyan-400">→</span>
        </button>
      </div>

      {/* Brand & Version Info */}
      <div className="text-center pt-6 space-y-1 text-xs text-slate-500 font-mono">
        <p className="font-bold text-slate-400">{t.brand} v1.0.0 (Production Release)</p>
        <p>{t.tagline}</p>
        <p className="text-[10px] text-slate-600 max-w-sm mx-auto pt-1">{t.legalNotice}</p>
      </div>
    </div>
  );
}
