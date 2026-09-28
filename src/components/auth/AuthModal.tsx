'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  KeyRound,
  X,
  Sparkles,
} from 'lucide-react';
import { evaluatePasswordStrength } from '@/lib/security/e2eEncryption';
import {
  createOtpChallenge,
  getCurrentUserProfile,
  DEFAULT_DEMO_USER,
  logSecurityEvent,
  signInWithPassword,
  signInWithOtp,
  resetPasswordForEmail,
  formatE164Phone,
} from '@/lib/auth/authService';
import { OtpChallenge, PasswordStrengthInfo } from '@/types/auth';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOtpRequired: (challenge: OtpChallenge, tempCredentials?: { email?: string; phone?: string; password?: string; displayName?: string }) => void;
  onLoginSuccess: () => void;
}

export function AuthModal({ isOpen, onClose, onOtpRequired, onLoginSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot_password'>('login');
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');

  // Form Fields
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Security & Validation State
  const [passwordStrength, setPasswordStrength] = useState<PasswordStrengthInfo | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Lockout State (Rate limiting simulation & protection)
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutTimer, setLockoutTimer] = useState<number | null>(null);

  useEffect(() => {
    if (password) {
      setPasswordStrength(evaluatePasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  }, [password]);

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

  const handleQuickDemoFill = () => {
    if (loginMethod === 'phone') {
      setPhone('+91 98765 43210');
      setDisplayName('Demo Sentinel');
    } else {
      setEmail(DEFAULT_DEMO_USER.email);
      setPhone(DEFAULT_DEMO_USER.phone);
      setPassword('CyberShield#2026!Secure');
      setConfirmPassword('CyberShield#2026!Secure');
      setDisplayName(DEFAULT_DEMO_USER.display_name);
    }
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (lockoutTimer && lockoutTimer > 0) {
      setErrorMsg(`Account temporarily locked for security. Please wait ${lockoutTimer} seconds.`);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'signup') {
        if (loginMethod === 'phone') {
          if (!phone || phone.trim().length < 8) {
            setErrorMsg('Please enter a valid mobile number.');
            setIsLoading(false);
            return;
          }

          const formattedPhone = formatE164Phone(phone);
          await signInWithOtp(formattedPhone);

          const { challenge } = createOtpChallenge(
            formattedPhone,
            'sms',
            'signup'
          );

          await logSecurityEvent({
            event_type: 'login',
            details: `Signup mobile SMS challenge dispatched to ${formattedPhone}`,
          });

          setIsLoading(false);
          onClose();
          onOtpRequired(challenge, {
            phone: formattedPhone,
            displayName: displayName.trim() || 'Citizen User',
          });
          return;
        }

        // Email signup with password policy
        const strength = evaluatePasswordStrength(password);
        if (strength.score < 3 || password.length < 12) {
          setErrorMsg('Password does not meet the 12-character high security requirement.');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setErrorMsg('Passwords do not match.');
          setIsLoading(false);
          return;
        }

        if (!email) {
          setErrorMsg('Please enter a valid email address.');
          setIsLoading(false);
          return;
        }

        const { challenge } = createOtpChallenge(
          email,
          'email',
          'signup'
        );

        await logSecurityEvent({
          event_type: 'login',
          details: `Signup OTP challenge dispatched to ${email}`,
        });

        setIsLoading(false);
        onClose();
        onOtpRequired(challenge, {
          email,
          password,
          displayName: displayName || email.split('@')[0],
        });
      } else if (mode === 'forgot_password') {
        const destination = loginMethod === 'email' ? email : formatE164Phone(phone);
        if (!destination) {
          setErrorMsg(`Please enter your registered ${loginMethod}.`);
          setIsLoading(false);
          return;
        }

        // Call Supabase password reset if email
        if (loginMethod === 'email') {
          await resetPasswordForEmail(destination);
        } else {
          await signInWithOtp(destination);
        }

        const { challenge } = createOtpChallenge(
          destination,
          loginMethod === 'email' ? 'email' : 'sms',
          'reset_password'
        );

        await logSecurityEvent({
          event_type: 'password_change',
          details: `Password reset OTP initiated for ${destination}`,
        });

        setIsLoading(false);
        onClose();
        onOtpRequired(challenge, {
          email: loginMethod === 'email' ? email : undefined,
          phone: loginMethod === 'phone' ? destination : undefined,
        });
      } else {
        // Mode === 'login'
        if (loginMethod === 'phone') {
          // Direct mobile OTP login — only mobile number needed!
          if (!phone || phone.trim().length < 8) {
            setErrorMsg('Please enter a valid mobile number.');
            setIsLoading(false);
            return;
          }

          const formattedPhone = formatE164Phone(phone);

          const otpResult = await signInWithOtp(formattedPhone);
          if (!otpResult.success) {
            setErrorMsg(otpResult.error || 'Failed to dispatch SMS OTP. Please check the mobile number.');
            setIsLoading(false);
            return;
          }

          const { challenge } = createOtpChallenge(formattedPhone, 'sms', 'login');

          await logSecurityEvent({
            event_type: 'login',
            details: `Mobile login SMS challenge dispatched to ${formattedPhone}`,
          });

          setIsLoading(false);
          onClose();
          onOtpRequired(challenge, {
            phone: formattedPhone,
          });
          return;
        }

        // Email login with password
        if (!email || !password) {
          setErrorMsg('Please enter both your email address and password.');
          setIsLoading(false);
          return;
        }

        const result = await signInWithPassword(email, password);

        if (result.success) {
          setFailedAttempts(0);
          setIsLoading(false);
          onLoginSuccess();
          onClose();
        } else {
          const newFailed = failedAttempts + 1;
          setFailedAttempts(newFailed);

          await logSecurityEvent({
            event_type: 'failed_login',
            details: `Failed authentication attempt #${newFailed} for ${email}`,
          });

          if (newFailed >= 5) {
            setLockoutTimer(900); // 15 minutes lockout
            await logSecurityEvent({
              event_type: 'lockout',
              details: `Account temporarily locked out for 15 minutes due to 5 consecutive failed logins: ${email}`,
            });
            setErrorMsg('Too many failed login attempts. Security lockout active for 15 minutes.');
          } else {
            setErrorMsg(result.error || `Invalid credentials. ${5 - newFailed} attempts remaining before temporary lockout.`);
          }
          setIsLoading(false);
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#090F1E] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.15)] overflow-hidden">
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
                {mode === 'login' && 'Secure Login'}
                {mode === 'signup' && 'Create Protected Account'}
                {mode === 'forgot_password' && 'Reset Access via OTP'}
              </h2>
              <p className="text-[11px] text-cyan-400/80 font-mono">Fraud Lock Security Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation for Login / Signup */}
        {mode !== 'forgot_password' && (
          <div className="grid grid-cols-2 p-1.5 bg-[#070B14] border-b border-cyan-500/10">
            <button
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'login'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setMode('signup');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-semibold rounded-lg transition-all ${
                mode === 'signup'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              New Account
            </button>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Quick Demo Pre-fill Button */}
          <div className="flex items-center justify-between p-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 text-xs">
            <div className="flex items-center gap-1.5 text-cyan-300">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Testing / Demo Mode</span>
            </div>
            <button
              type="button"
              onClick={handleQuickDemoFill}
              className="text-[11px] px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 font-medium transition-colors"
            >
              Auto-fill Test User
            </button>
          </div>

          {/* Login Method Toggle (Email vs Mobile Phone) */}
          <div className="flex items-center gap-2 p-1 bg-slate-900/80 rounded-lg border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => setLoginMethod('email')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
                loginMethod === 'email'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              Email
            </button>
            <button
              type="button"
              onClick={() => setLoginMethod('phone')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md font-medium transition-all ${
                loginMethod === 'phone'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              Mobile Phone
            </button>
          </div>

          {/* Display Name (Only in Signup) */}
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Display Name / Username
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Sentinel_Shield"
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all"
              />
            </div>
          )}

          {/* Identifier Input */}
          {loginMethod === 'email' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Verified Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Mobile Number (with country code)
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                />
              </div>
            </div>
          )}

          {/* Mobile Phone SMS OTP Information Banner */}
          {loginMethod === 'phone' && (
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-300 font-semibold">
                <Phone className="w-3.5 h-3.5 text-cyan-400" />
                <span>Passwordless Mobile SMS Authentication</span>
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Enter your mobile number above. A 6-digit one-time passcode (OTP) will be dispatched to your phone via SMS to verify and log you in.
              </p>
            </div>
          )}

          {/* Password Fields (Only for Email Login & Email Signup) */}
          {mode !== 'forgot_password' && loginMethod === 'email' && (
            <>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-300">
                    {mode === 'signup' ? 'Strong Password (Min 12 Characters)' : 'Master Password'}
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot_password');
                        setErrorMsg(null);
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 hover:underline"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'signup' ? 'Min 12 chars + mixed types' : '••••••••••••'}
                    required
                    className="w-full pl-9 pr-9 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Password Strength Indicator for Email Signup */}
              {mode === 'signup' && password && passwordStrength && (
                <div className="p-2.5 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
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
                      Tip: {passwordStrength.feedback[0]}
                    </p>
                  )}
                </div>
              )}

              {/* Confirm Password (Email Signup) */}
              {mode === 'signup' && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your secure password"
                      required
                      className="w-full pl-9 pr-3 py-2 rounded-lg bg-slate-900/90 border border-slate-700 focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 text-xs text-white placeholder-slate-500 outline-none transition-all font-mono"
                    />
                  </div>
                </div>
              )}
            </>
          )}

          {/* Security & Lockout Notice */}
          {lockoutTimer && lockoutTimer > 0 && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-500/40 flex items-center gap-2 text-red-300 text-xs animate-pulse">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>Security lockout active. Try again in {lockoutTimer}s.</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-red-950/30 border border-red-500/30 flex items-center gap-2 text-red-300 text-xs">
              <XCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Anti-Bot Protection Badge */}
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-[10px] text-slate-400">
            <span className="flex items-center gap-1.5 text-cyan-400">
              <Shield className="w-3 h-3" />
              Anti-Bot Challenge & Rate Protection
            </span>
            <span className="text-emerald-400 font-mono">ACTIVE</span>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || Boolean(lockoutTimer && lockoutTimer > 0)}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,240,255,0.25)] transition-all cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Dispatching Security Challenge...</span>
              </>
            ) : loginMethod === 'phone' ? (
              <>
                <span>{mode === 'signup' ? 'Send Activation OTP' : 'Send OTP to Mobile'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : mode === 'login' ? (
              <>
                <span>Sign In Securely</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : mode === 'signup' ? (
              <>
                <span>Send Verification OTP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <span>Send Password Reset OTP</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>

          {/* Back to Login button if in forgot password mode */}
          {mode === 'forgot_password' && (
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className="w-full text-center text-xs text-slate-400 hover:text-cyan-300 transition-colors"
            >
              ← Back to Sign In
            </button>
          )}
        </form>

        {/* Footer Zero-Knowledge Notice */}
        <div className="px-5 py-3 bg-[#070B14] border-t border-cyan-500/10 text-[10px] text-slate-400 text-center font-mono">
          🔒 Zero-knowledge encrypted. Passwords hashed with bcrypt/Argon2. Plaintext never stored.
        </div>
      </div>
    </div>
  );
}
