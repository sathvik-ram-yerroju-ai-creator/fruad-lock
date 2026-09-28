import { AnalysisResult } from '@/types/scam';

const SUSPICIOUS_TLDS = new Set([
  'xyz', 'top', 'live', 'click', 'work', 'icu', 'buzz', 'rest', 'lat', 'fit',
  'tk', 'ml', 'ga', 'cf', 'gq', 'monster', 'beauty', 'surf', 'loan', 'win', 'download',
]);

const SHORTENERS = new Set([
  'bit.ly', 'tinyurl.com', 'is.gd', 't.co', 'ow.ly', 'cutt.ly', 'rb.gy', 'goo.gl', 'bl.ink',
]);

const BRAND_TARGETS = [
  { name: 'SBI (State Bank of India)', official: 'onlinesbi.sbi', keywords: ['sbi', 'onlinesbi', 'statebank'] },
  { name: 'HDFC Bank', official: 'hdfcbank.com', keywords: ['hdfc', 'hdfcbank'] },
  { name: 'ICICI Bank', official: 'icicibank.com', keywords: ['icici', 'icicibank'] },
  { name: 'Axis Bank', official: 'axisbank.com', keywords: ['axisbank'] },
  { name: 'Paytm', official: 'paytm.com', keywords: ['paytm'] },
  { name: 'PhonePe', official: 'phonepe.com', keywords: ['phonepe'] },
  { name: 'Google Pay', official: 'pay.google.com', keywords: ['gpay', 'googlepay'] },
  { name: 'PayPal', official: 'paypal.com', keywords: ['paypal', 'paypa1'] },
  { name: 'Amazon', official: 'amazon.in', keywords: ['amazon', 'amaz0n'] },
  { name: 'Netflix', official: 'netflix.com', keywords: ['netflix'] },
  { name: 'India Post', official: 'indiapost.gov.in', keywords: ['indiapost', 'dak-sevak'] },
  { name: 'Income Tax Dept', official: 'incometax.gov.in', keywords: ['incometax', 'tax-refund'] },
];

export interface LinkInspectionResult {
  parsedUrl: {
    protocol: string;
    hostname: string;
    pathname: string;
    search: string;
  };
  analysis: AnalysisResult;
}

