'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Sparkles, Check, AlertTriangle, FileText, RefreshCw } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { validateUploadedImage, extractTextFromImageFile } from '@/lib/scanners/ocrEngine';
import { analyzeScamMessage } from '@/lib/scanners/messageScanner';
import { AnalysisResult } from '@/types/scam';
import { saveAnalysisRecord } from '@/lib/supabase';

interface ScreenshotOcrViewProps {
  onResult: (result: AnalysisResult, rawContent: string, scanType: string) => void;
}

export function ScreenshotOcrView({ onResult }: ScreenshotOcrViewProps) {
  const { t, locale } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [isProcessingOcr, setIsProcessingOcr] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [ocrCompleted, setOcrCompleted] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setErrorMessage(null);
    const validation = validateUploadedImage(file);
    if (!validation.valid) {
      setErrorMessage(validation.error || 'Invalid image file.');
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    // Auto extract text
    setIsProcessingOcr(true);
    try {
      const text = await extractTextFromImageFile(file);
      setExtractedText(text);
      setOcrCompleted(true);
    } catch {
      setErrorMessage('OCR processing encountered an issue. You can manually enter text below.');
    } finally {
      setIsProcessingOcr(false);
    }
  };

  const handleAnalyzeConfirmedText = async () => {
    if (!extractedText.trim()) return;
    setIsAnalyzing(true);

    try {
      const result = await analyzeScamMessage(extractedText, locale);
      await saveAnalysisRecord(result, 'screenshot', extractedText);
      onResult(result, extractedText, 'screenshot');
    } catch (e) {
      console.error('Analysis of screenshot text failed:', e);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setExtractedText('');
    setOcrCompleted(false);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
          <Camera className="w-5 h-5 text-cyan-400" />
          <span>{t.scanners.screenshotTitle}</span>
        </h2>
        <p className="text-xs text-slate-400">
          {t.scanners.screenshotSubtitle}
        </p>
      </div>

      {/* Error Notice */}
      {errorMessage && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      {!selectedFile && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl p-6 sm:p-8 text-center cursor-pointer bg-[#0F1A30]/50 hover:bg-[#0F1A30]/80 transition-all flex flex-col items-center justify-center gap-3 group"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.2)]">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              {t.scanners.dragDropText}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              {t.scanners.fileRequirements}
            </p>
          </div>
        </div>
      )}

      {/* Processing OCR Loading */}
      {isProcessingOcr && (
        <div className="p-4 rounded-xl border border-cyan-500/30 bg-[#0F1A30] text-center space-y-2 animate-pulse">
          <div className="flex items-center justify-center gap-2 text-cyan-300 text-sm font-semibold">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            <span>Extracting visible text via optical recognition...</span>
          </div>
          <p className="text-xs text-slate-400">
            Analyzing text shapes, timestamps, and message headers safely in memory.
          </p>
        </div>
      )}

      {/* Confirmed Text Area with User Verification */}
      {ocrCompleted && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4" />
              <span>{t.scanners.extractedTextConfirm}</span>
            </label>
            <button
              onClick={handleReset}
              className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Change Image</span>
            </button>
          </div>

          <div className="rounded-2xl border border-cyan-500/30 bg-[#0F1A30] p-3 focus-within:border-cyan-400/70 transition-all">
            <textarea
              rows={6}
              value={extractedText}
              onChange={(e) => setExtractedText(e.target.value)}
              placeholder="Confirm or edit the extracted text from your screenshot..."
              className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none resize-none font-mono"
            />
            <div className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-400 flex items-center justify-between">
              <span>{t.scanners.editTextNotice}</span>
              <span>{extractedText.length} characters</span>
            </div>
          </div>

          {/* Trigger Scan on Confirmed Text */}
          <button
            onClick={handleAnalyzeConfirmedText}
            disabled={!extractedText.trim() || isAnalyzing}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-bold text-sm shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isAnalyzing ? 'Analyzing Text for Fraud Signals...' : 'Confirm & Scan Extracted Text'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
