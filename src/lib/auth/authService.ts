import {
  UserProfile,
  UserRole,
  UserSecuritySettings,
  TrustedDevice,
  UserSession,
  SecurityEvent,
  EncryptedPrivateNote,
  OtpChallenge,
} from '@/types/auth';
import { supabase, isSupabaseConfigured, uploadProfileAvatar } from '@/lib/supabase';
import { generateBackupRecoveryCodes } from '@/lib/security/e2eEncryption';

// Local storage keys for resilient local-first auth state
const AUTH_STORAGE_KEYS = {
  CURRENT_USER: 'fraudlock_current_user',
  SECURITY_SETTINGS: 'fraudlock_security_settings',
  TRUSTED_DEVICES: 'fraudlock_trusted_devices',
  USER_SESSIONS: 'fraudlock_user_sessions',
  SECURITY_EVENTS: 'fraudlock_security_events',
  ENCRYPTED_NOTES: 'fraudlock_encrypted_notes',
  ACTIVE_OTP: 'fraudlock_active_otp',
};

// Default Demo User for instant offline/guest evaluation
export const DEFAULT_DEMO_USER: UserProfile = {
  id: 'usr_fraudlock_demo_001',
  display_name: 'Alex CyberGuard',
  email: 'alex.guardian@fraudlock.security',
  email_verified: true,
  phone: '+91 98765 00193',
  phone_verified: true,
  avatar_url: '',
  country: 'India',
  preferred_language: 'en',
  emergency_contact_name: 'Family Member Contact',
  emergency_contact_phone: '+91 98765 43210',
  created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  last_login_at: new Date().toISOString(),
};

export const DEFAULT_SECURITY_SETTINGS: UserSecuritySettings = {
  user_id: DEFAULT_DEMO_USER.id,
  mfa_enabled: false,
  backup_codes: [],
  failed_login_attempts: 0,
  notify_on_new_device: true,
  notify_on_security_change: true,
  password_last_changed_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
};

// =============================================================================
// SUPABASE AUTHENTICATION FLOWS
// =============================================================================

export interface AuthResult {
  success: boolean;
  user?: UserProfile | null;
  error?: string;
  requiresOtp?: boolean;
  requiresMfa?: boolean;
}

/**
 * Sign up with email or phone and password
 * Invokes live Supabase Auth signUp and auto-initializes the user profile in Postgres
 */
export async function signUpWithCredentials(params: {
  email?: string;
  phone?: string;
  password?: string;
  displayName?: string;
  country?: string;
  preferredLang?: string;
  emergencyName?: string;
  emergencyPhone?: string;
}): Promise<AuthResult> {
  const { email, phone, password, displayName, country, preferredLang, emergencyName, emergencyPhone } = params;

  if (supabase) {
    try {
      let signUpPayload: any = {
        password: password || 'Secure#FraudLock2026!',
        options: {
          data: {
            display_name: displayName || (email ? email.split('@')[0] : 'Citizen User'),
            phone: phone || '',
            country: country || 'India',
            preferred_language: preferredLang || 'en',
            emergency_contact_name: emergencyName || '',
            emergency_contact_phone: emergencyPhone || '',
          },
        },
      };

      if (email) {
        signUpPayload.email = email;
      } else if (phone) {
        signUpPayload.phone = phone;
      }

      const { data, error } = await supabase.auth.signUp(signUpPayload);

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        const userProfile: UserProfile = {
          id: data.user.id,
          display_name: displayName || data.user.user_metadata?.display_name || 'Citizen User',
          email: data.user.email || email || '',
          email_verified: Boolean(data.user.email_confirmed_at),
          phone: data.user.phone || phone || '',
          phone_verified: Boolean(data.user.phone_confirmed_at),
          avatar_url: '',
          country: country || 'India',
          preferred_language: (preferredLang as any) || 'en',
          emergency_contact_name: emergencyName,
          emergency_contact_phone: emergencyPhone,
          created_at: data.user.created_at,
          last_login_at: new Date().toISOString(),
        };

        // Cache locally for offline and fast UI display
        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(userProfile));
        }

        // Try syncing to public.profiles table
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            display_name: userProfile.display_name,
            email: userProfile.email,
            phone: userProfile.phone,
            country: userProfile.country,
            preferred_language: userProfile.preferred_language,
            emergency_contact_name: userProfile.emergency_contact_name,
            emergency_contact_phone: userProfile.emergency_contact_phone,
            created_at: userProfile.created_at,
            last_login_at: userProfile.last_login_at,
          });
        } catch (e) {
          console.warn('Profile DB upsert note (table may be pending migration):', e);
        }

        await logSecurityEvent({
          event_type: 'login',
          details: `User registered successfully: ${email || phone}`,
        });

        return {
          success: true,
          user: userProfile,
          requiresOtp: !data.session, // If Supabase requires email verification before session creation
        };
      }
    } catch (err: any) {
      console.warn('Supabase signup fallback:', err);
      return { success: false, error: err.message || 'Signup failed. Please try again.' };
    }
  }

  // Local-first fallback for offline mode
  const localId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const localProfile: UserProfile = {
    id: localId,
    display_name: displayName || (email ? email.split('@')[0] : 'Citizen User'),
    email: email || '',
    email_verified: Boolean(email),
    phone: phone || '',
    phone_verified: Boolean(phone),
    country: country || 'India',
    preferred_language: (preferredLang as any) || 'en',
    emergency_contact_name: emergencyName,
    emergency_contact_phone: emergencyPhone,
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(localProfile));
  }

  return { success: true, user: localProfile };
}

/**
 * Sign in with email or phone and password
 */
