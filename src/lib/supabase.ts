import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { AnalysisResult, EvidenceItem, IncidentReport, UserSettings } from '@/types/scam';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseAnonKey &&
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  !supabaseUrl.includes('placeholder')
);

// Real client if configured, with auto-refresh and session persistence
export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

// LocalStorage Keys for local-first & offline resilience
const STORAGE_KEYS = {
  ANALYSES: 'fraudlock_analyses_vault',
  EVIDENCE: 'fraudlock_evidence_items',
  REPORTS: 'fraudlock_incident_reports',
  SETTINGS: 'fraudlock_user_settings',
  CHAT_MESSAGES: 'fraudlock_chat_messages',
};

// Default Settings
export const DEFAULT_USER_SETTINGS: UserSettings = {
  user_id: 'local-anonymous-user',
  preferred_language: 'en',
  family_mode: false,
  retention_days: 30,
  telemetry_consent: false,
  anonymous_threat_sharing: true,
  trusted_contact_name: 'Family Emergency Contact',
  trusted_contact_phone: '1930',
};

// =============================================================================
// STORAGE BUCKET MANAGEMENT & SIGNED URLS
// =============================================================================

export interface StorageUploadResult {
  path: string | null;
  signedUrl: string | null;
  error?: string;
}

/**
 * Upload an evidence file to the private 'evidence-vault' bucket
 * Path format: ${userId}/${timestamp}_${sanitizedFilename}
 * Enforces strict RLS: (auth.uid())::text = (storage.foldername(name))[1]
 */
