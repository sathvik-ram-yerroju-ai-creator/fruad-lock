import { SupportedLocale } from './scam';

export interface UserProfile {
  id: string;
  display_name: string;
  email: string;
  email_verified: boolean;
  phone: string;
  phone_verified: boolean;
  avatar_url?: string;
  country: string;
  preferred_language: SupportedLocale;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  created_at: string;
  last_login_at: string;
}

export interface UserSecuritySettings {
  user_id: string;
  mfa_enabled: boolean;
  mfa_secret?: string;
  backup_codes: string[];
  failed_login_attempts: number;
  locked_until?: string;
  notify_on_new_device: boolean;
  notify_on_security_change: boolean;
  password_last_changed_at: string;
}

export interface TrustedDevice {
  id: string;
  user_id: string;
  device_name: string;
  device_type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
  ip_address: string;
  user_agent: string;
  last_active_at: string;
  is_current: boolean;
  trusted_since: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_name: string;
  ip_address: string;
  created_at: string;
  expires_at: string;
  is_current: boolean;
}

export interface SecurityEvent {
  id: string;
  user_id: string;
  event_type:
    | 'login'
    | 'logout'
    | 'password_change'
    | 'mfa_enabled'
    | 'mfa_disabled'
    | 'email_change'
    | 'phone_change'
    | 'new_device'
    | 'failed_login'
    | 'lockout'
    | 'data_export'
    | 'e2e_note_created'
    | 'e2e_note_deleted';
  ip_address: string;
  user_agent: string;
  details: string;
  created_at: string;
}

export interface EncryptedPrivateNote {
  id: string;
  user_id: string;
  note_label: string;
  cipher_text: string;
  iv: string;
  salt: string;
  created_at: string;
  updated_at: string;
}

export interface PasswordStrengthInfo {
  score: number; // 0 to 4
  label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
  meetsLength: boolean;
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  feedback: string[];
}

export interface OtpChallenge {
  destination: string; // phone or email
  channel: 'email' | 'sms';
  expiresAt: number; // timestamp
  resendAvailableAt: number;
  attemptsLeft: number;
  purpose: 'signup' | 'login' | 'reset_password' | 'change_email' | 'change_phone';
}