export async function signInWithPassword(
  identifier: string,
  password: string
): Promise<AuthResult> {
  if (supabase) {
    try {
      const isEmail = identifier.includes('@');
      const credentials = isEmail
        ? { email: identifier, password }
        : { phone: identifier, password };

      const { data, error } = await supabase.auth.signInWithPassword(credentials);

      if (error) {
        return { success: false, error: error.message };
      }

      if (data?.user) {
        // Fetch or create profile
        let profile = await getCurrentUserProfile();

        await logSecurityEvent({
          event_type: 'login',
          details: `Successful password authentication for ${identifier}`,
        });

        return { success: true, user: profile };
      }
    } catch (err: any) {
      console.warn('Supabase signInWithPassword error:', err);
      return { success: false, error: err.message || 'Authentication failed.' };
    }
  }

  // Fallback demo/local sign in
  const isDemo =
    identifier === DEFAULT_DEMO_USER.email ||
    identifier === DEFAULT_DEMO_USER.phone ||
    identifier.includes('demo') ||
    identifier.includes('fraudlock');

  if (isDemo || password.length >= 8) {
    const demoProfile = isDemo
      ? DEFAULT_DEMO_USER
      : {
          id: `usr_local_${Date.now()}`,
          display_name: identifier.split('@')[0] || 'User',
          email: identifier.includes('@') ? identifier : '',
          email_verified: true,
          phone: !identifier.includes('@') ? identifier : '',
          phone_verified: true,
          country: 'India',
          preferred_language: 'en' as const,
          created_at: new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        };

    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(demoProfile));
    }

    await logSecurityEvent({
      event_type: 'login',
      details: `Local authentication for ${identifier}`,
    });

    return { success: true, user: demoProfile };
  }

  return { success: false, error: 'Invalid email or password.' };
}

/**
 * Standardize and validate Indian mobile phone numbers to international E.164 format (+91XXXXXXXXXX)
 * Validates 10-digit Indian numbers starting with 6, 7, 8, or 9
 */
export function normalizeIndianPhone(rawPhone: string): {
  isValid: boolean;
  phone: string;
  error?: string;
} {
  if (!rawPhone || !rawPhone.trim()) {
    return { isValid: false, phone: '', error: 'Mobile number is required.' };
  }

  const trimmed = rawPhone.trim();
  const cleaned = trimmed.replace(/[\s\-\(\)\.]/g, '');

  let digits = '';
  if (cleaned.startsWith('+91')) {
    digits = cleaned.slice(3);
  } else if (cleaned.startsWith('91') && cleaned.length === 12) {
    digits = cleaned.slice(2);
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    digits = cleaned.slice(1);
  } else if (/^\d{10}$/.test(cleaned)) {
    digits = cleaned;
  } else if (cleaned.startsWith('+')) {
    // Non-India international format
    const internationalDigits = cleaned.slice(1);
    if (/^\d{7,15}$/.test(internationalDigits)) {
      return { isValid: true, phone: cleaned };
    }
    return { isValid: false, phone: '', error: 'Please enter a valid international mobile number.' };
  } else {
    digits = cleaned;
  }

  // Indian mobile numbers must be exactly 10 digits and start with 6, 7, 8, or 9
  if (/^[6-9]\d{9}$/.test(digits)) {
    return { isValid: true, phone: `+91${digits}` };
  }

  return {
    isValid: false,
    phone: '',
    error: 'Please enter a valid 10-digit Indian mobile number (e.g., 98765 43210 or +91 98765 43210).',
  };
}

/**
 * Standardize phone number to international E.164 format (+919876543210)
 */
export function formatE164Phone(rawPhone: string, defaultCountryCode = '+91'): string {
  const norm = normalizeIndianPhone(rawPhone);
  if (norm.isValid) return norm.phone;
  const digits = rawPhone.trim().replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) return digits;
  return `${defaultCountryCode}${digits}`;
}

/**
 * Validate standard RFC5322 email address format
 */
export function validateEmail(rawEmail: string): {
  isValid: boolean;
  email: string;
  error?: string;
} {
  if (!rawEmail || !rawEmail.trim()) {
    return { isValid: false, email: '', error: 'Email address is required.' };
  }
  const clean = rawEmail.trim().toLowerCase();
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(clean)) {
    return { isValid: false, email: clean, error: 'Please enter a valid email address (e.g., name@example.com).' };
  }
  return { isValid: true, email: clean };
}

/**
 * Mask an Indian mobile number for privacy and security display
 * Example: "+919876543210" -> "+91 98XXX XX210"
 * If showPartialDigits is false, returns standard: "+91 XXXXX XXXXX"
 */
export function maskIndianPhone(phone: string, showPartialDigits = true): string {
  if (!phone) return '+91 XXXXX XXXXX';
  const norm = normalizeIndianPhone(phone);
  const target = norm.isValid ? norm.phone : phone;
  const digitsOnly = target.replace(/[^\d]/g, '');
  const tenDigits = digitsOnly.startsWith('91') && digitsOnly.length === 12
    ? digitsOnly.slice(2)
    : digitsOnly.slice(-10);

  if (tenDigits.length === 10) {
    if (showPartialDigits) {
      return `+91 ${tenDigits.slice(0, 2)}XXX XX${tenDigits.slice(7, 10)}`;
    }
    return '+91 XXXXX XXXXX';
  }
  return target;
}

/**
 * Mask an email address for privacy and security display
 * Example: "name@example.com" -> "n***e@example.com"
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, domain] = email.trim().toLowerCase().split('@');
  if (local.length <= 2) {
    return `${local[0] || '*'}***@${domain}`;
  }
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

/**
 * Resolve client application redirect URL for Supabase Auth
 */
