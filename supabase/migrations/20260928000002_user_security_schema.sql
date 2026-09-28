-- =============================================================================
-- 🛡️ FRAUD LOCK: Enhanced User Security, Profile, Sessions & E2E Encryption Schema
-- =============================================================================

-- 1. Enhance Profiles Table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS email TEXT,
  ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS country VARCHAR(60) NOT NULL DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
  ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now());

-- 2. User Security Settings Table
CREATE TABLE IF NOT EXISTS public.user_security_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  mfa_enabled BOOLEAN NOT NULL DEFAULT false,
  mfa_secret TEXT,
  backup_codes_hash TEXT[],
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  notify_on_new_device BOOLEAN NOT NULL DEFAULT true,
  notify_on_security_change BOOLEAN NOT NULL DEFAULT true,
  password_last_changed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Trusted Devices Table
CREATE TABLE IF NOT EXISTS public.trusted_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_name TEXT NOT NULL,
  device_type VARCHAR(20) NOT NULL DEFAULT 'desktop' CHECK (device_type IN ('mobile', 'desktop', 'tablet', 'unknown')),
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  is_current BOOLEAN NOT NULL DEFAULT false,
  trusted_since TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. User Sessions Table (Session monitoring & device revocation)
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token_hash TEXT,
  device_name TEXT NOT NULL,
  ip_address TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ NOT NULL,
  revoked BOOLEAN NOT NULL DEFAULT false
);

-- 5. Consent Records Table
CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ip_address TEXT
);

-- 6. Account Security Events Audit Table
CREATE TABLE IF NOT EXISTS public.account_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Client-Side Encrypted Private Profile Data (Zero-Knowledge)
-- Contains ciphertext only; encryption keys are NEVER uploaded to server
CREATE TABLE IF NOT EXISTS public.encrypted_private_profile_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_label TEXT NOT NULL,
  cipher_text TEXT NOT NULL, -- AES-256-GCM encrypted payload
  iv TEXT NOT NULL,          -- Initialization vector (base64)
  salt TEXT NOT NULL,        -- PBKDF2 salt (base64)
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON public.user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.account_security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encrypted_notes_user_id ON public.encrypted_private_profile_data(user_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: User A can NEVER access or enumerate User B's records
-- =============================================================================
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_private_profile_data ENABLE ROW LEVEL SECURITY;

-- User Security Settings RLS
CREATE POLICY "Users can view own security settings" ON public.user_security_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own security settings" ON public.user_security_settings
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own security settings" ON public.user_security_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Trusted Devices RLS
CREATE POLICY "Users can view own trusted devices" ON public.trusted_devices
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own trusted devices" ON public.trusted_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own trusted devices" ON public.trusted_devices
  FOR DELETE USING (auth.uid() = user_id);

-- User Sessions RLS
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can delete or revoke own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- Consent Records RLS
CREATE POLICY "Users can view own consents" ON public.consent_records
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON public.consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Account Security Events RLS
CREATE POLICY "Users can view own security events" ON public.account_security_events
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own security events" ON public.account_security_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Encrypted Private Profile Data RLS
CREATE POLICY "Users can view own encrypted notes" ON public.encrypted_private_profile_data
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own encrypted notes" ON public.encrypted_private_profile_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own encrypted notes" ON public.encrypted_private_profile_data
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own encrypted notes" ON public.encrypted_private_profile_data
  FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- PROFILE AVATARS PRIVATE STORAGE BUCKET & RLS POLICIES
-- =============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-avatars',
  'profile-avatars',
  false,
  2097152, -- 2MB max
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-avatars' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own avatar"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-avatars' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-avatars' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);
