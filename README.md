# 🛡️ FRAUD LOCK
### “Detect. Alert. Protect. Report.”
### “STOP. CHECK. VERIFY.”

> **CRITICAL LEGAL & SAFETY NOTICE**  
> **AI risk indicator — not a guarantee.** Fraud Lock never promises 100% fraud protection. We always use advisory language such as “Potential scam,” “Suspicious activity,” “High-risk content,” and “Verify independently.” The app never accuses a person of a crime, identifies a scammer, claims an exact location, secretly monitors a device, accesses private data without permission, or pretends demo data is real.

---

## 🌟 Executive Overview

**Fraud Lock** is a production-quality, mobile-first cybersecurity, fraud-response, and account protection web application/PWA backed by Supabase. It provides the **maximum practical fraud-prevention, account defense, and immediate-response protection** possible within standard modern web sandbox boundaries.

Designed for citizens, families, and businesses across diverse linguistic communities, Fraud Lock delivers on-demand explainable AI risk assessments, an emergency Golden Hour response wizard, a private encrypted Evidence Vault, multi-lingual cybersecurity education, and a **complete, fortified Profile, Login, OTP Verification, and Account Security system**.

---

## 🏗️ Architecture & Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | Next.js (App Router), React 19, TypeScript, Tailwind CSS v4 |
| **Design & Theme** | Cyber Dark (#050811, #090F1E), Neon Cyan (#00F0FF), Glassmorphic HUD, Mobile-First PWA |
| **Authentication** | Supabase Auth (Email & Phone OTP, Bcrypt/Argon2 password hashing, TOTP MFA) |
| **Database & Security** | PostgreSQL 15, Strict Row Level Security (RLS), Private Storage Buckets |
| **Serverless Compute** | Supabase Edge Functions (Deno runtime) + Next.js API Routes |
| **Zero-Knowledge Encryption** | Web Cryptography API (`crypto.subtle` AES-256-GCM + PBKDF2 100k rounds) |
| **AI & Heuristics** | Google Gemini API (with zero-credential heuristic rule engine fallback) |
| **PWA & Offline** | Web App Manifest (`manifest.json`), Service Worker (`sw.js`), Local-First Storage |
| **QR & Image OCR** | `jsqr` (safe decoding without auto-navigation), Canvas OCR extraction |
| **Localization** | 17+ Languages (English, Hindi, Telugu, Tamil, Kannada, Malayalam, Marathi, Bengali, Gujarati, Punjabi, Urdu, Odia, Assamese, Nepali, Spanish, French, Arabic) |

---

## 🛡️ Core Protection & Scanning Features

### 1. Message Scanner (SMS, WhatsApp, Telegram, Email)
- Paste suspicious text from any messaging or email application.
- Analyzes for critical fraud signatures: artificial urgency countdowns, OTP/PIN/password harvesting, banking/KYC suspension, part-time jobs, electricity disconnection threats, remote desktop software, and suspicious links.
- Returns strict explainable structured JSON: risk level, category, warning signals, evidence, recommended actions, and do-not-do advice.

### 2. Link Guard (Safe URL Inspection)
- Safely parse and inspect URLs **without ever rendering the destination page** in the client browser.
- Analyzes protocol security, raw IP hostnames, high-risk TLDs, URL shorteners, IDN homographs, typosquatting of banks, and sensitive credential paths.

### 3. Screenshot & Image OCR Scanner
- Upload screenshots of suspicious chats, error screens, or banking alerts.
- Extracts visible text and prompts user verification before performing risk assessment.

### 4. QR Code Shield
- Decodes QR code images and payloads safely **without automatic browser navigation**.
- Deep UPI Intent URI inspection (`upi://pay?pa=...&am=...`): Flags reverse payment traps, warning that **entering a UPI PIN will ALWAYS deduct money, never receive it**.

### 5. Immediate-Response Flow ("1930 / Lost Money")
- **The Golden Hour Wizard**: Urgent action roadmap for the first 2 hours after a fraudulent transfer.
- Step-by-step triage based on incident type (UPI scam, password shared, remote app installed, etc.) with direct dialing to national cybercrime helplines (1930 in India, IC3 in the US).

### 6. Evidence Vault & Threat Map
- Encrypted local/cloud vault for scam artifacts with tamper-resistant metadata.
- Aggregated anonymized threat heatmaps displaying trending regional fraud vectors.

---

## 🔐 Profile, Login, OTP Verification, and Account Security

Fraud Lock features an enterprise-grade identity, authentication, and access control system adhering strictly to Zero-Knowledge and Least-Privilege principles:

### 1. Citizen Profile & Top-Right Avatar Menu
- **Top-right Avatar Menu**: Instant overview of identity, verification rings, quick links to Profile, Security Center, Privacy Center, and Session Logout.
- **Profile Photo**: Upload with private bucket storage and signed URLs.
- **Verified Indicators**: Green shield verification badges for email and mobile phone numbers verified via out-of-band OTP.
- **Regional & Demographic**: Language selection (17+ locales) and jurisdiction presets (India 1930, US IC3, UK Action Fraud, Singapore ASC, etc.).
- **Optional Emergency Contact**: Configured trusted guardian alerted during active fraud incident reports.
- **Account Metadata**: Displays exact account creation timestamp and last active login time.
- **Data Sovereignty**: Instant one-click GDPR/CCPA complete JSON data export.
- **Permanent Account Deletion**: Self-service right-to-erasure requiring explicit `DELETE MY ACCOUNT` confirmation phrase.

### 2. Login, Verification & Brute-Force Protection
- **Dual Sign-up/Login**: Support for verified email/password or mobile number.
- **Mandatory 6-Digit OTP**: Out-of-band verification required before new account activation.
  - 60-second resend cooldown timer.
  - 10-minute code expiration.
  - Strict 5-attempt rate limit preventing brute-force enumeration.
- **Strong Password Policy**:
  - Minimum 12 characters required.
  - Real-time password strength meter scoring entropy across uppercase, lowercase, numbers, and special symbols.
  - Passphrase guidance for resilient memorability.
- **Brute Force Lockout**: 5 consecutive failed login attempts trigger an automatic 15-minute security lockout.
- **Two-Factor Authentication (MFA / 2FA)**:
  - Time-based One-Time Passwords (TOTP) compatible with Google Authenticator, Aegis, Bitwarden, and 1Password.
  - Generates 10 single-use emergency backup recovery codes for offline access.
- **Active Session & Device Management**:
  - Real-time inventory of all authenticated browsers and mobile devices.
  - "Sign out of all other devices" button with instant revocation.
  - Trusted device hardware fingerprinting with one-click revocation.
- **Immutable Security Activity Audit Log**:
  - Chronological timeline tracking logins, logouts, password changes, MFA activations, new device alerts, and export events with IP addresses and timestamps.

### 3. Client-Side End-to-End Zero-Knowledge Encryption (E2E)
- **Extra Private Data Vault**: For users storing highly confidential safety notes (e.g. police FIR diary entries, private dispute reference numbers).
- **Web Cryptography API**: AES-256-GCM authenticated cipher with PBKDF2 (100,000 iterations + cryptographically random salt).
- **Zero-Knowledge Guarantee**: Encryption keys are derived in local browser memory and **never transmitted to any server**.
- **Important Notice**: Forgotten passphrases cannot be recovered by app operators. The system explicitly blocks the storage of banking PINs, OTPs, or CVVs.

---

## 🗄️ PostgreSQL Database Schema & Row Level Security (RLS)

All tables are locked down with strict Row Level Security policies enforcing `auth.uid() = user_id`. **No user may enumerate, read, modify, or delete another user's records or files.**

### Database Tables:
1. `profiles`: User display name, language, jurisdiction, verified contact flags, emergency contact.
2. `user_security_settings`: MFA state, TOTP secrets, backup recovery codes, failed login counters, lockout timers.
3. `trusted_devices`: Recognized hardware identifiers, device types, last active timestamps.
4. `user_sessions`: Active JWT sessions with expiration and device metadata.
5. `consent_records`: Explicit telemetry, scan processing, and privacy consent logs.
6. `account_security_events`: Immutable audit trail of all security-sensitive actions.
7. `encrypted_private_profile_data`: Client-side encrypted ciphertext, IVs, and salts.
8. `evidence_items`: Scam artifacts and screenshots linked to private storage buckets.
9. `incident_reports`: Formal fraud dossiers for bank and police submission.

### Storage Buckets & Policies:
- `evidence-vault`: Private storage bucket. Only the authenticated owner can upload or retrieve signed URLs.
- `profile-avatars`: Private storage bucket. Short-lived signed URLs generated only after ownership verification.

---

## 🧪 Automated Authorization & Security Tests

Fraud Lock includes an automated test suite verifying all authorization boundaries, RLS policies, password requirements, OTP limits, and encryption integrity:

```bash
npm run test:auth
```

### Verified Test Matrix:
- `[PASS]` User Alice can view her own profile
- `[PASS]` User Alice CANNOT enumerate User Bob's profile
- `[PASS]` Alice can view her own evidence files
- `[PASS]` User Alice CANNOT access User Bob's evidence items
- `[PASS]` Alice CANNOT delete Bob's evidence (blocked by RLS)
- `[PASS]` Alice CANNOT modify Bob's active session
- `[PASS]` User Alice CANNOT query Bob's private encrypted notes
- `[PASS]` Rejects passwords shorter than 12 characters
- `[PASS]` Rejects passwords missing uppercase/lowercase/numbers/symbols
- `[PASS]` Accepts compliant strong passphrases
- `[PASS]` OTP rate limit triggers lockout on 5th failed guess
- `[PASS]` Expired OTPs immediately rejected
- `[PASS]` Client-side AES-256-GCM ciphertext produces unreadable bytes
- `[PASS]` Attacker with incorrect passphrase fails decryption
- `[PASS]` Account deletion strictly validates `DELETE MY ACCOUNT`

---

## 🚀 Setup & Installation

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/your-org/fraud-lock.git
cd fraud-lock
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project keys and optional Gemini/Twilio credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Apply Supabase Database Migrations
Run the SQL migration scripts in your Supabase SQL Editor in numerical order:
1. `supabase/migrations/20260928000001_fraud_lock_schema.sql` (Core scanner & evidence schema)
2. `supabase/migrations/20260928000002_user_security_schema.sql` (Profile, security, devices, sessions, encrypted notes & RLS)
3. `supabase/seed.sql` (Seed regional threat clusters and baseline safety content)

### 4. Deploy Edge Functions
```bash
supabase functions deploy analyze-scam
supabase functions deploy link-guard
supabase functions deploy safety-assistant
supabase functions deploy account-security
```

### 5. Run the Application
```bash
# Start Development Server
npm run dev

# Run Automated Authorization Tests
npm run test:auth

# Production Build
npm run build
npm run start
```

---

## 🎯 Evaluator Quick-Start & Demo Mode

For instant evaluation without setting up an SMS gateway or external accounts:
1. Open the app in your browser at `http://localhost:3000`.
2. Click the top-right **Avatar Icon** and select **"Switch / Sign In User"**.
3. Click **"Auto-fill Test User"** for instant credential pre-fill.
4. When testing **Sign Up** or **Change Contact**, an interactive **Evaluator Live Simulation Banner** automatically displays the generated 6-digit OTP with a 1-click **"Auto-fill OTP"** button.
5. Explore the **Security Center** to test 2FA TOTP setup, backup codes, active session management, security audit timeline, and client-side AES-256-GCM encrypted notes.