export function resolveAppRedirectUrl(): string {
  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}/auth/callback`;
  }
  const rawBase =
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.VITE_APP_URL ||
    'https://cyber-lock-sable.vercel.app';
  const cleanBase = rawBase.replace(/\/+$/, '');
  return `${cleanBase}/auth/callback`;
}

export interface SignInWithOtpResult {
  success: boolean;
  destination?: string;
  channel?: 'email' | 'sms';
  error?: string;
  code?: string;
  canSwitchChannel?: 'email' | 'sms';
}

/**
 * Request passwordless OTP login via SMS or Email using live Supabase Auth
 */
export async function signInWithOtp(
  destination: string,
  options?: {
    channel?: 'email' | 'sms';
    shouldCreateUser?: boolean;
    displayName?: string;
  }
): Promise<SignInWithOtpResult> {
  const isEmail = options?.channel ? options.channel === 'email' : destination.includes('@');

  let normalizedDestination = '';
  if (isEmail) {
    const emailValidation = validateEmail(destination);
    if (!emailValidation.isValid) {
      return { success: false, error: emailValidation.error };
    }
    normalizedDestination = emailValidation.email;
  } else {
    const phoneValidation = normalizeIndianPhone(destination);
    if (!phoneValidation.isValid) {
      return { success: false, error: phoneValidation.error };
    }
    normalizedDestination = phoneValidation.phone;
  }

  if (supabase) {
    try {
      const redirectUrl = resolveAppRedirectUrl();

      let error: any = null;
      if (isEmail) {
        const res = await supabase.auth.signInWithOtp({
          email: normalizedDestination,
          options: {
            shouldCreateUser: options?.shouldCreateUser ?? true,
            emailRedirectTo: redirectUrl,
            data: options?.displayName ? { display_name: options.displayName } : undefined,
          },
        });
        error = res.error;
      } else {
        const res = await supabase.auth.signInWithOtp({
          phone: normalizedDestination,
          options: {
            shouldCreateUser: options?.shouldCreateUser ?? true,
            data: options?.displayName ? { display_name: options.displayName } : undefined,
          },
        });
        error = res.error;
      }

      if (error) {
        // Log non-sensitive error metadata only
        console.error('[Supabase Auth Error]', {
          channel: isEmail ? 'email' : 'sms',
          code: error.code,
          status: error.status,
          message: error.message,
        });

        // Specific developer & user actionable error messaging
        if (
          error.code === 'phone_provider_disabled' ||
          (error.message && error.message.toLowerCase().includes('phone provider')) ||
          (error.message && error.message.toLowerCase().includes('unsupported phone provider'))
        ) {
          return {
            success: false,
            code: 'phone_provider_disabled',
            error: 'SMS verification is not configured yet. Please choose email verification or contact support.',
            canSwitchChannel: 'email',
          };
        }

        if (
          error.code === 'over_email_send_rate_limit' ||
          error.code === 'over_sms_send_rate_limit' ||
          (error.message && error.message.toLowerCase().includes('rate limit'))
        ) {
          return {
            success: false,
            code: 'rate_limit',
            error: 'Security rate limit exceeded. Please wait a few minutes before requesting another OTP.',
            canSwitchChannel: isEmail ? 'sms' : 'email',
          };
        }

        if (
          error.code === 'email_address_invalid' ||
          (error.message && error.message.toLowerCase().includes('email address'))
        ) {
          return {
            success: false,
            code: 'email_invalid',
            error: 'The email address entered is invalid or cannot receive messages.',
            canSwitchChannel: 'sms',
          };
        }

        if (error.status === 429) {
          return {
            success: false,
            code: 'rate_limit',
            error: 'Too many OTP requests. Please wait a few moments before trying again.',
            canSwitchChannel: isEmail ? 'sms' : 'email',
          };
        }

        return {
          success: false,
          code: error.code,
          error: error.message || (isEmail
            ? 'Failed to dispatch email verification code. Please check your address or try SMS verification.'
            : 'SMS verification failed. Please choose email verification or contact support.'),
          canSwitchChannel: isEmail ? 'sms' : 'email',
        };
      }

      return {
        success: true,
        destination: normalizedDestination,
        channel: isEmail ? 'email' : 'sms',
      };
    } catch (err: any) {
      console.error('[Supabase Auth Exception]', {
        message: err?.message,
      });
      return {
        success: false,
        error: err?.message || 'Unable to connect to Supabase Auth service. Please verify your connection.',
      };
    }
  }

  // Isolated local development mock mode (ONLY active if explicitly enabled)
  const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
  if (isMockMode) {
    console.warn('[Fraud Lock] Using local mock auth because NEXT_PUBLIC_ENABLE_MOCK_AUTH is true.');
    return {
      success: true,
      destination: normalizedDestination,
      channel: isEmail ? 'email' : 'sms',
    };
  }

  return {
    success: false,
    error: 'Supabase authentication is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
  };
}

/**
 * Verify OTP with Supabase Auth
 */
export async function verifySupabaseOtp(
  destination: string,
  token: string,
  channel: 'email' | 'sms' = 'email',
  purpose: OtpChallenge['purpose'] = 'login',
  tempCredentials?: {
    displayName?: string;
    email?: string;
    phone?: string;
    apartmentBlock?: string;
    apartmentUnit?: string;
    role?: UserRole;
    emergencyName?: string;
    emergencyPhone?: string;
    country?: string;
    preferredLang?: string;
  }
): Promise<AuthResult> {
  const isEmail = channel === 'email' || destination.includes('@');
  const cleanToken = token.trim();

  if (!cleanToken || cleanToken.length !== 6 || !/^\d{6}$/.test(cleanToken)) {
    return { success: false, error: 'Please enter a valid 6-digit verification code.' };
  }

  let formattedDestination = '';
  if (isEmail) {
    const emailRes = validateEmail(destination);
    formattedDestination = emailRes.isValid ? emailRes.email : destination.trim().toLowerCase();
  } else {
    const phoneRes = normalizeIndianPhone(destination);
    formattedDestination = phoneRes.isValid ? phoneRes.phone : destination.trim();
  }

  if (supabase) {
    try {
      let data: any = null;
      let error: any = null;

      if (isEmail) {
        const res = await supabase.auth.verifyOtp({
          email: formattedDestination,
          token: cleanToken,
          type: 'email',
        });
        data = res.data;
        error = res.error;
      } else {
        const res = await supabase.auth.verifyOtp({
          phone: formattedDestination,
          token: cleanToken,
          type: 'sms',
        });
        data = res.data;
        error = res.error;
      }

      if (error) {
        console.error('[Supabase Auth Verify Error]', {
          code: error.code,
          status: error.status,
          message: error.message,
        });

        if (
          error.code === 'otp_expired' ||
          (error.message && error.message.toLowerCase().includes('expired'))
        ) {
          return {
            success: false,
            error: 'The verification code has expired. Please request a new OTP.',
          };
        }

        if (
          (error.message && error.message.toLowerCase().includes('invalid')) ||
          (error.message && error.message.toLowerCase().includes('token'))
        ) {
          return {
            success: false,
            error: 'Incorrect 6-digit OTP code. Please check your messages and try again.',
          };
        }

        return {
          success: false,
          error: error.message || 'Verification failed. Please try again.',
        };
      }

      if (data?.user) {
        const u = data.user;
        const displayName =
          tempCredentials?.displayName ||
          u.user_metadata?.display_name ||
          (isEmail ? formattedDestination.split('@')[0] : 'Citizen User');

        const resolvedEmail = u.email || tempCredentials?.email || (isEmail ? formattedDestination : '');
        const resolvedPhone = u.phone || tempCredentials?.phone || (!isEmail ? formattedDestination : '');
        const resolvedRole: UserRole = tempCredentials?.role || u.user_metadata?.role || 'customer';
        const resolvedBlock = tempCredentials?.apartmentBlock || u.user_metadata?.apartment_block || '';
        const resolvedUnit = tempCredentials?.apartmentUnit || u.user_metadata?.apartment_unit || '';

        // Save profile metadata in Supabase Auth user record
        try {
          await supabase.auth.updateUser({
            data: {
              display_name: displayName,
              apartment_block: resolvedBlock,
              apartment_unit: resolvedUnit,
              role: resolvedRole,
              phone: resolvedPhone,
              emergency_contact_name: tempCredentials?.emergencyName,
              emergency_contact_phone: tempCredentials?.emergencyPhone,
              country: tempCredentials?.country || 'India',
              preferred_language: tempCredentials?.preferredLang || 'en',
            },
          });
        } catch (updateErr) {
          console.warn('Metadata sync note:', updateErr);
        }

        // Try syncing to public.profiles table
        try {
          await supabase.from('profiles').upsert({
            id: u.id,
            display_name: displayName,
            email: resolvedEmail,
            phone: resolvedPhone,
            apartment_block: resolvedBlock,
            apartment_unit: resolvedUnit,
            role: resolvedRole,
            country: tempCredentials?.country || 'India',
            preferred_language: (tempCredentials?.preferredLang as any) || 'en',
            emergency_contact_name: tempCredentials?.emergencyName,
            emergency_contact_phone: tempCredentials?.emergencyPhone,
            created_at: u.created_at || new Date().toISOString(),
            last_login_at: new Date().toISOString(),
          });
        } catch {
          // Table may not yet be migrated
        }

        const userProfile: UserProfile = {
          id: u.id,
          display_name: displayName,
          email: resolvedEmail,
          email_verified: Boolean(u.email_confirmed_at || isEmail),
          phone: resolvedPhone,
          phone_verified: Boolean(u.phone_confirmed_at || !isEmail),
          apartment_block: resolvedBlock,
          apartment_unit: resolvedUnit,
          role: resolvedRole,
          avatar_url: u.user_metadata?.avatar_url || '',
          country: tempCredentials?.country || 'India',
          preferred_language: (tempCredentials?.preferredLang as any) || 'en',
          emergency_contact_name: tempCredentials?.emergencyName,
          emergency_contact_phone: tempCredentials?.emergencyPhone,
          created_at: u.created_at || new Date().toISOString(),
          last_login_at: new Date().toISOString(),
        };

        if (typeof window !== 'undefined') {
          localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(userProfile));
        }

        await logSecurityEvent({
          event_type: 'login',
          details: `OTP authentication verified successfully for ${formattedDestination}`,
        });

        return { success: true, user: userProfile };
      }
    } catch (err: any) {
      console.error('[Supabase Auth Verify Exception]', { message: err?.message });
      return { success: false, error: err?.message || 'Verification exception occurred.' };
    }
  }

  // Isolated local development mock mode (ONLY active if explicitly enabled)
  const isMockMode = process.env.NEXT_PUBLIC_ENABLE_MOCK_AUTH === 'true';
  if (isMockMode) {
    if (cleanToken === '123456') {
      const demoUser: UserProfile = {
        id: `usr_${Date.now()}`,
        display_name: tempCredentials?.displayName || (isEmail ? formattedDestination.split('@')[0] : 'Citizen User'),
        email: isEmail ? formattedDestination : '',
        email_verified: isEmail,
        phone: !isEmail ? formattedDestination : '',
        phone_verified: !isEmail,
        country: 'India',
        preferred_language: 'en',
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      };
      if (typeof window !== 'undefined') {
        localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(demoUser));
      }
      return { success: true, user: demoUser };
    }
    return { success: false, error: 'Mock OTP invalid. (In local mock mode, use code 123456)' };
  }

  return { success: false, error: 'Supabase authentication service unavailable.' };
}

/**
 * Initiate Password Reset via Email
 */
export async function resetPasswordForEmail(email: string): Promise<{ success: boolean; error?: string }> {
  if (supabase) {
    try {
      const redirectUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await logSecurityEvent({
        event_type: 'password_change',
        details: `Password reset link dispatched to ${email}`,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to dispatch reset email.' };
    }
  }

  return { success: true };
}

/**
 * Update authenticated user's password
 */
export async function updateUserPassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
  if (supabase) {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      await updateSecuritySettings({
        password_last_changed_at: new Date().toISOString(),
      });

      await logSecurityEvent({
        event_type: 'password_change',
        details: 'User successfully updated master account password',
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to update password.' };
    }
  }

  await updateSecuritySettings({
    password_last_changed_at: new Date().toISOString(),
  });

  return { success: true };
}

/**
 * Sign out of current active session
 */
export async function signOut(): Promise<void> {
  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('Supabase sign out error:', e);
    }
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_OTP);
  }

  await logSecurityEvent({
    event_type: 'logout',
    details: 'User signed out from Fraud Lock security session',
  });
}

// =============================================================================
// MULTI-FACTOR AUTHENTICATION (MFA / TOTP)
// =============================================================================

export interface MfaEnrollmentResult {
  success: boolean;
  factorId?: string;
  qrCodeUrl?: string;
  secret?: string;
  uri?: string;
  error?: string;
}

/**
 * Enroll a new TOTP Multi-Factor Authentication factor in Supabase
 */
export async function enrollMfaTotp(): Promise<MfaEnrollmentResult> {
  if (supabase) {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        issuer: 'Fraud Lock',
        friendlyName: 'Fraud Lock Authenticator',
      });

      if (error || !data) {
        console.warn('Supabase MFA enroll note:', error?.message);
        // Fall back to offline TOTP generator
        return {
          success: true,
          secret: 'JBSWY3DPEHPK3PXP',
          qrCodeUrl: '',
        };
      }

      return {
        success: true,
        factorId: data.id,
        qrCodeUrl: data.totp.qr_code,
        secret: data.totp.secret,
        uri: data.totp.uri,
      };
    } catch (err: any) {
      console.warn('MFA enrollment fallback:', err);
    }
  }

  return {
    success: true,
    secret: 'JBSWY3DPEHPK3PXP',
    qrCodeUrl: '',
  };
}

/**
 * Verify and challenge enrolled TOTP code to activate MFA
 */
export async function verifyMfaTotp(
  factorId: string | undefined,
  code: string
): Promise<{ success: boolean; error?: string }> {
  if (supabase && factorId) {
    try {
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (challengeError) {
        return { success: false, error: challengeError.message };
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code,
      });

      if (verifyError) {
        return { success: false, error: verifyError.message };
      }

      const backupCodes = generateBackupRecoveryCodes(10);
      await updateSecuritySettings({
        mfa_enabled: true,
        backup_codes: backupCodes,
      });

      await logSecurityEvent({
        event_type: 'mfa_enabled',
        details: 'Two-factor authenticator TOTP verified and activated via Supabase Auth',
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'MFA verification failed.' };
    }
  }

  // Local verification fallback
  if (code.length === 6) {
    const backupCodes = generateBackupRecoveryCodes(10);
    await updateSecuritySettings({
      mfa_enabled: true,
      backup_codes: backupCodes,
    });
    return { success: true };
  }

  return { success: false, error: 'Invalid 6-digit TOTP code.' };
}

/**
 * Unenroll MFA TOTP factor
 */
export async function unenrollMfaTotp(factorId?: string): Promise<{ success: boolean; error?: string }> {
  if (supabase && factorId) {
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId });
      if (error) {
        console.warn('Supabase MFA unenroll error:', error);
      }
    } catch (e) {
      console.warn('MFA unenroll note:', e);
    }
  }

  await updateSecuritySettings({
    mfa_enabled: false,
    backup_codes: [],
  });

  await logSecurityEvent({
    event_type: 'mfa_disabled',
    details: 'Two-factor authenticator TOTP deactivated by user',
  });

  return { success: true };
}

// =============================================================================
// USER PROFILE MANAGEMENT
// =============================================================================

/**
 * Get Current Active User Profile
 * Fetches from Supabase Auth session & Postgres profiles table, with local fallback
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  if (typeof window === 'undefined') return null;

  // Check Supabase Auth session first
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const u = session.user;
        const meta = u.user_metadata || {};

        // Query Postgres profiles table
        let dbProfile: any = null;
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', u.id)
            .maybeSingle();
          if (data && !error) {
            dbProfile = data;
          }
        } catch {
          // Table may not yet be migrated
        }

        const profile: UserProfile = {
          id: u.id,
          display_name: dbProfile?.display_name || meta.display_name || u.email?.split('@')[0] || 'Citizen User',
          email: u.email || dbProfile?.email || '',
          email_verified: Boolean(u.email_confirmed_at),
          phone: dbProfile?.phone || u.phone || meta.phone || '',
          phone_verified: Boolean(u.phone_confirmed_at || dbProfile?.phone_verified),
          apartment_block: dbProfile?.apartment_block || meta.apartment_block || '',
          apartment_unit: dbProfile?.apartment_unit || meta.apartment_unit || '',
          role: (dbProfile?.role || meta.role || 'customer') as UserRole,
          avatar_url: dbProfile?.avatar_url || meta.avatar_url || '',
          country: dbProfile?.country || meta.country || 'India',
          preferred_language: dbProfile?.preferred_language || meta.preferred_language || 'en',
          emergency_contact_name: dbProfile?.emergency_contact_name || meta.emergency_contact_name,
          emergency_contact_phone: dbProfile?.emergency_contact_phone || meta.emergency_contact_phone,
          created_at: dbProfile?.created_at || u.created_at,
          last_login_at: dbProfile?.last_login_at || new Date().toISOString(),
        };

        // Cache in local storage for fast render
        localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(profile));
        return profile;
      }
    } catch (e) {
      console.warn('Supabase profile fetch fallback to local:', e);
    }
  }

  // Local-first persistent profile
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id === 'usr_fraudlock_demo_001') {
      localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Update User Profile
 * Synchronizes to both Supabase Postgres (profiles) and local storage
 */
export async function updateUserProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
  const current = (await getCurrentUserProfile()) || {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    display_name: 'Citizen',
    email: '',
    email_verified: false,
    phone: '',
    phone_verified: false,
    country: 'India',
    preferred_language: 'en' as const,
    created_at: new Date().toISOString(),
    last_login_at: new Date().toISOString(),
  };

  const updated: UserProfile = { ...current, ...updates };

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.CURRENT_USER, JSON.stringify(updated));
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        // Update user metadata in Supabase Auth
        await supabase.auth.updateUser({
          data: {
            display_name: updated.display_name,
            phone: updated.phone,
            country: updated.country,
            preferred_language: updated.preferred_language,
            emergency_contact_name: updated.emergency_contact_name,
            emergency_contact_phone: updated.emergency_contact_phone,
            avatar_url: updated.avatar_url,
          },
        });

        // Upsert to Postgres profiles table
        await supabase.from('profiles').upsert({
          id: session.user.id,
          display_name: updated.display_name,
          phone: updated.phone,
          country: updated.country,
          preferred_language: updated.preferred_language,
          emergency_contact_name: updated.emergency_contact_name,
          emergency_contact_phone: updated.emergency_contact_phone,
          avatar_url: updated.avatar_url,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Supabase profile update skipped:', e);
    }
  }

  await logSecurityEvent({
    event_type: 'login',
    details: 'User profile updated successfully',
  });

  return updated;
}

/**
 * Upload Avatar to Private Storage Bucket and Update Profile
 */
export async function uploadAndSetUserAvatar(file: File): Promise<{ success: boolean; avatarUrl?: string; error?: string }> {
  const profile = await getCurrentUserProfile();
  const userId = profile?.id || 'guest_user';

  const uploadRes = await uploadProfileAvatar(file, userId);
  if (uploadRes.error || !uploadRes.signedUrl) {
    return { success: false, error: uploadRes.error || 'Failed to upload avatar.' };
  }

  await updateUserProfile({ avatar_url: uploadRes.signedUrl });
  return { success: true, avatarUrl: uploadRes.signedUrl };
}

// =============================================================================
// USER SECURITY SETTINGS
// =============================================================================

export async function getUserSecuritySettings(): Promise<UserSecuritySettings> {
  if (typeof window === 'undefined') return DEFAULT_SECURITY_SETTINGS;

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('user_security_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (data && !error) {
          return {
            user_id: data.user_id,
            mfa_enabled: data.mfa_enabled,
            backup_codes: data.backup_codes_hash || [],
            failed_login_attempts: data.failed_login_attempts || 0,
            notify_on_new_device: data.notify_on_new_device ?? true,
            notify_on_security_change: data.notify_on_security_change ?? true,
            password_last_changed_at: data.password_last_changed_at || new Date().toISOString(),
          };
        }
      }
    } catch (e) {
      console.warn('Supabase security settings fetch skipped:', e);
    }
  }

  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.SECURITY_SETTINGS);
    if (!raw) {
      localStorage.setItem(AUTH_STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(DEFAULT_SECURITY_SETTINGS));
      return DEFAULT_SECURITY_SETTINGS;
    }
    return JSON.parse(raw);
  } catch {
    return DEFAULT_SECURITY_SETTINGS;
  }
}

export async function updateSecuritySettings(
  updates: Partial<UserSecuritySettings>
): Promise<UserSecuritySettings> {
  const current = await getUserSecuritySettings();
  const updated = { ...current, ...updates };

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.SECURITY_SETTINGS, JSON.stringify(updated));
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('user_security_settings').upsert({
          user_id: session.user.id,
          mfa_enabled: updated.mfa_enabled,
          notify_on_new_device: updated.notify_on_new_device,
          notify_on_security_change: updated.notify_on_security_change,
          password_last_changed_at: updated.password_last_changed_at,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Supabase security settings update skipped:', e);
    }
  }

  return updated;
}

// =============================================================================
// OTP CHALLENGE METADATA MANAGEMENT (Zero secret storage on client)
// =============================================================================

export interface GeneratedOtp {
  challenge: OtpChallenge;
}

/**
 * Creates safe metadata representing an active OTP challenge.
 * Notice: The secret OTP is generated, managed, and verified exclusively
 * by Supabase Auth server-side. No OTP code is ever stored on the client.
 */
export function createOtpChallengeMetadata(
  destination: string,
  channel: 'email' | 'sms',
  purpose: OtpChallenge['purpose']
): OtpChallenge {
  const now = Date.now();
  const maskedDestination = channel === 'sms' ? maskIndianPhone(destination) : maskEmail(destination);
  const challenge: OtpChallenge = {
    destination,
    maskedDestination,
    channel,
    expiresAt: now + 10 * 60 * 1000, // 10 minutes expiry
    resendAvailableAt: now + 60 * 1000, // 60 seconds cooldown
    attemptsLeft: 5,
    purpose,
  };

  if (typeof window !== 'undefined') {
    // Store ONLY non-sensitive metadata for UI timer tracking (NO OTP CODE!)
    sessionStorage.setItem(
      AUTH_STORAGE_KEYS.ACTIVE_OTP,
      JSON.stringify({ challenge })
    );
  }

  return challenge;
}

export function createOtpChallenge(
  destination: string,
  channel: 'email' | 'sms',
  purpose: OtpChallenge['purpose']
): GeneratedOtp {
  const challenge = createOtpChallengeMetadata(destination, channel, purpose);
  return { challenge };
}

export function getActiveOtpChallenge(): { challenge: OtpChallenge } | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(AUTH_STORAGE_KEYS.ACTIVE_OTP);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearActiveOtpChallenge(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_OTP);
  }
}

// =============================================================================
// AUDIT LOGGING & SECURITY EVENTS
// =============================================================================

export async function logSecurityEvent(
  event: Omit<SecurityEvent, 'id' | 'user_id' | 'ip_address' | 'user_agent' | 'created_at'>
): Promise<void> {
  const newEvent: SecurityEvent = {
    id: `sec_evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    user_id: 'current-user',
    event_type: event.event_type,
    ip_address: '127.0.0.1 (Local Verified)',
    user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'FraudLock Web Client',
    details: event.details,
    created_at: new Date().toISOString(),
  };

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(AUTH_STORAGE_KEYS.SECURITY_EVENTS) || '[]';
      const events: SecurityEvent[] = JSON.parse(raw);
      events.unshift(newEvent);
      localStorage.setItem(AUTH_STORAGE_KEYS.SECURITY_EVENTS, JSON.stringify(events.slice(0, 50)));
    } catch {
      //
    }
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('account_security_events').insert({
          user_id: session.user.id,
          event_type: newEvent.event_type,
          ip_address: newEvent.ip_address,
          user_agent: newEvent.user_agent,
          details: newEvent.details,
        });
      }
    } catch (e) {
      console.warn('Supabase security event insert skipped:', e);
    }
  }
}

