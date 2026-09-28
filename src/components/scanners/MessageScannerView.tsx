'use client';

import React, { useState } from 'react';
import { MessageSquare, Sparkles, Clipboard, Trash2, AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { analyzeScamMessage } from '@/lib/scanners/messageScanner';
import { sanitizeUserInput } from '@/lib/scanners/sanitizer';
import { AnalysisResult } from '@/types/scam';
import { saveAnalysisRecord } from '@/lib/supabase';

interface MessageScannerViewProps {
  onResult: (result: AnalysisResult, rawContent: string, scanType: string) => void;
  initialText?: string;
}

export function MessageScannerView({ onResult, initialText = '' }: MessageScannerViewProps) {
  const { t, locale } = useTranslation();
  const [inputText, setInputText] = useState(initialText);
  const [isScanning, setIsScanning] = useState(false);
  const [liveWarning, setLiveWarning] = useState<string | null>(null);

  const handleTextChange = (text: string) => {
    setInputText(text);
    const check = sanitizeUserInput(text);
    if (check.hasSensitiveData) {
      setLiveWarning('Privacy Notice: Potential card number or password detected. Sensitive values will be masked.');
    } else {
      setLiveWarning(null);
    }
  };

  const handlePasteClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      handleTextChange(text);
    } catch {
      // Clipboard permission denied
    }
  };

  const handleScan = async () => {
    if (!inputText.trim()) return;
    setIsScanning(true);

    try {
      const result = await analyzeScamMessage(inputText, locale);
      await saveAnalysisRecord(result, 'message', inputText);
      onResult(result, inputText, 'message');
    } catch (e) {
      console.error('Scan failed:', e);
    } finally {
      setIsScanning(false);
    }
  };

  const loadSample = (sampleText: string) => {
    handleTextChange(sampleText);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
          <MessageSquare className="w-5 h-5 text-cyan-400" />
          <span>{t.scanners.messageTitle}</span>
        </h2>
        <p className="text-xs text-slate-400">
          {t.scanners.messageSubtitle}
        </p>
      </div>

      {/* Sensitive Data Alert */}
      {liveWarning && (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
          <span>{liveWarning}</span>
        </div>
      )}

      {/* Input Text Area */}
      <div className="relative rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/90 focus-within:border-cyan-400/60 transition-all p-3 shadow-lg">
        <textarea
          rows={5}
          value={inputText}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder={t.scanners.messagePlaceholder}
          className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none"
        />

        {/* Action Controls Under Textarea */}
        <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5 mt-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handlePasteClipboard}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-500 text-xs text-slate-300 transition-colors"
            >
              <Clipboard className="w-3.5 h-3.5 text-cyan-400" />
              <span>{t.scanners.pasteClipboard}</span>
            </button>
            {inputText && (
              <button
                onClick={() => handleTextChange('')}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs text-slate-400 hover:text-red-400 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.scanners.clearText}</span>
              </button>
            )}
          </div>

          <span className="text-[11px] font-mono text-slate-500">
            {inputText.length} chars
          </span>
        </div>
      </div>

      {/* Quick Sample Presets */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Quick Test Samples:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() =>
              loadSample(
                'Dear customer, your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our electricity officer at 9876543210.'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 transition-colors"
          >
            ⚡ Electricity Disconnection
          </button>
          <button
            onClick={() =>
              loadSample(
                'Work from home job: Earn Rs 3,500 daily just by liking 5 YouTube videos. Daily instant payment. Join Telegram @EarnDailyIndia to claim bonus.'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 transition-colors"
          >
            💼 Part-time YouTube Job
          </button>
          <button
            onClick={() =>
              loadSample(
                'HDFC Alert: Your account KYC expired. Download AnyDesk app from play store and contact our senior verification manager to avoid permanent blocking.'
              )
            }
            className="px-2.5 py-1 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 text-[11px] text-slate-300 transition-colors"
          >
            📱 AnyDesk / KYC Support
          </button>
        </div>
      </div>

      {/* Scan Button */}
      <button
        onClick={handleScan}
        disabled={!inputText.trim() || isScanning}
        className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all flex items-center justify-center gap-2"
      >
        <Sparkles className="w-4 h-4" />
        <span>{isScanning ? t.scanners.scanning : t.scanners.scanButton}</span>
      </button>
    </div>
  );
}
