export type RiskLevel = 'LOW' | 'CAUTION' | 'HIGH';
export type ConfidenceLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface AnalysisResult {
  risk_level: RiskLevel;
  category: string;
  summary: string;
  warning_signals: string[];
  evidence: string[];
  recommended_actions: string[];
  do_not_do: string[];
  technical_indicators: string[];
  confidence: ConfidenceLevel;
  limitations: string;
  language: string;
}

export type ScanType = 'message' | 'link' | 'screenshot' | 'qr';

export interface ScanRequest {
  type: ScanType;
  content: string;
  metadata?: {
    filename?: string;
    url?: string;
    parsedPayload?: string;
    origin?: string;
  };
  language?: string;
}

export interface EvidenceItem {
  id: string;
  user_id: string;
  title: string;
  category: string;
  type: 'message' | 'url' | 'screenshot' | 'qr' | 'phone' | 'transaction' | 'note';
  content: string;
  media_url?: string;
  raw_indicators?: string[];
  user_notes?: string;
  user_verified_facts?: {
    sender_identifier?: string;
    amount_lost?: number;
    currency?: string;
    transaction_reference?: string;
    incident_date?: string;
    platform?: string;
  };
  ai_analysis?: AnalysisResult;
  retention_days: number;
  created_at: string;
  expires_at?: string;
}

export interface IncidentReport {
  id: string;
  user_id: string;
  incident_type: string;
  incident_date: string;
  financial_loss_amount: number;
  currency: string;
  scammer_platform: string; // WhatsApp, SMS, Telegram, Phone Call, Web, Instagram, etc.
  scammer_contacts: string[]; // Phone numbers, UPI IDs, bank account, email, URL
  summary: string;
  timeline_events: {
    timestamp: string;
    description: string;
    verified_by_user: boolean;
  }[];
  emergency_steps_taken: {
    bank_contacted: boolean;
    card_blocked: boolean;
    upi_complaint_filed: boolean;
    cyber_helpline_called: boolean;
    passwords_changed: boolean;
    app_uninstalled: boolean;
  };
  evidence_ids: string[];
  status: 'draft' | 'exported' | 'filed_with_authorities';
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  preferred_language: SupportedLocale;
  family_mode: boolean;
  retention_days: 7 | 30 | 90;
  telemetry_consent: boolean;
  anonymous_threat_sharing: boolean;
  trusted_contact_phone?: string;
  trusted_contact_name?: string;
}

export interface DeviceCapability {
  name: string;
  category: 'camera' | 'storage' | 'notifications' | 'clipboard' | 'network' | 'telephony' | 'sms';
  supportedInBrowser: boolean;
  requiresNativeApp: boolean;
  status: 'active' | 'demo' | 'user_initiated_only' | 'restricted_by_os';
  description: string;
  limitationExplanation: string;
}

export interface ThreatMapPoint {
  id: string;
  region: string;
  country: string;
  approx_lat: number;
  approx_lng: number;
  scam_category: string;
  report_count: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  recent_sample_summary: string;
  updated_at: string;
}

export interface SafetyLesson {
  id: string;
  title: string;
  category: string;
  readTimeMinutes: number;
  summary: string;
  scamMechanism: string;
  redFlags: string[];
  safeRules: string[];
  realWorldScenario: string;
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
}

export type SupportedLocale =
  | 'en' // English
  | 'hi' // Hindi (हिंदी)
  | 'te' // Telugu (తెలుగు)
  | 'ta' // Tamil (தமிழ்)
  | 'kn' // Kannada (ಕನ್ನಡ)
  | 'ml' // Malayalam (മലയാളം)
  | 'mr' // Marathi (मराठी)
  | 'bn' // Bengali (বাংলা)
  | 'gu' // Gujarati (ગુજરાતી)
  | 'pa' // Punjabi (ਪੰਜਾਬੀ)
  | 'ur' // Urdu (اردو)
  | 'or' // Odia (ଓଡ଼ିଆ)
  | 'as' // Assamese (অসমীয়া)
  | 'ne' // Nepali (नेपाली)
  | 'es' // Spanish
  | 'fr' // French
  | 'ar'; // Arabic

export interface LanguageOption {
  code: SupportedLocale;
  name: string;
  nativeName: string;
  direction?: 'ltr' | 'rtl';
}
