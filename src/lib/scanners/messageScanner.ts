import { AnalysisResult } from '@/types/scam';
import { sanitizeUserInput } from './sanitizer';

interface ScamVectorRule {
  category: string;
  keywords: string[];
  regex?: RegExp;
  risk: 'HIGH' | 'CAUTION';
  signals: string[];
  doNotDo: string[];
  recommended: string[];
  techIndicators: string[];
}

const SCAM_RULES: ScamVectorRule[] = [
  // 1. Electricity / Utility disconnection
  {
    category: 'Electricity / Utility Impersonation Scam',
    keywords: ['electricity', 'power bill', 'disconnected tonight', 'power supply', 'light bill', 'officer number', 'urgently call'],
    regex: /(?:electricity|power|bill).*(?:disconnect|cut|9:30|call \+?91|contact officer)/i,
    risk: 'HIGH',
    signals: [
      'Artificial countdown urgency (e.g. power cut tonight at 9:30 PM)',
      'Unsolicited phone number provided instead of official electricity board portal',
      'Threat of immediate utility disruption to cause panic',
      'Request to download an APK or contact a personal mobile number',
    ],
    doNotDo: [
      'DO NOT call the mobile number given in the SMS.',
      'DO NOT install any remote support application (AnyDesk, QuickSupport).',
      'DO NOT transfer even a token amount (e.g. ₹10) to verify account.',
    ],
    recommended: [
      'Check your actual bill status directly on your state electricity board official app or website.',
      'Call your electricity discom customer care number listed on your physical bill.',
      'Block the sender mobile number on your phone.',
    ],
    techIndicators: [
      'Header spoofing / Personal 10-digit mobile sender instead of official alphanumeric sender ID',
      'High-pressure social engineering panic trigger',
    ],
  },

  // 2. Bank / KYC Account Blocking
  {
    category: 'Banking / KYC Phishing Impersonation',
    keywords: ['kyc', 'pan card', 'account blocked', 'account suspended', 'sbi', 'hdfc', 'icici', 'axis bank', 'netbanking', 'update your kyc', 'aadhaar'],
    regex: /(?:kyc|pan|aadhaar).*(?:block|suspend|deactivate|update|click here|apk)/i,
    risk: 'HIGH',
    signals: [
      'Threat that bank account or debit card will be blocked immediately',
      'Unsolicited link asking to upload PAN, Aadhaar, or NetBanking password',
      'Sent from an unknown number or lookalike sender ID',
      'Grammar mistakes or strange domain extension',
    ],
    doNotDo: [
      'DO NOT click any link in the SMS or email.',
      'DO NOT enter NetBanking credentials, OTP, or card PIN.',
      'DO NOT download files ending in .apk or .exe.',
    ],
    recommended: [
      'Visit your nearest bank branch or log in directly through your bank’s official mobile app.',
      'Forward the fraudulent SMS to 1909 (TRAI spam reporting) and report to 1930.',
      'Call the official phone number printed on the back of your debit card.',
    ],
    techIndicators: [
      'Domain mismatch / lookalike phishing domain detected',
      'Credential harvesting form targeting banking authentication',
    ],
  },

  // 3. Remote Access Apps (AnyDesk, TeamViewer, QuickSupport)
  {
    category: 'Remote Access / Device Takeover Scam',
    keywords: ['anydesk', 'teamviewer', 'quicksupport', 'rustdesk', 'ultraviewer', 'screen share', 'remote support', 'install app to resolve'],
    regex: /(?:anydesk|teamviewer|quicksupport|rustdesk|ultraviewer|screen share)/i,
    risk: 'HIGH',
    signals: [
      'Request to install a remote desktop / screen mirroring application',
      'Caller claims to be from bank, telecom, or government tech support',
      'Attempting to view your screen while you log into your banking app or enter PIN',
      'Insistence that you keep the app open to receive a refund',
    ],
    doNotDo: [
      'NEVER install AnyDesk, TeamViewer, or QuickSupport at the instruction of a stranger.',
      'DO NOT share your 9-digit remote connection code.',
      'DO NOT open banking or UPI apps while screen sharing is active.',
    ],
    recommended: [
      'Immediately uninstall AnyDesk, TeamViewer, or QuickSupport if already downloaded.',
      'Turn on Airplane mode immediately if a connection was initiated.',
      'Change all banking and email passwords from another device.',
    ],
    techIndicators: [
      'Abuse of legitimate remote administration tool (RAT) for financial theft',
      'Session takeover and real-time OTP surveillance vector',
    ],
  },

  // 4. Part-Time Job / Telegram Task Scam
  {
    category: 'Part-Time Job / YouTube Like / Task Deposit Scam',
    keywords: ['part time job', 'telegram', 'work from home', 'daily income', 'like youtube videos', 'earn 3000', 'earn 5000', 'hotel review', 'prepaid task', 'crypto task'],
    regex: /(?:part.?time|work from home|like youtube|earn \d{3,5}|daily profit|telegram)/i,
    risk: 'HIGH',
    signals: [
      'Unsolicited WhatsApp or Telegram message offering high daily pay for trivial tasks',
      'Initial payout of small amounts (e.g. ₹150-₹500) to build false trust',
      'Requirement to pay a "deposit" or "prepaid task fee" to unlock higher earnings',
      'Addition to large Telegram groups showing fake screenshots of high profits',
    ],
    doNotDo: [
      'DO NOT send any deposit money or cryptocurrency.',
      'DO NOT share your bank account or UPI details for "salary processing".',
      'DO NOT join Telegram channels promising guaranteed returns.',
    ],
    recommended: [
      'Block and report the sender on WhatsApp/Telegram.',
      'Remember: Legitimate employers never ask employees to pay money to work.',
      'If you already paid, file an immediate complaint at cybercrime.gov.in or helpline 1930.',
    ],
    techIndicators: [
      'Classic Ponzi / Task advance-fee fraud matrix',
      'Mule account routing and cryptocurrency laundering pattern',
    ],
  },

  // 5. Courier / Customs Drugs Seizure Scam (Digital Arrest)
  {
    category: 'Law Enforcement / Courier / Digital Arrest Extortion',
    keywords: ['fedex', 'customs', 'narcotics', 'mumbai police', 'cbi', 'arrest warrant', 'drugs found', 'taiwan parcel', 'money laundering case', 'digital arrest', 'skype call'],
    regex: /(?:fedex|customs|narcotics|police|cbi|arrest warrant|drugs|digital arrest|skype)/i,
    risk: 'HIGH',
    signals: [
      'Caller claims a parcel with drugs, passports, or illegal items was sent in your name',
      'Video call showing fake police station backdrop or uniform',
      'Threat of immediate arrest unless you transfer money to a "RBI verification account"',
      'Demand that you stay on video call for hours ("Digital Arrest")',
    ],
    doNotDo: [
      'DO NOT transfer money to any "safe account" or "RBI verification account".',
      'DO NOT remain on video call with unknown callers threatening legal action.',
      'DO NOT panic: Law enforcement NEVER conducts arrests or trials over Skype/WhatsApp video.',
    ],
    recommended: [
      'Hang up immediately. There is no concept of "Digital Arrest" under Indian or international law.',
      'Dial 1930 or visit your local police station to report the caller.',
      'Verify with official courier customer service using your registered mobile number.',
    ],
    techIndicators: [
      'Severe psychological intimidation & authority impersonation extortion',
      'Deepfake or fake badge video calling deception',
    ],
  },

  // 6. UPI QR Code "Receive Money" Scam
  {
    category: 'UPI QR Code / Fake Cashback Trap',
    keywords: ['scan qr to receive', 'enter pin to receive', 'cashback', 'lottery winner', 'olx payment', 'buyer wants to send advance', 'qr code payment'],
    regex: /(?:scan qr.*receive|enter pin.*receive|cashback.*claim|olx)/i,
    risk: 'HIGH',
    signals: [
      'Claim that you need to scan a QR code to RECEIVE money',
      'Instruction to enter your UPI PIN to claim a refund, prize, or OLX payment',
      'Sender sends a screenshot showing a "Payment Failed" or "Approve Request"',
    ],
    doNotDo: [
      'NEVER enter your UPI PIN to receive money. Entering your PIN ALWAYS deducts money.',
      'DO NOT scan QR codes sent over WhatsApp or OLX chat.',
      'DO NOT accept collect requests on PhonePe, Google Pay, or Paytm.',
    ],
    recommended: [
      'Decline all payment requests immediately.',
      'Block the buyer/scammer on the marketplace app.',
      'Educate friends and family: UPI PIN is strictly for DEBITING accounts, never CREDITING.',
    ],
    techIndicators: [
      'UPI Intent / Collect API manipulation exploiting user cognitive bias',
      'Reversal fraud vector',
    ],
  },
];

