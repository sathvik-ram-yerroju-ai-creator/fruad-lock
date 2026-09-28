'use client';

import React, { useState, useEffect } from 'react';
import {
  Globe,
  Users,
  Siren,
  Shield,
  Smartphone,
  Monitor,
  User,
  ShieldCheck,
  Lock,
  LogOut,
  ChevronDown,
  LogIn,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { SupportedLocale } from '@/types/scam';
import { getCurrentUserProfile, logSecurityEvent } from '@/lib/auth/authService';
import { UserProfile } from '@/types/auth';

interface HeaderProps {
  onOpenEmergency: () => void;
  isFamilyMode: boolean;
  onToggleFamilyMode: () => void;
  isMobileFrame: boolean;
  onToggleMobileFrame: () => void;
  onSelectNav: (tab: string) => void;
  onOpenAuthModal: () => void;
  currentUser?: UserProfile | null;
  onSignOut: () => void;
}

export function Header({
  onOpenEmergency,
  isFamilyMode,
  onToggleFamilyMode,
  isMobileFrame,
  onToggleMobileFrame,
  onSelectNav,
  onOpenAuthModal,
  currentUser,
  onSignOut,
}: HeaderProps) {
  const { locale, setLocale, t, languages } = useTranslation();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  // Close menus on outside click
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#lang-menu-container') && !target.closest('#avatar-menu-container')) {
        setShowLangMenu(false);
        setShowAvatarMenu(false);
      }
    };
    document.addEventListener('click', handleDocumentClick);
    return () => document.removeEventListener('click', handleDocumentClick);
  }, []);

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#070B14]/90 backdrop-blur-md border-b border-cyan-500/20 px-3 py-2.5">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        {/* Brand Logo & Name */}
        <button
          onClick={() => onSelectNav('home')}
          className="flex items-center gap-2.5 text-left group transition-all cursor-pointer"
        >
          <div className="w-9 h-9 rounded-xl bg-black border border-amber-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_15px_rgba(245,158,11,0.25)] group-hover:border-amber-400 group-hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] transition-all shrink-0">
            <img
              src="/logo.png"
              alt="Fraud Lock"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-wider bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent">
                FRAUD LOCK
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-mono">
                PWA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight hidden sm:block">
              {t.motto}
            </p>
          </div>
        </button>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Emergency 1-Tap Trigger */}
          <button
            onClick={onOpenEmergency}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-red-600/90 hover:bg-red-500 text-white font-semibold text-xs border border-red-400/50 shadow-[0_0_16px_rgba(239,68,68,0.5)] transition-all animate-pulse cursor-pointer"
            title="Immediate Incident Assistance & Bank Freeze"
          >
            <Siren className="w-3.5 h-3.5" />
            <span className="font-bold text-[11px] sm:text-xs">1930 / Lost Money</span>
          </button>

          {/* Family Mode Switcher */}
          <button
            onClick={onToggleFamilyMode}
            className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              isFamilyMode
                ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                : 'bg-slate-900/60 border-slate-700/60 text-slate-300 hover:border-slate-500'
            }`}
            title="Toggle Senior/Family Simplified Mode"
          >
            <Users className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Family</span>
          </button>

          {/* Language Selector Dropdown */}
          <div id="lang-menu-container" className="relative">
            <button
              onClick={() => {
                setShowLangMenu(!showLangMenu);
                setShowAvatarMenu(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-slate-900/80 border border-slate-700/70 text-xs text-slate-200 hover:border-cyan-500/50 transition-all cursor-pointer"
              title="Change Language (14+ Supported)"
            >
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-mono text-xs uppercase">{locale}</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto bg-[#0B1222] border border-cyan-500/30 rounded-xl shadow-2xl p-1.5 z-50 divide-y divide-slate-800">
                <div className="px-2 py-1 text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
                  Select Language (भाषा)
                </div>
                <div className="py-1 space-y-0.5">
                  {languages.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        setLocale(lang.code as SupportedLocale);
                        setShowLangMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        locale === lang.code
                          ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                          : 'text-slate-300 hover:bg-slate-800/80'
                      }`}
                    >
                      <span>{lang.nativeName}</span>
                      <span className="text-[10px] text-slate-400 font-mono">({lang.name})</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top-Right User Action: Sign In / Register or Avatar Dropdown */}
          {!currentUser ? (
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white font-semibold text-xs border border-cyan-400/40 shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
              title="Sign In or Create Account"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign In / Register</span>
              <span className="sm:hidden">Sign In</span>
            </button>
          ) : (
            <div id="avatar-menu-container" className="relative">
              <button
                onClick={() => {
                  setShowAvatarMenu(!showAvatarMenu);
                  setShowLangMenu(false);
                }}
                className="flex items-center gap-1 p-1 rounded-xl bg-slate-900/80 border border-cyan-500/30 hover:border-cyan-400 transition-all cursor-pointer group"
                title="Account & Security"
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-600 to-indigo-700 flex items-center justify-center text-white text-[11px] font-bold overflow-hidden shadow-sm">
                    {currentUser?.avatar_url ? (
                      <img
                        src={currentUser.avatar_url}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{getInitials(currentUser?.display_name)}</span>
                    )}
                  </div>
                  {/* Verified Shield dot */}
                  <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-[#070B14]" />
                </div>
                <ChevronDown className="w-3 h-3 text-slate-400 group-hover:text-cyan-300 transition-transform" />
              </button>

              {/* Avatar Dropdown Modal */}
              {showAvatarMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-[#090F1E] border border-cyan-500/30 rounded-2xl shadow-2xl p-2 z-50 divide-y divide-slate-800 animate-in fade-in">
                  {/* User Identity Header */}
                  <div className="px-3 py-2 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white truncate">
                        {currentUser?.display_name || 'Citizen'}
                      </span>
                      <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                        VERIFIED
                      </span>
                    </div>
                    <p className="text-[11px] text-cyan-400 font-mono truncate">
                      {currentUser?.email || currentUser?.phone || 'Verified Account'}
                    </p>
                  </div>

                {/* Menu Navigation Options */}
                <div className="py-1 space-y-0.5">
                  <button
                    onClick={() => {
                      onSelectNav('profile');
                      setShowAvatarMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-slate-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Citizen Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectNav('security_center');
                      setShowAvatarMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-slate-300 hover:text-white hover:bg-cyan-500/10 hover:border-cyan-500/30 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Security Center & MFA</span>
                  </button>

                  <button
                    onClick={() => {
                      onSelectNav('privacy_center');
                      setShowAvatarMenu(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-slate-300 hover:text-white hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Privacy & Consent</span>
                  </button>
                </div>

                {/* Sign In / Sign Out Action */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      setShowAvatarMenu(false);
                      onOpenAuthModal();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-cyan-300 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Switch / Sign In User</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowAvatarMenu(false);
                      onSignOut();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs flex items-center gap-2 text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-red-400" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

          {/* Desktop/Mobile Device Frame Toggle */}
          <button
            onClick={onToggleMobileFrame}
            className="hidden md:flex items-center gap-1 p-1.5 rounded-lg bg-slate-900/60 border border-slate-700/60 text-slate-400 hover:text-cyan-300 transition-colors cursor-pointer"
            title={isMobileFrame ? 'Expand to Full View' : 'Simulate Mobile Device Canvas'}
          >
            {isMobileFrame ? <Monitor className="w-3.5 h-3.5" /> : <Smartphone className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
