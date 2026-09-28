# 🛡️ Fraud Lock — Supabase Setup & Security Guide

This document explains how to connect your Supabase project to Fraud Lock, apply the SQL migrations, configure Row Level Security (RLS), private Storage buckets with signed URLs, and deploy Edge Functions safely.

---

## 🔑 1. Environment Configuration

Your environment variables in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key_here
```

> [!NOTE]
> The app connects to Supabase using `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (also backward-compatible with `NEXT_PUBLIC_SUPABASE_ANON_KEY`). **Never** place the Supabase `SERVICE_ROLE_KEY` in frontend code or in client-accessible environment variables.

---

## ⚡ 2. Applying the SQL Migration (1-Click Setup)

We have consolidated the entire database schema, triggers, RLS policies, indexes, and storage buckets into a single SQL script:

📁 **[`supabase/complete_fraud_lock_setup.sql`](file:///c:/Users/sathv/Downloads/arise%20project/supabase/complete_fraud_lock_setup.sql)**

### Steps to Apply via Supabase Dashboard:
1. Open your [Supabase Dashboard](https://supabase.com/dashboard).
2. Select your project.
3. In the left navigation menu, click **SQL Editor**.
4. Click **New Query**.
5. Copy the entire contents of [`supabase/complete_fraud_lock_setup.sql`](file:///c:/Users/sathv/Downloads/arise%20project/supabase/complete_fraud_lock_setup.sql) and paste into the editor.
6. Click **Run** (or press `Ctrl+Enter`).
7. You should see `Success: No rows returned` — all 16 tables, triggers, indexes, and RLS policies are now active.

---

## 🛡️ 3. Security Architecture & Zero-Trust RLS Policies

Fraud Lock enforces a strict **Zero-Trust Data Isolation Model**:

```
Every user-owned record must enforce: user_id = auth.uid()
```

### Table Isolation Summary:

| Table | Ownership Column | RLS Rules Enforced |
|---|---|---|
| `profiles` | `id = auth.uid()` | Only the authenticated user can SELECT, INSERT, UPDATE, or DELETE their profile. |
| `user_settings` | `user_id = auth.uid()` | Isolation for language, family mode, retention days, and emergency contacts. |
| `user_security_settings` | `user_id = auth.uid()` | MFA status, failed attempt counters, and lockout timestamps. |
| `trusted_devices` | `user_id = auth.uid()` | Devices registered to the user; User B cannot enumerate User A's devices. |
| `user_sessions` | `user_id = auth.uid()` | Active user sessions with remote revocation capability. |
| `consent_records` | `user_id = auth.uid()` | GDPR / privacy consent audit trail. |
| `account_security_events`| `user_id = auth.uid()` | Security audit log (logins, failed attempts, password changes). |
| `encrypted_private_profile_data` | `user_id = auth.uid()` | Client-side encrypted notes (AES-256-GCM zero-knowledge ciphertext). |
| `analyses` | `user_id = auth.uid()` | Scam scan history and explainable AI risk assessments. |
| `evidence_items` | `user_id = auth.uid()` | Private evidence vault artifacts and storage paths. |
| `incident_reports` | `user_id = auth.uid()` | Police complaints and formal cyber incident dossiers. |
| `chat_conversations` | `user_id = auth.uid()` | Safety guidance chat sessions. |
| `chat_messages` | `conversation_id -> user_id = auth.uid()` | Individual messages belonging to user's conversation. |
| `safety_content` | Public Knowledge Base | Publicly readable (`SELECT true`), non-writable by users. |
| `aggregated_threats` | Coarse Threat Map | Publicly readable aggregated threat counts. |

---

## 🗄️ 4. Private Storage & Signed URLs

Fraud Lock provisions two **private** storage buckets (`public = false`):

1. **`evidence-vault`**: Stores scam screenshots, PDF receipts, and transaction proof (5MB max per file).
2. **`profile-avatars`**: Stores user profile photos (2MB max per file).

### How Storage Access Works:
- **Upload Path Convention**: `${auth.uid()}/${timestamp}_${sanitizedFilename}`
- **Storage RLS Check**:
  ```sql
  CREATE POLICY "Users can read their own evidence files"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'evidence-vault' AND
    (auth.uid())::text = (storage.foldername(name))[1]
  );
  ```
- **Time-Limited Signed URLs**: Evidence files are never served through public URLs. The app calls `supabase.storage.from('evidence-vault').createSignedUrl(path, 3600)` to generate a 1-hour secure link accessible only by the owner.

---

## 🔐 5. Authentication Flows Implemented

The application connects to Supabase Auth with both live API execution and local offline resilience:

1. **Email / Mobile Sign-Up**: Calls `supabase.auth.signUp()`. An automatic database trigger `on_auth_user_created` populates `public.profiles`, `public.user_settings`, and `public.user_security_settings`.
2. **Secure Login**: Calls `supabase.auth.signInWithPassword()`. Validates 12+ char password policy, tracks consecutive failed attempts, and triggers 15-minute lockout after 5 failures.
3. **OTP Verification**: Supports both email & SMS verification tokens via `supabase.auth.verifyOtp()`.
4. **Password Reset**: Calls `supabase.auth.resetPasswordForEmail()` with secure redirect.
5. **Multi-Factor Authentication (MFA)**:
   - TOTP Enrollment: Calls `supabase.auth.mfa.enroll({ factorType: 'totp' })`.
   - Challenge & Verification: Calls `supabase.auth.mfa.challengeAndVerify()`.
   - Stores 10 offline recovery codes in user security settings.
6. **Account Deletion**: Requires exact confirmation phrase `"DELETE MY ACCOUNT"`. Purges all user data across all tables and signs out.

---

## 🚀 6. Edge Functions (Zero Service-Role Key on Frontend)

Edge Functions in `supabase/functions/` run in the Deno runtime on Supabase's edge network:

- **`account-security`**: Handles GDPR complete data portability export and server-side cascade account deletion.
- **`analyze-scam`**: Evaluates messages and URLs with Gemini AI.
- **`link-guard`**: Sandboxed URL analysis without client browser page rendering.
- **`safety-assistant`**: Multi-lingual conversational cyber guidance.

To deploy Edge Functions via Supabase CLI:
```bash
supabase functions deploy account-security --no-verify-jwt=false
supabase functions deploy analyze-scam
supabase functions deploy link-guard
supabase functions deploy safety-assistant
```

---

## 🧪 7. Automated Test Suite

Fraud Lock includes an automated security test suite covering:
- RLS row-level isolation (User A vs User B)
- 12+ character high-entropy password policy
- OTP attempt limits and countdown cooldown
- Client-side AES-256-GCM zero-knowledge encryption
- Account deletion phrase validation

Run the test suite:
```bash
npm run test:auth
```
Result: **27 / 27 Passed (100% Success)**