export async function uploadEvidenceFile(
  file: File,
  userId: string
): Promise<StorageUploadResult> {
  if (!supabase) {
    // If Supabase is not configured, create a temporary local object URL
    const localUrl = URL.createObjectURL(file);
    return { path: null, signedUrl: localUrl };
  }

  // 5MB file size limit
  if (file.size > 5 * 1024 * 1024) {
    return { path: null, signedUrl: null, error: 'File size exceeds maximum limit of 5MB.' };
  }

  // Sanitize filename: alphanumeric, dash, underscore, dot only
  const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const storagePath = `${userId}/${Date.now()}_${cleanName}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('evidence-vault')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.warn('Evidence file upload error:', uploadError);
      return { path: null, signedUrl: null, error: uploadError.message };
    }

    // Generate 1-hour time-limited signed URL for private viewing
    const { data: signedData, error: signError } = await supabase.storage
      .from('evidence-vault')
      .createSignedUrl(storagePath, 3600);

    if (signError || !signedData?.signedUrl) {
      return { path: storagePath, signedUrl: null, error: signError?.message };
    }

    return { path: storagePath, signedUrl: signedData.signedUrl };
  } catch (err: any) {
    return { path: null, signedUrl: null, error: err.message || 'Failed to upload file to storage.' };
  }
}

/**
 * Generate a time-limited signed URL for a private evidence file
 */
export async function getEvidenceFileSignedUrl(
  pathOrUrl: string,
  expiresInSeconds = 3600
): Promise<string> {
  // If it's already an HTTP URL or blob URL, return it directly
  if (pathOrUrl.startsWith('http://') || pathOrUrl.startsWith('https://') || pathOrUrl.startsWith('blob:') || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }

  if (!supabase) return pathOrUrl;

  try {
    const { data, error } = await supabase.storage
      .from('evidence-vault')
      .createSignedUrl(pathOrUrl, expiresInSeconds);

    if (error || !data?.signedUrl) {
      console.warn('Could not generate signed URL for evidence path:', pathOrUrl, error);
      return pathOrUrl;
    }

    return data.signedUrl;
  } catch {
    return pathOrUrl;
  }
}

/**
 * Delete a private evidence file from Supabase Storage
 */
export async function deleteEvidenceFile(storagePath: string): Promise<boolean> {
  if (!supabase || !storagePath || storagePath.startsWith('http') || storagePath.startsWith('blob:')) {
    return true;
  }

  try {
    const { error } = await supabase.storage.from('evidence-vault').remove([storagePath]);
    return !error;
  } catch {
    return false;
  }
}

/**
 * Upload a profile avatar to the private 'profile-avatars' bucket
 */
export async function uploadProfileAvatar(
  file: File,
  userId: string
): Promise<StorageUploadResult> {
  if (!supabase) {
    return { path: null, signedUrl: URL.createObjectURL(file) };
  }

  // 2MB size limit
  if (file.size > 2 * 1024 * 1024) {
    return { path: null, signedUrl: null, error: 'Avatar file size exceeds 2MB limit.' };
  }

  const ext = file.name.split('.').pop() || 'png';
  const storagePath = `${userId}/avatar_${Date.now()}.${ext}`;

  try {
    const { error: uploadError } = await supabase.storage
      .from('profile-avatars')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.warn('Avatar upload error:', uploadError);
      return { path: null, signedUrl: null, error: uploadError.message };
    }

    // Generate signed URL (expires in 7 days for avatars)
    const { data, error: signError } = await supabase.storage
      .from('profile-avatars')
      .createSignedUrl(storagePath, 60 * 60 * 24 * 7);

    if (signError || !data?.signedUrl) {
      return { path: storagePath, signedUrl: null, error: signError?.message };
    }

    return { path: storagePath, signedUrl: data.signedUrl };
  } catch (err: any) {
    return { path: null, signedUrl: null, error: err.message || 'Avatar upload failed.' };
  }
}

// =============================================================================
// USER SETTINGS
// =============================================================================

export async function getStoredSettings(): Promise<UserSettings> {
  if (typeof window === 'undefined') return DEFAULT_USER_SETTINGS;

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (data && !error) {
          return {
            user_id: data.user_id,
            preferred_language: data.preferred_language,
            family_mode: data.family_mode,
            retention_days: data.retention_days,
            telemetry_consent: data.telemetry_consent,
            anonymous_threat_sharing: data.anonymous_threat_sharing,
            trusted_contact_name: data.trusted_contact_name,
            trusted_contact_phone: data.trusted_contact_phone,
          };
        }
      }
    } catch (e) {
      console.warn('Supabase settings query skipped:', e);
    }
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) return DEFAULT_USER_SETTINGS;
    return { ...DEFAULT_USER_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_SETTINGS;
  }
}

export async function saveStoredSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  const current = await getStoredSettings();
  const updated = { ...current, ...settings };

  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(updated));
    } catch {
      // Storage unavailable
    }
  }

  // Sync to Supabase with user_id = auth.uid()
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('user_settings').upsert({
          user_id: session.user.id,
          preferred_language: updated.preferred_language,
          family_mode: updated.family_mode,
          retention_days: updated.retention_days,
          telemetry_consent: updated.telemetry_consent,
          anonymous_threat_sharing: updated.anonymous_threat_sharing,
          trusted_contact_name: updated.trusted_contact_name,
          trusted_contact_phone: updated.trusted_contact_phone,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Supabase sync skipped:', e);
    }
  }

  return updated;
}

// =============================================================================
// SCAM ANALYSES HISTORY
// =============================================================================

export async function saveAnalysisRecord(
  analysis: AnalysisResult,
  scanType: string,
  rawContent: string
): Promise<string> {
  const recordId = `scan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const record = {
    id: recordId,
    scan_type: scanType,
    risk_level: analysis.risk_level,
    category: analysis.category,
    summary: analysis.summary,
    analysis_data: analysis,
    created_at: new Date().toISOString(),
  };

  // Local-first storage
  if (typeof window !== 'undefined') {
    try {
      const existingRaw = localStorage.getItem(STORAGE_KEYS.ANALYSES) || '[]';
      const list = JSON.parse(existingRaw);
      list.unshift(record);
      localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(list.slice(0, 50)));
    } catch {
      // Storage limit
    }
  }

  // Supabase storage with user_id = auth.uid()
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('analyses').insert({
          user_id: session.user.id,
          scan_type: scanType,
          risk_level: analysis.risk_level,
          category: analysis.category,
          summary: analysis.summary,
          full_analysis: analysis,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Supabase analysis insert skipped:', e);
    }
  }

  return recordId;
}

export async function getAnalysisRecords(): Promise<any[]> {
  // Try Supabase first if authenticated
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('analyses')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data && !error && data.length > 0) {
          return data.map((item) => ({
            id: item.id,
            scan_type: item.scan_type,
            risk_level: item.risk_level,
            category: item.category,
            summary: item.summary,
            analysis_data: item.full_analysis,
            created_at: item.created_at,
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase analyses fetch fallback:', e);
    }
  }

  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ANALYSES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteAnalysisRecord(id: string): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ANALYSES) || '[]';
      const list = JSON.parse(raw);
      const filtered = list.filter((r: any) => r.id !== id);
      localStorage.setItem(STORAGE_KEYS.ANALYSES, JSON.stringify(filtered));
    } catch {
      //
    }
  }

  if (supabase) {
    try {
      await supabase.from('analyses').delete().eq('id', id);
    } catch (e) {
      console.warn('Supabase analysis delete skipped:', e);
    }
  }
}