export function inspectUrlSafely(rawUrl: string, language: string = 'en'): LinkInspectionResult {
  let normalizedUrl = rawUrl.trim();
  if (!/^https?:\/\//i.test(normalizedUrl)) {
    normalizedUrl = 'https://' + normalizedUrl;
  }

  const warningSignals: string[] = [];
  const evidence: string[] = [];
  const technicalIndicators: string[] = [];
  const recommendedActions: string[] = [];
  const doNotDo: string[] = [
    'DO NOT open this link on your computer or mobile device.',
    'DO NOT enter passwords, OTPs, or debit/credit card details.',
    'DO NOT download or install any files prompted by this site (.apk, .exe, .dmg).',
  ];

  let parsed: URL;
  try {
    parsed = new URL(normalizedUrl);
  } catch {
    return {
      parsedUrl: { protocol: '', hostname: '', pathname: '', search: '' },
      analysis: {
        risk_level: 'CAUTION',
        category: 'Malformed / Invalid URL Structure',
        summary: 'The provided link does not follow valid internet URL standards.',
        warning_signals: ['Cannot safely parse hostname and protocol.'],
        evidence: [`Input could not be parsed: "${rawUrl}"`],
        recommended_actions: ['Do not attempt to open malformed or obfuscated URLs.'],
        do_not_do: doNotDo,
        technical_indicators: ['RFC 3986 URL parsing failure'],
        confidence: 'HIGH',
        limitations: 'Malformed input cannot be analyzed against DNS or domain registries.',
        language,
      },
    };
  }

  const hostname = parsed.hostname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  let isHighRisk = false;

  // 1. Protocol check
  if (protocol === 'http:') {
    warningSignals.push('Insecure connection: Uses unencrypted HTTP instead of HTTPS.');
    technicalIndicators.push('Cleartext HTTP protocol vulnerable to man-in-the-middle interception.');
  }

  // 2. IP address as host
  const isIpAddress = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIpAddress) {
    isHighRisk = true;
    warningSignals.push('Direct IP address used as hostname instead of a registered domain.');
    evidence.push(`Hostname is raw IP: ${hostname}`);
    technicalIndicators.push('Raw IPv4 host — standard evasion technique for temporary phishing infrastructure.');
  }

  // 3. Punycode / Homograph check
  if (hostname.startsWith('xn--') || hostname.includes('.xn--')) {
    isHighRisk = true;
    warningSignals.push('Punycode domain detected (potential IDN homograph attack pretending to be another brand).');
    evidence.push(`Punycode representation: ${hostname}`);
    technicalIndicators.push('Internationalized Domain Name (IDN) homograph deception vector.');
  }

  // 4. Suspicious TLD check
  const parts = hostname.split('.');
  const tld = parts[parts.length - 1];
  if (SUSPICIOUS_TLDS.has(tld)) {
    isHighRisk = true;
    warningSignals.push(`Abused Top-Level Domain (TLD) detected: .${tld}`);
    evidence.push(`Domain ends with high-risk TLD: .${tld}`);
    technicalIndicators.push(`Historically high spam/phishing abuse rate on .${tld} registry.`);
  }

  // 5. URL Shortener check
  if (SHORTENERS.has(hostname)) {
    warningSignals.push('URL shortener used: Obscures the true destination server.');
    evidence.push(`Redirect service detected: ${hostname}`);
    technicalIndicators.push('HTTP 301/302 masking service commonly used to evade SMS security filters.');
  }

  // 6. Brand impersonation & Typosquatting
  let impersonatedBrand: string | null = null;
  for (const brand of BRAND_TARGETS) {
    const isBrandKeywordPresent = brand.keywords.some((kw) => hostname.includes(kw) || pathname.includes(kw));
    const isOfficialDomain = hostname === brand.official || hostname.endsWith('.' + brand.official);

    if (isBrandKeywordPresent && !isOfficialDomain) {
      isHighRisk = true;
      impersonatedBrand = brand.name;
      warningSignals.push(`Potential Brand Impersonation: Mentions "${brand.name}" but domain is NOT official "${brand.official}".`);
      evidence.push(`Host "${hostname}" matches keyword of "${brand.name}" without belonging to "${brand.official}"`);
      technicalIndicators.push(`Domain spoofing / Typosquatting signature targeting ${brand.name}.`);
      break;
    }
  }

  // 7. Sensitive path keywords
  const sensitivePaths = ['login', 'verify', 'kyc', 'netbanking', 'claim', 'reset-password', 'update-pan', 'apk', 'reward'];
  const matchedPath = sensitivePaths.find((p) => pathname.includes(p) || parsed.search.includes(p));
  if (matchedPath) {
    warningSignals.push(`Sensitive action path keyword detected in URL: "${matchedPath}".`);
    technicalIndicators.push(`Credential harvesting or malicious payload path signature: "/${matchedPath}".`);
  }

  // 8. Excessive subdomains
  if (parts.length >= 4 && !hostname.endsWith('.co.in') && !hostname.endsWith('.gov.in')) {
    warningSignals.push('Excessive subdomain depth: Commonly used to camouflage malicious domains on mobile screens.');
    technicalIndicators.push(`Subdomain depth count: ${parts.length} segments.`);
  }

  // Formulate final recommendations
  if (isHighRisk || impersonatedBrand) {
    recommendedActions.push(
      'Do not visit this website.',
      'If you already entered passwords, change them immediately from your official banking portal.',
      'Report this URL to the official brand or National Cyber Crime Reporting Portal (1930 / cybercrime.gov.in).'
    );

    return {
      parsedUrl: {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        search: parsed.search,
      },
      analysis: {
        risk_level: 'HIGH',
        category: impersonatedBrand ? `Phishing / ${impersonatedBrand} Impersonation` : 'High-Risk Malicious Link',
        summary: `High-risk URL flagged: Multiple deceptive indicators detected on domain "${hostname}".`,
        warning_signals: Array.from(new Set(warningSignals)),
        evidence: Array.from(new Set(evidence)),
        recommended_actions: recommendedActions,
        do_not_do: doNotDo,
        technical_indicators: Array.from(new Set(technicalIndicators)),
        confidence: 'HIGH',
        limitations: 'Heuristic structural evaluation without rendering the target in the client browser.',
        language,
      },
    };
  }

  if (warningSignals.length > 0) {
    recommendedActions.push(
      'Exercise caution before entering any personal information.',
      'Confirm the domain belongs to the intended company before logging in.'
    );

    return {
      parsedUrl: {
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        pathname: parsed.pathname,
        search: parsed.search,
      },
      analysis: {
        risk_level: 'CAUTION',
        category: 'Unverified Domain with Risk Indicators',
        summary: `Caution advised: The URL on domain "${hostname}" has attributes commonly observed in untrusted links.`,
        warning_signals: Array.from(new Set(warningSignals)),
        evidence: Array.from(new Set(evidence)),
        recommended_actions: recommendedActions,
        do_not_do: doNotDo,
        technical_indicators: Array.from(new Set(technicalIndicators)),
        confidence: 'MEDIUM',
        limitations: 'Domain reputation and DNS age require live authoritative query.',
        language,
      },
    };
  }

  // Low risk
  return {
    parsedUrl: {
      protocol: parsed.protocol,
      hostname: parsed.hostname,
      pathname: parsed.pathname,
      search: parsed.search,
    },
    analysis: {
      risk_level: 'LOW',
      category: 'Standard Web Domain',
      summary: `No high-risk spoofing or deception indicators detected for "${hostname}".`,
      warning_signals: ['Always ensure the address bar matches the intended service before logging in.'],
      evidence: [`Domain "${hostname}" uses HTTPS and standard registry conventions.`],
      recommended_actions: [
        'Proceed with normal web hygiene.',
        'Never enter credentials on pages arrived at through unsolicited messages.',
      ],
      do_not_do: ['Do not reuse master passwords on external websites.'],
      technical_indicators: ['Standard TLS/HTTPS structure', 'No blacklisted TLDs or IP hostnames'],
      confidence: 'MEDIUM',
      limitations: 'AI risk indicator — not a guarantee. Even legitimate websites can be temporarily compromised.',
      language,
    },
  };
}
