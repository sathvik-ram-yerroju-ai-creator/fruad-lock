export interface DemoScenario {
  id: string;
  title: string;
  type: 'message' | 'link' | 'qr' | 'screenshot';
  category: string;
  inputContent: string;
  description: string;
  metadata?: {
    senderId?: string;
    url?: string;
    qrPayload?: string;
  };
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: 'demo-electricity',
    title: 'Electricity Bill Cut Threat [DEMO SAMPLE]',
    type: 'message',
    category: 'Utility Impersonation / Urgency Trap',
    description: 'Classic fear-based SMS threatening immediate power cut at 9:30 PM with a fake officer contact number.',
    inputContent: `[DEMO SAMPLE - NOT REAL DATA] Dear customer, your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our electricity officer at 9876543210. Thank you.`,
    metadata: {
      senderId: '+91 98765 43210 (Spoofed personal mobile)',
    },
  },
  {
    id: 'demo-sbi-kyc',
    title: 'Fake SBI KYC Update Phishing Link [DEMO SAMPLE]',
    type: 'link',
    category: 'Banking Phishing / Typosquatting',
    description: 'Lookalike domain attempting to steal State Bank of India netbanking passwords and OTPs.',
    inputContent: `https://onlinesbi-kyc-verify-update.xyz/netbanking/login`,
    metadata: {
      url: 'https://onlinesbi-kyc-verify-update.xyz/netbanking/login',
    },
  },
  {
    id: 'demo-upi-qr',
    title: 'UPI "Receive Cashback" QR Code Trap [DEMO SAMPLE]',
    type: 'qr',
    category: 'UPI Collect / Reverse Payment Scam',
    description: 'QR code sent by scammer pretending to credit ₹5,000 lottery cashback, but actually initiates a ₹5,000 debit.',
    inputContent: `upi://pay?pa=cashback-rewards-node9@upi&pn=NationalCashbackReward&am=5000&cu=INR&tn=Cashback%20Reward%20Refund`,
    metadata: {
      qrPayload: 'upi://pay?pa=cashback-rewards-node9@upi&pn=NationalCashbackReward&am=5000&cu=INR&tn=Cashback%20Reward%20Refund',
    },
  },
  {
    id: 'demo-telegram-task',
    title: 'Telegram YouTube Like Part-Time Job [DEMO SAMPLE]',
    type: 'message',
    category: 'Advance-Fee / Prepaid Task Scam',
    description: 'Promise of ₹3,000-₹5,000 daily for liking videos, followed by demands for prepaid "task deposits".',
    inputContent: `[DEMO SAMPLE - NOT REAL DATA] Hello! I am Sarah from HR Global Talent. We noticed your profile and have an urgent work from home job offer. You can earn ₹3,500 to ₹7,000 daily just by liking 5 YouTube videos and giving 5-star Google map reviews. No experience needed! Daily instant payout via UPI. Contact our task manager on Telegram @EarnDailyIndia to claim your ₹500 welcome bonus now!`,
    metadata: {
      senderId: 'International WhatsApp +62 895 2341 988',
    },
  },
  {
    id: 'demo-anydesk-support',
    title: 'Bank Remote Screen-Share Takeover [DEMO SAMPLE]',
    type: 'message',
    category: 'Remote Access / Device Takeover',
    description: 'Fraudster impersonating bank technical support instructing victim to install AnyDesk/QuickSupport.',
    inputContent: `[DEMO SAMPLE - NOT REAL DATA] HDFC Alert: Your credit card annual fee refund of ₹1,499 is pending verification. To receive direct refund to your savings account, our senior manager will assist you. Please download AnyDesk from Play Store and provide your 9-digit remote address code to complete verification. Do not close the app until process finishes.`,
  },
  {
    id: 'demo-fedex-customs',
    title: 'FedEx Customs Drugs Seizure Extortion [DEMO SAMPLE]',
    type: 'message',
    category: 'Digital Arrest / Authority Extortion',
    description: 'Intimidation scam claiming illegal narcotics were intercepted in Taiwan parcel addressed to victim.',
    inputContent: `[DEMO SAMPLE - NOT REAL DATA] Urgent notice from FedEx Logistics & Mumbai Crime Branch: Parcel tracking #FX-88912 addressed to you containing 5 fake passports and 150g MDMA narcotics has been intercepted by customs. Case registered under NDPS Act. An arrest warrant has been issued. Connect immediately with Sub-Inspector Sharma on Skype video call for identity verification and clear your name.`,
  },
  {
    id: 'demo-crypto-doubling',
    title: 'Guaranteed 200% Crypto Profit Group [DEMO SAMPLE]',
    type: 'message',
    category: 'Investment / Ponzi Fraud',
    description: 'High-yield investment fraud group claiming AI algorithms double your money in 48 hours.',
    inputContent: `[DEMO SAMPLE - NOT REAL DATA] 🔥 VIP CRYPTO ARBITRAGE SIGNAL: Guaranteed 200% returns in 48 hours with zero risk! Our proprietary algorithmic bot trades Binance price differences. Invest ₹10,000, get back ₹30,000 guaranteed by RBI regulated insurance. Over 500+ satisfied investors this week. Join our private VIP channel: https://t.me/CryptoDoubler2026`,
  },
  {
    id: 'demo-safe-bank',
    title: 'Legitimate Bank Transaction Alert [BENCHMARK LOW RISK]',
    type: 'message',
    category: 'Legitimate Banking Notification',
    description: 'Genuine informational bank transaction SMS with no urgency or link hooks.',
    inputContent: `[DEMO SAMPLE - NOT REAL DATA] Dear customer, your account XX1234 has been debited by INR 450.00 on 28-SEP-26 towards UPI transaction to FreshMart. Available balance: INR 18,240.50. If this transaction was not authorized by you, SMS BLOCK to 567676 or call 1800-425-3800.`,
  },
];
