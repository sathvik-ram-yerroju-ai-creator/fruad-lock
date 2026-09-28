'use client';

import React from 'react';
import { Shield, Smartphone, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { DeviceCapability } from '@/types/scam';

const CAPABILITIES: DeviceCapability[] = [
  {
    name: 'Manual Message & Text Scanning',
    category: 'clipboard',
    supportedInBrowser: true,
    requiresNativeApp: false,
    status: 'active',
    description: 'Paste SMS, WhatsApp, Telegram, or email text for on-demand heuristic scam analysis.',
    limitationExplanation: 'Fully operational in browser sandbox with zero background tracking.',
  },
  {
    name: 'Link Guard URL Inspection',
    category: 'network',
    supportedInBrowser: true,
    requiresNativeApp: false,
    status: 'active',
    description: 'Sandboxed server-side parsing of domains, TLDs, and homograph attacks without rendering target sites.',
    limitationExplanation: 'Does not render or visit target pages in client browser.',
  },
  {
    name: 'Screenshot & Image OCR',
    category: 'camera',
    supportedInBrowser: true,
    requiresNativeApp: false,
    status: 'user_initiated_only',
    description: 'Client-side file picker allowing users to select screenshots for verified text extraction.',
    limitationExplanation: 'Operates only on files explicitly selected by the user. Browser security forbids background gallery access.',
  },
  {
    name: 'QR Code Decoding & UPI Verification',
    category: 'camera',
    supportedInBrowser: true,
    requiresNativeApp: false,
    status: 'user_initiated_only',
    description: 'Decodes QR images and parses UPI payment payloads without automatic navigation.',
    limitationExplanation: 'User must initiate scan; browser will never auto-follow decoded web or intent links.',
  },
  {
    name: 'Incoming Phone Call Screening',
    category: 'telephony',
    supportedInBrowser: false,
    requiresNativeApp: true,
    status: 'restricted_by_os',
    description: 'Real-time caller ID lookup and caller reputation flagging on incoming mobile calls.',
    limitationExplanation: 'Requires Native Android/iOS telephony APIs. Web standards and PWAs strictly forbid access to incoming phone calls.',
  },
  {
    name: 'Automatic Background SMS Reading',
    category: 'sms',
    supportedInBrowser: false,
    requiresNativeApp: true,
    status: 'restricted_by_os',
    description: 'Silent background screening of newly arrived SMS text messages.',
    limitationExplanation: 'Requires native Android SMS permissions. Browsers deliberately prevent websites from reading private device messages in the background.',
  },
];

export function ProtectionCenterView() {
  const { t } = useTranslation();

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
          <Shield className="w-5 h-5 text-cyan-400" />
          <span>{t.protectionCenter.title}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.protectionCenter.subtitle}
        </p>
      </div>

      {/* Honest Web Boundary Callout */}
      <div className="p-3.5 rounded-2xl bg-[#0F1A30] border border-cyan-500/30 space-y-2 shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>Browser Sandbox & Transparency Standard:</span>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          {t.protectionCenter.webAppLimitationNotice}
        </p>
        <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800">
          {t.protectionCenter.nativeAppNote}
        </p>
      </div>

      {/* Capabilities Matrix */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          Device Capabilities Matrix:
        </h3>

        <div className="space-y-2">
          {CAPABILITIES.map((cap, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-xl border border-slate-800 bg-[#0F1A30]/70 space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-100">{cap.name}</span>
                <span
                  className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
                    cap.supportedInBrowser
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {cap.supportedInBrowser ? 'WEB ACTIVE' : 'NATIVE ONLY'}
                </span>
              </div>

              <p className="text-xs text-slate-300">
                {cap.description}
              </p>

              <div className="text-[11px] text-slate-400 font-mono flex items-start gap-1 pt-0.5">
                <span className="text-cyan-400">•</span>
                <span>{cap.limitationExplanation}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
