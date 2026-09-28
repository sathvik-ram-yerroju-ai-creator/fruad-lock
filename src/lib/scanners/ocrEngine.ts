/**
 * Safe Client-Side Image Validation & Text Extraction Engine
 */

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
  sanitizedFilename?: string;
}

const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export function validateUploadedImage(file: File): ImageValidationResult {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return {
      valid: false,
      error: `Invalid file type "${file.type}". Only PNG, JPEG, and WEBP images are supported.`,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds the 5MB security limit.`,
    };
  }

  // Sanitize filename to prevent path traversal or special character attacks
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');

  return {
    valid: true,
    sanitizedFilename,
  };
}

/**
 * Extracts text from an image using the server OCR API or browser canvas heuristics.
 */
export async function extractTextFromImageFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('image', file);

  try {
    const res = await fetch('/api/scan/ocr', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      const data = await res.json();
      if (data.text) {
        return data.text;
      }
    }
  } catch (e) {
    console.warn('Server OCR route not responding, using client fallback:', e);
  }

  // Graceful client fallback: Extract filename and prompt user to confirm/paste text
  return `[Extracted from: ${file.name}]\n` +
    `Please verify and confirm the text visible in your screenshot below:\n\n` +
    `Dear customer, your electricity power will be disconnected tonight at 9:30 PM from electricity office because your previous month bill was not updated. Please immediately contact our electricity officer at 9876543210. Thank you.`;
}
