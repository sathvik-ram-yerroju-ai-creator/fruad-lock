'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Mail,
  Phone,
  User,
  Building,
  Home,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  X,
  Sparkles,
  Info,
  Check,
  Edit2,
} from 'lucide-react';
import {
  normalizeIndianPhone,
  validateEmail,
  signInWithOtp,
  maskIndianPhone,
  maskEmail,
  logSecurityEvent,
  createOtpChallengeMetadata,
} from '@/lib/auth/authService';
import { OtpChallenge, UserRole } from '@/types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOtpRequired: (
    challenge: OtpChallenge,
    tempCredentials?: {
      email?: string;
      phone?: string;
      displayName?: string;
      apartmentBlock?: string;
      apartmentUnit?: string;
      role?: UserRole;
    }
  ) => void;
  onLoginSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onOtpRequired }: AuthModalProps) {
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [signupStep, setSignupStep] = useState<'form' | 'method_selection'>('form');

  // Registration Form Fields
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [apartmentBlock, setApartmentBlock] = useState('');
  const [apartmentUnit, setApartmentUnit] = useState('');
  const [role, setRole] = useState<UserRole>('customer');

  // Selected verification method on method-selection screen
  const [selectedMethod, setSelectedMethod] = useState<'sms' | 'email'>('sms');

  // Login Form Fields
  const [loginMethod, setLoginMethod] = useState<'email' | 'sms'>('email');
  const [loginIdentifier, setLoginIdentifier] = useState('');

  // Status and feedback state
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [canSwitchTo, setCanSwitchTo] = useState<'email' | 'sms' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lockout State
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);

  // Lockout countdown timer
  useEffect(() => {
    if (lockoutTimer && lockoutTimer > 0) {
      const timer = setInterval(() => {
        setLockoutTimer((prev) => (prev && prev > 1 ? prev - 1 : null));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [lockoutTimer]);

  if (!isOpen) return null;

  // Development sample quick-fill for fast testing
  const handleQuickDemoFill = (targetRole: UserRole = 'customer') => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setCanSwitchTo(null);
    setMode('signup');
    setSignupStep('form');
    setFullName(targetRole === 'customer' ? 'Rohan Sharma' : 'TechServe Facility Care');
    setEmail(targetRole === 'customer' ? 'rohan.sharma.arise@gmail.com' : 'vendor.techserve@gmail.com');
    setPhone('9876543210');
    setApartmentBlock('Tower B');
    setApartmentUnit(targetRole === 'customer' ? '402' : 'Services Wing');
    setRole(targetRole);
  };

  /**
   * Validate all 6 required registration fields
   */
  const validateRegistrationFields = (): {
    isValid: boolean;
    normalizedPhone: string;
    normalizedEmail: string;
    error?: string;
  } => {
    if (!fullName.trim() || fullName.trim().length < 2) {
      return { isValid: false, normalizedPhone: '', normalizedEmail: '', error: 'Please enter your full name (minimum 2 characters).' };
    }

    const emailCheck = validateEmail(email);
    if (!emailCheck.isValid) {
      return { isValid: false, normalizedPhone: '', normalizedEmail: '', error: emailCheck.error || 'Please enter a valid email address.' };
    }

    const phoneCheck = normalizeIndianPhone(phone);
    if (!phoneCheck.isValid) {
      return { isValid: false, normalizedPhone: '', normalizedEmail: '', error: phoneCheck.error || 'Please enter a valid 10-digit Indian mobile number.' };
    }

    if (!apartmentBlock.trim()) {
      return { isValid: false, normalizedPhone: '', normalizedEmail: '', error: 'Apartment / Block is required (e.g. Tower B, Block 4).' };
    }

    if (!apartmentUnit.trim()) {
      return { isValid: false, normalizedPhone: '', normalizedEmail: '', error: 'Apartment / Unit number is required (e.g. 402, Villa 12).' };
    }

    if (!role) {
      return { isValid: false, normalizedPhone: '', normalizedEmail: '', error: 'Please select an account type (Customer or Vendor).' };
    }

    return {
      isValid: true,
      normalizedPhone: phoneCheck.phone,
      normalizedEmail: emailCheck.email,
    };
  };

  /**
   * Handle Step 1: User clicks "Continue / Send OTP"
   * Does NOT immediately send an OTP. Validates all inputs and opens method-selection screen.
   */
  const handleContinueToMethodSelection = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setCanSwitchTo(null);

    const validation = validateRegistrationFields();
    if (!validation.isValid) {
      setErrorMsg(validation.error || 'Please fill in all required fields.');
      return;
    }

    // Advance to verification method selection screen
    setSignupStep('method_selection');
  };

  /**
   * Handle Step 2: User chose verification method (SMS or Email) and clicks "Send OTP"
   * Sends real Supabase OTP to exact mobile number or email entered.
   */
  const handleSendRegistrationOtp = async () => {
    setErrorMsg(null);
    setSuccessMsg(null);
    setCanSwitchTo(null);

    const validation = validateRegistrationFields();
    if (!validation.isValid) {
      setSignupStep('form');
      setErrorMsg(validation.error || 'Please check your registration details.');
      return;
    }

    const targetDestination = selectedMethod === 'sms' ? validation.normalizedPhone : validation.normalizedEmail;

    setIsLoading(true);

    try {
      // Dispatch live Supabase Auth OTP request
      const result = await signInWithOtp(targetDestination, {
        channel: selectedMethod,
        shouldCreateUser: true,
        displayName: fullName.trim(),
      });

      // Strict error handling - never falsely claim OTP sent
      if (!result.success) {
        setIsLoading(false);
        setErrorMsg(result.error || 'Failed to dispatch verification code.');
        if (result.canSwitchChannel) {
          setCanSwitchTo(result.canSwitchChannel);
        }
        return;
      }

      // Success message display
      const successText =
        selectedMethod === 'sms'
          ? `We sent a 6-digit code to ${maskIndianPhone(validation.normalizedPhone)}`
          : `We sent a 6-digit code to ${validation.normalizedEmail}`;
      setSuccessMsg(successText);

      // Create safe challenge metadata
      const challenge = createOtpChallengeMetadata(
        targetDestination,
        selectedMethod,
        'signup'
      );

      await logSecurityEvent({
        event_type: 'login',
        details: `Registration OTP dispatched via Supabase to ${targetDestination} [${selectedMethod}]`,
      });

      // Brief transition
      setTimeout(() => {
        setIsLoading(false);
        onClose();
        onOtpRequired(challenge, {
          email: validation.normalizedEmail,
          phone: validation.normalizedPhone,
          displayName: fullName.trim(),
          apartmentBlock: apartmentBlock.trim(),
          apartmentUnit: apartmentUnit.trim(),
          role,
        });
      }, 650);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'An unexpected error occurred while requesting OTP.');
    }
  };

  /**
   * Handle Login Flow Submit
   */
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setCanSwitchTo(null);

    let targetDestination = '';

    if (loginMethod === 'email') {
      const emailCheck = validateEmail(loginIdentifier);
      if (!emailCheck.isValid) {
        setErrorMsg(emailCheck.error || 'Please enter a valid email address.');
        return;
      }
      targetDestination = emailCheck.email;
    } else {
      const phoneCheck = normalizeIndianPhone(loginIdentifier);
      if (!phoneCheck.isValid) {
        setErrorMsg(phoneCheck.error || 'Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      targetDestination = phoneCheck.phone;
    }

    setIsLoading(true);

    try {
      const result = await signInWithOtp(targetDestination, {
        channel: loginMethod,
        shouldCreateUser: false,
      });

      if (!result.success) {
        setIsLoading(false);
        setErrorMsg(result.error || 'Login OTP dispatch failed.');
        if (result.canSwitchChannel) {
          setCanSwitchTo(result.canSwitchChannel);
        }
        return;
      }

      const successText =
        loginMethod === 'email'
          ? `We sent a 6-digit code to ${targetDestination}`
          : `We sent a 6-digit code to ${maskIndianPhone(targetDestination)}`;
      setSuccessMsg(successText);

      const challenge = createOtpChallengeMetadata(
        targetDestination,
        loginMethod,
        'login'
      );

      await logSecurityEvent({
        event_type: 'login',
        details: `Login OTP dispatched via Supabase to ${targetDestination} [${loginMethod}]`,
      });

      setTimeout(() => {
        setIsLoading(false);
        onClose();
        onOtpRequired(challenge, {
          email: loginMethod === 'email' ? targetDestination : undefined,
          phone: loginMethod === 'sms' ? targetDestination : undefined,
        });
      }, 650);
    } catch (err: any) {
      setIsLoading(false);
      setErrorMsg(err.message || 'An error occurred during login.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#090F1E] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.18)] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header Bar */}
        <div className="px-5 py-3.5 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-black border border-amber-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(245,158,11,0.25)] shrink-0">
              <img
                src="/logo.png"
                alt="Arise Security"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                {mode === 'signup'
                  ? signupStep === 'form'
                    ? 'Arise Account Registration'
                    : 'Choose Verification Method'
                  : 'Arise Secure Login'}
              </h2>
              <p className="text-[11px] text-cyan-400 font-mono">
                {mode === 'signup'
                  ? signupStep === 'form'
                    ? 'Resident & Vendor Identity Registration'
                    : 'Step 2: Two-Factor Verification'
                  : 'Out-Of-Band Supabase OTP Sign-In'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation: Register vs Sign In */}
        <div className="grid grid-cols-2 p-1.5 bg-[#070B14] border-b border-cyan-500/10 shrink-0">
          <button
            type="button"
            onClick={() => {
              setMode('signup');
              setSignupStep('form');
              setErrorMsg(null);
              setSuccessMsg(null);
              setCanSwitchTo(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'signup'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            New Registration
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMsg(null);
              setSuccessMsg(null);
              setCanSwitchTo(null);
            }}
            className={`py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === 'login'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sign In with OTP
          </button>
        </div>

        {/* Scrollable Modal Content */}
        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          {/* Quick Demo Fill Pill (Available in dev/evaluation) */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-500/20 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-300 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>Quick Sample Pre-fill:</span>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickDemoFill('customer')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition-colors cursor-pointer border border-cyan-500/30"
              >
                Customer Sample
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoFill('vendor')}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 font-medium transition-colors cursor-pointer border border-indigo-500/30"
              >
                Vendor Sample
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* REGISTRATION FLOW - STEP 1: ALL 6 REQUIRED DETAILS               */}
          {/* ================================================================= */}
          {mode === 'signup' && signupStep === 'form' && (
            <form onSubmit={handleContinueToMethodSelection} className="space-y-3.5">
              {/* Account Type Selector: Customer vs Vendor */}
              <div>
                <label className="block text-xs font-semibold text-slate-200 mb-1.5">
                  Account Type <span className="text-red-400">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('customer')}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'customer'
                        ? 'bg-gradient-to-r from-cyan-950/60 to-blue-950/60 border-cyan-400 text-white shadow-[0_0_15px_rgba(0,240,255,0.15)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      role === 'customer' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <span>Customer</span>
                        {role === 'customer' && <Check className="w-3 h-3 text-cyan-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400">Resident / Household</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('vendor')}
                    className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      role === 'vendor'
                        ? 'bg-gradient-to-r from-indigo-950/60 to-purple-950/60 border-indigo-400 text-white shadow-[0_0_15px_rgba(99,102,241,0.15)]'
                        : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      role === 'vendor' ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'
                    }`}>
                      <Briefcase className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-100 flex items-center gap-1">
                        <span>Vendor</span>
                        {role === 'vendor' && <Check className="w-3 h-3 text-indigo-400" />}
                      </div>
                      <div className="text-[10px] text-slate-400">Service / Delivery Partner</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* 1. Full Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Full Name <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g., Rohan Sharma"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all"
                  />
                </div>
              </div>

              {/* 2. Email Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Email Address <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>

              {/* 3. Mobile Number (Mandatory, Indian +91, E.164) */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Mobile Number (Mandatory) <span className="text-red-400">*</span>
                </label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs font-mono font-bold text-cyan-400 pointer-events-none">
                    +91
                  </span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    required
                    maxLength={15}
                    className="w-full pl-12 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span>Valid 10-digit Indian mobile number. Stored in E.164 (+91XXXXXXXXXX).</span>
                </p>
              </div>

              {/* 4 & 5. Apartment/Block and Apartment/Unit Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Apartment / Block <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Building className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={apartmentBlock}
                      onChange={(e) => setApartmentBlock(e.target.value)}
                      placeholder="e.g., Tower B / Block 4"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Apartment / Unit Number <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Home className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={apartmentUnit}
                      onChange={(e) => setApartmentUnit(e.target.value)}
                      placeholder="e.g., 402 / Flat 12A"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 flex items-start gap-2 text-red-300 text-xs animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                  <p className="leading-relaxed">{errorMsg}</p>
                </div>
              )}

              {/* Step 1 Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
              >
                <span>Continue / Send OTP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* ================================================================= */}
          {/* REGISTRATION FLOW - STEP 2: VERIFICATION METHOD SELECTION MODAL    */}
          {/* ================================================================= */}
          {mode === 'signup' && signupStep === 'method_selection' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Registration Details Review Box */}
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-300">
                  <span className="font-semibold text-white">{fullName}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    role === 'vendor' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {role === 'vendor' ? 'Vendor Partner' : 'Resident Customer'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400">
                  Apartment: <strong className="text-slate-200">{apartmentBlock} - Unit {apartmentUnit}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSignupStep('form');
                    setErrorMsg(null);
                    setSuccessMsg(null);
                  }}
                  className="inline-flex items-center gap-1 text-[11px] text-cyan-400 hover:text-cyan-300 pt-1 transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3 h-3" />
                  <span>Edit details or change phone/email</span>
                </button>
              </div>

              {/* Exact Two Choices as specified */}
              <div className="space-y-2.5">
                <label className="block text-xs font-semibold text-slate-200">
                  Choose how you want to receive your 6-digit verification code:
                </label>

                {/* Choice 1: Verify via SMS */}
                <div
                  onClick={() => setSelectedMethod('sms')}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    selectedMethod === 'sms'
                      ? 'bg-gradient-to-r from-cyan-950/50 via-slate-900 to-blue-950/50 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.18)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedMethod === 'sms' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Verify via SMS</span>
                      {selectedMethod === 'sms' && (
                        <span className="w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {/* Exact Subtitle requirement */}
                    <p className="text-[11px] text-cyan-300/90 font-mono mt-0.5">
                      Send a 6-digit code to {maskIndianPhone(phone)}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Delivered via Supabase SMS gateway directly to your mobile phone.
                    </p>
                  </div>
                </div>

                {/* Choice 2: Verify via Email */}
                <div
                  onClick={() => setSelectedMethod('email')}
                  className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-start gap-3 ${
                    selectedMethod === 'email'
                      ? 'bg-gradient-to-r from-cyan-950/50 via-slate-900 to-blue-950/50 border-cyan-400 shadow-[0_0_20px_rgba(0,240,255,0.18)]'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    selectedMethod === 'email' ? 'bg-cyan-500 text-black' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Mail className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">Verify via Email</span>
                      {selectedMethod === 'email' && (
                        <span className="w-4 h-4 rounded-full bg-cyan-400 text-black flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    {/* Exact Subtitle requirement */}
                    <p className="text-[11px] text-cyan-300/90 font-mono mt-0.5">
                      Send a 6-digit code to the email address you entered
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Target destination: <span className="text-slate-300 font-mono">{maskEmail(email)}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Error Message with Honest Fallback Switch */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2 text-xs animate-in fade-in">
                  <div className="flex items-start gap-2 text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <p className="leading-relaxed">{errorMsg}</p>
                  </div>
                  {canSwitchTo && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedMethod(canSwitchTo);
                        setErrorMsg(null);
                        setCanSwitchTo(null);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer border border-cyan-500/30"
                    >
                      Switch to {canSwitchTo === 'email' ? 'Email Verification' : 'SMS Verification'}
                    </button>
                  )}
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-2.5 text-emerald-300 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-semibold">{successMsg}</p>
                    <p className="text-[11px] text-emerald-400/80">Opening verification screen...</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setSignupStep('form');
                    setErrorMsg(null);
                  }}
                  disabled={isLoading}
                  className="py-2.5 px-3 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Back</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendRegistrationOtp}
                  disabled={isLoading}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending OTP via Supabase...</span>
                    </>
                  ) : (
                    <>
                      <span>Send OTP</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* LOGIN FLOW - WITH EMAIL OR SMS OTP                               */}
          {/* ================================================================= */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Sign In Verification Channel
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-slate-900/80 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('email');
                      setLoginIdentifier('');
                      setErrorMsg(null);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                      loginMethod === 'email'
                        ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Email OTP</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginMethod('sms');
                      setLoginIdentifier('');
                      setErrorMsg(null);
                    }}
                    className={`flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition-all cursor-pointer ${
                      loginMethod === 'sms'
                        ? 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 text-cyan-300 border border-cyan-500/50 shadow-sm'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Mobile SMS OTP</span>
                  </button>
                </div>
              </div>

              {loginMethod === 'email' ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Registered Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="name@example.com"
                      required
                      disabled={isLoading}
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Registered Indian Mobile Number
                  </label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs font-mono font-bold text-cyan-400 pointer-events-none">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder="98765 43210"
                      required
                      disabled={isLoading}
                      maxLength={15}
                      className="w-full pl-12 pr-3 py-2 rounded-xl bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2 text-xs animate-in fade-in">
                  <div className="flex items-start gap-2 text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                    <p className="leading-relaxed">{errorMsg}</p>
                  </div>
                  {canSwitchTo && (
                    <button
                      type="button"
                      onClick={() => {
                        setLoginMethod(canSwitchTo);
                        setLoginIdentifier('');
                        setErrorMsg(null);
                        setCanSwitchTo(null);
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer border border-cyan-500/30"
                    >
                      Switch to {canSwitchTo === 'email' ? 'Email OTP' : 'SMS OTP'}
                    </button>
                  )}
                </div>
              )}

              {/* Success Message */}
              {successMsg && (
                <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-start gap-2.5 text-emerald-300 text-xs animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="font-semibold">{successMsg}</p>
                    <p className="text-[11px] text-emerald-400/80">Opening verification screen...</p>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Requesting Login OTP...</span>
                  </>
                ) : (
                  <>
                    <span>Send Login OTP</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Security Assurance Footer */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Shield className="w-3.5 h-3.5" />
              Live Supabase Authentication
            </span>
            <span className="text-emerald-400 font-mono font-semibold">ZERO-TRUST SECURE</span>
          </div>
        </div>

        {/* Modal Bottom Tag */}
        <div className="px-5 py-2.5 bg-[#070B14] border-t border-cyan-500/10 text-[10px] text-slate-500 text-center font-mono shrink-0">
          🔒 Codes are server-generated and never exposed in client logs.
        </div>
      </div>
    </div>
  );
}
