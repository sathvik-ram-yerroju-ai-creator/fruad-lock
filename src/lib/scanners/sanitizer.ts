/**
 * Sanitizer & Privacy Guard
 * Ensures sensitive information (credit cards, PINs, OTPs) is not stored
 * or transmitted carelessly, and warns the user if they paste raw credentials.
 */

export interface SanitizationResult {
  sanitizedText: string;
  hasSensitiveData: boolean;
  warnings: string[];
}

export function sanitizeUserInput(input: string): SanitizationResult {
  const warnings: string[] = [];
  let sanitizedText = input;

  // 1. Detect and mask 15-16 digit payment card numbers (Visa, Mastercard, RuPay, Amex)
  const cardRegex = /\b(?:\d{4}[ -]?){3}\d{4}\b|\b\d{15,16}\b/g;
  if (cardRegex.test(sanitizedText)) {
    warnings.push('Redacted potential 16-digit payment card number for your safety.');
    sanitizedText = sanitizedText.replace(cardRegex, '[REDACTED_CARD_NUMBER]');
  }

  // 2. Detect 3-4 digit CVV/CVC numbers near keywords
  const cvvRegex = /\b(?:cvv|cvc|security code)[\s:=]+(\d{3,4})\b/gi;
  if (cvvRegex.test(sanitizedText)) {
    warnings.push('Redacted CVV / Card Security code.');
    sanitizedText = sanitizedText.replace(cvvRegex, '$1: [REDACTED_CVV]');
  }

  // 3. Detect 4-6 digit OTPs explicitly preceded by OTP keywords
  const otpRegex = /\b(?:otp|one time password|verification code)[\s:=]+(\d{4,8})\b/gi;
  if (otpRegex.test(sanitizedText)) {
    warnings.push('Detected potential OTP code. Never share this with anyone.');
    sanitizedText = sanitizedText.replace(otpRegex, 'OTP: [REDACTED_OTP]');
  }

  // 4. Detect passwords explicitly labeled
  const pwdRegex = /\b(?:password|passcode|pin)[\s:=]+([^\s,;]+)\b/gi;
  if (pwdRegex.test(sanitizedText)) {
    warnings.push('Redacted sensitive password or PIN pattern.');
    sanitizedText = sanitizedText.replace(pwdRegex, 'password: [REDACTED_CREDENTIAL]');
  }

  return {
    sanitizedText,
    hasSensitiveData: warnings.length > 0,
    warnings,
  };
}
