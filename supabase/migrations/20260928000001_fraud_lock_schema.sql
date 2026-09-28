-- =============================================================================
-- 🛡️ FRAUD LOCK: Production Database Schema & Security Architecture
-- =============================================================================

-- Enable pgcrypto for UUID and cryptographic hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Profiles Table (User identity and account metadata)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  phone_hash TEXT, -- Stored as one-way cryptographic hash for privacy
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. User Settings & Consent Records Table
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

-- 3. Analyses Table (User scan history & explainable AI risk output)
CREATE TABLE IF NOT EXISTS public.analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  scan_type VARCHAR(30) NOT NULL CHECK (scan_type IN ('message', 'link', 'screenshot', 'qr')),
  risk_level VARCHAR(20) NOT NULL CHECK (risk_level IN ('LOW', 'CAUTION', 'HIGH')),
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  full_analysis JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ -- Computed based on user retention_days
);

-- 4. Evidence Items Table (Private Evidence Vault artifacts)
CREATE TABLE IF NOT EXISTS public.evidence_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  evidence_type VARCHAR(30) NOT NULL CHECK (evidence_type IN ('message', 'url', 'screenshot', 'qr', 'phone', 'transaction', 'note')),
  content TEXT NOT NULL,
  media_url TEXT, -- Private Supabase Storage signed object path
  raw_indicators TEXT[],
  user_notes TEXT,
  user_verified_facts JSONB, -- User-attested facts kept distinct from AI analysis
  ai_analysis JSONB,
  retention_days INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  expires_at TIMESTAMPTZ
);

-- 5. Incident Reports Table (Official complaint dossiers)
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

-- 6. Report Exports Audit Log
CREATE TABLE IF NOT EXISTS public.report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES public.incident_reports(id) ON DELETE CASCADE,
  format VARCHAR(20) NOT NULL CHECK (format IN ('json', 'markdown', 'pdf', 'txt')),
  exported_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Chat Conversations & Messages Table (Ask Fraud Lock)
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

-- 8. Localized Safety Content (Knowledge Base)
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

-- 9. Anonymous Aggregated Threat Map Data (Coarse Regional Level Only)
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
-- INDEXES FOR HIGH-PERFORMANCE QUERYING
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON public.analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_analyses_created_at ON public.analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_user_id ON public.evidence_items(user_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_user_id ON public.incident_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_safety_content_lang ON public.safety_content(language, category);
CREATE INDEX IF NOT EXISTS idx_aggregated_threats_region ON public.aggregated_threats(region);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.safety_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.aggregated_threats ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view and update only their own profile
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- User Settings: Users can view and update only their own settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Analyses: Users can view and manage their own scan analyses
CREATE POLICY "Users can view own analyses" ON public.analyses
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own analyses" ON public.analyses
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);
CREATE POLICY "Users can delete own analyses" ON public.analyses
  FOR DELETE USING (auth.uid() = user_id);

-- Evidence Items: Users can view, insert, update, and delete their own evidence
CREATE POLICY "Users can view own evidence" ON public.evidence_items
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own evidence" ON public.evidence_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own evidence" ON public.evidence_items
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own evidence" ON public.evidence_items
  FOR DELETE USING (auth.uid() = user_id);

-- Incident Reports: Users can view and manage their own reports
CREATE POLICY "Users can view own reports" ON public.incident_reports
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reports" ON public.incident_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reports" ON public.incident_reports
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own reports" ON public.incident_reports
  FOR DELETE USING (auth.uid() = user_id);

-- Chat Conversations & Messages: Users can access only their own sessions
CREATE POLICY "Users can view own chats" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own chat messages" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  );
CREATE POLICY "Users can insert own chat messages" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations c
      WHERE c.id = chat_messages.conversation_id AND c.user_id = auth.uid()
    )
  );

-- Safety Content & Aggregated Threat Map: Publicly readable for all users
CREATE POLICY "Safety content is readable by all" ON public.safety_content
  FOR SELECT USING (true);
CREATE POLICY "Threat map is readable by all" ON public.aggregated_threats
  FOR SELECT USING (true);

-- =============================================================================
-- STORAGE BUCKET CONFIGURATION & POLICIES
-- =============================================================================
-- Create private storage bucket for evidence vault
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'evidence-vault',
  'evidence-vault',
  false,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Evidence Vault Storage RLS Policies
CREATE POLICY "Users can upload their own evidence files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'evidence-vault' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can read their own evidence files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'evidence-vault' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own evidence files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'evidence-vault' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);
