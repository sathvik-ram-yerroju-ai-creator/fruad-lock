'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  FileText,
  BookmarkPlus,
  HelpCircle,
  RefreshCw,
  Check,
  AlertOctagon,
  Copy,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { AnalysisResult } from '@/types/scam';
import { useTranslation } from '@/lib/i18n';
import { saveEvidenceItem } from '@/lib/supabase';

interface AnalysisResultViewProps {
  result: AnalysisResult;
  rawInput: string;
  scanType: string;
  onScanAnother: () => void;
  onPrepareReport: (result: AnalysisResult, rawInput: string) => void;
  onAskAssistant: (context: string) => void;
}

export function AnalysisResultView({
  result,
  rawInput,
  scanType,
  onScanAnother,
  onPrepareReport,
  onAskAssistant,
}: AnalysisResultViewProps) {
  const { t } = useTranslation();
  const [isSaved, setIsSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showTechnical, setShowTechnical] = useState(false);

  const riskConfig = {
    HIGH: {
      title: t.result.riskHigh,
      bg: 'bg-red-950/60 border-red-500/60 text-red-200',
      badgeBg: 'bg-red-500/20 text-red-400 border-red-500/40',
      icon: ShieldAlert,
      glow: 'shadow-[0_0_30px_rgba(239,68,68,0.3)]',
    },
    CAUTION: {
      title: t.result.riskCaution,
      bg: 'bg-amber-950/60 border-amber-500/60 text-amber-200',
      badgeBg: 'bg-amber-500/20 text-amber-400 border-amber-500/40',
      icon: AlertTriangle,
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.25)]',
    },
    LOW: {
      title: t.result.riskLow,
      bg: 'bg-emerald-950/60 border-emerald-500/60 text-emerald-200',
      badgeBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      icon: ShieldCheck,
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.25)]',
    },
  }[result.risk_level];

  const handleSaveToVault = async () => {
    try {
      await saveEvidenceItem({
        user_id: 'local-user',
        title: `${result.category} Scan Evidence`,
        category: result.category,
        type: scanType as any,
        content: rawInput,
        raw_indicators: result.technical_indicators,
        ai_analysis: result,
        retention_days: 30,
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error('Failed to save to vault:', e);
    }
  };

  const handleCopySummary = () => {
    const text = `[FRAUD LOCK ADVISORY]\nRisk: ${result.risk_level}\nCategory: ${result.category}\nSummary: ${result.summary}\nVerification: AI risk indicator — not a guarantee.`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const RiskIcon = riskConfig.icon;

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-12">
      {/* Top Risk Header Card */}
      <div
        className={`rounded-2xl border p-4.5 sm:p-5 ${riskConfig.bg} ${riskConfig.glow} backdrop-blur-md transition-all`}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 shrink-0">
              <RiskIcon className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono tracking-wider uppercase opacity-80">
                  {t.result.riskLevel}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${riskConfig.badgeBg}`}
                >
                  {result.confidence} CONFIDENCE
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight mt-0.5">
                {riskConfig.title}
              </h2>
            </div>
          </div>

          <button
            onClick={handleCopySummary}
            className="p-2 rounded-lg bg-black/30 border border-white/10 text-slate-300 hover:text-white transition-colors"
            title="Copy Summary"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        {/* Category & Summary */}
        <div className="mt-4 pt-3.5 border-t border-white/10 space-y-2">
          <div className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
            <span className="opacity-70 font-normal">{t.result.category}:</span>
            <span>{result.category}</span>
          </div>
          <p className="text-sm sm:text-base leading-relaxed text-slate-100 font-medium">
            {result.summary}
          </p>
        </div>
      </div>

      {/* WHAT NOT TO DO (Urgent Red Callout) */}
      {result.do_not_do && result.do_not_do.length > 0 && (
        <div className="rounded-xl border border-red-500/40 bg-red-950/40 p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>{t.result.doNotDo}</span>
          </div>
          <ul className="space-y-1.5 text-xs sm:text-sm text-red-100">
            {result.do_not_do.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-red-400 font-bold shrink-0">✕</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Warning Signals / Why It Was Flagged */}
      {result.warning_signals && result.warning_signals.length > 0 && (
        <div className="rounded-xl border border-cyan-500/20 bg-[#0F1A30]/80 p-4 space-y-2.5">
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
            {t.result.warningSignals}
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-200">
            {result.warning_signals.map((sig, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 font-bold shrink-0">⚠️</span>
                <span>{sig}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommended Safe Next Steps */}
      {result.recommended_actions && result.recommended_actions.length > 0 && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-4 space-y-2.5">
          <div className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            {t.result.recommendedActions}
          </div>
          <ul className="space-y-2 text-xs sm:text-sm text-emerald-100">
            {result.recommended_actions.map((act, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold shrink-0">✓</span>
                <span>{act}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Collapsible Technical Indicators */}
      <div className="rounded-xl border border-slate-800 bg-[#0B1222]/80 overflow-hidden">
        <button
          onClick={() => setShowTechnical(!showTechnical)}
          className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
        >
          <span>{t.result.technicalIndicators} ({result.technical_indicators?.length || 0})</span>
          {showTechnical ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showTechnical && (
          <div className="px-4 pb-3 space-y-2 text-xs font-mono text-slate-300 border-t border-slate-800/80 pt-2">
            {result.technical_indicators?.map((tech, idx) => (
              <div key={idx} className="flex items-start gap-1.5">
                <span className="text-cyan-400">$</span>
                <span>{tech}</span>
              </div>
            ))}
            {result.evidence?.length > 0 && (
              <div className="pt-2">
                <div className="text-[11px] text-slate-400 uppercase">{t.result.evidence}:</div>
                {result.evidence.map((ev, idx) => (
                  <div key={idx} className="text-slate-300 text-[11px] pl-2 border-l border-slate-700 mt-1">
                    {ev}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Limitations & Legal Confidence Notice */}
      <div className="px-3 py-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
        <p className="font-semibold text-slate-300">
          {t.result.limitations}: <span className="font-normal">{result.limitations}</span>
        </p>
        <p className="text-[10px] text-amber-400/90 leading-relaxed">
          {t.result.aiConfidenceDisclaimer}
        </p>
      </div>

      {/* Action Buttons Grid */}
      <div className="grid grid-cols-2 gap-2 pt-2">
        <button
          onClick={handleSaveToVault}
          disabled={isSaved}
          className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
            isSaved
              ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300'
              : 'bg-cyan-950/70 border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/80 shadow-[0_0_15px_rgba(0,240,255,0.15)]'
          }`}
        >
          {isSaved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
          <span>{isSaved ? t.result.savedSuccess : t.result.saveToVault}</span>
        </button>

        <button
          onClick={() => onPrepareReport(result, rawInput)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold transition-all"
        >
          <FileText className="w-4 h-4 text-cyan-400" />
          <span>{t.result.prepareReport}</span>
        </button>

        <button
          onClick={() => onAskAssistant(`I scanned this message: "${rawInput}". Can you advise on safe next steps?`)}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-indigo-400 text-slate-200 text-xs font-semibold transition-all"
        >
          <HelpCircle className="w-4 h-4 text-indigo-400" />
          <span>{t.result.askAiAssistant}</span>
        </button>

        <button
          onClick={onScanAnother}
          className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-slate-900 border border-slate-700 hover:border-sky-400 text-slate-200 text-xs font-semibold transition-all"
        >
          <RefreshCw className="w-4 h-4 text-sky-400" />
          <span>{t.result.scanAnother}</span>
        </button>
      </div>
    </div>
  );
}
