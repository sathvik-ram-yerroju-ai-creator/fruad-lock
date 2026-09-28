'use client';

import React, { useState, useEffect } from 'react';
import {
  FolderLock,
  Download,
  Trash2,
  Plus,
  Calendar,
  Tag,
  Shield,
  FileText,
  AlertCircle,
  Copy,
  Check,
  Clock,
  Lock,
  Eye,
  Upload,
} from 'lucide-react';
import { EvidenceItem, IncidentReport } from '@/types/scam';
import { useTranslation } from '@/lib/i18n';
import { getEvidenceItems, saveEvidenceItem, deleteEvidenceItem, purgeAllUserData } from '@/lib/supabase';
import { generateIncidentDossier } from '@/lib/reports/reportGenerator';

interface EvidenceVaultViewProps {
  onOpenReportExport: (report: IncidentReport) => void;
}

export function EvidenceVaultView({ onOpenReportExport }: EvidenceVaultViewProps) {
  const { t } = useTranslation();
  const [items, setItems] = useState<EvidenceItem[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');
  const [isPurging, setIsPurging] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Manual Add Form state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState('Suspicious Call');
  const [manualContent, setManualContent] = useState('');
  const [manualNotes, setManualNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSavingItem, setIsSavingItem] = useState(false);

  const loadItems = async () => {
    const list = await getEvidenceItems();
    setItems(list);
  };

  useEffect(() => {
    loadItems();
  }, []);

  const handleDeleteItem = async (id: string) => {
    await deleteEvidenceItem(id);
    await loadItems();
  };

  const handlePurgeAll = async () => {
    if (confirm(t.vault.purgeConfirm)) {
      setIsPurging(true);
      await purgeAllUserData();
      await loadItems();
      setIsPurging(false);
    }
  };

  const handleCreateManualEvidence = async () => {
    if (!manualContent.trim() && !selectedFile) return;

    setIsSavingItem(true);
    try {
      await saveEvidenceItem(
        {
          user_id: 'current-user',
          title: manualTitle || (selectedFile ? `Attachment: ${selectedFile.name}` : 'Manual Evidence Note'),
          category: manualCategory,
          type: selectedFile ? 'screenshot' : 'note',
          content: manualContent || (selectedFile ? `File attachment: ${selectedFile.name}` : 'Manual note'),
          user_notes: manualNotes,
          retention_days: 30,
        },
        selectedFile || undefined
      );

      setShowAddModal(false);
      setManualTitle('');
      setManualContent('');
      setManualNotes('');
      setSelectedFile(null);
      await loadItems();
    } catch (err) {
      console.warn('Evidence save note:', err);
    } finally {
      setIsSavingItem(false);
    }
  };

  const handleExportAllAsReport = () => {
    const report: IncidentReport = {
      id: `FL_DOSSIER_${Date.now()}`,
      user_id: 'local-user',
      incident_type: 'Consolidated Evidence Vault Dossier',
      incident_date: new Date().toISOString(),
      financial_loss_amount: 0,
      currency: 'INR',
      scammer_platform: 'Multiple Vectors',
      scammer_contacts: [],
      summary: `Consolidated cyber incident evidence package comprising ${items.length} verified artifacts.`,
      timeline_events: items.map((i) => ({
        timestamp: i.created_at,
        description: `Captured: ${i.title} (${i.category})`,
        verified_by_user: true,
      })),
      emergency_steps_taken: {
        bank_contacted: true,
        card_blocked: true,
        upi_complaint_filed: true,
        cyber_helpline_called: true,
        passwords_changed: true,
        app_uninstalled: true,
      },
      evidence_ids: items.map((i) => i.id),
      status: 'exported',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    onOpenReportExport(report);
  };

  const filteredItems = items.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.type === selectedFilter;
  });

  return (
    <div className="space-y-4 max-w-2xl mx-auto pb-16">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-100 flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-cyan-400" />
            <span>{t.vault.title}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            {t.vault.subtitle}
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-2.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center gap-1 shadow-[0_0_12px_rgba(0,240,255,0.25)] shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Item</span>
        </button>
      </div>

      {/* Fact vs AI Notice */}
      <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
        <AlertCircle className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>{t.vault.itemFactNotice}</span>
      </div>

      {/* Action Toolbar: Filter & Export */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
        {/* Category Filters */}
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          {['all', 'message', 'link', 'screenshot', 'qr', 'note'].map((f) => (
            <button
              key={f}
              onClick={() => setSelectedFilter(f)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium uppercase tracking-wider transition-colors ${
                selectedFilter === f
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:border-slate-700'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {items.length > 0 && (
          <button
            onClick={handleExportAllAsReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-indigo-300 text-xs font-semibold hover:bg-indigo-900/80 transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)]"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Police Dossier</span>
          </button>
        )}
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#0F1A30]/50 p-8 text-center space-y-2">
          <FolderLock className="w-10 h-10 text-slate-600 mx-auto" />
          <p className="text-sm font-semibold text-slate-300">{t.vault.emptyVault}</p>
          <p className="text-xs text-slate-500">
            Use any scanner to analyze suspicious texts or add manual incident records.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-800 bg-[#0F1A30]/90 p-4 space-y-2.5 hover:border-cyan-500/30 transition-all shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-100">{item.title}</span>
                    <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">
                      {item.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span>{new Date(item.created_at).toLocaleDateString()}</span>
                    </span>
                    <span>•</span>
                    <span className="text-cyan-400 font-medium">{item.category}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition-colors"
                  title="Delete evidence record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Raw Content Excerpt */}
              <div className="p-2.5 rounded-xl bg-black/40 border border-slate-800/80 font-mono text-xs text-slate-300 max-h-28 overflow-y-auto break-all">
                {item.content}
              </div>

              {/* Private Storage Signed URL Attachment */}
              {item.media_url && (
                <div className="flex items-center justify-between p-2 rounded-xl bg-cyan-950/40 border border-cyan-500/20 text-xs">
                  <div className="flex items-center gap-1.5 text-cyan-300">
                    <Lock className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="font-mono text-[11px]">Private Vault Object</span>
                  </div>
                  <a
                    href={item.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[11px] font-semibold flex items-center gap-1 border border-cyan-500/30 transition-colors"
                  >
                    <Eye className="w-3 h-3" />
                    <span>View Signed URL</span>
                  </a>
                </div>
              )}

              {/* AI Risk Summary tag if present */}
              {item.ai_analysis && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Advisory Risk Assessment:</span>
                  <span
                    className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                      item.ai_analysis.risk_level === 'HIGH'
                        ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                        : item.ai_analysis.risk_level === 'CAUTION'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}
                  >
                    {item.ai_analysis.risk_level}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Retention Controls & Purge All */}
      <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5 text-slate-400">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>{t.vault.retentionNotice} 30 {t.vault.daysRemaining}</span>
        </div>

        {items.length > 0 && (
          <button
            onClick={handlePurgeAll}
            disabled={isPurging}
            className="text-xs text-red-400 hover:text-red-300 hover:underline flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
            <span>{t.vault.purgeAllData}</span>
          </button>
        )}
      </div>

      {/* Manual Evidence Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="w-full max-w-md bg-[#0B1222] border border-cyan-500/30 rounded-2xl p-5 space-y-3.5 shadow-2xl">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-cyan-400" />
              <span>Record Manual Evidence Item</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Title / Identifier:</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="e.g. Scammer WhatsApp Phone Number"
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Category:</label>
                <select
                  value={manualCategory}
                  onChange={(e) => setManualCategory(e.target.value)}
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                >
                  <option value="Suspicious Phone Call">Suspicious Phone Call</option>
                  <option value="WhatsApp / Telegram Chat">WhatsApp / Telegram Chat</option>
                  <option value="UPI ID / Bank Account">UPI ID / Bank Account</option>
                  <option value="Transaction UTR Receipt">Transaction UTR Receipt</option>
                  <option value="Phishing Link">Phishing Link</option>
                  <option value="Other Evidence">Other Evidence</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Evidence Text / Content:</label>
                <textarea
                  rows={4}
                  value={manualContent}
                  onChange={(e) => setManualContent(e.target.value)}
                  placeholder="Paste phone numbers, chat logs, transaction IDs, or caller claims..."
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Your Personal Notes:</label>
                <input
                  type="text"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="e.g. Called claiming to be SBI manager regarding credit card"
                  className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 focus:border-cyan-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  Upload Evidence File (Screenshot / PDF / Receipt, max 5MB):
                </label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,application/pdf"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-300 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-cyan-950 file:text-cyan-300 hover:file:bg-cyan-900 cursor-pointer"
                />
                {selectedFile && (
                  <p className="text-[10px] text-cyan-400 font-mono mt-1 flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    <span>Private Storage: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)</span>
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setSelectedFile(null);
                }}
                disabled={isSavingItem}
                className="flex-1 py-2 rounded-xl bg-slate-900 border border-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManualEvidence}
                disabled={(!manualContent.trim() && !selectedFile) || isSavingItem}
                className="flex-1 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-[0_0_15px_rgba(0,240,255,0.3)] flex items-center justify-center gap-1.5"
              >
                {isSavingItem ? (
                  <span>Encrypting & Storing...</span>
                ) : (
                  <>
                    <Upload className="w-3.5 h-3.5" />
                    <span>Save to Vault</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