// =============================================================================
// EVIDENCE VAULT ITEMS
// =============================================================================

export async function saveEvidenceItem(
  item: Omit<EvidenceItem, 'id' | 'created_at'>,
  fileToUpload?: File
): Promise<EvidenceItem> {
  let mediaPath = item.media_url || '';
  let mediaSignedUrl = item.media_url || '';

  // If a file attachment is provided, upload to private Supabase Storage
  if (fileToUpload) {
    const { data: { session } } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
    const userId = session?.user?.id || 'local-user';
    const uploadRes = await uploadEvidenceFile(fileToUpload, userId);
    if (uploadRes.path) {
      mediaPath = uploadRes.path;
      mediaSignedUrl = uploadRes.signedUrl || uploadRes.path;
    } else if (uploadRes.signedUrl) {
      mediaPath = uploadRes.signedUrl;
      mediaSignedUrl = uploadRes.signedUrl;
    }
  }

  const fullItem: EvidenceItem = {
    ...item,
    media_url: mediaSignedUrl || mediaPath,
    id: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    created_at: new Date().toISOString(),
  };

  // Local storage
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EVIDENCE) || '[]';
      const items = JSON.parse(raw);
      items.unshift(fullItem);
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(items));
    } catch {
      //
    }
  }

  // Supabase storage
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('evidence_items').insert({
          user_id: session.user.id,
          title: fullItem.title,
          category: fullItem.category,
          evidence_type: fullItem.type,
          content: fullItem.content,
          media_url: mediaPath, // Store storage path in database
          raw_indicators: fullItem.raw_indicators || [],
          user_notes: fullItem.user_notes,
          user_verified_facts: fullItem.user_verified_facts,
          ai_analysis: fullItem.ai_analysis,
          retention_days: fullItem.retention_days,
          created_at: fullItem.created_at,
        });
      }
    } catch (e) {
      console.warn('Supabase evidence insert skipped:', e);
    }
  }

  return fullItem;
}

export async function getEvidenceItems(): Promise<EvidenceItem[]> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('evidence_items')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data && !error && data.length > 0) {
          // Resolve signed URLs for private storage items in parallel
          const enrichedItems: EvidenceItem[] = await Promise.all(
            data.map(async (row) => {
              let resolvedMedia = row.media_url;
              if (row.media_url && !row.media_url.startsWith('http') && !row.media_url.startsWith('blob:')) {
                resolvedMedia = await getEvidenceFileSignedUrl(row.media_url, 3600);
              }
              return {
                id: row.id,
                user_id: row.user_id,
                title: row.title,
                category: row.category,
                type: row.evidence_type,
                content: row.content,
                media_url: resolvedMedia,
                raw_indicators: row.raw_indicators,
                user_notes: row.user_notes,
                user_verified_facts: row.user_verified_facts,
                ai_analysis: row.ai_analysis,
                retention_days: row.retention_days,
                created_at: row.created_at,
              };
            })
          );
          return enrichedItems;
        }
      }
    } catch (e) {
      console.warn('Supabase evidence fetch fallback:', e);
    }
  }

  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EVIDENCE);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function deleteEvidenceItem(id: string): Promise<void> {
  // First find item to check if media needs deletion from storage
  let mediaToDelete: string | undefined;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.EVIDENCE) || '[]';
      const items: EvidenceItem[] = JSON.parse(raw);
      const target = items.find((i) => i.id === id);
      mediaToDelete = target?.media_url;
      const filtered = items.filter((item) => item.id !== id);
      localStorage.setItem(STORAGE_KEYS.EVIDENCE, JSON.stringify(filtered));
    } catch {
      //
    }
  }

  if (supabase) {
    try {
      // Fetch record from database to get storage path
      const { data } = await supabase
        .from('evidence_items')
        .select('media_url')
        .eq('id', id)
        .maybeSingle();

      if (data?.media_url) {
        mediaToDelete = data.media_url;
      }

      // Delete database record (RLS enforces user_id = auth.uid())
      await supabase.from('evidence_items').delete().eq('id', id);

      // Clean up storage object if exists
      if (mediaToDelete) {
        await deleteEvidenceFile(mediaToDelete);
      }
    } catch (e) {
      console.warn('Supabase delete skipped:', e);
    }
  }
}

// =============================================================================
// INCIDENT REPORTS
// =============================================================================

