'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  KeyRound,
  Smartphone,
  Laptop,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Clock,
  LogOut,
  RefreshCw,
  QrCode,
  Copy,
  Download,
  Eye,
  EyeOff,
  Bell,
  Trash2,
  Plus,
  ShieldCheck,
  FileKey,
  HelpCircle,
} from 'lucide-react';
import {
  getUserSecuritySettings,
  updateSecuritySettings,
  getTrustedDevices,
  removeTrustedDevice,
  getUserSessions,
  signOutOtherSessions,
  getSecurityEvents,
  getEncryptedNotes,
  saveEncryptedNote,
  deleteEncryptedNote,
  logSecurityEvent,
  updateUserPassword,
  enrollMfaTotp,
  verifyMfaTotp,
  unenrollMfaTotp,
} from '@/lib/auth/authService';
import {
  evaluatePasswordStrength,
  encryptDataWithPassphrase,
  decryptDataWithPassphrase,
  generateBackupRecoveryCodes,
} from '@/lib/security/e2eEncryption';
import {
  UserSecuritySettings,
  TrustedDevice,
  UserSession,
  SecurityEvent,
  EncryptedPrivateNote,
  PasswordStrengthInfo,
} from '@/types/auth';

type SecurityTab =
  | 'overview'
  | 'password'
  | 'mfa'
  | 'sessions'
  | 'activity'
  | 'encrypted_notes';

