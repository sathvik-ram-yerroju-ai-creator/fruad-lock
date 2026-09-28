'use client';

import React, { useState, useRef } from 'react';
import { QrCode, Upload, AlertTriangle, Shield, ExternalLink, Sparkles, RefreshCw, CheckCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { decodeQrFromImageData, DecodedQrResult } from '@/lib/scanners/qrScanner';
import { AnalysisResult } from '@/types/scam';
import { saveAnalysisRecord } from '@/lib/supabase';

interface QrShieldViewProps {
  onResult: (result: AnalysisResult, rawContent: string, scanType: string) => void;
  onOpenLinkGuard: (url: string) => void;
}

export function QrShieldView({ onResult, onOpenLinkGuard }: QrShieldViewProps) {
  const { t, locale } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [decodedResult, setDecodedResult] = useState<DecodedQrResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const processImageElement = (img: HTMLImageElement) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0, img.width, img.height);

    try {
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const decoded = decodeQrFromImageData(imgData, locale);
      if (decoded) {
        setDecodedResult(decoded);
        setErrorMsg(null);
      } else {
        setErrorMsg('No QR code could be detected in this image. Try another screenshot or clear picture.');
      }
    } catch (e) {
      console.error('QR decode error:', e);
      setErrorMsg('Error processing QR image data.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setErrorMsg(null);
    setDecodedResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => processImageElement(img);
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const testUpiSample = () => {
    const fakeUpi = 'upi://pay?pa=cashback-rewards-node9@upi&pn=NationalCashbackReward&am=5000&cu=INR&tn=Cashback%20Reward%20Refund';
    const decoded = decodeQrFromImageData(
      // Create empty 1x1 image data just for fallback parser
      new ImageData(1, 1),
      locale
    );
    // Directly simulate UPI decoded payload
    const dummyImg = new Image();
    // Render dynamic QR or set payload directly
    const simResult: DecodedQrResult = {
      rawPayload: fakeUpi,
      type: 'upi',
      parsedDetails: {
        upiPayee: 'cashback-rewards-node9@upi',
        upiName: 'National Cashback Reward',
        upiAmount: '5000',
        upiNote: 'Cashback Reward Refund',
      },
      analysis: {
        risk_level: 'HIGH',
        category: 'UPI Collect / Reverse Payment Scam Trap',
        summary: 'CRITICAL ALERT: This QR code will DEDUCT ₹5,000 from your account! You were tricked into believing this will credit you money.',
        warning_signals: [
          'CRITICAL: Entering your UPI PIN will DEDUCT money from your account, NOT credit it.',
          'Scammers routinely send QR codes claiming you will "receive a refund" or "collect cashback".',
        ],
        evidence: [
          'Target VPA / Payee: cashback-rewards-node9@upi',
          'Merchant / Payee Name: NationalCashbackReward',
          'Pre-filled Amount to Deduct: ₹5000',
        ],
        recommended_actions: [
          'DO NOT scan or approve this QR in PhonePe, Google Pay, or Paytm.',
          'Remember the fundamental rule: You NEVER need to enter your UPI PIN to receive money.',
          'Block and report the sender immediately.',
        ],
        do_not_do: [
          'DO NOT enter your UPI PIN.',
          'DO NOT accept collect requests on your UPI app.',
        ],
        technical_indicators: [
          'NPCI UPI Intent URI scheme with forced debit parameters',
          'Social engineering reverse-credit cognitive bias exploit',
        ],
        confidence: 'HIGH',
        limitations: 'UPI protocol specifications verify this is an outbound debit instruction.',
        language: locale,
      },
    };
    setDecodedResult(simResult);
    setErrorMsg(null);
  };

  const handleSaveAndAnalyze = async () => {
    if (!decodedResult) return;
    await saveAnalysisRecord(decodedResult.analysis, 'qr', decodedResult.rawPayload);
    onResult(decodedResult.analysis, decodedResult.rawPayload, 'qr');
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header */}
      <div className="text-center sm:text-left space-y-1">
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center justify-center sm:justify-start gap-2">
          <QrCode className="w-5 h-5 text-cyan-400" />
          <span>{t.scanners.qrTitle}</span>
        </h2>
        <p className="text-xs text-slate-400">
          {t.scanners.qrSubtitle}
        </p>
      </div>

      {/* Error notice */}
      {errorMsg && (
        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 rounded-2xl p-6 sm:p-7 text-center cursor-pointer bg-[#0F1A30]/50 hover:bg-[#0F1A30]/80 transition-all flex flex-col items-center justify-center gap-3 group"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <QrCode className="w-6 h-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-200">
            {t.scanners.uploadQrPrompt}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Safely decodes target payload without triggering browser navigation.
          </p>
        </div>
      </div>

      {/* Quick Test Sample for Evaluation */}
      <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <span className="text-slate-400">Test Scenario:</span>
        <button
          onClick={testUpiSample}
          className="px-2.5 py-1 rounded-lg bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 text-xs font-semibold flex items-center gap-1 transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Test "₹5,000 Cashback" UPI QR Trap</span>
        </button>
      </div>

      {/* Decoded Payload View */}
      {decodedResult && (
        <div className="rounded-2xl border border-cyan-500/30 bg-[#0F1A30] p-4 space-y-3.5 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-semibold text-cyan-300 uppercase tracking-wider">
              {t.scanners.qrResultTitle}
            </span>
            <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
              Type: {decodedResult.type}
            </span>
          </div>

          {/* Raw Payload string safely escaped */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800 font-mono text-xs text-slate-300 break-all select-all">
            {decodedResult.rawPayload}
          </div>

          {/* Special UPI Alert Callout */}
          {decodedResult.type === 'upi' && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-500/50 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-red-400">
                <AlertTriangle className="w-4 h-4" />
                <span>UPI SAFETY WARNING</span>
              </div>
              <p className="text-xs text-red-200 leading-relaxed font-medium">
                {t.scanners.qrWarningUpi}
              </p>
              {decodedResult.parsedDetails?.upiAmount && (
                <div className="text-xs font-mono text-amber-300 pt-1">
                  Amount that will be DEBITED: ₹{decodedResult.parsedDetails.upiAmount}
                </div>
              )}
            </div>
          )}

          {/* Actions on Decoded Result */}
          <div className="flex flex-col sm:flex-row gap-2 pt-1">
            <button
              onClick={handleSaveAndAnalyze}
              className="flex-1 py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center gap-1.5"
            >
              <Shield className="w-4 h-4" />
              <span>View Full Security Advisory</span>
            </button>

            {decodedResult.type === 'url' && (
              <button
                onClick={() => onOpenLinkGuard(decodedResult.rawPayload)}
                className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-4 h-4 text-cyan-400" />
                <span>{t.scanners.testLinkGuardWithQr}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
