'use client';

import React, { useState } from 'react';
import { MapPin, TrendingUp, TrendingDown, Minus, AlertCircle, Shield, Globe } from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { ThreatMapPoint } from '@/types/scam';

const REGIONAL_THREAT_DATA: ThreatMapPoint[] = [
  {
    id: 'region-north',
    region: 'Northern Zone (Delhi NCR, Haryana, UP)',
    country: 'India',
    approx_lat: 28.6139,
    approx_lng: 77.2090,
    scam_category: 'Electricity Bill Cut & Courier Drugs Extortion',
    report_count: 1420,
    trend: 'increasing',
    recent_sample_summary: 'Spike in fake electricity bill SMS sent after 7 PM threatening power cuts at 9:30 PM.',
    updated_at: '2026-09-28T04:00:00Z',
  },
  {
    id: 'region-west',
    region: 'Western Zone (Mumbai, Pune, Ahmedabad)',
    country: 'India',
    approx_lat: 19.0760,
    approx_lng: 72.8777,
    scam_category: 'Customs Digital Arrest & AnyDesk Support',
    report_count: 1890,
    trend: 'increasing',
    recent_sample_summary: 'High incidence of Skype video call extortion impersonating Crime Branch and narcotics officers.',
    updated_at: '2026-09-28T04:30:00Z',
  },
  {
    id: 'region-south',
    region: 'Southern Zone (Bengaluru, Hyderabad, Chennai)',
    country: 'India',
    approx_lat: 12.9716,
    approx_lng: 77.5946,
    scam_category: 'Telegram Part-Time Task & YouTube Like Scams',
    report_count: 2150,
    trend: 'increasing',
    recent_sample_summary: 'Prepaid task investment scams targeting tech employees with promise of ₹5000 daily payout.',
    updated_at: '2026-09-28T05:00:00Z',
  },
  {
    id: 'region-east',
    region: 'Eastern Zone (Kolkata, Patna, Bhubaneswar)',
    country: 'India',
    approx_lat: 22.5726,
    approx_lng: 88.3639,
    scam_category: 'Fake KYC / SIM Deactivation SMS',
    report_count: 980,
    trend: 'stable',
    recent_sample_summary: 'SMS claiming 4G/5G SIM card will be blocked unless Aadhaar document is uploaded.',
    updated_at: '2026-09-28T03:15:00Z',
  },
  {
    id: 'region-global',
    region: 'International & Cross-Border Scams',
    country: 'Global',
    approx_lat: 0,
    approx_lng: 0,
    scam_category: 'Cryptocurrency Arbitrage & Romance Scams',
    report_count: 3410,
    trend: 'increasing',
    recent_sample_summary: 'Fake trading websites hosted on foreign VPS servers promising 200% return in 48 hours.',
    updated_at: '2026-09-28T02:00:00Z',
  },
];

export function ThreatMapView() {
  const { t } = useTranslation();
  const [selectedPoint, setSelectedPoint] = useState<ThreatMapPoint>(REGIONAL_THREAT_DATA[0]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
          <Globe className="w-5 h-5 text-cyan-400" />
          <span>{t.threatMap.title}</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.threatMap.subtitle}
        </p>
      </div>

      {/* Mandatory Regulatory / Accuracy Disclaimer */}
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-amber-200">Legal Notice: </strong>
          {t.threatMap.disclaimer}
        </p>
      </div>

      {/* Regional Selector Pills */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          {t.threatMap.trendTitle}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {REGIONAL_THREAT_DATA.map((pt) => {
            const isSelected = selectedPoint.id === pt.id;
            return (
              <div
                key={pt.id}
                onClick={() => setSelectedPoint(pt)}
                className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                  isSelected
                    ? 'bg-cyan-950/70 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
                    : 'bg-[#0F1A30]/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{pt.region}</span>
                  </span>
                  <span
                    className={`flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded font-semibold ${
                      pt.trend === 'increasing'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {pt.trend === 'increasing' ? <TrendingUp className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                    <span>{pt.trend.toUpperCase()}</span>
                  </span>
                </div>

                <div className="text-[11px] text-cyan-300 font-medium">
                  {pt.scam_category}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>Aggregated Incident Reports:</span>
                  <span className="text-slate-200 font-bold">{pt.report_count.toLocaleString()}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Region Detailed Card */}
      {selectedPoint && (
        <div className="rounded-2xl border border-cyan-500/30 bg-[#0F1A30] p-4.5 space-y-3 shadow-lg">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
            <div>
              <span className="text-[10px] font-mono uppercase text-cyan-400">Coarse Threat Cluster</span>
              <h3 className="text-sm sm:text-base font-bold text-slate-100">
                {selectedPoint.region}
              </h3>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block font-mono">Report Volume</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                {selectedPoint.report_count.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="space-y-1.5 text-xs text-slate-300">
            <span className="font-semibold text-slate-200">Active Threat Modus Operandi:</span>
            <p className="bg-black/30 p-3 rounded-xl border border-slate-800 leading-relaxed">
              {selectedPoint.recent_sample_summary}
            </p>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Aggregated Level: Broad Regional Zone</span>
            <span className="font-mono text-slate-400">Updated: Today</span>
          </div>
        </div>
      )}
    </div>
  );
}
