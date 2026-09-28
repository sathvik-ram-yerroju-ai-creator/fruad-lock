'use client';

import React from 'react';
import {
  MessageSquare,
  Globe,
  Camera,
  QrCode,
  Siren,
  Sparkles,
  ShieldCheck,
  Users,
  ChevronRight,
  Clock,
  ExternalLink,
  Bot,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { CyberShield } from '../common/CyberShield';
import { useTranslation } from '@/lib/i18n';

interface HomeDashboardViewProps {
  onSelectScanner: (type: 'message' | 'link' | 'screenshot' | 'qr') => void;
  onOpenEmergency: () => void;
  onOpenFamilyMode: () => void;
  onOpenDemoScenarios: () => void;
  onOpenAssistant: () => void;
  onOpenThreatMap: () => void;
}

export function HomeDashboardView({
  onSelectScanner,
  onOpenEmergency,
  onOpenFamilyMode,
  onOpenDemoScenarios,
  onOpenAssistant,
  onOpenThreatMap,
}: HomeDashboardViewProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-16">
      {/* Hero Status Card with Animated Cyber Shield */}
      <div className="relative rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-[#0F1A30]/90 to-[#070B14]/90 p-5 sm:p-6 text-center space-y-4 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Ambient background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex justify-center py-2">
          <CyberShield status="armed" size="lg" showRings={true} useLogoImage={true} />
        </div>

        <div className="space-y-1 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-400/30 text-[11px] font-mono text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>{t.dashboard.statusArmed}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            {t.dashboard.welcome}
          </h1>
          <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
            {t.dashboard.subtitle}
          </p>
        </div>

        {/* Demo Scenarios Shortcut */}
        <div className="pt-1">
          <button
            onClick={onOpenDemoScenarios}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 hover:border-cyan-400 text-xs font-semibold text-cyan-300 transition-all shadow-[0_0_12px_rgba(0,240,255,0.15)]"
          >
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Hackathon Demo Scenarios</span>
          </button>
        </div>
      </div>

      {/* EMERGENCY HERO CARD (I Lost Money / I May Have Been Scammed) */}
      <div
        onClick={onOpenEmergency}
        className="rounded-3xl border-2 border-red-500/60 bg-gradient-to-r from-red-950/90 via-rose-950/80 to-red-950/90 p-4.5 sm:p-5 cursor-pointer hover:border-red-400 transition-all shadow-[0_0_30px_rgba(239,68,68,0.35)] group space-y-2.5"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-red-600/80 border border-red-400/50 flex items-center justify-center text-white shadow-[0_0_15px_rgba(239,68,68,0.5)] group-hover:scale-105 transition-transform animate-pulse">
              <Siren className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-red-300 font-bold">
                Emergency Hotline 1930
              </span>
              <h2 className="text-sm sm:text-base font-extrabold text-white">
                {t.dashboard.emergencyTitle}
              </h2>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
        </div>

        <p className="text-xs text-red-100/90 leading-relaxed">
          {t.dashboard.emergencySubtitle}
        </p>

        <div className="pt-1 flex items-center justify-between text-[11px] font-bold text-red-300">
          <span>Freeze Bank Accounts • UPI Reversal • File Cyber Complaint</span>
          <span className="underline group-hover:text-white">Start Recovery →</span>
        </div>
      </div>

      {/* Family Mode Quick Banner */}
      <div
        onClick={onOpenFamilyMode}
        className="p-3.5 rounded-2xl border border-amber-500/40 bg-amber-950/20 hover:bg-amber-950/30 cursor-pointer transition-all flex items-center justify-between gap-3 shadow-md"
      >
        <div className="flex items-center gap-2.5">
          <Users className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-200 font-medium leading-relaxed">
            {t.dashboard.familyModeBanner}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />
      </div>

      {/* 4 Core Scanner Tiles Grid */}
      <div className="space-y-2.5">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
          {t.dashboard.quickScanTitle}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Tile 1: Message Scanner */}
          <div
            onClick={() => onSelectScanner('message')}
            className="p-4 rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/80 hover:border-cyan-400/60 hover:bg-[#0F1A30] cursor-pointer transition-all group space-y-2 shadow-md"
          >
            <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(0,240,255,0.2)]">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors flex items-center justify-between">
                <span>{t.dashboard.messageScannerTitle}</span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.dashboard.messageScannerDesc}
              </p>
            </div>
          </div>

          {/* Tile 2: Link Guard */}
          <div
            onClick={() => onSelectScanner('link')}
            className="p-4 rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/80 hover:border-cyan-400/60 hover:bg-[#0F1A30] cursor-pointer transition-all group space-y-2 shadow-md"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-950 border border-sky-500/40 flex items-center justify-center text-sky-400 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(56,189,248,0.2)]">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-sky-300 transition-colors flex items-center justify-between">
                <span>{t.dashboard.linkGuardTitle}</span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.dashboard.linkGuardDesc}
              </p>
            </div>
          </div>

          {/* Tile 3: Screenshot & OCR */}
          <div
            onClick={() => onSelectScanner('screenshot')}
            className="p-4 rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/80 hover:border-cyan-400/60 hover:bg-[#0F1A30] cursor-pointer transition-all group space-y-2 shadow-md"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(99,102,241,0.2)]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                <span>{t.dashboard.screenshotScannerTitle}</span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.dashboard.screenshotScannerDesc}
              </p>
            </div>
          </div>

          {/* Tile 4: QR Code Shield */}
          <div
            onClick={() => onSelectScanner('qr')}
            className="p-4 rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/80 hover:border-cyan-400/60 hover:bg-[#0F1A30] cursor-pointer transition-all group space-y-2 shadow-md"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-950 border border-purple-500/40 flex items-center justify-center text-purple-400 group-hover:scale-105 transition-transform shadow-[0_0_12px_rgba(168,85,247,0.2)]">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 group-hover:text-purple-300 transition-colors flex items-center justify-between">
                <span>{t.dashboard.qrShieldTitle}</span>
                <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {t.dashboard.qrShieldDesc}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Academy & Threat Map Quick Links */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onOpenAssistant}
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors flex items-center gap-2.5"
        >
          <Bot className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-200">Ask Fraud Lock</div>
            <div className="text-[10px] text-slate-400">Conversational AI guard</div>
          </div>
        </button>

        <button
          onClick={onOpenThreatMap}
          className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-cyan-500/40 text-left transition-colors flex items-center gap-2.5"
        >
          <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-200">Threat Map</div>
            <div className="text-[10px] text-slate-400">Regional scam trends</div>
          </div>
        </button>
      </div>
    </div>
  );
}