export async function saveIncidentReport(report: IncidentReport): Promise<IncidentReport> {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.REPORTS) || '[]';
      const list = JSON.parse(raw);
      const filtered = list.filter((r: IncidentReport) => r.id !== report.id);
      filtered.unshift(report);
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(filtered));
    } catch {
      //
    }
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('incident_reports').upsert({
          user_id: session.user.id,
          incident_type: report.incident_type,
          incident_date: report.incident_date,
          financial_loss_amount: report.financial_loss_amount,
          currency: report.currency,
          scammer_platform: report.scammer_platform,
          scammer_contacts: report.scammer_contacts,
          summary: report.summary,
          timeline_events: report.timeline_events,
          emergency_steps_taken: report.emergency_steps_taken,
          status: report.status,
          updated_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Supabase incident report upsert skipped:', e);
    }
  }

  return report;
}

export async function getIncidentReports(): Promise<IncidentReport[]> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const { data, error } = await supabase
          .from('incident_reports')
          .select('*')
          .eq('user_id', session.user.id)
          .order('created_at', { ascending: false });

        if (data && !error && data.length > 0) {
          return data.map((r) => ({
            id: r.id,
            user_id: r.user_id,
            incident_type: r.incident_type,
            incident_date: r.incident_date,
            financial_loss_amount: Number(r.financial_loss_amount) || 0,
            currency: r.currency || 'INR',
            scammer_platform: r.scammer_platform || 'Digital',
            scammer_contacts: r.scammer_contacts || [],
            summary: r.summary || '',
            timeline_events: r.timeline_events || [],
            emergency_steps_taken: r.emergency_steps_taken || {
              bank_contacted: false,
              card_blocked: false,
              upi_complaint_filed: false,
              cyber_helpline_called: false,
              passwords_changed: false,
              app_uninstalled: false,
            },
            evidence_ids: r.evidence_ids || [],
            status: r.status || 'draft',
            created_at: r.created_at,
            updated_at: r.updated_at,
          }));
        }
      }
    } catch (e) {
      console.warn('Supabase incident reports query skipped:', e);
    }
  }

  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// =============================================================================
// SAFETY ASSISTANT CHAT CONVERSATIONS & MESSAGES
// =============================================================================

export interface ChatMessageRecord {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  text: string;
  risk_warning?: string;
  created_at: string;
}

export async function getOrCreateChatConversation(title = 'Safety Guidance Session'): Promise<string> {
  const localId = `conv_${Date.now()}`;
  if (!supabase) return localId;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) return localId;

    // Check for recent conversation
    const { data: existing } = await supabase
      .from('chat_conversations')
      .select('id')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existing?.id) return existing.id;

    // Create new conversation
    const { data: created, error } = await supabase
      .from('chat_conversations')
      .insert({
        user_id: session.user.id,
        title,
        created_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error || !created) return localId;
    return created.id;
  } catch {
    return localId;
  }
}

export async function saveChatMessage(
  conversationId: string,
  message: { sender: 'user' | 'assistant'; text: string; riskWarning?: string }
): Promise<void> {
  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        await supabase.from('chat_messages').insert({
          conversation_id: conversationId,
          sender: message.sender,
          text: message.text,
          risk_warning: message.riskWarning || null,
          created_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn('Supabase chat message insert skipped:', e);
    }
  }
}

export async function getChatMessages(conversationId: string): Promise<ChatMessageRecord[]> {
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (data && !error) {
        return data.map((m) => ({
          id: m.id,
          sender: m.sender,
          text: m.text,
          risk_warning: m.risk_warning,
          created_at: m.created_at,
        }));
      }
    } catch (e) {
      console.warn('Supabase chat messages fetch skipped:', e);
    }
  }

  return [];
}

// =============================================================================
// PURGE ALL USER DATA (DATA PRIVACY / GDPR)
// =============================================================================

export async function purgeAllUserData(): Promise<void> {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.ANALYSES);
    localStorage.removeItem(STORAGE_KEYS.EVIDENCE);
    localStorage.removeItem(STORAGE_KEYS.REPORTS);
    localStorage.removeItem(STORAGE_KEYS.CHAT_MESSAGES);
  }

  if (supabase) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.id) {
        const uid = session.user.id;
        await Promise.all([
          supabase.from('evidence_items').delete().eq('user_id', uid),
          supabase.from('analyses').delete().eq('user_id', uid),
          supabase.from('incident_reports').delete().eq('user_id', uid),
          supabase.from('chat_conversations').delete().eq('user_id', uid),
        ]);
      }
    } catch (e) {
      console.warn('Supabase purge failed:', e);
    }
  }
}