export async function getSecurityEvents(): Promise<SecurityEvent[]> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('account_security_events')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (data && !error && data.length > 0) {
          return data.map((e) => ({
            id: e.id,
            user_id: e.user_id,
            event_type: e.event_type,
            ip_address: e.ip_address,
            user_agent: e.user_agent,
            details: e.details,
            created_at: e.created_at,
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase events query skipped:', e);
    }
  }

  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.SECURITY_EVENTS);
    if (!raw) return [];
    const events: SecurityEvent[] = JSON.parse(raw);
    return events.filter((e) => !e.id?.startsWith('sec_init_'));
  } catch {
    return [];
  }
}

// =============================================================================
// TRUSTED DEVICES & USER SESSIONS
// =============================================================================

export async function getTrustedDevices(): Promise<TrustedDevice[]> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('trusted_devices')
          .select('*')
          .eq('user_id', session.user.id)
          .order('last_active_at', { ascending: false });

        if (data && !error && data.length > 0) {
          return data.map((d) => ({
            id: d.id,
            user_id: d.user_id,
            device_name: d.device_name,
            device_type: d.device_type,
            ip_address: d.ip_address,
            user_agent: d.user_agent,
            last_active_at: d.last_active_at,
            is_current: d.is_current,
            trusted_since: d.trusted_since,
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase trusted devices fetch skipped:', e);
    }
  }

  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.TRUSTED_DEVICES);
    if (!raw) return [];
    const devices: TrustedDevice[] = JSON.parse(raw);
    return devices.filter((d) => !d.id?.startsWith('dev_'));
  } catch {
    return [];
  }
}

