'use client';

import React, { useState, useEffect } from 'react';
import { Lock, ShieldCheck, Trash2, CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { getStoredSettings, saveStoredSettings, purgeAllUserData } from '@/lib/supabase';
import { UserSettings } from '@/types/scam';

export function PrivacyCenterView() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [purged, setPurged] = useState(false);

  useEffect(() => {
    getStoredSettings().then(setSettings);
  }, []);

  const handleUpdateRetention = async (days: 7 | 30 | 90) => {
    if (!settings) return;
    const updated = await saveStoredSettings({ retention_days: days });
    setSettings(updated);
  };

  const handleToggleThreatSharing = async () => {
    if (!settings) return;
    const updated = await saveStoredSettings({
      anonymous_threat_sharing: !settings.anonymous_threat_sharing,
    });
    setSettings(updated);
  };

  const handlePurge = async () => {
    if (confirm(t.vault.purgeConfirm)) {
      await purgeAllUserData();
      setPurged(true);
      setTimeout(() => setPurged(false), 3000);
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
          <Lock className="w-5 h-5 text-cyan-400" />
          <span>{t.privacyCenter.title}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.privacyCenter.subtitle}
        </p>
      </div>

      {/* Privacy Guarantees */}
      <div className="space-y-2.5">
        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F1A30]/80 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Zero Background Surveillance</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pl-6">
            {t.privacyCenter.pledge1}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F1A30]/80 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Ephemeral AI Processing</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pl-6">
            {t.privacyCenter.pledge2}
          </p>
        </div>

        <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0F1A30]/80 space-y-1">
          <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
            <CheckCircle2 className="w-4 h-4 text-cyan-400" />
            <span>Total User Data Sovereignty</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed pl-6">
            {t.privacyCenter.pledge3}
          </p>
        </div>
      </div>

      {/* Retention Controls */}
      <div className="p-4 rounded-2xl border border-cyan-500/20 bg-[#0F1A30] space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span>{t.privacyCenter.retentionSettings}</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { days: 7, label: t.privacyCenter.retention7 },
            { days: 30, label: t.privacyCenter.retention30 },
            { days: 90, label: t.privacyCenter.retention90 },
          ].map((r) => (
            <button
              key={r.days}
              onClick={() => handleUpdateRetention(r.days as 7 | 30 | 90)}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                settings?.retention_days === r.days
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 font-bold shadow-[0_0_12px_rgba(0,240,255,0.2)]'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div className="text-sm font-bold font-mono">{r.days} Days</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{r.label.split(' ')[1]}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Anonymous Threat Sharing Toggle */}
      <div className="p-4 rounded-2xl border border-slate-800 bg-[#0F1A30]/80 flex items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-slate-200 block">
            Contribute Anonymized Threat Indicators
          </span>
          <span className="text-[11px] text-slate-400 block mt-0.5">
            Helps protect fellow citizens by contributing coarse scam categories to the regional threat map. Zero personal details or text are transmitted.
          </span>
        </div>
        <button
          onClick={handleToggleThreatSharing}
          className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${
            settings?.anonymous_threat_sharing ? 'bg-cyan-600' : 'bg-slate-800'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform ${
              settings?.anonymous_threat_sharing ? 'translate-x-6' : 'translate-x-0.5'
            }`}
          />
        </button>
      </div>

      {/* Permanent Purge Button */}
      <div className="pt-2">
        <button
          onClick={handlePurge}
          className="w-full py-3 px-4 rounded-xl bg-red-950/40 border border-red-500/40 hover:bg-red-900/40 text-red-300 font-semibold text-xs flex items-center justify-center gap-2 transition-colors"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
          <span>{purged ? 'All Vault Data Successfully Purged!' : t.vault.purgeAllData}</span>
        </button>
      </div>
    </div>
  );
}
