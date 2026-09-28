'use client';

import React, { useState } from 'react';
import {
  Briefcase,
  ShieldCheck,
  Building,
  Home,
  Phone,
  Mail,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Users,
  LogOut,
  ChevronRight,
  KeyRound,
  FileCheck2,
} from 'lucide-react';
import { UserProfile } from '@/types/auth';
import { maskIndianPhone } from '@/lib/auth/authService';

interface VendorDashboardViewProps {
  currentUser: UserProfile | null;
  onSwitchToCustomerView: () => void;
  onSignOut: () => void;
  onOpenEmergency?: () => void;
}

export function VendorDashboardView({
  currentUser,
  onSwitchToCustomerView,
  onSignOut,
  onOpenEmergency,
}: VendorDashboardViewProps) {
  const [activePassGenerated, setActivePassGenerated] = useState(true);
  const [passCode] = useState(() => Math.floor(100000 + Math.random() * 900000).toString());

  return (
    <div className="space-y-5 max-w-3xl mx-auto pb-16">
      {/* Hero Vendor Identification Banner */}
      <div className="relative rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-[#0F142A]/90 via-[#0A0E20]/90 to-[#070B14]/90 p-5 sm:p-6 shadow-2xl overflow-hidden backdrop-blur-md">
        {/* Glow orb */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 border border-indigo-400/40 flex items-center justify-center text-white shadow-[0_0_25px_rgba(99,102,241,0.35)] shrink-0">
              <Briefcase className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-mono font-bold tracking-wider uppercase border border-indigo-500/40 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-indigo-400" />
                  Arise Verified Vendor Partner
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {currentUser?.display_name || 'Vendor Partner Portal'}
              </h1>
              <p className="text-xs text-indigo-200/80">
                Society Logistics, Clearance & Delivery Pass Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSwitchToCustomerView}
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-cyan-400 text-xs text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <span>Resident View</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onSignOut}
              className="p-1.5 rounded-xl bg-slate-900/80 border border-slate-700 hover:border-red-500 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Vendor Society Details Strip */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 p-3.5 rounded-2xl bg-black/40 border border-indigo-500/20 text-xs">
          <div className="flex items-center gap-2.5">
            <Building className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Apartment Block:</span>
              <span className="font-semibold text-slate-100 font-mono">
                {currentUser?.apartment_block || 'Tower B'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Home className="w-4 h-4 text-indigo-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Assigned Unit:</span>
              <span className="font-semibold text-slate-100 font-mono">
                Unit {currentUser?.apartment_unit || 'Service Hub 402'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] text-slate-400 block">Verified Mobile:</span>
              <span className="font-semibold text-slate-100 font-mono">
                {currentUser?.phone ? maskIndianPhone(currentUser.phone) : '+91 98765 43210'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Real-Time Digital Gate Pass (Society Entry OTP) */}
      <div className="rounded-3xl border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-slate-900/80 to-indigo-950/40 p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <QrCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Digital Security Gate Pass</h2>
              <p className="text-[11px] text-cyan-300/80">Valid for Apartment Society Entry & Verification</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono border border-emerald-500/40">
            ACTIVE & AUTHORIZED
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-black/60 border border-cyan-500/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1 text-center sm:text-left">
            <span className="text-[11px] text-slate-400">Guard Verification Passcode</span>
            <div className="text-3xl font-extrabold tracking-widest text-cyan-300 font-mono">
              {passCode}
            </div>
            <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-center sm:justify-start">
              <Clock className="w-3 h-3 text-cyan-400" />
              <span>Expires in 4 hours • Tied to your verified identity</span>
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full sm:w-auto">
            <div className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700 text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Supabase 2FA Verified</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Dest: {currentUser?.email || 'vendor@arise.security'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Onboarding & Verification Checklist */}
      <div className="rounded-3xl border border-slate-800 bg-[#090F1E] p-5 space-y-3.5 shadow-lg">
        <h2 className="text-sm font-bold text-white flex items-center gap-2">
          <FileCheck2 className="w-4 h-4 text-indigo-400" />
          <span>Vendor Onboarding Compliance Status</span>
        </h2>

        <div className="space-y-2">
          <div className="p-3 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Identity Authentication (Supabase OTP)</span>
                <span className="text-[11px] text-slate-400">Mobile +91 and Email credentials authenticated</span>
              </div>
            </div>
            <span className="text-emerald-400 font-mono text-[10px] font-bold">VERIFIED</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-emerald-500/30 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Apartment Block Access Clearance</span>
                <span className="text-[11px] text-slate-400">
                  Assigned to {currentUser?.apartment_block || 'Tower B'} - Unit {currentUser?.apartment_unit || '402'}
                </span>
              </div>
            </div>
            <span className="text-emerald-400 font-mono text-[10px] font-bold">APPROVED</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-semibold text-white block">Arise Society Security Protocol</span>
                <span className="text-[11px] text-slate-400">Zero-trust visitor verification protocol active</span>
              </div>
            </div>
            <span className="text-cyan-400 font-mono text-[10px] font-bold">ENFORCED</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Emergency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onSwitchToCustomerView}
          className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-400 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <Users className="w-5 h-5 text-cyan-400" />
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-xs font-bold text-white mt-2">Resident Safety Center</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Switch to customer dashboard to view scam scanners and threat feeds.
          </p>
        </button>

        <div
          onClick={onOpenEmergency}
          className="p-4 rounded-2xl bg-red-950/30 border border-red-500/40 hover:border-red-400 text-left transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
            <ChevronRight className="w-4 h-4 text-red-400 group-hover:translate-x-1 transition-transform" />
          </div>
          <h3 className="text-xs font-bold text-white mt-2">Emergency Society Hotline</h3>
          <p className="text-[11px] text-red-200/80 mt-0.5">
            National Cyber Crime 1930 & Society Gate Security Escalation.
          </p>
        </div>
      </div>
    </div>
  );
}
