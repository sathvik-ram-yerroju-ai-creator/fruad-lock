-- =============================================================================
-- 🛡️ FRAUD LOCK: Production Database Schema, Storage, Triggers & RLS Policies
-- =============================================================================
-- Target Database: Supabase PostgreSQL
-- Instructions: Copy and run this entire script in Supabase Dashboard -> SQL Editor
-- Security Model: Strict Zero-Trust Row Level Security (RLS)
-- Rule: Every user-owned record enforces user_id = auth.uid()
-- =============================================================================

-- Enable pgcrypto for UUID generation & cryptographic hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. PROFILES TABLE (User identity, contact details & emergency recovery)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL DEFAULT 'Citizen User',
  email TEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  phone TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT false,
  avatar_url TEXT,
  country VARCHAR(60) NOT NULL DEFAULT 'India',
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  last_login_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 2. USER SETTINGS TABLE (Preferences, Family Mode & Threat Sharing)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  preferred_language VARCHAR(10) NOT NULL DEFAULT 'en',
  family_mode BOOLEAN NOT NULL DEFAULT false,
  retention_days INTEGER NOT NULL DEFAULT 30 CHECK (retention_days IN (7, 30, 90)),
  telemetry_consent BOOLEAN NOT NULL DEFAULT false,
  anonymous_threat_sharing BOOLEAN NOT NULL DEFAULT true,
  trusted_contact_name TEXT,
  trusted_contact_phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 3. USER SECURITY SETTINGS TABLE (MFA status, lockout policy & password audits)
-- =============================================================================
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

-- =============================================================================
-- 4. TRUSTED DEVICES & ACTIVE SESSIONS
-- =============================================================================
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

CREATE TABLE IF NOT EXISTS public.consent_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type VARCHAR(50) NOT NULL,
  granted BOOLEAN NOT NULL DEFAULT true,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  ip_address TEXT
);

CREATE TABLE IF NOT EXISTS public.account_security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  ip_address TEXT NOT NULL,
  user_agent TEXT NOT NULL,
  details TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 5. CLIENT-SIDE ENCRYPTED PRIVATE NOTES (Zero-Knowledge AES-256-GCM)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.encrypted_private_profile_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note_label TEXT NOT NULL,
  cipher_text TEXT NOT NULL,
  iv TEXT NOT NULL,
  salt TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 6. SCAM ANALYSES & HEURISTIC SCAN HISTORY
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type VARCHAR(30) NOT NULL CHECK (scan_type IN ('message', 'link', 'screenshot', 'qr')),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'CAUTION', 'HIGH')),
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ
);

-- =============================================================================
-- 7. EVIDENCE ITEMS (Private Evidence Vault artifacts & signed object paths)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  evidence_type VARCHAR(30) NOT NULL CHECK (evidence_type IN ('message', 'url', 'screenshot', 'qr', 'phone', 'transaction', 'note')),
  content TEXT NOT NULL,
  media_url TEXT, -- Path in private 'evidence-vault' storage bucket
  raw_indicators TEXT[],
  user_notes TEXT,
  user_verified_facts JSONB,
  ai_analysis JSONB,
  retention_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ
);

