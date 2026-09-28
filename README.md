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

## 🚀 GitHub Setup & Repository Instructions

This project is maintained in the following GitHub repository:
**`https://github.com/sathvik-ram-yerroju-ai-creator/fruad-lock.git`**

### 1. Clone & Local Setup
```bash
# Clone the repository
git clone https://github.com/sathvik-ram-yerroju-ai-creator/fruad-lock.git
cd fruad-lock

# Install dependencies
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Fill in your Supabase project keys and optional Gemini credentials (never commit `.env.local` to git):
```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key

# Optional Server-Side Keys (for Edge Functions & Next.js API Routes)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Apply Supabase Database Migrations & RLS
Fraud Lock provides both unified and modular SQL migration scripts:
- **Option A (One-Click Setup)**: Execute `supabase/complete_fraud_lock_setup.sql` in your Supabase SQL Editor. This initializes all 9 tables, indexes, triggers, storage buckets (`evidence-vault`, `profile-avatars`), and strict Row Level Security (RLS) policies.
- **Option B (Modular Migrations)**: Run sequentially:
  1. `supabase/migrations/20260928000001_fraud_lock_schema.sql` (Scanners, threat intelligence, and evidence vault)
  2. `supabase/migrations/20260928000002_user_security_schema.sql` (Profiles, OTP/2FA security settings, devices, audit events, encrypted notes)
  3. `supabase/seed.sql` (Baseline cyber threat categories and regional fraud vectors)

### 4. Deploy Edge Functions (Optional)
```bash
supabase functions deploy analyze-scam
supabase functions deploy link-guard
supabase functions deploy safety-assistant
supabase functions deploy account-security
```

### 5. Run Locally
```bash
# Start Next.js Development Server
npm run dev

# Run Automated Authorization & Security Tests
npm run test:auth

# Run Automated Supabase OTP Authentication Audit
npm run test:otp

# Production Build Validation
npm run build
npm run start
```

---

## 🔑 Supabase OTP Authentication Setup Guide (Email & Mobile)

Fraud Lock / Arise implements passwordless Two-Factor OTP authentication powered directly by **Supabase Auth** (`signInWithOtp` and `verifyOtp`). To ensure reliable OTP delivery in local development and production, follow this configuration guide.

### 1. Configure the Supabase Site URL
1. Navigate to your **Supabase Dashboard** -> **Authentication** -> **URL Configuration**.
2. Set the **Site URL**:
   - **Production (Active)**: `https://cyber-lock-sable.vercel.app`
   - **Local Development**: `http://localhost:3000`
3. Click **Save**.

### 2. Configure Redirect URLs (Local & Production)
Under **Authentication** -> **URL Configuration** -> **Redirect URLs**, add the following allowlisted callback endpoints:
- `https://cyber-lock-sable.vercel.app/**`
- `https://cyber-lock-sable.vercel.app/auth/callback`
- `http://localhost:3000/**`
- `http://localhost:3000/auth/callback`

> **Note:** The redirect URL ensures that if a user clicks an email confirmation link or magic link instead of entering the 6-digit passcode, they are securely redirected and authenticated into your app.

### 3. Configuring Supabase Email Auth & Custom SMTP

#### Default Email Service Limitations (Development Tier)
- Supabase provides a built-in default email service for prototyping.
- **Strict Rate Limit:** The default service is strictly rate-limited to **3 to 4 emails per hour**.
- If multiple OTPs are requested in quick succession during development or testing, Supabase returns the error:
  `over_email_send_rate_limit: email rate limit exceeded`
- The default service does **NOT** guarantee deliverability to all consumer inboxes (e.g. Gmail, Yahoo, Outlook) and emails may land in the Spam/Junk folder.

#### Setting up Custom SMTP for Production
For production deployment, you **must** configure a custom SMTP provider (e.g., **Resend**, **SendGrid**, **Amazon SES**, **Postmark**, **Mailgun**, or **Brevo**):

1. Go to **Supabase Dashboard** -> **Project Settings** -> **Authentication**.
2. Scroll down to **SMTP Settings** and toggle **Enable Custom SMTP** to **ON**.
3. Fill in your SMTP provider details:
   - **Sender Email**: `security@yourdomain.com` (or `notifications@yourdomain.com`)
   - **Sender Name**: `Arise Security Gateway`
   - **Host**: e.g., `smtp.resend.com` / `smtp.sendgrid.net`
   - **Port**: `587` (or `465` for SSL)
   - **Username**: Provided by your SMTP provider (e.g., `resend` or `apikey`)
   - **Password**: Your SMTP API key / secret password
