'use client';

import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, ShieldOff } from 'lucide-react';

export type ShieldStatus = 'armed' | 'scanning' | 'safe' | 'caution' | 'high_risk';

interface CyberShieldProps {
  status?: ShieldStatus;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showRings?: boolean;
  useLogoImage?: boolean;
}

export function CyberShield({ status = 'armed', size = 'md', showRings = true, useLogoImage = false }: CyberShieldProps) {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-32 h-32',
  };

  const iconSizeMap = {
    sm: 20,
    md: 32,
    lg: 48,
    xl: 64,
  };

  const statusConfig = {
    armed: {
      color: 'text-cyan-400',
      glow: 'shadow-[0_0_30px_rgba(0,240,255,0.4)]',
      border: 'border-cyan-500/40',
      bg: 'bg-cyan-950/40',
      ringColor: 'border-cyan-400/20',
      icon: Shield,
    },
    scanning: {
      color: 'text-sky-400',
      glow: 'shadow-[0_0_35px_rgba(56,189,248,0.6)] animate-pulse',
      border: 'border-sky-400/60',
      bg: 'bg-sky-950/50',
      ringColor: 'border-sky-400/40',
      icon: Shield,
    },
    safe: {
      color: 'text-emerald-400',
      glow: 'shadow-[0_0_30px_rgba(16,185,129,0.4)]',
      border: 'border-emerald-500/50',
      bg: 'bg-emerald-950/40',
      ringColor: 'border-emerald-400/20',
      icon: ShieldCheck,
    },
    caution: {
      color: 'text-amber-400',
      glow: 'shadow-[0_0_30px_rgba(245,158,11,0.4)]',
      border: 'border-amber-500/50',
      bg: 'bg-amber-950/40',
      ringColor: 'border-amber-400/20',
      icon: ShieldAlert,
    },
    high_risk: {
      color: 'text-red-500',
      glow: 'shadow-[0_0_40px_rgba(239,68,68,0.6)] animate-bounce',
      border: 'border-red-500/70',
      bg: 'bg-red-950/50',
      ringColor: 'border-red-500/40',
      icon: ShieldOff,
    },
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Pulse Rings */}
      {showRings && (
        <>
          <div
            className={`absolute rounded-full border ${config.ringColor} animate-ping pointer-events-none`}
            style={{ width: '130%', height: '130%' }}
          />
          <div
            className={`absolute rounded-full border border-dashed ${config.ringColor} animate-[spin_12s_linear_infinite] pointer-events-none`}
            style={{ width: '155%', height: '155%' }}
          />
        </>
      )}

      {/* Main Shield Container */}
      <div
        className={`relative flex items-center justify-center rounded-2xl border ${config.border} ${config.bg} ${config.glow} ${sizeMap[size]} transition-all duration-500 backdrop-blur-md`}
      >
        {/* Radar Scanning Line */}
        {status === 'scanning' && (
          <div className="absolute inset-0 overflow-hidden rounded-2xl pointer-events-none">
            <div className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan-line" />
          </div>
        )}

        {useLogoImage ? (
          <div className="w-full h-full p-2 flex items-center justify-center overflow-hidden rounded-2xl">
            <img
              src="/logo.png"
              alt="Fraud Lock"
              className="w-full h-full object-contain drop-shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-transform duration-300"
            />
          </div>
        ) : (
          <IconComponent
            size={iconSizeMap[size]}
            className={`${config.color} transition-transform duration-300 drop-shadow-[0_0_12px_currentColor]`}
          />
        )}
      </div>
    </div>
  );
}