-- =============================================================================
-- 8. INCIDENT REPORTS & COMPLAINT DOSSIERS
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.incident_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  incident_type TEXT NOT NULL,
  incident_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  financial_loss_amount NUMERIC(14, 2) NOT NULL DEFAULT 0.00,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  scammer_platform TEXT,
  scammer_contacts TEXT[],
  summary TEXT,
  timeline_events JSONB DEFAULT '[]'::jsonb,
  emergency_steps_taken JSONB DEFAULT '{}'::jsonb,
  evidence_ids UUID[],
  status VARCHAR(30) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'exported', 'filed_with_authorities')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  format VARCHAR(20) NOT NULL CHECK (format IN ('json', 'markdown', 'pdf', 'txt')),
  exported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 9. SAFETY ASSISTANT CHAT CONVERSATIONS & MESSAGES
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Safety Guidance Session',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  sender VARCHAR(20) NOT NULL CHECK (sender IN ('user', 'assistant', 'system')),
  text TEXT NOT NULL,
  risk_warning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- 10. SAFETY CONTENT & AGGREGATED THREAT MAP (Publicly readable)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.safety_content (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  scam_mechanism TEXT NOT NULL,
  red_flags TEXT[] NOT NULL,
  safe_rules TEXT[] NOT NULL,
  real_world_case TEXT NOT NULL,
  quiz JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.aggregated_threats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  approx_lat NUMERIC(8, 4) NOT NULL,
  approx_lng NUMERIC(8, 4) NOT NULL,
  scam_category TEXT NOT NULL,
  report_count INTEGER NOT NULL DEFAULT 1,
  trend VARCHAR(20) NOT NULL DEFAULT 'stable' CHECK (trend IN ('increasing', 'stable', 'decreasing')),
  recent_summary TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- =============================================================================
-- INDEXES FOR MAXIMUM QUERY PERFORMANCE
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_id ON public.profiles(id);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_security_user_id ON public.user_security_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_devices_user_id ON public.trusted_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON public.account_security_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_encrypted_notes_user_id ON public.encrypted_private_profile_data(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_user_id ON public.evidence_items(user_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_user_id ON public.incident_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_conv_id ON public.chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_safety_content_lang ON public.safety_content(language, category);
CREATE INDEX IF NOT EXISTS idx_aggregated_threats_region ON public.aggregated_threats(region);

-- =============================================================================
-- AUTOMATIC NEW USER INITIALIZATION TRIGGER
-- Auto-populates public.profiles and user_security_settings upon Supabase signup
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    email,
    phone,
    country,
    preferred_language,
    created_at
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1), 'Citizen User'),
    new.email,
    COALESCE(new.phone, new.raw_user_meta_data->>'phone'),
    COALESCE(new.raw_user_meta_data->>'country', 'India'),
    COALESCE(new.raw_user_meta_data->>'preferred_language', 'en'),
    new.created_at
  )
  ON CONFLICT (id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone;

  INSERT INTO public.user_security_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.user_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Strict Isolation: User A can NEVER view, mutate or delete User B's records
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_security_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trusted_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.encrypted_private_profile_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregated_threats ENABLE ROW LEVEL SECURITY;

-- 1. Profiles RLS
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
  FOR DELETE USING (auth.uid() = id);

-- 2. User Settings RLS
DROP POLICY IF EXISTS "Users can view own settings" ON public.user_settings;
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON public.user_settings;
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON public.user_settings;
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own settings" ON public.user_settings;
CREATE POLICY "Users can delete own settings" ON public.user_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 3. User Security Settings RLS
DROP POLICY IF EXISTS "Users can view own security settings" ON public.user_security_settings;
CREATE POLICY "Users can view own security settings" ON public.user_security_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own security settings" ON public.user_security_settings;
CREATE POLICY "Users can insert own security settings" ON public.user_security_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own security settings" ON public.user_security_settings;
CREATE POLICY "Users can update own security settings" ON public.user_security_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own security settings" ON public.user_security_settings;
CREATE POLICY "Users can delete own security settings" ON public.user_security_settings
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Trusted Devices RLS
DROP POLICY IF EXISTS "Users can view own trusted devices" ON public.trusted_devices;
CREATE POLICY "Users can view own trusted devices" ON public.trusted_devices
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trusted devices" ON public.trusted_devices;
CREATE POLICY "Users can insert own trusted devices" ON public.trusted_devices
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own trusted devices" ON public.trusted_devices;
CREATE POLICY "Users can delete own trusted devices" ON public.trusted_devices
  FOR DELETE USING (auth.uid() = user_id);

-- 5. User Sessions RLS
DROP POLICY IF EXISTS "Users can view own sessions" ON public.user_sessions;
CREATE POLICY "Users can view own sessions" ON public.user_sessions
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own sessions" ON public.user_sessions;
CREATE POLICY "Users can delete own sessions" ON public.user_sessions
  FOR DELETE USING (auth.uid() = user_id);

-- 6. Consent Records RLS
DROP POLICY IF EXISTS "Users can view own consents" ON public.consent_records;
CREATE POLICY "Users can view own consents" ON public.consent_records
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own consents" ON public.consent_records;
CREATE POLICY "Users can insert own consents" ON public.consent_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 7. Account Security Events RLS
DROP POLICY IF EXISTS "Users can view own security events" ON public.account_security_events;
CREATE POLICY "Users can view own security events" ON public.account_security_events
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own security events" ON public.account_security_events;
CREATE POLICY "Users can insert own security events" ON public.account_security_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. Encrypted Private Profile Data RLS
DROP POLICY IF EXISTS "Users can view own encrypted notes" ON public.encrypted_private_profile_data;
CREATE POLICY "Users can view own encrypted notes" ON public.encrypted_private_profile_data
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own encrypted notes" ON public.encrypted_private_profile_data;
CREATE POLICY "Users can insert own encrypted notes" ON public.encrypted_private_profile_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own encrypted notes" ON public.encrypted_private_profile_data;
CREATE POLICY "Users can update own encrypted notes" ON public.encrypted_private_profile_data
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own encrypted notes" ON public.encrypted_private_profile_data;
CREATE POLICY "Users can delete own encrypted notes" ON public.encrypted_private_profile_data
  FOR DELETE USING (auth.uid() = user_id);

-- 9. Analyses RLS
DROP POLICY IF EXISTS "Users can view own analyses" ON public.analyses;
CREATE POLICY "Users can view own analyses" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own analyses" ON public.analyses;
CREATE POLICY "Users can insert own analyses" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can delete own analyses" ON public.analyses;
CREATE POLICY "Users can delete own analyses" ON public.analyses
  FOR DELETE USING (auth.uid() = user_id);

-- 10. Evidence Items RLS
DROP POLICY IF EXISTS "Users can view own evidence" ON public.evidence_items;
CREATE POLICY "Users can view own evidence" ON public.evidence_items
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own evidence" ON public.evidence_items;
CREATE POLICY "Users can insert own evidence" ON public.evidence_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own evidence" ON public.evidence_items;
CREATE POLICY "Users can update own evidence" ON public.evidence_items
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own evidence" ON public.evidence_items;
CREATE POLICY "Users can delete own evidence" ON public.evidence_items
  FOR DELETE USING (auth.uid() = user_id);

-- 11. Incident Reports & Exports RLS
DROP POLICY IF EXISTS "Users can view own reports" ON public.incident_reports;
CREATE POLICY "Users can view own reports" ON public.incident_reports
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own reports" ON public.incident_reports;
CREATE POLICY "Users can insert own reports" ON public.incident_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own reports" ON public.incident_reports;
CREATE POLICY "Users can update own reports" ON public.incident_reports
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own reports" ON public.incident_reports;
CREATE POLICY "Users can delete own reports" ON public.incident_reports
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own report exports" ON public.report_exports;
CREATE POLICY "Users can view own report exports" ON public.report_exports
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own report exports" ON public.report_exports;
CREATE POLICY "Users can insert own report exports" ON public.report_exports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 12. Chat Conversations & Messages RLS
DROP POLICY IF EXISTS "Users can view own chats" ON public.chat_conversations;
CREATE POLICY "Users can view own chats" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own chats" ON public.chat_conversations;
CREATE POLICY "Users can insert own chats" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own chats" ON public.chat_conversations;
CREATE POLICY "Users can delete own chats" ON public.chat_conversations
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own chat messages" ON public.chat_messages;
CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert own chat messages" ON public.chat_messages;
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete own chat messages" ON public.chat_messages;
CREATE POLICY "Users can delete own chat messages" ON public.chat_messages
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

-- 13. Safety Content & Threat Map (Public Knowledge Base)
DROP POLICY IF EXISTS "Safety content is readable by all" ON public.safety_content;
CREATE POLICY "Safety content is readable by all" ON public.safety_content
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Threat map is readable by all" ON public.aggregated_threats;
CREATE POLICY "Threat map is readable by all" ON public.aggregated_threats
  FOR SELECT USING (true);

-- =============================================================================
-- STORAGE BUCKETS & TIME-LIMITED SIGNED URL STORAGE POLICIES
-- =============================================================================
-- Create private storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('evidence-vault', 'evidence-vault', false, 5242880, ARRAY['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
  ('profile-avatars', 'profile-avatars', false, 2097152, ARRAY['image/png', 'image/jpeg', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage RLS: Users can only upload, read, and delete their own files
-- Object path convention: `${auth.uid()}/${filename}`
DROP POLICY IF EXISTS "Users can upload their own evidence files" ON storage.objects;
CREATE POLICY "Users can upload their own evidence files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence-vault' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can read their own evidence files" ON storage.objects;
CREATE POLICY "Users can read their own evidence files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence-vault' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own evidence files" ON storage.objects;
CREATE POLICY "Users can delete their own evidence files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidence-vault' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'profile-avatars' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can read their own avatar" ON storage.objects;
CREATE POLICY "Users can read their own avatar"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'profile-avatars' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'profile-avatars' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);