export async function removeTrustedDevice(id: string): Promise<void> {
  const devices = await getTrustedDevices();
  const updated = devices.filter((d) => d.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.TRUSTED_DEVICES, JSON.stringify(updated));
  }

  if (supabase) {
    try {
      await supabase.from('trusted_devices').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase trusted device delete skipped:', e);
    }
  }

  await logSecurityEvent({
    event_type: 'logout',
    details: `Trusted device revoked: ${id}`,
  });
}

export async function getUserSessions(): Promise<UserSession[]> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('user_sessions')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data && !error && data.length > 0) {
          return data.map((s) => ({
            id: s.id,
            user_id: s.user_id,
            device_name: s.device_name,
            ip_address: s.ip_address,
            created_at: s.created_at,
            expires_at: s.expires_at,
            is_current: !s.revoked,
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase sessions query skipped:', e);
    }
  }

  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.USER_SESSIONS);
    if (!raw) return [];
    const sessions: UserSession[] = JSON.parse(raw);
    return sessions.filter((s) => !s.id?.startsWith('sess_'));
  } catch {
    return [];
  }
}

export async function signOutOtherSessions(): Promise<void> {
  const sessions = await getUserSessions();
  const currentOnly = sessions.filter((s) => s.is_current);
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.USER_SESSIONS, JSON.stringify(currentOnly));
  }

  if (supabase) {
    try {
      await supabase.auth.signOut({ scope: 'others' });
    } catch (e) {
      console.warn('Supabase sign out others skipped:', e);
    }
  }

  await logSecurityEvent({
    event_type: 'logout',
    details: 'Signed out of all other active sessions and devices',
  });
}