4. Click **Save**.
5. Custom SMTP eliminates the 3-email/hour limit and guarantees high deliverability straight to the recipient's primary inbox.

#### Troubleshooting Email Delivery with Supabase Auth Logs
If an email OTP does not arrive:
1. Open your **Supabase Dashboard** -> **Logs** -> **Auth Logs**.
2. Look for entries with:
   - `level: error` or `status: 429` (Rate limit exceeded)
   - `status: 400` (`email_address_invalid`)
   - `msg: "Failed to send email"` (SMTP connection error or bad sender address)
3. Check the user's **Spam / Junk** folder in their email client.

---

---

## 📋 Arise Registration & OTP Flow Configuration Checklist

Arise enforces a strict, zero-trust registration and two-factor OTP verification flow with full live Supabase backend integration:

```
[1. Registration Form]
  - Full Name
  - Email Address
  - Indian Mobile Number (+91 E.164)
  - Apartment / Block
  - Apartment / Unit Number
  - Account Type: Customer or Vendor
       │
       ▼ (Clicks "Continue / Send OTP" - Does NOT send OTP yet)
[2. Method Selection Screen]
  - Option A: Verify via SMS (“Send a 6-digit code to +91 XXXXX XXXXX”)
  - Option B: Verify via Email (“Send a 6-digit code to the email address you entered”)
       │
       ▼ (User chooses one option and clicks "Send OTP")
[3. Live Supabase Auth Dispatch]
  - If SMS: supabase.auth.signInWithOtp({ phone: '+91XXXXXXXXXX' })
  - If Email: supabase.auth.signInWithOtp({ email: 'name@example.com' })
       │
       ▼ (Truthful Error Handling if gateway is unconfigured)
[4. OTP Verification Screen]
  - 6-Digit input with auto-focus & paste
  - Resend countdown timer & Resend button
  - "Change verification method" button
       │
       ▼ (supabase.auth.verifyOtp({ token, type: 'sms' | 'email' }))
[5. Profile Persistence & Role-Based Routing]
  - Auth account created only through Supabase Auth
  - Profile saved with full name, email, normalized phone, block, unit, role
  - Customer ➔ Customer Dashboard (Home)
  - Vendor ➔ Vendor Onboarding & Clearance Dashboard (vendor_dashboard)
  - Protected views blocked until OTP verified
```

---

### 🛠️ Supabase Configuration Checklist

