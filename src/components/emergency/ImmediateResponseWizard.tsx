'use client';

import React, { useState } from 'react';
import {
  Siren,
  PhoneCall,
  Clock,
  ShieldAlert,
  Lock,
  WifiOff,
  KeyRound,
  FileCheck,
  CheckSquare,
  Square,
  ExternalLink,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { IncidentReport } from '@/types/scam';
import { generateIncidentDossier } from '@/lib/reports/reportGenerator';

interface ImmediateResponseWizardProps {
  onBackToHome: () => void;
  onOpenReportExport: (report: IncidentReport) => void;
}

export function ImmediateResponseWizard({ onBackToHome, onOpenReportExport }: ImmediateResponseWizardProps) {
  const { t } = useTranslation();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedIncidentType, setSelectedIncidentType] = useState<string>('payment');
  const [amountLost, setAmountLost] = useState<string>('');
  const [scammerContact, setScammerContact] = useState<string>('');
  const [transactionRef, setTransactionRef] = useState<string>('');

  const [checklist, setChecklist] = useState({
    bankContacted: false,
    cardBlocked: false,
    upiReported: false,
    cyberHelplineCalled: false,
    airplaneMode: false,
    passwordsChanged: false,
  });

  const toggleChecklist = (key: keyof typeof checklist) => {
    setChecklist((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFinishAndGenerateDossier = () => {
    const report: IncidentReport = {
      id: `FL_INCIDENT_${Date.now()}`,
      user_id: 'local-user',
      incident_type: selectedIncidentType,
      incident_date: new Date().toISOString(),
      financial_loss_amount: parseFloat(amountLost) || 0,
      currency: 'INR',
      scammer_platform: 'Mobile / Online',
      scammer_contacts: scammerContact ? [scammerContact] : [],
      summary: `Citizen reported potential fraudulent incident under category "${selectedIncidentType}". Financial impact: INR ${amountLost || '0'}. Reference/UTR: ${transactionRef || 'N/A'}.`,
      timeline_events: [
        {
          timestamp: new Date().toISOString(),
          description: `User initiated emergency incident triage for ${selectedIncidentType}.`,
          verified_by_user: true,
        },
      ],
      emergency_steps_taken: {
        bank_contacted: checklist.bankContacted,
        card_blocked: checklist.cardBlocked,
        upi_complaint_filed: checklist.upiReported,
        cyber_helpline_called: checklist.cyberHelplineCalled,
        passwords_changed: checklist.passwordsChanged,
        app_uninstalled: checklist.airplaneMode,
      },
      evidence_ids: [],
      status: 'draft',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onOpenReportExport(report);
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      {/* Top Banner with Golden Hour Urgent Alert */}
      <div className="rounded-2xl border border-red-500/60 bg-gradient-to-r from-red-950/80 via-rose-950/70 to-red-950/80 p-4.5 sm:p-5 shadow-[0_0_35px_rgba(239,68,68,0.4)] space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-red-400 font-bold text-base sm:text-lg">
            <Siren className="w-6 h-6 animate-pulse" />
            <span>{t.emergency.heroTitle}</span>
          </div>
          <button
            onClick={onBackToHome}
            className="text-xs text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Exit</span>
          </button>
        </div>

        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-black/40 border border-red-500/30 text-xs text-red-100">
          <Clock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong className="text-amber-300">The Golden Hour Rule:</strong> Calling your bank and dialing{' '}
            <strong className="text-white bg-red-600/80 px-1 rounded">1930</strong> within 2 hours of a fraudulent transfer maximizes the chance of freezing funds before inter-bank withdrawal.
          </p>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="flex items-center justify-between text-xs font-semibold px-1 text-slate-400">
        <span className={step >= 1 ? 'text-cyan-400' : ''}>1. What Happened</span>
        <span>→</span>
        <span className={step >= 2 ? 'text-cyan-400' : ''}>2. Golden Hour Steps</span>
        <span>→</span>
        <span className={step >= 3 ? 'text-cyan-400' : ''}>3. Official Helplines</span>
      </div>

      {/* Step 1: Select Incident Type */}
      {step === 1 && (
        <div className="space-y-3 rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/90 p-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            {t.emergency.step1Title}
          </h3>

          <div className="space-y-2">
            {[
              { id: 'payment', title: t.emergency.scamTypeMoney, desc: 'UPI transfer, IMPS, credit card charge' },
              { id: 'otp', title: t.emergency.scamTypeOtp, desc: '6-digit OTP, netbanking password, ATM PIN' },
              { id: 'app', title: t.emergency.scamTypeApp, desc: 'AnyDesk, TeamViewer, unknown APK installation' },
              { id: 'link', title: t.emergency.scamTypeLink, desc: 'Phishing website, fake KYC form' },
              { id: 'other', title: t.emergency.scamTypeOther, desc: 'Extortion, deepfake call, identity theft' },
            ].map((opt) => (
              <label
                key={opt.id}
                onClick={() => setSelectedIncidentType(opt.id)}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                  selectedIncidentType === opt.id
                    ? 'bg-cyan-500/20 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <input
                  type="radio"
                  name="incident_type"
                  checked={selectedIncidentType === opt.id}
                  onChange={() => setSelectedIncidentType(opt.id)}
                  className="mt-1 accent-cyan-400"
                />
                <div>
                  <div className="text-xs font-semibold text-slate-100">{opt.title}</div>
                  <div className="text-[11px] text-slate-400">{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Quick Details */}
          <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-slate-400 block mb-1">Estimated Amount Lost (₹):</label>
              <input
                type="number"
                value={amountLost}
                onChange={(e) => setAmountLost(e.target.value)}
                placeholder="e.g. 15000"
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-slate-400 block mb-1">Transaction UTR / Ref ID (if known):</label>
              <input
                type="text"
                value={transactionRef}
                onChange={(e) => setTransactionRef(e.target.value)}
                placeholder="e.g. 423912948291"
                className="w-full p-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            className="w-full mt-2 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-[0_0_20px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center gap-1.5"
          >
            <span>Proceed to Immediate Emergency Steps</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Step 2: Golden Hour Checklist */}
      {step === 2 && (
        <div className="space-y-3 rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/90 p-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              {t.emergency.step2Title}
            </h3>
            <span className="text-[10px] text-amber-400 font-mono">PRIORITY ZERO</span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Checklist item 1 */}
            <div
              onClick={() => toggleChecklist('bankContacted')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                checklist.bankContacted
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-200'
              }`}
            >
              {checklist.bankContacted ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block">{t.emergency.actionFreezeBank}</span>
                <span className="text-[11px] text-slate-400">
                  Call the emergency number on the back of your debit card or use the bank directory below to freeze UPI and accounts.
                </span>
              </div>
            </div>

            {/* Checklist item 2 */}
            <div
              onClick={() => toggleChecklist('cyberHelplineCalled')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                checklist.cyberHelplineCalled
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-200'
              }`}
            >
              {checklist.cyberHelplineCalled ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block">{t.emergency.actionDialHelpline}</span>
                <span className="text-[11px] text-slate-400">
                  In India: Dial 1930 immediately. Keep account number, sender UPI ID, and UTR number ready.
                </span>
              </div>
            </div>

            {/* Checklist item 3 */}
            <div
              onClick={() => toggleChecklist('airplaneMode')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                checklist.airplaneMode
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-200'
              }`}
            >
              {checklist.airplaneMode ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block">{t.emergency.actionDisconnectNet}</span>
                <span className="text-[11px] text-slate-400">
                  Cut off remote control by disconnecting Wi-Fi and mobile data. Uninstall AnyDesk/TeamViewer.
                </span>
              </div>
            </div>

            {/* Checklist item 4 */}
            <div
              onClick={() => toggleChecklist('passwordsChanged')}
              className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-2.5 ${
                checklist.passwordsChanged
                  ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-200'
              }`}
            >
              {checklist.passwordsChanged ? (
                <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              ) : (
                <Square className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block">{t.emergency.actionChangePasswords}</span>
                <span className="text-[11px] text-slate-400">
                  Change NetBanking password and email passwords from another clean phone or laptop.
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              onClick={() => setStep(1)}
              className="px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold"
            >
              Back
            </button>
            <button
              onClick={() => setStep(3)}
              className="flex-1 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-[0_0_15px_rgba(0,240,255,0.3)] transition-all flex items-center justify-center gap-1.5"
            >
              <span>View Emergency Contact Directory</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Emergency Contacts Directory & Generate Dossier */}
      {step === 3 && (
        <div className="space-y-3.5 rounded-2xl border border-cyan-500/20 bg-[#0F1A30]/90 p-4">
          <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
            {t.emergency.step3Title}
          </h3>

          {/* Primary Helpline Card */}
          <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/50 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">National Cybercrime Reporting Portal</div>
              <div className="text-sm font-bold text-red-300 font-mono mt-0.5">Dial: 1930</div>
              <div className="text-[10px] text-slate-300 mt-0.5">Toll-free 24x7 Inter-Bank Freeze Cell</div>
            </div>
            <a
              href="tel:1930"
              className="px-3.5 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(239,68,68,0.5)]"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>Call 1930</span>
            </a>
          </div>

          {/* Bank Emergency Directory */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-cyan-300 uppercase">
              {t.emergency.bankDirectoryTitle}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">SBI Bank</span>
                  <span className="text-[11px] text-slate-400 font-mono">1800 1234 / 1800 2100</span>
                </div>
                <a href="tel:18001234" className="text-cyan-400 font-bold hover:underline">Call</a>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">HDFC Bank</span>
                  <span className="text-[11px] text-slate-400 font-mono">1800 1600 / 1800 2600</span>
                </div>
                <a href="tel:18001600" className="text-cyan-400 font-bold hover:underline">Call</a>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">ICICI Bank</span>
                  <span className="text-[11px] text-slate-400 font-mono">1800 1080</span>
                </div>
                <a href="tel:18001080" className="text-cyan-400 font-bold hover:underline">Call</a>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-200 block">Axis Bank</span>
                  <span className="text-[11px] text-slate-400 font-mono">1860 419 5555</span>
                </div>
                <a href="tel:18604195555" className="text-cyan-400 font-bold hover:underline">Call</a>
              </div>
            </div>
          </div>

          {/* Official Cyber Portal Links */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs space-y-1">
            <span className="font-semibold text-slate-300">Official Filing Portals:</span>
            <div className="flex flex-wrap gap-2 text-[11px] pt-1">
              <a
                href="https://cybercrime.gov.in"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>cybercrime.gov.in (India)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="https://www.ic3.gov"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>ic3.gov (USA)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-slate-600">•</span>
              <a
                href="https://www.actionfraud.police.uk"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Action Fraud (UK)</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Step 4 Generate Incident Report */}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={handleFinishAndGenerateDossier}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-[0_0_25px_rgba(0,240,255,0.35)] transition-all flex items-center justify-center gap-2"
            >
              <FileCheck className="w-4 h-4" />
              <span>{t.emergency.generateReportDraft}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