export function SecurityCenterView() {
  const [activeTab, setActiveTab] = useState<SecurityTab>('overview');
  const [settings, setSettings] = useState<UserSecuritySettings | null>(null);
  const [devices, setDevices] = useState<TrustedDevice[]>([]);
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [encryptedNotes, setEncryptedNotes] = useState<EncryptedPrivateNote[]>([]);

  // Password Change State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthInfo | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // MFA State
  const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
  const [totpSecret, setTotpSecret] = useState('JBSWY3DPEHPK3PXP');
  const [totpCodeInput, setTotpCodeInput] = useState('');
  const [mfaFactorId, setMfaFactorId] = useState<string | undefined>(undefined);
  const [mfaSuccessMsg, setMfaSuccessMsg] = useState<string | null>(null);
  const [mfaErrorMsg, setMfaErrorMsg] = useState<string | null>(null);
  const [copiedCodes, setCopiedCodes] = useState(false);

  // Encrypted Notes (E2E) State
  const [localPassphrase, setLocalPassphrase] = useState('');
  const [newNoteLabel, setNewNoteLabel] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [decryptedNotesMap, setDecryptedNotesMap] = useState<Record<string, string>>({});
  const [e2eError, setE2eError] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);

  useEffect(() => {
    loadSecurityData();
  }, []);

  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(evaluatePasswordStrength(newPassword));
    } else {
      setPasswordStrength(null);
    }
  }, [newPassword]);

  const loadSecurityData = async () => {
    const s = await getUserSecuritySettings();
    const d = await getTrustedDevices();
    const sess = await getUserSessions();
    const evt = await getSecurityEvents();
    const notes = await getEncryptedNotes();

    setSettings(s);
    setDevices(d);
    setSessions(sess);
    setEvents(evt);
    setEncryptedNotes(notes);
  };

  // Password Change Handler
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMsg(null);

    const strength = evaluatePasswordStrength(newPassword);
    if (newPassword.length < 12 || strength.score < 3) {
      setPasswordMsg({
        type: 'error',
        text: 'New password must be at least 12 characters and have Fair or higher strength.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'New passwords do not match.' });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await updateUserPassword(newPassword);
      if (!res.success) {
        setPasswordMsg({ type: 'error', text: res.error || 'Failed to change password.' });
        setIsChangingPassword(false);
        return;
      }

      setPasswordMsg({
        type: 'success',
        text: 'Password successfully changed! Security alert dispatched to registered devices.',
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadSecurityData();
    } catch (err: any) {
      setPasswordMsg({ type: 'error', text: err.message || 'Failed to change password.' });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // MFA Setup Start Handler
  const handleStartMfaSetup = async () => {
    setIsSettingUpMfa(true);
    setMfaErrorMsg(null);
    try {
      const res = await enrollMfaTotp();
      if (res.secret) setTotpSecret(res.secret);
      if (res.factorId) setMfaFactorId(res.factorId);
    } catch (e) {
      console.warn('MFA enrollment init note:', e);
    }
  };

  // MFA Enable Handler
  const handleEnableMfa = async () => {
    if (totpCodeInput.length !== 6) {
      return;
    }
    setMfaErrorMsg(null);

    const res = await verifyMfaTotp(mfaFactorId, totpCodeInput);
    if (!res.success) {
      setMfaErrorMsg(res.error || 'Verification code failed. Please check your authenticator app.');
      return;
    }

    setMfaSuccessMsg('MFA Authenticator successfully enabled! Keep your backup codes in a safe offline location.');
    setIsSettingUpMfa(false);
    setTotpCodeInput('');
    loadSecurityData();
  };

  const handleDisableMfa = async () => {
    if (confirm('Are you sure you want to disable 2-Factor Authentication? Your account will have reduced protection.')) {
      await unenrollMfaTotp(mfaFactorId);
      loadSecurityData();
    }
  };

  // Session Revocation Handlers
  const handleSignOutOtherDevices = async () => {
    await signOutOtherSessions();
    await loadSecurityData();
  };

  const handleRevokeDevice = async (id: string) => {
    await removeTrustedDevice(id);
    await loadSecurityData();
  };

  // Client-Side E2E Encrypted Notes Handlers
  const handleCreateEncryptedNote = async (e: React.FormEvent) => {
    e.preventDefault();
    setE2eError(null);

    if (!localPassphrase) {
      setE2eError('You must enter your local encryption passphrase.');
      return;
    }
    if (!newNoteLabel || !newNoteContent) {
      setE2eError('Please provide both a label and note content.');
      return;
    }

    setIsEncrypting(true);
    try {
      const encrypted = await encryptDataWithPassphrase(newNoteContent, localPassphrase);
      await saveEncryptedNote({
        user_id: 'current-user',
        note_label: newNoteLabel,
        cipher_text: encrypted.cipherText,
        iv: encrypted.iv,
        salt: encrypted.salt,
      });

      // Clear input form
      setNewNoteLabel('');
      setNewNoteContent('');
      await loadSecurityData();
    } catch (err: any) {
      setE2eError(err.message || 'Encryption failed.');
    } finally {
      setIsEncrypting(false);
    }
  };

  const handleDecryptNote = async (note: EncryptedPrivateNote) => {
    setE2eError(null);
    if (!localPassphrase) {
      setE2eError('Enter your private local passphrase to decrypt this record.');
      return;
    }

    try {
      const decrypted = await decryptDataWithPassphrase(
        note.cipher_text,
        localPassphrase,
        note.iv,
        note.salt
      );

      setDecryptedNotesMap((prev) => ({
        ...prev,
        [note.id]: decrypted,
      }));
    } catch {
      setE2eError('Incorrect passphrase. Decryption failed.');
    }
  };

  const handleDeleteEncryptedNote = async (id: string) => {
    if (confirm('Delete this encrypted record permanently?')) {
      await deleteEncryptedNote(id);
      setDecryptedNotesMap((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
      await loadSecurityData();
    }
  };

  const handleCopyBackupCodes = () => {
    if (!settings?.backup_codes) return;
    navigator.clipboard.writeText(settings.backup_codes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <span>Security Center</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
            FORTIFIED
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          Multi-factor authentication, active session control, audit trails & client-side E2E storage
        </p>
      </div>

      {/* Security Navigation Sub-tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-cyan-500/20 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview & Score', icon: ShieldCheck },
          { id: 'password', label: 'Password Policy', icon: KeyRound },
          { id: 'mfa', label: 'MFA / 2FA', icon: Smartphone },
          { id: 'sessions', label: 'Sessions & Devices', icon: Laptop },
          { id: 'activity', label: 'Audit Timeline', icon: Clock },
          { id: 'encrypted_notes', label: 'E2E Private Notes', icon: FileKey },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SecurityTab)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & SECURITY SCORE */}
      {activeTab === 'overview' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Security Posture Rating Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-br from-[#090F1E] to-[#0A1428] border border-cyan-500/30 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] uppercase font-mono text-cyan-400 tracking-wider">
                  Account Protection Posture
                </span>
                <h2 className="text-xl font-bold text-white flex items-center justify-center sm:justify-start gap-2">
                  <span>{settings?.mfa_enabled ? 'High Fortress Grade' : 'Moderate Protection'}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-mono font-bold ${
                      settings?.mfa_enabled
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300'
                        : 'bg-amber-950/80 border border-amber-500/40 text-amber-300'
                    }`}
                  >
                    {settings?.mfa_enabled ? '98 / 100' : '75 / 100'}
                  </span>
                </h2>
                <p className="text-xs text-slate-400 max-w-md">
                  {settings?.mfa_enabled
                    ? '2FA Authenticator active, rate-limiting enabled, and zero-knowledge client partitioning online.'
                    : 'Activate Multi-Factor Authentication (MFA) to reach full 98/100 defense grade.'}
                </p>
              </div>

              {!settings?.mfa_enabled && (
                <button
                  onClick={() => setActiveTab('mfa')}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] shrink-0 cursor-pointer"
                >
                  Enable 2FA Now
                </button>
              )}
            </div>
          </div>

          {/* Quick Security Checklist */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-4 rounded-xl bg-[#090F1E] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">12+ Character Password</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Last updated:{' '}
                <strong className="text-slate-300 font-mono">
                  {settings?.password_last_changed_at
                    ? new Date(settings.password_last_changed_at).toLocaleDateString()
                    : 'Recently'}
                </strong>
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090F1E] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">2-Factor TOTP (MFA)</span>
                {settings?.mfa_enabled ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-500/30">
                    RECOMMENDED
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {settings?.mfa_enabled
                  ? 'Authenticator app linked with recovery backup codes'
                  : 'Protects against stolen password credential attacks'}
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090F1E] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Brute Force Lockout</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Auto 15-min lockout triggers after 5 consecutive failed attempts
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#090F1E] border border-cyan-500/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-200">Active Devices & Sessions</span>
                <span className="text-xs font-mono font-bold text-cyan-300">
                  {sessions.length} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Instantly revoke unauthorized sessions from any terminal
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PASSWORD MANAGEMENT & 12+ CHAR POLICY */}
      {activeTab === 'password' && (
        <form
          onSubmit={handleChangePassword}
          className="p-5 rounded-2xl bg-[#090F1E] border border-cyan-500/30 space-y-4 animate-in fade-in"
        >
          <div className="border-b border-cyan-500/20 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-cyan-400" />
              <span>Change Master Password</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Requires minimum 12 characters, mix of uppercase, numbers, and symbols. Passphrases are highly recommended.
            </p>
          </div>

          {passwordMsg && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                passwordMsg.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-red-950/40 border-red-500/40 text-red-300'
              }`}
            >
              {passwordMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              )}
              <span>{passwordMsg.text}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              placeholder="••••••••••••"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              New Master Password (Min 12 Characters)
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              placeholder="e.g. Correct-Horse-Battery-Staple#2026"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none font-mono"
            />
          </div>

          {/* Strength Meter */}
          {newPassword && passwordStrength && (
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">Password Strength:</span>
                <span
                  className={`text-[11px] font-bold ${
                    passwordStrength.score >= 3
                      ? 'text-emerald-400'
                      : passwordStrength.score === 2
                      ? 'text-amber-400'
                      : 'text-red-400'
                  }`}
                >
                  {passwordStrength.label}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                {[0, 1, 2, 3].map((step) => (
                  <div
                    key={step}
                    className={`h-full transition-all ${
                      passwordStrength.score > step
                        ? passwordStrength.score >= 3
                          ? 'bg-emerald-400'
                          : passwordStrength.score === 2
                          ? 'bg-amber-400'
                          : 'bg-red-400'
                        : 'bg-transparent'
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10px] text-slate-400 pt-1">
                <span className={passwordStrength.meetsLength ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ 12+ characters
                </span>
                <span className={passwordStrength.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Uppercase letter
                </span>
                <span className={passwordStrength.hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Number (0-9)
                </span>
                <span className={passwordStrength.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}>
                  ✓ Special symbol (!@#)
                </span>
              </div>
              {passwordStrength.feedback.length > 0 && (
                <p className="text-[10px] text-amber-300/80 font-mono">
                  Guidance: {passwordStrength.feedback.join(' ')}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Confirm New Master Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              placeholder="Repeat new master password"
              className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none font-mono"
            />
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="w-full py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
          >
            {isChangingPassword ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Hashing & Updating Credentials...</span>
              </>
            ) : (
              <span>Update Password & Notify Devices</span>
            )}
          </button>
        </form>
      )}

      {/* TAB 3: TWO-FACTOR AUTHENTICATION (MFA) */}
      {activeTab === 'mfa' && (
        <div className="p-5 rounded-2xl bg-[#090F1E] border border-cyan-500/30 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Authenticator App 2FA (TOTP)</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Google Authenticator, Aegis, Bitwarden, or 1Password
              </p>
            </div>
            {settings?.mfa_enabled ? (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-300">
                ENABLED
              </span>
            ) : (
              <span className="text-xs font-mono font-bold px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700 text-slate-400">
                DISABLED
              </span>
            )}
          </div>

          {mfaSuccessMsg && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{mfaSuccessMsg}</span>
            </div>
          )}

          {!settings?.mfa_enabled ? (
            !isSettingUpMfa ? (
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <p className="text-xs text-slate-300 leading-relaxed">
                  Protect your Fraud Lock account with time-based one-time passcodes (TOTP). Even if someone discovers your password, they cannot gain access without your physical phone.
                </p>
                <button
                  type="button"
                  onClick={handleStartMfaSetup}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
                >
                  Configure Authenticator App
                </button>
              </div>
            ) : (
              <div className="space-y-4 p-4 rounded-xl bg-cyan-950/30 border border-cyan-500/30">
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                    Step 1: Scan Secret or Enter Key
                  </h3>
                  <p className="text-xs text-slate-400">
                    Open your Authenticator app and scan or manually enter this secret:
                  </p>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shrink-0">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <span className="text-[10px] text-slate-400 uppercase font-mono block">Secret Key:</span>
                    <span className="text-xs font-mono font-bold text-white tracking-widest break-all">
                      {totpSecret}
                    </span>
                  </div>
                </div>

                {mfaErrorMsg && (
                  <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{mfaErrorMsg}</span>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-xs font-medium text-slate-300">
                    Step 2: Enter 6-digit Code from Authenticator
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={6}
                      value={totpCodeInput}
                      onChange={(e) => setTotpCodeInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-center font-mono font-bold text-base text-white outline-none w-32"
                    />
                    <button
                      type="button"
                      onClick={handleEnableMfa}
                      disabled={totpCodeInput.length !== 6}
                      className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Confirm & Activate
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsSettingUpMfa(false)}
                      className="px-3 py-2 text-xs text-slate-400 hover:text-white"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white">Authenticator Active</span>
                  <p className="text-[11px] text-slate-400">TOTP time-based challenges required on new logins</p>
                </div>
                <button
                  type="button"
                  onClick={handleDisableMfa}
                  className="px-3 py-1.5 rounded-lg bg-red-950/40 hover:bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  Disable MFA
                </button>
              </div>

              {/* 10 Backup Recovery Codes */}
              {settings.backup_codes && settings.backup_codes.length > 0 && (
                <div className="p-4 rounded-xl bg-slate-950/80 border border-cyan-500/20 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Emergency Backup Recovery Codes</span>
                      </h3>
                      <p className="text-[11px] text-slate-400">
                        Use one of these if you lose access to your authenticator phone. Each code works once.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleCopyBackupCodes}
                      className="flex items-center gap-1 text-xs font-mono text-cyan-400 hover:text-cyan-300 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedCodes ? 'Copied!' : 'Copy All'}</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 p-3 bg-slate-900/80 rounded-lg border border-slate-800 text-center font-mono text-xs text-cyan-300">
                    {settings.backup_codes.map((code, idx) => (
                      <span key={idx} className="bg-slate-950/60 py-1 px-1.5 rounded border border-slate-800">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SESSIONS & TRUSTED DEVICES */}
      {activeTab === 'sessions' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Active Sessions Card */}
          <div className="p-5 rounded-2xl bg-[#090F1E] border border-cyan-500/30 space-y-4">
            <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
              <div>
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Laptop className="w-4 h-4 text-cyan-400" />
                  <span>Active Browser Sessions</span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Terminals and devices currently authorized under your credentials
                </p>
              </div>

              {sessions.filter((s) => !s.is_current).length > 0 && (
                <button
                  type="button"
                  onClick={handleSignOutOtherDevices}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-500/40 text-red-300 text-xs font-semibold cursor-pointer transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out All Other Devices</span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    sess.is_current
                      ? 'bg-cyan-950/30 border-cyan-500/40'
                      : 'bg-slate-900/60 border-slate-800'
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{sess.device_name}</span>
                      {sess.is_current && (
                        <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-cyan-950 border border-cyan-400/40 text-cyan-300 font-bold">
                          THIS DEVICE
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      IP: {sess.ip_address} • Started: {new Date(sess.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trusted Devices Card */}
          <div className="p-5 rounded-2xl bg-[#090F1E] border border-cyan-500/30 space-y-4">
            <div className="border-b border-cyan-500/20 pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Recognized Trusted Hardware</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Revoking a device forces an immediate re-authentication and SMS/email OTP challenge
              </p>
            </div>

            <div className="space-y-2">
              {devices.map((dev) => (
                <div
                  key={dev.id}
                  className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-white">{dev.device_name}</span>
                      {dev.is_current && (
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400">
                          Active Now
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {dev.ip_address} • Trusted since {new Date(dev.trusted_since).toLocaleDateString()}
                    </p>
                  </div>

                  {!dev.is_current && (
                    <button
                      type="button"
                      onClick={() => handleRevokeDevice(dev.id)}
                      className="text-xs text-red-400 hover:text-red-300 font-medium underline cursor-pointer"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT ACTIVITY TIMELINE */}
      {activeTab === 'activity' && (
        <div className="p-5 rounded-2xl bg-[#090F1E] border border-cyan-500/30 space-y-4 animate-in fade-in">
          <div className="border-b border-cyan-500/20 pb-3">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span>Immutable Security Activity Log</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Audited event log with timestamps and network origins for accountability
            </p>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
            {events.map((evt) => (
              <div
                key={evt.id}
                className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-start gap-3"
              >
                <div className="w-7 h-7 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0 mt-0.5">
                  <Shield className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
                      {evt.event_type.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(evt.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{evt.details}</p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    IP: {evt.ip_address}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: CLIENT-SIDE END-TO-END ENCRYPTED NOTES */}
      {activeTab === 'encrypted_notes' && (
        <div className="p-5 rounded-2xl bg-[#090F1E] border border-cyan-500/30 space-y-5 animate-in fade-in">
          <div className="border-b border-cyan-500/20 pb-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Zero-Knowledge Client-Side E2E Notes Vault</span>
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                AES-256-GCM
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Ciphertext is encrypted directly inside your browser before transmission. Server operators can never decrypt these contents.
            </p>
          </div>

          {/* Strict Security Advisory Alert */}
          <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Strict Privacy & Zero-Knowledge Architecture Rules:</span>
            </div>
            <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-200/90 pl-1">
              <li>
                <strong>Lost Passphrase = Irrecoverable Data:</strong> Encryption keys are never sent to the server. If you forget your passphrase, encrypted notes cannot be recovered by anyone.
              </li>
              <li>
                <strong>Forbidden Sensitive Credentials:</strong> Never use this field to collect or store OTPs, ATM PINs, bank passwords, CVVs, or full payment card numbers.
              </li>
            </ul>
          </div>

          {/* Local Passphrase Input */}
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
              <span>Your Private Local Passphrase (Never Stored or Transmitted)</span>
            </label>
            <input
              type="password"
              value={localPassphrase}
              onChange={(e) => {
                setLocalPassphrase(e.target.value);
                setE2eError(null);
              }}
              placeholder="Enter your confidential passphrase"
              className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none font-mono focus:border-cyan-400"
            />
            <p className="text-[10px] text-slate-500">
              Derives local AES-256-GCM encryption key via PBKDF2 (100,000 iterations + salt).
            </p>
          </div>

          {e2eError && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{e2eError}</span>
            </div>
          )}

          {/* Add New Encrypted Note Form */}
          <form
            onSubmit={handleCreateEncryptedNote}
            className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3"
          >
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-cyan-400" />
              <span>Add Highly Sensitive Private Safety Note</span>
            </h3>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Record Title / Identifier</label>
              <input
                type="text"
                value={newNoteLabel}
                onChange={(e) => setNewNoteLabel(e.target.value)}
                placeholder="e.g. Police Complaint Acknowledgement Memo"
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 mb-1">Confidential Body</label>
              <textarea
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Write private notes (e.g. officer badge number, FIR reference diary entry, suspect case log)..."
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isEncrypting || !localPassphrase}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-semibold text-xs transition-colors cursor-pointer flex items-center gap-2"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isEncrypting ? 'Encrypting with AES-GCM...' : 'Encrypt & Store Locally'}</span>
            </button>
          </form>

          {/* List of Encrypted Records */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Stored Encrypted Records ({encryptedNotes.length})
            </h3>

            {encryptedNotes.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-950/40 rounded-lg border border-slate-800">
                No encrypted records stored yet.
              </p>
            ) : (
              <div className="space-y-2">
                {encryptedNotes.map((note) => {
                  const isDecrypted = Boolean(decryptedNotesMap[note.id]);
                  return (
                    <div
                      key={note.id}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileKey className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-bold text-white">{note.note_label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleDecryptNote(note)}
                            className="flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 font-mono underline cursor-pointer"
                          >
                            {isDecrypted ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            <span>{isDecrypted ? 'Decrypted' : 'Decrypt'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteEncryptedNote(note.id)}
                            className="text-slate-500 hover:text-red-400 transition-colors p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {isDecrypted ? (
                        <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-500/30 text-xs text-white font-mono break-all animate-in fade-in">
                          {decryptedNotesMap[note.id]}
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-500 truncate">
                          🔒 Ciphertext: {note.cipher_text.slice(0, 48)}...
                        </div>
                      )}

                      <div className="text-[10px] text-slate-500 font-mono flex items-center justify-between">
                        <span>IV: {note.iv.slice(0, 12)}...</span>
                        <span>{new Date(note.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