export async function analyzeScamMessage(
  rawText: string,
  language: string = 'en'
): Promise<AnalysisResult> {
  const { sanitizedText, hasSensitiveData, warnings: sanitizationWarnings } = sanitizeUserInput(rawText);

  // Check against our comprehensive rule database
  let matchedRule: ScamVectorRule | null = null;
  const detectedSignals: string[] = [...sanitizationWarnings];
  const detectedEvidence: string[] = [];
  const techIndicators: string[] = [];

  for (const rule of SCAM_RULES) {
    let matchesKeyword = false;
    for (const kw of rule.keywords) {
      if (sanitizedText.toLowerCase().includes(kw)) {
        matchesKeyword = true;
        detectedEvidence.push(`Matched keyword pattern: "${kw}"`);
      }
    }

    if (rule.regex && rule.regex.test(sanitizedText)) {
      matchesKeyword = true;
      detectedEvidence.push('Matched critical structural fraud signature.');
    }

    if (matchesKeyword) {
      matchedRule = rule;
      detectedSignals.push(...rule.signals);
      techIndicators.push(...rule.techIndicators);
      break;
    }
  }

  // URL presence detection
  const urlMatch = sanitizedText.match(/https?:\/\/[^\s]+/gi);
  if (urlMatch) {
    detectedEvidence.push(`Embedded link found: ${urlMatch[0]}`);
    techIndicators.push('External web URL embedded in unsolicited communication.');
    if (!matchedRule) {
      detectedSignals.push('Contains an unverified external hyperlink.');
    }
  }

  // Generic urgency analysis
  const urgencyKeywords = ['immediately', 'urgent', 'within 24 hours', 'action required', 'final notice', 'emergency'];
  const hasUrgency = urgencyKeywords.some((k) => sanitizedText.toLowerCase().includes(k));
  if (hasUrgency) {
    detectedSignals.push('Artificial urgency detected — common tactic to induce rushed decisions.');
  }

  // Decision logic
  if (matchedRule) {
    return {
      risk_level: matchedRule.risk,
      category: matchedRule.category,
      summary: `Potential scam detected: High-risk indicators matching known ${matchedRule.category.toLowerCase()} patterns.`,
      warning_signals: Array.from(new Set(detectedSignals)),
      evidence: Array.from(new Set(detectedEvidence)),
      recommended_actions: matchedRule.recommended,
      do_not_do: matchedRule.doNotDo,
      technical_indicators: Array.from(new Set(techIndicators)),
      confidence: 'HIGH',
      limitations: 'Advisory analysis based on structural heuristic matching. Verify independently through official organizational channels.',
      language,
    };
  }

  // Moderate risk / caution
  if (hasUrgency || urlMatch || hasSensitiveData) {
    return {
      risk_level: 'CAUTION',
      category: 'Unverified Communication with Risk Indicators',
      summary: 'Suspicious elements detected: The message exhibits urgency or contains links requiring independent verification.',
      warning_signals: Array.from(new Set(detectedSignals)),
      evidence: detectedEvidence.length > 0 ? detectedEvidence : ['Unverified sender context'],
      recommended_actions: [
        'Do not click embedded links directly.',
        'Verify sender identity through official published customer care numbers.',
        'Do not share personal credentials, OTPs, or financial information.',
      ],
      do_not_do: [
        'DO NOT share OTP or passwords.',
        'DO NOT authorize unknown payment requests.',
      ],
      technical_indicators: techIndicators.length > 0 ? techIndicators : ['Unsolicited outbound communication'],
      confidence: 'MEDIUM',
      limitations: 'Cannot conclusively determine authenticity without official sender header verification.',
      language,
    };
  }

  // Low Risk
  return {
    risk_level: 'LOW',
    category: 'Standard Communication / No Obvious Scam Indicators',
    summary: 'No common high-risk fraud signatures or urgency patterns detected in the analyzed text.',
    warning_signals: ['Always remain cautious with unexpected requests for money or personal data.'],
    evidence: ['No malicious keywords, URLs, or extortion signatures detected.'],
    recommended_actions: [
      'Normal caution applies.',
      'Never share banking PINs or OTPs even if a communication seems harmless.',
    ],
    do_not_do: [
      'Never send money or personal credentials to unverified contacts.',
    ],
    technical_indicators: ['No blacklisted keywords or urgent action hooks observed.'],
    confidence: 'MEDIUM',
    limitations: 'AI risk indicator — not a guarantee. Subtle social engineering tactics may not be captured.',
    language,
  };
}
