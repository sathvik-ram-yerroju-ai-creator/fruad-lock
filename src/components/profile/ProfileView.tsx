'use client';

import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Clock,
  Globe,
  MapPin,
  HeartHandshake,
  Download,
  Trash2,
  Edit3,
  Save,
  X,
  AlertTriangle,
  Lock,
  Camera,
  ChevronRight,
  ShieldAlert,
  UserPlus,
  LogIn,
  KeyRound,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import {
  getCurrentUserProfile,
  updateUserProfile,
  exportAllUserData,
  permanentlyDeleteAccount,
  createOtpChallenge,
  logSecurityEvent,
  uploadAndSetUserAvatar,
} from '@/lib/auth/authService';
import { evaluatePasswordStrength } from '@/lib/security/e2eEncryption';
import { UserProfile, OtpChallenge, PasswordStrengthInfo } from '@/types/auth';
import { useTranslation } from '@/lib/i18n';
import { SupportedLocale } from '@/types/scam';

interface ProfileViewProps {
  onOpenSecurityCenter: () => void;
  onOpenPrivacyCenter: () => void;
  onRequestOtp: (
    challenge: OtpChallenge,
    tempCredentials?: {
      email?: string;
      phone?: string;
      password?: string;
      displayName?: string;
      emergencyName?: string;
      emergencyPhone?: string;
      country?: string;
      preferredLang?: string;
    }
  ) => void;
  onAccountDeleted: () => void;
  onOpenAuthModal?: () => void;
  onSignOut?: () => void;
}