Follow this checklist in your [Supabase Dashboard](https://supabase.com/dashboard) to ensure 100% production delivery for both SMS and Email OTP:

#### 1. Enable Email & Phone Auth
1. Go to **Authentication** ➔ **Providers**.
2. **Email Provider**:
   - Set to **Enabled**.
   - Toggle **Confirm email** according to your policy.
   - Set **OTP Expiry** to `600` seconds (10 minutes).
3. **Phone Provider**:
   - Set to **Enabled**.
   - Toggle **Enable Phone Confirmations**.
   - Set **SMS OTP length** to `6` digits.

#### 2. Configure a Real SMS Provider (Twilio / MessageBird / Vonage)
Under **Authentication** ➔ **Providers** ➔ **Phone**:
1. Select your SMS Gateway provider (e.g., **Twilio** or **MessageBird**).
2. Enter your Gateway credentials:
   - **Twilio Account SID**: Found in your Twilio Console.
   - **Twilio Auth Token**: Found in your Twilio Console.
   - **Twilio Message Service SID** or **Twilio Phone Number**.
3. **Important for Indian +91 Numbers**:
   - Ensure your SMS provider account has sufficient balance.
   - Verify that your provider has international SMS enabled or registered for Indian DLT (Distributed Ledger Technology) requirements for transactional OTP delivery.
4. Click **Save**.

#### 3. Configure Custom SMTP for Production Email OTP
Supabase's built-in default email service has a strict rate limit (~3 emails/hour for testing). For reliable production delivery:
1. Go to **Authentication** ➔ **SMTP Settings** (or **Project Settings** ➔ **Auth** ➔ **SMTP**).
2. Toggle **Enable Custom SMTP** to **ON**.
3. Configure your transactional email provider (e.g., **Resend**, **SendGrid**, **Postmark**, or **Amazon SES**):
   - **Sender Email**: e.g., `security@yourdomain.com` or `auth@yourdomain.com`
   - **Sender Name**: `Arise Security`
   - **Host**: e.g., `smtp.resend.com` or `smtp.sendgrid.net`
   - **Port**: `587` (TLS) or `465` (SSL)
   - **Username**: Provided by your SMTP service (e.g., `resend` or `apikey`)
   - **Password**: Your SMTP API Key
4. Click **Save**.

#### 4. Configure Site URL & Redirect URLs
Under **Authentication** ➔ **URL Configuration**:
1. **Site URL**:
   - **Production (Live)**: `https://cyber-lock-sable.vercel.app`
   - Local development: `http://localhost:3000`
2. **Redirect URLs**:
   Add the callback routes handled by Arise:
   - `https://cyber-lock-sable.vercel.app/auth/callback`
   - `https://cyber-lock-sable.vercel.app/**`
   - `http://localhost:3000/auth/callback`
   - `http://localhost:3000/**`
3. Click **Save**.

---

### 🛡️ Truthful Error Handling Matrix

Fraud Lock maintains absolute honesty with the user:
- **SMS Provider Not Configured**: If a project does not have an active SMS gateway (`phone_provider_disabled`), Fraud Lock shows:
  > *"SMS verification is not configured yet. Please choose email verification or contact support."*  
  and provides a 1-click button to switch immediately to email OTP.
- **Email Rate Limit Exceeded**: If the default email provider limits requests, Fraud Lock displays:
  > *"Security rate limit exceeded. Please wait a few minutes before requesting another OTP."*  
  and enables switching to SMS verification.
- **Never Fake Deliveries**: The application will **never** display “OTP sent” unless Supabase Auth confirms that the dispatch API succeeded with HTTP 200.
- **Zero Token Leakage**: OTP codes, bearer tokens, and sensitive credentials are never written to client console logs or exposed in application storage.

---

## 🌐 Production Deployment Guide

### ⚠️ Why GitHub Pages Is NOT Supported
> **Important Architectural Limitation:**  
> **GitHub Pages only hosts static files (HTML, CSS, client-side JS)**.  
> **Fraud Lock is a full-stack Next.js application** utilizing server-side dynamic API routes (`/api/scan/message`, `/api/scan/link`, `/api/scan/ocr`, `/api/assistant/chat`), secure server-side API key handling (Gemini API, threat intelligence endpoints), and dynamic serverless compute.  
>
> Attempting to deploy this project to GitHub Pages via `next export` / static export will break server-side AI scanners, OCR processing, and secure backend proxying. **Keep GitHub strictly for source control and automated CI/CD triggers**, and deploy the application to a compatible modern cloud platform.

### 🌟 Recommended Deployment Platforms

#### Option 1: Vercel (Recommended — Zero-Config)
Vercel is the creator and maintainer of Next.js, providing native support for App Router, serverless API routes, and environment variable management.

1. **Push your code to GitHub**:
   Ensure all changes are committed and pushed to `https://github.com/sathvik-ram-yerroju-ai-creator/fruad-lock.git`.
2. **Import into Vercel**:
   - Go to [vercel.com](https://vercel.com/) and sign in with GitHub.
   - Click **"Add New..."** -> **"Project"**.
   - Select the `sathvik-ram-yerroju-ai-creator/fruad-lock` repository and click **Import**.
3. **Configure Environment Variables**:
   In the **Environment Variables** section of the Vercel import screen, add:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase URL (`https://<project-id>.supabase.co`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase public anon key
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: Your Supabase publishable key
   - `GEMINI_API_KEY`: Your Google Gemini API key (optional for server-side AI)
4. **Deploy**:
   - Click **Deploy**. Vercel will automatically build the Next.js bundle and provide an HTTPS production URL:
     **`https://cyber-lock-sable.vercel.app`**
   - Every push to `main` branch will automatically trigger a production deployment.

#### Option 2: Netlify
1. Connect your GitHub repository at [netlify.com](https://www.netlify.com/).
2. Netlify will auto-detect Next.js via `@netlify/plugin-nextjs`.
3. In **Site Configuration** -> **Environment variables**, configure the Supabase keys.
4. Deploy the site.

#### Option 3: Docker / Self-Hosted / Railway / Render
Build and run the production container:
```bash
npm run build
PORT=3000 npm run start
```
Configure environment variables directly in your hosting dashboard or container environment.

---

---

## 🎯 Evaluator Quick-Start & Demo Mode

For instant evaluation without setting up an SMS gateway or external accounts:
1. Open the app in your browser at `http://localhost:3000`.
2. Click the top-right **Avatar Icon** and select **"Switch / Sign In User"**.
3. Click **"Auto-fill Test User"** for instant credential pre-fill.
4. When testing **Sign Up** or **Change Contact**, an interactive **Evaluator Live Simulation Banner** automatically displays the generated 6-digit OTP with a 1-click **"Auto-fill OTP"** button.
5. Explore the **Security Center** to test 2FA TOTP setup, backup codes, active session management, security audit timeline, and client-side AES-256-GCM encrypted notes.
