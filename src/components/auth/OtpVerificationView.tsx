'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  KeyRound,
  X,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  verifyOtpCode,
  verifySupabaseOtp,
  signUpWithCredentials,
  createOtpChallenge,
  getActiveOtpChallenge,
  updateUserProfile,
  logSecurityEvent,
  signInWithOtp,
} from '@/lib/auth/authService';
import { OtpChallenge } from '@/types/auth';

interface OtpVerificationViewProps {
  challenge: OtpChallenge;
  onSuccess: (verifiedDestination: string, purpose: OtpChallenge['purpose']) => void;
  onCancel: () => void;
  tempCredentials?: {
    email?: string;
    phone?: string;
    password?: string;
    displayName?: string;
  };
}

export function OtpVerificationView({
  challenge: initialChallenge,
  onSuccess,
  onCancel,
  tempCredentials,
}: OtpVerificationViewProps) {
  const [currentChallenge, setCurrentChallenge] = useState<OtpChallenge>(initialChallenge);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);

  // Timers
  const [secondsUntilResend, setSecondsUntilResend] = useState<number>(60);
  const [secondsUntilExpiry, setSecondsUntilExpiry] = useState<number>(600); // 10 minutes

  // Refs for 6 digit inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    const active = getActiveOtpChallenge();
    if (active) {
      setCurrentChallenge(active.challenge);
    }
  }, []);

  // Countdown timers
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const resendDiff = Math.max(0, Math.ceil((currentChallenge.resendAvailableAt - now) / 1000));
      const expiryDiff = Math.max(0, Math.ceil((currentChallenge.expiresAt - now) / 1000));

      setSecondsUntilResend(resendDiff);
      setSecondsUntilExpiry(expiryDiff);

      if (expiryDiff <= 0) {
        setErrorMsg('Verification code has expired. Please click Resend Code to obtain a new OTP.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentChallenge]);

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    // Take only the last character entered
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are filled
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  };

  // Handle backspace navigation
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Handle paste of 6 digits
  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pasted)) {
      const chars = pasted.split('');
      setDigits(chars);
      inputRefs.current[5]?.focus();
      handleVerify(pasted);
    }
  };

  const handleVerify = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    try {
      let isVerified = false;
      let error = '';

      // 1. Try Supabase Auth OTP verification
      const isEmail = currentChallenge.destination.includes('@');
      const sbResult = await verifySupabaseOtp(
        currentChallenge.destination,
        codeToVerify,
        currentChallenge.purpose === 'signup'
          ? (isEmail ? 'signup' : 'sms')
          : (isEmail ? 'email' : 'sms')
      );

      if (sbResult.success) {
        isVerified = true;
      } else {
        // 2. Try local secure OTP challenge fallback
        const localResult = verifyOtpCode(codeToVerify);
        if (localResult.success) {
          isVerified = true;
        } else {
          error = sbResult.error || localResult.error || 'Invalid 6-digit verification code. Please check your SMS and try again.';
        }
      }

      if (!isVerified) {
        setErrorMsg(error);
        setIsVerifying(false);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccessMsg('Identity verified successfully! Activating session...');

      // If signup, finalize user profile creation via Supabase Auth & Postgres
      if (currentChallenge.purpose === 'signup' && tempCredentials) {
        const ext = tempCredentials as any;
        await signUpWithCredentials({
          email: tempCredentials.email,
          phone: tempCredentials.phone,
          password: tempCredentials.password || 'MobileOtp#Auth2026!',
          displayName: tempCredentials.displayName,
          country: ext.country || 'India',
          preferredLang: ext.preferredLang || 'en',
          emergencyName: ext.emergencyName || undefined,
          emergencyPhone: ext.emergencyPhone || undefined,
        });
      } else if (currentChallenge.purpose === 'change_email' && tempCredentials?.email) {
        await updateUserProfile({
          email: tempCredentials.email,
          email_verified: true,
        });
      } else if (currentChallenge.purpose === 'change_phone' && tempCredentials?.phone) {
        await updateUserProfile({
          phone: tempCredentials.phone,
          phone_verified: true,
        });
      }

      await logSecurityEvent({
        event_type: 'login',
        details: `OTP verification passed for ${currentChallenge.destination} [${currentChallenge.purpose}]`,
      });

      setTimeout(() => {
        setIsVerifying(false);
        onSuccess(currentChallenge.destination, currentChallenge.purpose);
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please try again.');
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (secondsUntilResend > 0) return;

    setErrorMsg(null);
    setDigits(['', '', '', '', '', '']);

    await signInWithOtp(currentChallenge.destination);

    const { challenge } = createOtpChallenge(
      currentChallenge.destination,
      currentChallenge.channel,
      currentChallenge.purpose
    );

    setCurrentChallenge(challenge);
    inputRefs.current[0]?.focus();

    logSecurityEvent({
      event_type: 'login',
      details: `New OTP challenge re-issued to ${currentChallenge.destination}`,
    });
  };

  // Format expiry minutes:seconds
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#090F1E] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-black border border-amber-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_12px_rgba(245,158,11,0.25)] shrink-0">
              <img
                src="/logo.png"
                alt="Fraud Lock"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-wide">
                Two-Factor OTP Verification
              </h2>
              <p className="text-[11px] text-cyan-400/80 font-mono">
                Mandatory Out-Of-Band Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Destination info */}
          <div className="text-center space-y-1">
            <p className="text-xs text-slate-300">
              A 6-digit one-time verification passcode was dispatched {currentChallenge.channel === 'sms' ? 'via SMS' : 'via Email'} to:
            </p>
            <p className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/40 border border-cyan-500/30 rounded-lg py-1 px-2.5 inline-block">
              {currentChallenge.destination}
            </p>
            <p className="text-[11px] text-slate-400">
              {currentChallenge.channel === 'sms'
                ? 'Check your mobile SMS messages and enter the 6-digit code below.'
                : 'Check your email inbox and enter the 6-digit code below.'}
            </p>
          </div>

          {/* 6 Digit Input Boxes */}
          <div className="flex justify-center gap-2 sm:gap-3 py-2" onPaste={handlePaste}>
            {digits.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                disabled={isVerifying || secondsUntilExpiry <= 0}
                className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl font-mono font-bold text-white bg-slate-900/90 border-2 border-slate-700 rounded-xl focus:border-cyan-400 focus:bg-cyan-950/20 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all"
              />
            ))}
          </div>

          {/* Expiry and Attempt Limits */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Expires in: <strong className="text-slate-300 font-mono">{formatTime(secondsUntilExpiry)}</strong>
            </span>
            <span>
              Attempts left: <strong className="text-cyan-400 font-mono">{currentChallenge.attemptsLeft}</strong> / 5
            </span>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-emerald-300 text-xs">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center gap-2 text-red-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Actions: Verify and Resend */}
          <div className="space-y-2 pt-2">
            <button
              type="button"
              onClick={() => handleVerify(digits.join(''))}
              disabled={isVerifying || digits.join('').length !== 6 || secondsUntilExpiry <= 0}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating Passcode...</span>
                </>
              ) : (
                <>
                  <span>
                    {currentChallenge.purpose === 'signup'
                      ? 'Verify & Activate Account'
                      : 'Verify & Log In'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            <div className="flex items-center justify-between pt-1">
              <button
                type="button"
                onClick={onCancel}
                className="text-xs text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={secondsUntilResend > 0}
                className="text-xs text-cyan-400 hover:text-cyan-300 disabled:text-slate-500 disabled:cursor-not-allowed transition-colors"
              >
                {secondsUntilResend > 0 ? (
                  <span>Resend available in {secondsUntilResend}s</span>
                ) : (
                  <span className="font-semibold underline">Resend New OTP</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Policy Reminder */}
        <div className="px-5 py-3 bg-[#070B14] border-t border-cyan-500/10 text-[10px] text-slate-500 text-center font-mono">
          🛡️ Never share OTP with anyone. Fraud Lock staff will NEVER ask for your code.
        </div>
      </div>
    </div>
  );
}
