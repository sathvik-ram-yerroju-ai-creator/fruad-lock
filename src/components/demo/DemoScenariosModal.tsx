'use client';

import React from 'react';
import { Sparkles, X, ChevronRight, Shield, Globe, QrCode, MessageSquare } from 'lucide-react';
import { DEMO_SCENARIOS, DemoScenario } from '@/lib/demo/demoData';
import { useTranslation } from '@/lib/i18n';

interface DemoScenariosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectScenario: (scenario: DemoScenario) => void;
}

export function DemoScenariosModal({ isOpen, onClose, onSelectScenario }: DemoScenariosModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  const iconMap = {
    message: MessageSquare,
    link: Globe,
    qr: QrCode,
    screenshot: Shield,
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-2xl max-h-[85vh] bg-[#0B1222] border border-cyan-500/30 rounded-3xl p-5 sm:p-6 flex flex-col shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                {t.demo.title}
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {t.demo.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Tag Notice */}
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[11px] text-amber-300 font-mono">
          {t.demo.tagDemo} All samples are synthetic simulations designed strictly for safety demonstration and evaluation.
        </div>

        {/* Scenarios List */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
          {DEMO_SCENARIOS.map((scen) => {
            const Icon = iconMap[scen.type];
            return (
              <div
                key={scen.id}
                onClick={() => {
                  onSelectScenario(scen);
                  onClose();
                }}
                className="p-3.5 rounded-2xl border border-slate-800 bg-[#0F1A30]/80 hover:border-cyan-500/50 hover:bg-[#0F1A30] cursor-pointer transition-all space-y-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Icon className="w-3 h-3" />
                    <span>{scen.type}</span>
                  </span>
                  <span className="text-[11px] text-cyan-400 font-semibold group-hover:underline flex items-center gap-0.5">
                    <span>{t.demo.loadScenario}</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>

                <h4 className="text-xs sm:text-sm font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
                  {scen.title}
                </h4>

                <p className="text-xs text-slate-400 line-clamp-2">
                  {scen.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
