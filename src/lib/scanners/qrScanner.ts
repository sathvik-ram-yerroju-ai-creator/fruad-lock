import jsQR from 'jsqr';
import { AnalysisResult } from '@/types/scam';
import { inspectUrlSafely } from './linkGuard';

export interface DecodedQrResult {
  rawPayload: string;
  type: 'url' | 'upi' | 'text' | 'wifi' | 'unknown';
  parsedDetails?: {
    upiPayee?: string;
    upiName?: string;
    upiAmount?: string;
    upiNote?: string;
    ssid?: string;
  };
  analysis: AnalysisResult;
}

export function decodeQrFromImageData(
  imageData: ImageData,
  language: string = 'en'
): DecodedQrResult | null {
  const code = jsQR(imageData.data, imageData.width, imageData.height);
  if (!code || !code.data) {
    return null;
  }

  const raw = code.data.trim();

  // 1. UPI Payload Detection
  if (raw.toLowerCase().startsWith('upi://pay')) {
    return parseUpiPayload(raw, language);
  }

  // 2. URL Payload Detection
  if (/^https?:\/\//i.test(raw)) {
    const linkResult = inspectUrlSafely(raw, language);
    return {
      rawPayload: raw,
      type: 'url',
      analysis: linkResult.analysis,
    };
  }

  // 3. Wi-Fi Configuration
  if (raw.startsWith('WIFI:')) {
    return {
      rawPayload: raw,
      type: 'wifi',
      analysis: {
        risk_level: 'CAUTION',
        category: 'Wi-Fi Network Configuration QR',
        summary: 'This QR code contains Wi-Fi network credentials.',
        warning_signals: ['Connecting to unknown public Wi-Fi networks poses traffic eavesdropping risks.'],
        evidence: ['Wi-Fi connection schema payload detected.'],
        recommended_actions: [
          'Verify this network is an official, trusted router before connecting.',
          'Always use a VPN when connecting to unfamiliar wireless networks.',
        ],
        do_not_do: ['Do not connect if an unknown stranger asked you to scan this.'],
        technical_indicators: ['Standard IEEE 802.11 Wi-Fi QR schema'],
        confidence: 'HIGH',
        limitations: 'Cannot verify physical router security parameters from QR text.',
        language,
      },
    };
  }

  // 4. Plain Text or Other
  return {
    rawPayload: raw,
    type: 'text',
    analysis: {
      risk_level: 'LOW',
      category: 'Informational Text QR',
      summary: 'The QR code contains plain alphanumeric text without automatic actions.',
      warning_signals: ['Inspect text carefully for unsolicited instructions or phone numbers.'],
      evidence: [`Decoded text length: ${raw.length} characters`],
      recommended_actions: ['Review the decoded text before following any instructions.'],
      do_not_do: ['Do not contact numbers or follow instructions if origin is unknown.'],
      technical_indicators: ['Generic UTF-8 QR payload'],
      confidence: 'MEDIUM',
      limitations: 'Text content evaluated without external context.',
      language,
    },
  };
}

function parseUpiPayload(rawUpi: string, language: string): DecodedQrResult {
  let pa = '';
  let pn = '';
  let am = '';
  let tn = '';

  try {
    const url = new URL(rawUpi);
    pa = url.searchParams.get('pa') || '';
    pn = url.searchParams.get('pn') || '';
    am = url.searchParams.get('am') || '';
    tn = url.searchParams.get('tn') || '';
  } catch {
    // Regex fallback for loose UPI URIs
    const paMatch = rawUpi.match(/[?&]pa=([^&]+)/i);
    const pnMatch = rawUpi.match(/[?&]pn=([^&]+)/i);
    const amMatch = rawUpi.match(/[?&]am=([^&]+)/i);
    const tnMatch = rawUpi.match(/[?&]tn=([^&]+)/i);
    if (paMatch) pa = decodeURIComponent(paMatch[1]);
    if (pnMatch) pn = decodeURIComponent(pnMatch[1]);
    if (amMatch) am = decodeURIComponent(amMatch[1]);
    if (tnMatch) tn = decodeURIComponent(tnMatch[1]);
  }

  const warningSignals = [
    'CRITICAL: Entering your UPI PIN will DEDUCT money from your account, NOT credit it.',
    'Scammers routinely send QR codes claiming you will "receive a refund" or "collect cashback".',
  ];

  const evidence = [
    pa ? `Target VPA / Payee: ${pa}` : 'Payee VPA present',
    pn ? `Merchant / Payee Name: ${pn}` : 'Payee Name specified',
    am ? `Pre-filled Amount to Deduct: ₹${am}` : 'Amount to be specified by user',
    tn ? `Transaction Note: "${tn}"` : 'Transaction note provided',
  ];

  return {
    rawPayload: rawUpi,
    type: 'upi',
    parsedDetails: {
      upiPayee: pa,
      upiName: pn,
      upiAmount: am,
      upiNote: tn,
    },
    analysis: {
      risk_level: 'CAUTION',
      category: 'UPI Payment Request QR',
      summary: `UPI Payment target detected (${pa || 'Unknown VPA'}). Scanning and authorizing will TRANSFER FUNDS OUT of your account.`,
      warning_signals: warningSignals,
      evidence,
      recommended_actions: [
        'Confirm if you intended to PAY this entity.',
        'If someone sent this QR code saying you will RECEIVE money, STOP IMMEDIATELY. This is a scam.',
        'Remember the fundamental rule: You NEVER need to enter your UPI PIN to receive money.',
      ],
      do_not_do: [
        'DO NOT enter your UPI PIN if you were expecting to receive money or a refund.',
        'DO NOT share screenshots of your UPI app with the sender.',
      ],
      technical_indicators: [
        'National Payments Corporation of India (NPCI) UPI Intent URI scheme',
        'Direct account debit request protocol',
      ],
      confidence: 'HIGH',
      limitations: 'Legitimate for making purchases at physical stores; high-risk if received online to "receive" funds.',
      language,
    },
  };
}
