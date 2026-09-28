import { PasswordStrengthInfo } from '@/types/auth';

/**
 * Client-Side End-to-End Encryption Utility
 * Uses Web Cryptography API (AES-256-GCM + PBKDF2)
 * All encryption and decryption occurs strictly in-browser memory.
 * Encryption passphrases are NEVER stored or transmitted to any server.
 */

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export async function encryptPrivateText(
  plaintext: string,
  passphrase: string
): Promise<{ cipherText: string; iv: string; salt: string }> {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Cryptography API is not supported in this browser.');
  }

  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    aesKey,
    encoder.encode(plaintext)
  );

  return {
    cipherText: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv.buffer),
    salt: bufferToBase64(salt.buffer),
  };
}

export async function decryptPrivateText(
  cipherText: string,
  iv: string,
  salt: string,
  passphrase: string
): Promise<string> {
  if (!window.crypto || !window.crypto.subtle) {
    throw new Error('Web Cryptography API is not supported in this browser.');
  }

  const saltBuffer = base64ToBuffer(salt);
  const ivBuffer = base64ToBuffer(iv);
  const cipherBuffer = base64ToBuffer(cipherText);

  const encoder = new TextEncoder();
  const passwordKey = await window.crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  const aesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: saltBuffer,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['decrypt']
  );

  try {
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer,
      },
      aesKey,
      cipherBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch {
    throw new Error('Decryption failed. Incorrect passphrase or corrupted data.');
  }
}

export const encryptDataWithPassphrase = encryptPrivateText;
export async function decryptDataWithPassphrase(
  cipherText: string,
  passphrase: string,
  iv: string,
  salt: string
): Promise<string> {
  return decryptPrivateText(cipherText, iv, salt, passphrase);
}

/**
 * Strong Password Policy Validator
 * Minimum 12 characters, uppercase, lowercase, numbers, and symbols
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthInfo {
  const meetsLength = password.length >= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  const feedback: string[] = [];
  if (!meetsLength) feedback.push('At least 12 characters required');
  if (!hasUppercase) feedback.push('Add uppercase letters (A-Z)');
  if (!hasLowercase) feedback.push('Add lowercase letters (a-z)');
  if (!hasNumber) feedback.push('Add numbers (0-9)');
  if (!hasSpecial) feedback.push('Add special characters (!@#$%^&*)');

  let criteriaCount = 0;
  if (meetsLength) criteriaCount++;
  if (hasUppercase && hasLowercase) criteriaCount++;
  if (hasNumber) criteriaCount++;
  if (hasSpecial) criteriaCount++;
  if (password.length >= 16) criteriaCount++;

  let score = 0;
  let label: PasswordStrengthInfo['label'] = 'Very Weak';

  if (criteriaCount <= 1) {
    score = 1;
    label = 'Weak';
  } else if (criteriaCount === 2 || criteriaCount === 3) {
    score = 2;
    label = 'Fair';
  } else if (criteriaCount === 4) {
    score = 3;
    label = 'Strong';
  } else if (criteriaCount >= 5) {
    score = 4;
    label = 'Very Strong';
  }

  return {
    score,
    label,
    meetsLength,
    hasUppercase,
    hasLowercase,
    hasNumber,
    hasSpecial,
    feedback,
  };
}

export function generateBackupRecoveryCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const part1 = Math.random().toString(36).substring(2, 6).toUpperCase();
    const part2 = Math.random().toString(36).substring(2, 6).toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}
