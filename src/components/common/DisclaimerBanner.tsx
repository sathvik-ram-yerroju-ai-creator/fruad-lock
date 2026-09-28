'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

export function DisclaimerBanner() {
  const { t } = useTranslation();

  return (
    <aside aria-label="Security and legal disclaimer" className="bg-slate-950/90 border-b border-amber-500/20 px-3 py-1.5 text-xs text-amber-300/90 backdrop-blur-md">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-medium">
          <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" aria-hidden="true" />
          <span>{t.disclaimer}</span>
        </div>
        <span className="hidden sm:inline-block text-[10px] text-slate-400 uppercase tracking-wider font-mono">
          Advisory Mode
        </span>
      </div>
    </aside>
  );
}