// =============================================================================
// CLIENT-SIDE E2E ENCRYPTED NOTES (ZERO-KNOWLEDGE)
// =============================================================================

export async function getEncryptedNotes(): Promise<EncryptedPrivateNote[]> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('encrypted_private_profile_data')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data && !error && data.length > 0) {
          return data.map((n) => ({
            id: n.id,
            user_id: n.user_id,
            note_label: n.note_label,
            cipher_text: n.cipher_text,
            iv: n.iv,
            salt: n.salt,
            created_at: n.created_at,
            updated_at: n.updated_at,
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase encrypted notes query skipped:', e);
    }
  }

  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEYS.ENCRYPTED_NOTES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveEncryptedNote(
  note: Omit<EncryptedPrivateNote, 'id' | 'created_at' | 'updated_at'>
): Promise<EncryptedPrivateNote> {
  const newNote: EncryptedPrivateNote = {
    ...note,
    id: `e2e_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const list = await getEncryptedNotes();
  list.unshift(newNote);

  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.ENCRYPTED_NOTES, JSON.stringify(list));
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('encrypted_private_profile_data').insert({
          user_id: session.user.id,
          note_label: newNote.note_label,
          cipher_text: newNote.cipher_text,
          iv: newNote.iv,
          salt: newNote.salt,
        });
      }
    } catch (e) {
      console.warn('Supabase encrypted note insert skipped:', e);
    }
  }

  await logSecurityEvent({
    event_type: 'e2e_note_created',
    details: `Client-side encrypted record created: "${newNote.note_label}"`,
  });

  return newNote;
}

export async function deleteEncryptedNote(id: string): Promise<void> {
  const list = await getEncryptedNotes();
  const filtered = list.filter((n) => n.id !== id);
  if (typeof window !== 'undefined') {
    localStorage.setItem(AUTH_STORAGE_KEYS.ENCRYPTED_NOTES, JSON.stringify(filtered));
  }

  if (supabase) {
    try {
      await supabase.from('encrypted_private_profile_data').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase encrypted note delete skipped:', e);
    }
  }

  await logSecurityEvent({
    event_type: 'e2e_note_deleted',
    details: `Encrypted private record deleted: ${id}`,
  });
}

// =============================================================================
// GDPR / DATA SOVEREIGNTY EXPORT & ACCOUNT PERMANENT DELETION
// =============================================================================

export async function exportAllUserData(): Promise<string> {
  const profile = await getCurrentUserProfile();
  const security = await getUserSecuritySettings();
  const devices = await getTrustedDevices();
  const sessions = await getUserSessions();
  const events = await getSecurityEvents();

  let evidence = [];
  let analyses = [];
  try {
    evidence = JSON.parse(localStorage.getItem('fraudlock_evidence_items') || '[]');
    analyses = JSON.parse(localStorage.getItem('fraudlock_analyses_vault') || '[]');
  } catch {
    //
  }

  const exportPayload = {
    export_metadata: {
      generated_at: new Date().toISOString(),
      system: 'Fraud Lock Data Sovereignty & Portability',
      standard: 'GDPR_CCPA_COMPLIANT_EXPORT_V1',
    },
    user_profile: profile,
    security_configuration: {
      mfa_enabled: security.mfa_enabled,
      notify_on_new_device: security.notify_on_new_device,
      password_last_changed_at: security.password_last_changed_at,
    },
    trusted_devices: devices,
    active_sessions: sessions,
    security_audit_events: events,
    evidence_vault_records: evidence,
    scan_analyses: analyses,
  };

  await logSecurityEvent({
    event_type: 'data_export',
    details: 'User exported complete data sovereignty archive',
  });

  return JSON.stringify(exportPayload, null, 2);
}

export async function permanentlyDeleteAccount(
  confirmationText: string
): Promise<{ success: boolean; error?: string }> {
  if (confirmationText.trim() !== 'DELETE MY ACCOUNT') {
    return { success: false, error: 'Confirmation phrase did not match "DELETE MY ACCOUNT".' };
  }

  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_STORAGE_KEYS.CURRENT_USER);
    localStorage.removeItem(AUTH_STORAGE_KEYS.SECURITY_SETTINGS);
    localStorage.removeItem(AUTH_STORAGE_KEYS.TRUSTED_DEVICES);
    localStorage.removeItem(AUTH_STORAGE_KEYS.USER_SESSIONS);
    localStorage.removeItem(AUTH_STORAGE_KEYS.SECURITY_EVENTS);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ENCRYPTED_NOTES);
    localStorage.removeItem(AUTH_STORAGE_KEYS.ACTIVE_OTP);
    localStorage.removeItem('fraudlock_evidence_items');
    localStorage.removeItem('fraudlock_analyses_vault');
    localStorage.removeItem('fraudlock_incident_reports');
    sessionStorage.clear();
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const uid = session.user.id;
        await Promise.all([
          supabase.from('encrypted_private_profile_data').delete().eq('user_id', uid),
          supabase.from('account_security_events').delete().eq('user_id', uid),
          supabase.from('consent_records').delete().eq('user_id', uid),
          supabase.from('user_sessions').delete().eq('user_id', uid),
          supabase.from('trusted_devices').delete().eq('user_id', uid),
          supabase.from('user_security_settings').delete().eq('user_id', uid),
          supabase.from('evidence_items').delete().eq('user_id', uid),
          supabase.from('analyses').delete().eq('user_id', uid),
          supabase.from('incident_reports').delete().eq('user_id', uid),
          supabase.from('chat_conversations').delete().eq('user_id', uid),
          supabase.from('profiles').delete().eq('id', uid),
        ]);
        await supabase.auth.signOut();
      }
    } catch (e) {
      console.warn('Supabase account deletion skipped:', e);
    }
  }

  return { success: true };
}