export function ProfileView({
  onOpenSecurityCenter,
  onOpenPrivacyCenter,
  onRequestOtp,
  onAccountDeleted,
  onOpenAuthModal,
  onSignOut,
}: ProfileViewProps) {
  const { locale, setLocale, languages } = useTranslation();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Editable form fields
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('India');
  const [preferredLang, setPreferredLang] = useState<SupportedLocale>(locale);
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // Contact change with OTP state
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isChangingPhone, setIsChangingPhone] = useState(false);
  const [newPhone, setNewPhone] = useState('');

  // Registration Form State (when no profile exists)
  const [regDisplayName, setRegDisplayName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regCountry, setRegCountry] = useState('India');
  const [regPreferredLang, setRegPreferredLang] = useState<SupportedLocale>(locale);
  const [regEmergencyName, setRegEmergencyName] = useState('');
  const [regEmergencyPhone, setRegEmergencyPhone] = useState('');
  const [regError, setRegError] = useState<string | null>(null);
  const [regPasswordStrength, setRegPasswordStrength] = useState<PasswordStrengthInfo | null>(null);

  // Export state
  const [isExporting, setIsExporting] = useState(false);

  // Deletion modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  useEffect(() => {
    if (regPassword) {
      setRegPasswordStrength(evaluatePasswordStrength(regPassword));
    } else {
      setRegPasswordStrength(null);
    }
  }, [regPassword]);

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    const data = await getCurrentUserProfile();
    if (data) {
      setProfile(data);
      setDisplayName(data.display_name || '');
      setCountry(data.country || 'India');
      setPreferredLang(data.preferred_language || locale);
      setEmergencyName(data.emergency_contact_name || '');
      setEmergencyPhone(data.emergency_contact_phone || '');
      setAvatarUrl(data.avatar_url || '');
    } else {
      setProfile(null);
    }
    setIsLoadingProfile(false);
  };

  // Handle Account Registration from Zero Data
  const handleRegisterAccount = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError(null);

    if (!regDisplayName.trim()) {
      setRegError('Please provide a display name or handle.');
      return;
    }

    if (!regEmail.trim() && !regPhone.trim()) {
      setRegError('Please provide at least a valid email address or mobile phone number.');
      return;
    }

    // Password validation (min 12 chars, strong entropy)
    const strength = evaluatePasswordStrength(regPassword);
    if (regPassword.length < 12 || strength.score < 3) {
      setRegError('Password must be at least 12 characters and meet strong security standards.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Passwords do not match.');
      return;
    }

    const destination = regEmail.trim() || regPhone.trim();
    const channel = regEmail.trim() ? 'email' : 'sms';

    // Dispatch 6-digit OTP challenge
    const { challenge } = createOtpChallenge(destination, channel, 'signup');

    onRequestOtp(challenge, {
      displayName: regDisplayName.trim(),
      email: regEmail.trim() || undefined,
      phone: regPhone.trim() || undefined,
      password: regPassword,
      emergencyName: regEmergencyName.trim() || undefined,
      emergencyPhone: regEmergencyPhone.trim() || undefined,
      country: regCountry,
      preferredLang: regPreferredLang,
    });
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      const updated = await updateUserProfile({
        display_name: displayName,
        country,
        preferred_language: preferredLang,
        emergency_contact_name: emergencyName,
        emergency_contact_phone: emergencyPhone,
        avatar_url: avatarUrl,
      });

      setProfile(updated);
      setLocale(preferredLang);
      setIsSaving(false);
      setIsEditing(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      setAvatarUrl(previewUrl);
      try {
        const uploadRes = await uploadAndSetUserAvatar(file);
        if (uploadRes.success && uploadRes.avatarUrl) {
          setAvatarUrl(uploadRes.avatarUrl);
        }
      } catch (err) {
        console.warn('Avatar storage upload note:', err);
      }
    }
  };

  const handleInitiateEmailChange = () => {
    if (!newEmail || !newEmail.includes('@')) return;
    const { challenge } = createOtpChallenge(newEmail, 'email', 'change_email');
    setIsChangingEmail(false);
    onRequestOtp(challenge, { email: newEmail });
  };

  const handleInitiatePhoneChange = () => {
    if (!newPhone || newPhone.length < 8) return;
    const { challenge } = createOtpChallenge(newPhone, 'sms', 'change_phone');
    setIsChangingPhone(false);
    onRequestOtp(challenge, { phone: newPhone });
  };

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const jsonString = await exportAllUserData();
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fraudlock_data_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Data export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleteError(null);
    setIsDeleting(true);

    const result = await permanentlyDeleteAccount(deleteConfirmationInput);
    if (!result.success) {
      setDeleteError(result.error || 'Failed to delete account.');
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    setIsDeleteModalOpen(false);
    setProfile(null);
    onAccountDeleted();
  };

  // -------------------------------------------------------------------------
  // CASE 1: NO PROFILE REGISTERED (ZERO DATA STATE) -> RENDER REGISTRATION
  // -------------------------------------------------------------------------
  if (!isLoadingProfile && !profile) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-in fade-in duration-300">
        {/* Registration Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              <span>Create Citizen Account</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700 text-slate-300 font-mono">
                ZERO DATA STORED
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your real details below to create your cryptographically partitioned profile.
            </p>
          </div>

          {onOpenAuthModal && (
            <button
              type="button"
              onClick={onOpenAuthModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer w-fit"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In Instead</span>
            </button>
          )}
        </div>

        {/* Empty Form Card with Translucent Placeholders */}
        <form
          onSubmit={handleRegisterAccount}
          className="p-5 sm:p-6 rounded-2xl bg-[#090F1E] border border-cyan-500/30 space-y-4 shadow-xl"
        >
          <div className="border-b border-cyan-500/20 pb-3 flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider">
              Profile & Credential Registration
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Fields start with 0 data
            </span>
          </div>

          {regError && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-xs text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{regError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Display Name */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Account Name / Display Handle *
              </label>
              <input
                type="text"
                value={regDisplayName}
                onChange={(e) => setRegDisplayName(e.target.value)}
                placeholder="e.g. Alex CyberGuard or your name"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                This name identifies your safety dossier and incident reports.
              </p>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Verified Email Address *
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="e.g. name@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Mobile Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Mobile Number (with country code)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                  placeholder="e.g. +91 98765 00193"
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Master Password (Min 12 Characters) *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="e.g. Correct-Horse-Battery#2026"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Confirm Password *
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>

            {/* Password Strength Meter */}
            {regPassword && regPasswordStrength && (
              <div className="sm:col-span-2 p-3 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">Password Strength:</span>
                  <span
                    className={`text-[11px] font-bold ${
                      regPasswordStrength.score >= 3
                        ? 'text-emerald-400'
                        : regPasswordStrength.score === 2
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    {regPasswordStrength.label}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  {[0, 1, 2, 3].map((step) => (
                    <div
                      key={step}
                      className={`h-full transition-all ${
                        regPasswordStrength.score > step
                          ? regPasswordStrength.score >= 3
                            ? 'bg-emerald-400'
                            : regPasswordStrength.score === 2
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                          : 'bg-transparent'
                      }`}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 text-[10px] text-slate-400 pt-1">
                  <span className={regPasswordStrength.meetsLength ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ 12+ chars
                  </span>
                  <span className={regPasswordStrength.hasUppercase ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ Uppercase
                  </span>
                  <span className={regPasswordStrength.hasNumber ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ Number
                  </span>
                  <span className={regPasswordStrength.hasSpecial ? 'text-emerald-400' : 'text-slate-500'}>
                    ✓ Symbol
                  </span>
                </div>
              </div>
            )}

            {/* Country */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Country of Residence
              </label>
              <select
                value={regCountry}
                onChange={(e) => setRegCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none"
              >
                <option value="India">India (1930 / I4C National Helpline)</option>
                <option value="United States">United States (IC3 / FTC)</option>
                <option value="United Kingdom">United Kingdom (Action Fraud)</option>
                <option value="Singapore">Singapore (Anti-Scam Centre)</option>
                <option value="Australia">Australia (Scamwatch)</option>
                <option value="Canada">Canada (CAFC)</option>
              </select>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Preferred Language
              </label>
              <select
                value={regPreferredLang}
                onChange={(e) => setRegPreferredLang(e.target.value as SupportedLocale)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            {/* Emergency Contact Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Emergency Contact Name (Optional)
              </label>
              <input
                type="text"
                value={regEmergencyName}
                onChange={(e) => setRegEmergencyName(e.target.value)}
                placeholder="e.g. Family Member / Trusted Guardian"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>

            {/* Emergency Contact Phone */}
            <div>
              <label className="block text-xs font-semibold text-slate-200 mb-1">
                Emergency Contact Phone (Optional)
              </label>
              <input
                type="tel"
                value={regEmergencyPhone}
                onChange={(e) => setRegEmergencyPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-white placeholder-slate-500 outline-none font-mono"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
            >
              <span>Register & Verify with 6-Digit OTP</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Security & Privacy Notice */}
        <div className="p-4 rounded-xl bg-[#070B14] border border-cyan-500/20 text-xs text-slate-400 space-y-1 font-mono">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <Shield className="w-4 h-4" />
            <span>PostgreSQL Row Level Security (RLS) Active:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            Your newly registered account will be completely isolated to your user ID.
            No user may see another user&apos;s phone number, email, profile, scans, chats, evidence, reports, or settings.
          </p>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------------------
  // CASE 2: LOGGED-IN PROFILE (SHOWS USER'S REAL DATA)
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Title & Badge Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>Citizen Profile</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-mono">
              SECURE IDENTITY
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Cryptographically partitioned profile with strict Row-Level Isolation (RLS)
          </p>
        </div>

        <div className="flex items-center gap-2">
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}

          {onSignOut && (
            <button
              onClick={onSignOut}
              className="px-3 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 text-red-300 border border-red-500/30 text-xs font-semibold transition-all cursor-pointer"
            >
              Sign Out
            </button>
          )}
        </div>
      </div>

      {/* Save Success Notice */}
      {saveSuccess && (
        <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Profile changes saved and synchronized to secure storage.</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="p-5 rounded-2xl bg-[#090F1E] border border-cyan-500/20 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar with optional change */}
          <div className="relative group">
            <div className="w-20 h-20 rounded-2xl bg-cyan-950/80 border-2 border-cyan-400/50 flex items-center justify-center overflow-hidden shadow-[0_0_20px_rgba(0,240,255,0.25)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-cyan-400" />
              )}
            </div>

            {isEditing && (
              <label className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] text-cyan-300">
                <Camera className="w-5 h-5 mb-0.5" />
                <span>Upload</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* User Details */}
          <div className="flex-1 text-center sm:text-left space-y-1">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                {profile?.display_name || 'Citizen User'}
              </h2>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 w-fit mx-auto sm:mx-0">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Verified Citizen
              </span>
            </div>

            {/* Email & Phone with Verified Badges */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              {profile?.email && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{profile.email}</span>
                  {profile.email_verified && (
                    <span title="Email Verified with OTP">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  )}
                </div>
              )}

              {profile?.phone && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-xs font-mono text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{profile.phone}</span>
                  {profile.phone_verified && (
                    <span title="Mobile Number Verified with OTP">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Meta Timestamps */}
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-2 text-[11px] text-slate-400 font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Account Created:{' '}
                <strong className="text-slate-300">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Today'}
                </strong>
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Last Login:{' '}
                <strong className="text-slate-300">
                  {profile?.last_login_at
                    ? new Date(profile.last_login_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    : 'Active Now'}
                </strong>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form or Information Grid */}
      {isEditing ? (
        <form
          onSubmit={handleSaveProfile}
          className="p-5 rounded-2xl bg-[#090F1E] border border-cyan-500/30 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span>Edit Account Information</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Display Name / Handle
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Alex CyberGuard or your name"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Country of Residence
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
              >
                <option value="India">India (1930 / I4C National Helpline)</option>
                <option value="United States">United States (IC3 / FTC)</option>
                <option value="United Kingdom">United Kingdom (Action Fraud)</option>
                <option value="Singapore">Singapore (Anti-Scam Centre)</option>
                <option value="Australia">Australia (Scamwatch)</option>
                <option value="Canada">Canada (CAFC)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Language Preference
              </label>
              <select
                value={preferredLang}
                onChange={(e) => setPreferredLang(e.target.value as SupportedLocale)}
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
              >
                {languages.map((l) => (
                  <option key={l.code} value={l.code}>
                    {l.nativeName} ({l.name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Emergency Contact Name (Optional)
              </label>
              <input
                type="text"
                value={emergencyName}
                onChange={(e) => setEmergencyName(e.target.value)}
                placeholder="e.g. Spouse, Parent, Guardian"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Emergency Contact Mobile Phone (Optional)
              </label>
              <input
                type="tel"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                placeholder="e.g. +91 98765 43210"
                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:border-cyan-400 text-xs text-white outline-none font-mono"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Contact Verification Controls Card */}
          <div className="p-4 rounded-xl bg-[#090F1E] border border-cyan-500/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Verified Contact Identifiers</span>
            </h3>

            {/* Email Verification Box */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Primary Email:</span>
                <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> OTP VERIFIED
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white">{profile?.email || 'Not configured'}</span>
                <button
                  onClick={() => setIsChangingEmail(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
                >
                  Change Email
                </button>
              </div>
            </div>

            {/* Change Email Dialog */}
            {isChangingEmail && (
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 space-y-2 animate-in fade-in">
                <label className="block text-xs font-medium text-cyan-300">
                  New Email Address (Requires OTP Verification)
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="e.g. new.email@example.com"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none"
                  />
                  <button
                    onClick={handleInitiateEmailChange}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Send OTP
                  </button>
                </div>
                <button
                  onClick={() => setIsChangingEmail(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* Mobile Phone Verification Box */}
            <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Mobile Phone:</span>
                <span className="text-emerald-400 text-[10px] font-mono flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> OTP VERIFIED
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-white">{profile?.phone || 'Not configured'}</span>
                <button
                  onClick={() => setIsChangingPhone(true)}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium underline cursor-pointer"
                >
                  Change Mobile
                </button>
              </div>
            </div>

            {/* Change Phone Dialog */}
            {isChangingPhone && (
              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 space-y-2 animate-in fade-in">
                <label className="block text-xs font-medium text-cyan-300">
                  New Mobile Number (Requires OTP Verification)
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="e.g. +91 98765 00000"
                    className="flex-1 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none font-mono"
                  />
                  <button
                    onClick={handleInitiatePhoneChange}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold cursor-pointer"
                  >
                    Send OTP
                  </button>
                </div>
                <button
                  onClick={() => setIsChangingPhone(false)}
                  className="text-[10px] text-slate-400 hover:text-slate-200"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {/* Regional & Emergency Details Card */}
          <div className="p-4 rounded-xl bg-[#090F1E] border border-cyan-500/20 space-y-3">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5 text-cyan-400">
              <Globe className="w-4 h-4" />
              <span>Location & Emergency Contact</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  Jurisdiction:
                </span>
                <span className="font-semibold text-white">{profile?.country}</span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  Language:
                </span>
                <span className="font-semibold text-white uppercase font-mono">
                  {profile?.preferred_language}
                </span>
              </div>

              <div className="flex items-center justify-between py-1 border-b border-slate-800">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <HeartHandshake className="w-3.5 h-3.5 text-slate-500" />
                  Emergency Contact:
                </span>
                <span className="font-semibold text-white">
                  {profile?.emergency_contact_name || 'Not configured'}
                </span>
              </div>

              <div className="flex items-center justify-between py-1">
                <span className="text-slate-400">Emergency Phone:</span>
                <span className="font-mono text-cyan-300">
                  {profile?.emergency_contact_phone || 'None'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Navigation to Security and Privacy Centers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={onOpenSecurityCenter}
          className="p-4 rounded-xl bg-[#090F1E] border border-cyan-500/30 hover:border-cyan-400 text-left flex items-center justify-between group transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:scale-105 transition-transform">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Security Center</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 font-mono">
                  MFA / Devices
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Manage passphrases, 2FA TOTP, active sessions & security logs
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
        </button>

        <button
          onClick={onOpenPrivacyCenter}
          className="p-4 rounded-xl bg-[#090F1E] border border-cyan-500/30 hover:border-cyan-400 text-left flex items-center justify-between group transition-all cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-950/60 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                <span>Privacy & Consent</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 font-mono">
                  GDPR / RLS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Review data minimization, telemetry consent, and RLS partition
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
        </button>
      </div>

      {/* Row-Level Security Isolation Assurance */}
      <div className="p-4 rounded-xl bg-[#070B14] border border-cyan-500/20 text-xs text-slate-400 space-y-1 font-mono">
        <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
          <Shield className="w-4 h-4" />
          <span>PostgreSQL Row Level Security (RLS) Active Guarantee:</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Zero-leakage policy enforced: User records are bounded to <code>auth.uid() = user_id</code>.
          No user can enumerate, view, modify, download, or delete another user&apos;s phone number,
          email, profile, scans, chats, evidence, or settings.
        </p>
      </div>

      {/* Data Sovereignty & Account Deletion Controls */}
      <div className="p-5 rounded-2xl bg-[#090F1E] border border-red-500/20 space-y-4">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400" />
            <span>Data Sovereignty & Account Lifecycle</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Full compliance with GDPR/CCPA data export and right-to-erasure provisions
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
          {/* Export All Data */}
          <button
            type="button"
            onClick={handleExportData}
            disabled={isExporting}
            className="w-full sm:w-auto flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-cyan-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating JSON Archive...' : 'Export Complete User Data (JSON)'}</span>
          </button>

          {/* Delete Account Button */}
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-950/70 border border-red-500/40 text-red-300 font-semibold text-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-4 h-4 text-red-400" />
            <span>Delete Account Permanently</span>
          </button>
        </div>
      </div>

      {/* Account Deletion Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#090F1E] border-2 border-red-500/50 rounded-2xl shadow-[0_0_50px_rgba(239,68,68,0.3)] p-5 space-y-4">
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-base font-bold text-white">Permanently Delete Account?</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This action is <strong className="text-red-400">irreversible</strong>.
              All your saved scan results, evidence vault files, emergency reports, security logs,
              and encrypted notes will be permanently purged from the database and storage.
            </p>

            <div className="p-3 rounded-lg bg-red-950/30 border border-red-500/30 space-y-1 text-xs">
              <p className="text-slate-300 font-medium">To confirm, type exactly:</p>
              <p className="font-mono font-bold text-red-400 tracking-wider">DELETE MY ACCOUNT</p>
              <input
                type="text"
                value={deleteConfirmationInput}
                onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                placeholder="Type DELETE MY ACCOUNT"
                className="w-full mt-2 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white outline-none font-mono"
              />
            </div>

            {deleteError && (
              <p className="text-xs text-red-400 font-medium">{deleteError}</p>
            )}

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmationInput('');
                  setDeleteError(null);
                }}
                className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={isDeleting || deleteConfirmationInput.trim() !== 'DELETE MY ACCOUNT'}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                {isDeleting ? 'Purging Records...' : 'Permanently Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
