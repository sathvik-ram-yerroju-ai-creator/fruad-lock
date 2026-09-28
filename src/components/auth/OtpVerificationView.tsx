'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  X,
  ArrowRight,
  Mail,
  Phone,
  ArrowLeftRight,
  Edit3,
} from 'lucide-react';
import {
  verifySupabaseOtp,
  signInWithOtp,
  maskIndianPhone,
  maskEmail,
  logSecurityEvent,
} from '@/lib/auth/authService';
import { OtpChallenge, UserRole } from '@/types/auth';

interface OtpVerificationViewProps {
  challenge: OtpChallenge;
  onSuccess: (verifiedDestination: string, purpose: OtpChallenge['purpose']) => void;
  onCancel: () => void;
  onChangeMethod?: () => void;
  onChangeDestination?: () => void;
  tempCredentials?: {
    email?: string;
    phone?: string;
    displayName?: string;
    apartmentBlock?: string;
    apartmentUnit?: string;
    role?: UserRole;
    emergencyName?: string;
    emergencyPhone?: string;
    country?: string;
    preferredLang?: string;
  };
}

export function OtpVerificationView({
  challenge: initialChallenge,
  onSuccess,
  onCancel,
  onChangeMethod,
  onChangeDestination,
  tempCredentials,
}: OtpVerificationViewProps) {
  const [currentChallenge, setCurrentChallenge] = useState<OtpChallenge>(initialChallenge);
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [canSwitchChannel, setCanSwitchChannel] = useState<'email' | 'sms' | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSwitchingMethod, setIsSwitchingMethod] = useState(false);

  // Timers
  const [secondsUntilResend, setSecondsUntilResend] = useState<number>(() => {
    const diff = Math.ceil((initialChallenge.resendAvailableAt - Date.now()) / 1000);
    return Math.max(0, diff > 0 ? diff : 60);
  });
  const [secondsUntilExpiry, setSecondsUntilExpiry] = useState<number>(() => {
    const diff = Math.ceil((initialChallenge.expiresAt - Date.now()) / 1000);
    return Math.max(0, diff > 0 ? diff : 600);
  });

  // Refs for 6 digit inputs
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
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
        setErrorMsg('Verification code has expired. Please click "Resend OTP" to receive a fresh code.');
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [currentChallenge]);

  // Handle single digit input
  const handleDigitChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newDigits = [...digits];
    newDigits[index] = value.slice(-1);
    setDigits(newDigits);
    setErrorMsg(null);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit if all 6 digits are typed
    const fullCode = newDigits.join('');
    if (fullCode.length === 6) {
      handleVerify(fullCode);
    }
  };

  // Backspace navigation
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

  /**
   * Verify 6-digit OTP token with Supabase Auth
   */
  const handleVerify = async (codeToVerify: string) => {
    if (codeToVerify.length !== 6) {
      setErrorMsg('Please enter the complete 6-digit verification code.');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setCanSwitchChannel(null);

    try {
      const sbResult = await verifySupabaseOtp(
        currentChallenge.destination,
        codeToVerify,
        currentChallenge.channel,
        currentChallenge.purpose,
        tempCredentials
      );

      if (!sbResult.success) {
        setErrorMsg(sbResult.error || 'Incorrect 6-digit OTP code. Please check and try again.');
        setIsVerifying(false);
        setDigits(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        return;
      }

      setSuccessMsg('Identity verified successfully! Directing to your dashboard...');

      await logSecurityEvent({
        event_type: 'login',
        details: `OTP verification passed via Supabase for ${currentChallenge.destination} [${currentChallenge.purpose}]`,
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

  /**
   * Resend OTP via Supabase Auth
   */
  const handleResend = async () => {
    if (secondsUntilResend > 0 || isResending) return;

    setErrorMsg(null);
    setSuccessMsg(null);
    setCanSwitchChannel(null);
    setIsResending(true);

    try {
      const res = await signInWithOtp(currentChallenge.destination, {
        channel: currentChallenge.channel,
        shouldCreateUser: currentChallenge.purpose === 'signup',
        displayName: tempCredentials?.displayName,
      });

      if (!res.success) {
        setIsResending(false);
        setErrorMsg(res.error || 'Failed to resend OTP. Please try again later.');
        if (res.canSwitchChannel) {
          setCanSwitchChannel(res.canSwitchChannel);
        }
        return;
      }

      const now = Date.now();
      const updatedChallenge: OtpChallenge = {
        ...currentChallenge,
        expiresAt: now + 10 * 60 * 1000,
        resendAvailableAt: now + 60 * 1000,
      };

      setCurrentChallenge(updatedChallenge);
      setSecondsUntilResend(60);
      setSecondsUntilExpiry(600);
      setDigits(['', '', '', '', '', '']);
      setIsResending(false);

      const successNotice =
        currentChallenge.channel === 'sms'
          ? `We sent a 6-digit code to ${maskIndianPhone(currentChallenge.destination)}.`
          : `We sent a 6-digit code to ${currentChallenge.destination}.`;
      setSuccessMsg(successNotice);
      inputRefs.current[0]?.focus();

      await logSecurityEvent({
        event_type: 'login',
        details: `Fresh OTP challenge re-issued to ${currentChallenge.destination}`,
      });
    } catch (err: any) {
      setIsResending(false);
      setErrorMsg(err.message || 'Error occurred while resending verification code.');
    }
  };

  /**
   * Switch between SMS and Email verification directly
   */
  const handleSwitchVerificationMethod = async () => {
    const nextChannel: 'email' | 'sms' = currentChallenge.channel === 'sms' ? 'email' : 'sms';
    const nextDestination =
      nextChannel === 'email'
        ? tempCredentials?.email || ''
        : tempCredentials?.phone || '';

    if (!nextDestination) {
      // If alternate destination is not cached, return to method selection modal
      if (onChangeMethod) {
        onChangeMethod();
      } else if (onChangeDestination) {
        onChangeDestination();
      } else {
        onCancel();
      }
      return;
    }

    setIsSwitchingMethod(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setCanSwitchChannel(null);

    try {
      const res = await signInWithOtp(nextDestination, {
        channel: nextChannel,
        shouldCreateUser: currentChallenge.purpose === 'signup',
        displayName: tempCredentials?.displayName,
      });

      if (!res.success) {
        setIsSwitchingMethod(false);
        setErrorMsg(res.error || `Failed to switch to ${nextChannel.toUpperCase()} verification.`);
        if (res.canSwitchChannel) {
          setCanSwitchChannel(res.canSwitchChannel);
        }
        return;
      }

      const now = Date.now();
      const updatedChallenge: OtpChallenge = {
        destination: nextDestination,
        maskedDestination: nextChannel === 'sms' ? maskIndianPhone(nextDestination) : maskEmail(nextDestination),
        channel: nextChannel,
        expiresAt: now + 10 * 60 * 1000,
        resendAvailableAt: now + 60 * 1000,
        attemptsLeft: 5,
        purpose: currentChallenge.purpose,
      };

      setCurrentChallenge(updatedChallenge);
      setSecondsUntilResend(60);
      setSecondsUntilExpiry(600);
      setDigits(['', '', '', '', '', '']);
      setIsSwitchingMethod(false);

      const notice =
        nextChannel === 'sms'
          ? `We sent a 6-digit code to ${maskIndianPhone(nextDestination)}.`
          : `We sent a 6-digit code to ${nextDestination}.`;
      setSuccessMsg(notice);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setIsSwitchingMethod(false);
      setErrorMsg(err.message || 'Failed to switch verification method.');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    return `${mins}:${remSecs < 10 ? '0' : ''}${remSecs}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#090F1E] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] overflow-hidden">
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-indigo-950/40 flex items-center justify-between">
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
                Two-Factor OTP Verification
              </h2>
              <p className="text-[11px] text-cyan-400 font-mono">
                {currentChallenge.channel === 'sms' ? 'SMS Mobile Verification' : 'Email Address Verification'}
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Destination Notification Banner */}
          <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/20 text-cyan-300 text-[11px] font-medium border border-cyan-500/30">
              {currentChallenge.channel === 'sms' ? (
                <>
                  <Phone className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SMS Verification Route</span>
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Email Verification Route</span>
                </>
              )}
            </div>

            {/* Exact Required Delivery Subtitle */}
            <p className="text-xs font-semibold text-slate-100">
              {currentChallenge.channel === 'sms' ? (
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 inline-block mt-0.5">
                    {maskIndianPhone(currentChallenge.destination)}
                  </span>
                </>
              ) : (
                <>
                  We sent a 6-digit code to{' '}
                  <span className="font-mono font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40 inline-block mt-0.5">
                    {currentChallenge.destination}
                  </span>
                </>
              )}
            </p>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              {currentChallenge.channel === 'sms'
                ? 'Check your mobile SMS text messages and enter the 6-digit code below.'
                : 'Check your email inbox or spam folder and enter the 6-digit code below.'}
            </p>

            {/* Return / Edit destination button */}
            <div className="pt-0.5">
              <button
                type="button"
                onClick={() => {
                  if (onChangeDestination) {
                    onChangeDestination();
                  } else {
                    onCancel();
                  }
                }}
                className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                <span>Change entered phone number or email</span>
              </button>
            </div>
          </div>

          {/* 6 Digit Input Boxes */}
          <div>
            <label className="block text-center text-xs font-medium text-slate-300 mb-2">
              Enter 6-Digit Passcode
            </label>
            <div className="flex justify-center gap-2 sm:gap-2.5 py-1" onPaste={handlePaste}>
              {digits.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    inputRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleDigitChange(idx, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(idx, e)}
                  disabled={isVerifying || secondsUntilExpiry <= 0}
                  className="w-11 h-13 sm:w-12 sm:h-14 text-center text-2xl font-mono font-bold text-white bg-slate-900/90 border-2 border-slate-700 rounded-xl focus:border-cyan-400 focus:bg-cyan-950/20 focus:ring-2 focus:ring-cyan-400/20 outline-none transition-all"
                  aria-label={`Digit ${idx + 1}`}
                />
              ))}
            </div>
          </div>

          {/* Expiry Countdown */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Code expires in: <strong className="text-slate-300 font-mono">{formatTime(secondsUntilExpiry)}</strong>
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
              Supabase Live
            </span>
          </div>

          {/* Success Message */}
          {successMsg && (
            <div className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Error Message with Honest Fallback Switch */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/40 space-y-2 text-xs animate-in fade-in">
              <div className="flex items-start gap-2 text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <div>
                  <p className="font-semibold text-red-200">Verification Notice</p>
                  <p className="text-[11px] text-red-300/90 leading-relaxed mt-0.5">{errorMsg}</p>
                </div>
              </div>
              {canSwitchChannel && (
                <button
                  type="button"
                  onClick={handleSwitchVerificationMethod}
                  disabled={isSwitchingMethod}
                  className="w-full py-1.5 px-3 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-xs font-semibold transition-colors cursor-pointer border border-cyan-500/30 flex items-center justify-center gap-1.5"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Switch to {canSwitchChannel === 'email' ? 'Email OTP' : 'SMS OTP'}</span>
                </button>
              )}
            </div>
          )}

          {/* Actions: Verify and Resend */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              onClick={() => handleVerify(digits.join(''))}
              disabled={isVerifying || digits.join('').length !== 6 || secondsUntilExpiry <= 0}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying Passcode with Supabase...</span>
                </>
              ) : (
                <>
                  <span>
                    {currentChallenge.purpose === 'signup'
                      ? 'Verify & Activate Account'
                      : 'Verify & Sign In'}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Change Verification Method & Resend Row */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
              {/* Exact Required "Change verification method" button */}
              <button
                type="button"
                onClick={handleSwitchVerificationMethod}
                disabled={isSwitchingMethod || isVerifying}
                className="text-xs text-cyan-400 hover:text-cyan-300 disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isSwitchingMethod ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Switching...</span>
                  </>
                ) : (
                  <>
                    <ArrowLeftRight className="w-3.5 h-3.5" />
                    <span>Change verification method</span>
                  </>
                )}
              </button>

              {/* Resend OTP button with countdown */}
              <button
                type="button"
                onClick={handleResend}
                disabled={secondsUntilResend > 0 || isResending || isVerifying}
                className="text-xs text-slate-300 hover:text-white disabled:text-slate-500 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span>Dispatching...</span>
                  </>
                ) : secondsUntilResend > 0 ? (
                  <span>Resend in {secondsUntilResend}s</span>
                ) : (
                  <span className="font-semibold underline text-cyan-400">Resend OTP</span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Security Policy Reminder */}
        <div className="px-5 py-3 bg-[#070B14] border-t border-cyan-500/10 text-[10px] text-slate-500 text-center font-mono">
          🛡️ Never share this OTP with anyone. Arise security will NEVER ask for your code.
        </div>
      </div>
    </div>
  );
}
