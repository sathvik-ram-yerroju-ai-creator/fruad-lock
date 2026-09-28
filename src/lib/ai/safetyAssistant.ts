import { sanitizeUserInput } from '../scanners/sanitizer';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  riskWarning?: string;
  suggestedActions?: string[];
}

const SAFETY_KNOWLEDGE_BASE = [
  {
    topic: 'electricity_bill',
    triggers: ['electricity', 'power bill', 'cut tonight', 'power disconnected', 'light bill', 'discom', 'officer'],
    response: `⚠️ High Risk Scam Pattern:\n\n1. Genuine electricity boards NEVER send messages from personal 10-digit mobile numbers.\n2. Power supply is NEVER disconnected at night (e.g. 9:30 PM) without formal written prior notice.\n3. NEVER call the mobile number provided in the SMS.\n4. NEVER download AnyDesk or APK files.\n\nSafe Action: Open your state electricity provider's official portal or app directly, or check your physical bill for the official customer care helpline.`,
  },
  {
    topic: 'upi_pin_refund',
    triggers: ['upi pin', 'receive money', 'cashback', 'lottery', 'refund qr', 'scan to receive'],
    response: `🚨 Critical Financial Rule:\n\n• You NEVER need to enter your UPI PIN to RECEIVE money.\n• Entering your UPI PIN ALWAYS transfers money OUT of your account.\n• If someone claims you will get a refund, cashback, or OLX buyer payment by entering your PIN, it is 100% a fraudulent collect request.\n\nSafe Action: Decline the request on your UPI app and block the sender.`,
  },
  {
    topic: 'remote_access',
    triggers: ['anydesk', 'teamviewer', 'quicksupport', 'rustdesk', 'screen share', 'remote desktop'],
    response: `🚨 Severe Device Takeover Risk:\n\n• Bank staff and legitimate tech support will NEVER ask you to install AnyDesk, TeamViewer, or QuickSupport.\n• These apps allow scammers to view your screen in real time, see your OTPs, and take control of your phone.\n\nSafe Action: If already installed, disconnect from Wi-Fi immediately, turn on Airplane mode, and uninstall the app now.`,
  },
  {
    topic: 'digital_arrest_customs',
    triggers: ['digital arrest', 'fedex', 'customs', 'narcotics', 'mumbai police', 'cbi', 'drugs found', 'skype call', 'arrest warrant'],
    response: `⚠️ Extortion Scam Alert:\n\n1. There is NO legal provision for "Digital Arrest" in India or internationally.\n2. Police, CBI, and Customs NEVER conduct interrogations or demand money over Skype, WhatsApp, or video calls.\n3. Government agencies NEVER ask citizens to transfer funds to "RBI verification accounts".\n\nSafe Action: Hang up immediately. Report the incident directly to the National Cyber Crime Helpline at 1930 or cybercrime.gov.in.`,
  },
  {
    topic: 'part_time_job',
    triggers: ['part time job', 'telegram', 'like youtube', 'hotel review', 'prepaid task', 'daily ₹5000', 'deposit money to earn'],
    response: `⚠️ Ponzi / Advance-Fee Task Scam:\n\n• Legitimate companies never pay ₹5,000/day for simply liking YouTube videos or writing fake reviews.\n• The initial small payouts are bait to lure you into paying large "task deposits".\n• Once you send large sums, they block you or demand more "tax fees" to withdraw.\n\nSafe Action: Refuse to pay any deposits. Block and report the Telegram/WhatsApp accounts.`,
  },
  {
    topic: 'lost_money_recovery',
    triggers: ['lost money', 'scammed', 'money deducted', 'help me recover', 'account hacked', 'cyber cell'],
    response: `🚨 Immediate Emergency Recovery Steps (Act within Golden Hour):\n\n1. Call your bank immediately and ask to FREEZE the account, debit card, and UPI.\n2. Call the National Cyber Crime Helpline: 1930 (India) immediately to request inter-bank transaction blocking.\n3. File a detailed report at cybercrime.gov.in with transaction UTR numbers and screenshots.\n4. Beware of "recovery scammers" online who claim they can hack back your money for a fee — they are secondary scammers.`,
  },
];

export async function generateSafetyAssistantResponse(
  userQuery: string,
  language: string = 'en'
): Promise<{ text: string; riskWarning?: string; suggestedActions?: string[] }> {
  const { sanitizedText, hasSensitiveData } = sanitizeUserInput(userQuery);

  let riskWarning: string | undefined;
  if (hasSensitiveData) {
    riskWarning = '🛡️ Sensitive Information Redacted: For your safety, never share passwords, card numbers, or OTP codes.';
  }

  const queryLower = sanitizedText.toLowerCase();

  // 1. Try server-side AI route if available
  try {
    const res = await fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: sanitizedText, language }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.response) {
        return {
          text: data.response,
          riskWarning,
          suggestedActions: data.suggestedActions,
        };
      }
    }
  } catch (e) {
    console.warn('AI endpoint not reachable, applying local safety rules engine:', e);
  }

  // 2. Local Knowledge-Base Match
  for (const item of SAFETY_KNOWLEDGE_BASE) {
    const match = item.triggers.some((trigger) => queryLower.includes(trigger));
    if (match) {
      return {
        text: item.response,
        riskWarning,
        suggestedActions: [
          'Verify independently through official published customer care numbers.',
          'Never transfer money to personal bank accounts or UPI IDs.',
          'Preserve all SMS, chat messages, and transaction IDs as evidence.',
        ],
      };
    }
  }

  // 3. Fallback required by user instructions:
  // "When uncertain, say: 'I cannot verify this from the available information. Verify through the organization’s official channel.'"
  return {
    text: `I cannot verify this from the available information. Verify through the organization’s official channel.\n\nFor your security:\n• Never share OTPs, PINs, or passwords with anyone.\n• Do not click links or download apps sent by unknown numbers.\n• If in doubt regarding a bank or service, visit their official website directly or call the number on your account statement or card.`,
    riskWarning,
    suggestedActions: [
      'Call official bank customer care',
      'Check account status in official mobile app',
      'Dial 1930 for cybercrime advisory',
    ],
  };
}
