export const en = {
  // Brand & Taglines
  brand: '🛡️ FRAUD LOCK',
  tagline: 'Detect. Alert. Protect. Report.',
  motto: 'STOP. CHECK. VERIFY.',
  disclaimer: 'AI risk indicator — not a guarantee. We never promise 100% fraud protection. Verify independently through official channels.',
  legalNotice: 'Fraud Lock is an advisory safety tool. It does not identify individuals, accuse persons of crimes, or guarantee outcomes. Never share credentials with anyone.',

  // Nav
  nav: {
    home: 'Home',
    scanners: 'Scanners',
    vault: 'Evidence Vault',
    safety: 'Safety Academy',
    emergency: 'Emergency Response',
    assistant: 'Ask AI Guard',
    settings: 'Settings',
    privacy: 'Privacy Center',
    protection: 'Protection Center',
    threatMap: 'Threat Map',
    familyMode: 'Family Mode',
    demoMode: 'Demo Scenarios',
  },

  // Dashboard
  dashboard: {
    welcome: 'Cyber Shield Active',
    subtitle: 'Zero background surveillance. Real-time, user-initiated fraud defense.',
    statusArmed: 'SHIELD ARMED',
    statusDescription: 'Sandboxed browser environment ready for manual verification.',
    emergencyTitle: '🚨 I Lost Money / I May Have Been Scammed',
    emergencySubtitle: 'Act within the Golden Hour to stop unauthorized transfers and freeze accounts.',
    emergencyButton: 'Start Emergency Recovery',
    quickScanTitle: 'Scan Suspicious Input',
    messageScannerTitle: 'Message Scanner',
    messageScannerDesc: 'Analyze SMS, WhatsApp, Telegram, or email messages for fraud indicators.',
    linkGuardTitle: 'Link Guard',
    linkGuardDesc: 'Inspect URLs safely without opening them. Detect typosquatting & phishing.',
    screenshotScannerTitle: 'Screenshot & OCR',
    screenshotScannerDesc: 'Extract and inspect text from payment screens, chats, or error notices.',
    qrShieldTitle: 'QR Code Shield',
    qrShieldDesc: 'Safely decode QR codes. Detect hidden UPI collect requests & malicious links.',
    recentScansTitle: 'Recent Advisory Scans',
    noRecentScans: 'No scans recorded yet. Select a scanner or load a demo scenario below.',
    familyModeBanner: 'Family Safety Mode Available — Simplified view with large buttons and direct emergency dialers.',
  },

  // Scanners
  scanners: {
    messageTitle: 'SMS & Message Scanner',
    messageSubtitle: 'Paste suspicious texts, chat logs, or emails. Analyzed safely on-demand.',
    messagePlaceholder: 'Paste message text here (e.g. "Dear customer, your bank account will be blocked today due to pending KYC. Click here immediately...")',
    pasteClipboard: 'Paste from Clipboard',
    clearText: 'Clear',
    scanButton: 'Analyze for Scam Signals',
    scanning: 'Analyzing Scam Patterns...',

    linkTitle: 'Link Guard — Safe URL Inspection',
    linkSubtitle: 'Never click unverified links. We inspect domain structure, redirects, and threat indicators without opening the page.',
    linkPlaceholder: 'https://secure-bank-login.xyz/update-pan',
    checkLinkButton: 'Inspect URL Safely',
    linkWarning: 'Links are analyzed via server-side sandboxed heuristics. The destination webpage is never rendered in your browser.',

    screenshotTitle: 'Screenshot & Image Scanner',
    screenshotSubtitle: 'Upload a screenshot of a suspicious message, transaction, or website. OCR extracts text for verified inspection.',
    dragDropText: 'Tap to upload screenshot or drag image here',
    fileRequirements: 'PNG, JPG, or WEBP up to 5MB. Files are verified locally in your browser memory.',
    extractedTextConfirm: 'Review Extracted Text Before Scanning:',
    editTextNotice: 'You can edit or correct the extracted text before running analysis.',
    startOcr: 'Extract & Inspect Text',

    qrTitle: 'QR Code Shield',
    qrSubtitle: 'Decode QR payloads without navigating. Detect UPI collect traps and sneaky redirects.',
    uploadQrPrompt: 'Upload QR Image or use Camera',
    qrResultTitle: 'Decoded QR Payload:',
    qrWarningUpi: '⚠️ UPI ALERT: Entering your UPI PIN will DEDUCT money from your account, not receive it. Fraudsters send collect requests disguised as "cashback" or "refunds".',
    testLinkGuardWithQr: 'Inspect Decoded Link in Link Guard',
  },

  // Analysis Result
  result: {
    title: 'Security Advisory Result',
    riskLevel: 'Risk Level',
    riskLow: 'LOW RISK',
    riskCaution: 'CAUTION ADVISED',
    riskHigh: 'HIGH RISK / POTENTIAL SCAM',
    category: 'Scam Vector / Category',
    summary: 'Executive Summary',
    warningSignals: 'Detected Red Flags',
    evidence: 'Key Textual Evidence',
    recommendedActions: 'Recommended Safe Next Steps',
    doNotDo: 'WHAT NOT TO DO',
    technicalIndicators: 'Technical Cyber Indicators',
    confidence: 'Assessment Confidence',
    limitations: 'Analysis Limitations',
    aiConfidenceDisclaimer: 'AI risk indicator — not a guarantee. Criminal tactics evolve continuously. Verify independently through official bank/organization hotlines.',
    saveToVault: 'Save Evidence to Vault',
    prepareReport: 'Prepare Incident Report',
    askAiAssistant: 'Ask Safety Assistant',
    scanAnother: 'Scan Another Item',
    savedSuccess: 'Successfully saved to private Evidence Vault!',
  },

  // Emergency / I Lost Money
  emergency: {
    heroTitle: 'Emergency Fraud Response',
    heroSubtitle: 'Every minute matters. Follow these immediate steps to freeze funds and protect accounts.',
    goldenHourNotice: 'The first 2 hours after a scam are critical for bank inter-bank freezing and recovering digital funds.',
    step1Title: '1. What happened?',
    step2Title: '2. Immediate Golden Hour Actions',
    step3Title: '3. Official Reporting Hotlines',
    step4Title: '4. Generate Evidence Dossier',

    scamTypeMoney: 'I transferred money / UPI payment',
    scamTypeOtp: 'I shared an OTP or Banking Password',
    scamTypeApp: 'I installed a remote app (AnyDesk, TeamViewer, APK)',
    scamTypeLink: 'I clicked a link and entered personal credentials',
    scamTypeOther: 'Blackmail / Extortion / Unknown threat',

    actionFreezeBank: 'Call Bank Immediately to Freeze Account & Cards',
    actionDialHelpline: 'Dial National Cyber Helpline (India: 1930 / US: IC3 / UK: 0300 123 2040)',
    actionDisconnectNet: 'Put Phone on Airplane Mode & Uninstall Remote Apps',
    actionChangePasswords: 'Change Passwords from a SECOND, trusted device',
    actionPreserveEvidence: 'Take Screenshots & Record Transaction UTR / Ref IDs',

    hotlineDirectory: 'Official Emergency Numbers',
    indiaNational: 'National Cyber Crime Helpline: 1930 (Toll Free, 24x7)',
    indiaPortal: 'Official Cybercrime Portal: cybercrime.gov.in',
    bankDirectoryTitle: 'Emergency Bank Hotlines (India & Global)',
    generateReportDraft: 'Generate Official Incident Report Draft',
  },

  // Evidence Vault
  vault: {
    title: 'Private Evidence Vault',
    subtitle: 'Encrypted, local-first repository for screenshots, message records, and transaction IDs for law enforcement reporting.',
    emptyVault: 'Your vault is currently empty. Items saved from scans or incident reports will appear here.',
    retentionNotice: 'Configured Data Retention:',
    daysRemaining: 'days until auto-purge',
    addNewEvidence: '+ Add Manual Evidence Item',
    exportIncidentPackage: 'Export Official Dossier (JSON / Markdown)',
    purgeAllData: 'Permanently Purge All Vault Records',
    purgeConfirm: 'Are you sure you want to permanently delete all evidence, scans, and reports? This action is irreversible.',
    itemFactNotice: 'Attested User Facts vs AI Risk Indicators are clearly separated in exported documents for legal admissibility.',
  },

  // Ask Fraud Lock AI
  assistant: {
    title: 'Ask Fraud Lock',
    subtitle: 'Conversational cybersecurity guidance grounded strictly in fraud-prevention best practices.',
    placeholder: 'Ask about a suspicious email, phone number, QR code, or recovery step...',
    send: 'Send',
    warningSensitive: '🛡️ Privacy Guard: Never enter full passwords, card numbers, or 6-digit OTPs here. We will never ask for them.',
    uncertaintyResponse: 'I cannot verify this from the available information. Please verify independently through the organization’s official published customer support channel.',
    suggested1: 'Is it safe to pay a fee to release a courier parcel?',
    suggested2: 'My electricity company says power will be cut tonight unless I call a number.',
    suggested3: 'Someone asked me to install AnyDesk to solve a banking issue.',
  },

  // Family Mode
  family: {
    bannerTitle: 'Family Safe Mode',
    bannerSubtitle: 'Simplified interface with maximum contrast, large touch targets, and unmistakable safety instructions.',
    rule1: '1. STOP. Take a breath.',
    rule2: '2. DO NOT click links in SMS or WhatsApp.',
    rule3: '3. DO NOT pay money or enter your UPI PIN.',
    rule4: '4. NEVER share 6-digit OTP codes with anyone, even a "bank manager".',
    rule5: '5. ALWAYS verify by calling your family or visiting your local branch.',
    callFamilyButton: 'Call Trusted Family Member',
    callCyberPoliceButton: 'Call Cyber Helpline (1930)',
    exitFamilyMode: 'Exit Family Mode',
  },

  // Protection & Privacy Center
  protectionCenter: {
    title: 'Protection Center',
    subtitle: 'Transparent hardware and permission capabilities of this Web Application / PWA.',
    webAppLimitationNotice: 'Web Browser Boundary: Modern web security policies forbid web apps from silently reading incoming phone calls, background SMS, or device files. All scans in Fraud Lock are user-initiated by design to preserve your absolute privacy.',
    nativeAppNote: 'Native Android/iOS companion integration is planned for future automatic SMS screening; this web release operates strictly within browser sandboxes.',
  },

  privacyCenter: {
    title: 'Privacy Center & Data Sovereignty',
    subtitle: 'Your privacy is non-negotiable. Zero background data collection.',
    pledge1: 'No Silent Background Surveillance: We never read your calls, SMS, contacts, or photos without your direct action.',
    pledge2: 'Ephemeral AI Processing: Text submitted for scanning is analyzed in memory and never used to train public LLM models.',
    pledge3: 'Total Data Ownership: You can purge all evidence and scan history at any time with a single tap.',
    retentionSettings: 'Configure Data Auto-Deletion:',
    retention7: '7 Days (Strict Privacy)',
    retention30: '30 Days (Standard)',
    retention90: '90 Days (Extended Evidence)',
  },

  // Threat Map
  threatMap: {
    title: 'Anonymized Threat Map',
    subtitle: 'Coarse regional scam trend intelligence based on aggregated incident reports.',
    disclaimer: 'Aggregated reports are not proof of criminal activity. Data is aggregated to broad regional levels only.',
    trendTitle: 'Scam Categories by Region',
    topVectors: 'Highest Trending Vectors This Week:',
  },

  // Demo Scenarios
  demo: {
    title: 'Interactive Hackathon Demo Scenarios',
    subtitle: 'Pre-configured real-world scam simulations for immediate testing and evaluation.',
    loadScenario: 'Load Scenario',
    tagDemo: '[DEMO SAMPLE - NOT REAL DATA]',
  },
};
