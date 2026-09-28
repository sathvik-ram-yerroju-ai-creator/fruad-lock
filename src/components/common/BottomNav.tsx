'use client';

import React from 'react';
import { Home, ShieldCheck, Siren, FolderLock, GraduationCap } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';

interface BottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
}

export function BottomNav({ activeTab, onSelectTab }: BottomNavProps) {
  const { t } = useTranslation();

  const navItems = [
    { id: 'home', label: t.nav.home, icon: Home },
    { id: 'scanners', label: t.nav.scanners, icon: ShieldCheck },
    { id: 'emergency', label: 'Emergency', icon: Siren, highlight: true },
    { id: 'vault', label: t.nav.vault, icon: FolderLock },
    { id: 'safety', label: 'Safety', icon: GraduationCap },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#070B14]/95 backdrop-blur-lg border-t border-cyan-500/20 px-2 py-1.5 safe-area-pb">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          if (item.highlight) {
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className="flex flex-col items-center justify-center -mt-4 group focus:outline-none"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-rose-500 border-2 border-[#070B14] flex items-center justify-center text-white shadow-[0_0_20px_rgba(239,68,68,0.7)] group-hover:scale-105 transition-transform animate-pulse">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-bold text-red-400 mt-0.5">
                  1930 / Help
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all focus:outline-none ${
                isActive
                  ? 'text-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#00f0ff]" />
                )}
              </div>
              <span className="text-[10px] mt-1 tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
