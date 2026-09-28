'use client';

import React, { useState } from 'react';
import { FileText, Download, Copy, Check, X, Shield, ExternalLink, Printer } from 'lucide-react';
import { IncidentReport, EvidenceItem } from '@/types/scam';
import { generateIncidentDossier, GeneratedReportDocument } from '@/lib/reports/reportGenerator';

interface ReportExportModalProps {
  report: IncidentReport;
  evidenceItems?: EvidenceItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function ReportExportModal({
  report,
  evidenceItems = [],
  isOpen,
  onClose,
}: ReportExportModalProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'preview' | 'json'>('preview');

  if (!isOpen) return null;

  const dossier: GeneratedReportDocument = generateIncidentDossier(report, evidenceItems);

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(dossier.markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fraud Lock Cyber Incident Dossier - ${report.id}</title>
            <style>
              body { font-family: monospace; padding: 20px; line-height: 1.5; color: #111; }
              pre { white-space: pre-wrap; word-wrap: break-word; }
            </style>
          </head>
          <body>
            <pre>${dossier.markdown}</pre>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-3xl max-h-[90vh] bg-[#0B1222] border border-cyan-500/40 rounded-3xl p-5 sm:p-6 flex flex-col shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base sm:text-lg font-bold text-slate-100">
                Official Incident Evidence Dossier
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Structured package for submission to Cyber Crime Cells, Police, and Bank Fraud Departments.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
          <strong>Admissibility Note: </strong>
          User-attested factual statements (amounts, dates, contacts) and AI risk indicators (pattern heuristics) are strictly compartmentalized for legal clarity.
        </div>

        {/* Tab switchers & actions */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'preview'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Formatted Dossier
            </button>
            <button
              onClick={() => setActiveTab('json')}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'json'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Raw JSON Data
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-200 text-xs font-semibold transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-slate-300" />
              <span>Print</span>
            </button>

            <button
              onClick={() =>
                handleDownloadFile(
                  activeTab === 'preview' ? dossier.markdown : dossier.jsonBlob,
                  `FraudLock_Incident_${report.id}.${activeTab === 'preview' ? 'md' : 'json'}`,
                  activeTab === 'preview' ? 'text/markdown' : 'application/json'
                )
              }
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-[0_0_12px_rgba(0,240,255,0.25)] transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .{activeTab === 'preview' ? 'md' : 'json'}</span>
            </button>
          </div>
        </div>

        {/* Content Preview Box */}
        <div className="flex-1 overflow-y-auto p-4 rounded-2xl bg-black/50 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed max-h-[50vh]">
          {activeTab === 'preview' ? (
            <pre className="whitespace-pre-wrap font-mono">{dossier.markdown}</pre>
          ) : (
            <pre className="whitespace-pre-wrap font-mono text-cyan-300">{dossier.jsonBlob}</pre>
          )}
        </div>

        {/* Submission Guidance Footer */}
        <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <span>Ready to file at cybercrime.gov.in (India 1930) or ic3.gov (USA)</span>
          <a
            href="https://cybercrime.gov.in"
            target="_blank"
            rel="noreferrer"
            className="text-cyan-400 font-bold hover:underline flex items-center gap-1"
          >
            <span>Open National Cybercrime Portal</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
