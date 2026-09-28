'use client';

import React, { useState } from 'react';
import { Globe, Shield, Sparkles, ExternalLink, AlertTriangle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { inspectUrlSafely } from '@/lib/scanners/linkGuard';
import { AnalysisResult } from '@/types/scam';
import { saveAnalysisRecord } from '@/lib/supabase';

interface LinkGuardViewProps {
  onResult: (result: AnalysisResult, rawContent: string, scanType: string) => void;
  initialUrl?: string;
}

export function LinkGuardView({ onResult, initialUrl = '' }: LinkGuardViewProps) {
  const { t, locale } = useTranslation();
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [isScanning, setIsScanning] = useState(false);

  const handleScan = async () => {
    if (!urlInput.trim()) return;
    setIsScanning(true);

    try {
      const inspectRes = inspectUrlSafely(urlInput, locale);
      await saveAnalysisRecord(inspectRes.analysis, 'link', urlInput);
      onResult(inspectRes.analysis, urlInput, 'link');
    } catch (e) {
      console.error('Link guard inspection failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const loadSample = (sampleUrl: string) => {
    setUrlInput(sampleUrl);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <span>{t.scanners.linkTitle}</span>
        </h2>
        <p className="text-xs text-slate-400">
          {t.scanners.linkSubtitle}
        </p>
      </div>

      {/* Security Warning Notice */}
      <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs text-cyan-300 flex items-start gap-2">
        <Shield className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
        <p className="leading-relaxed">
          {t.scanners.linkWarning}
        </p>
      </div>

      {/* URL Input Box */}
      <div className="space-y-1.5">
        <div className="relative rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/90 focus-within:border-cyan-400/60 transition-all p-2 shadow-lg flex items-center gap-2">
          <span className="text-xs font-mono text-slate-500 pl-2">URL:</span>
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={t.scanners.linkPlaceholder}
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono py-1"
          />
        </div>
      </div>

      {/* Quick Test Links */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Test Known Domain Patterns:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => loadSample('https://onlinesbi-kyc-verify-update.xyz/netbanking/login')}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-red-500/40 text-[11px] text-red-300 transition-colors"
          >
            🚨 Spoofed SBI Phishing (.xyz)
          </button>
          <button
            onClick={() => loadSample('https://paypa1-security-verification.live/account')}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-red-500/40 text-[11px] text-red-300 transition-colors"
          >
            🚨 Typosquatting (paypa1.live)
          </button>
          <button
            onClick={() => loadSample('http://192.168.1.105/bank-login.apk')}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 text-[11px] text-amber-300 transition-colors"
          >
            ⚠️ Raw IP + APK Download
          </button>
          <button
            onClick={() => loadSample('https://www.hdfcbank.com/personal')}
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 text-[11px] text-emerald-300 transition-colors"
          >
            ✓ Genuine Bank Official URL
          </button>
        </div>
      </div>

      {/* Inspect Button */}
      <button
        onClick={handleScan}
        disabled={!urlInput.trim() || isScanning}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all flex items-center justify-center gap-2"
      >
        <Shield className="w-4 h-4" />
        <span>{isScanning ? 'Inspecting Domain Security...' : t.scanners.checkLinkButton}</span>
      </button>
    </div>
  );
}
