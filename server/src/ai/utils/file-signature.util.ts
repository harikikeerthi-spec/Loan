/**
 * Magic Number File Signature Verification Utility
 * Validates binary byte headers of uploaded document files (PDF, PNG, JPEG)
 * to prevent spoofed extensions or malicious file uploads.
 */

export interface FileSignatureResult {
  isValid: boolean;
  detectedMime: string;
  error?: string;
}

export function validateFileSignature(
  buffer: Buffer,
  declaredMimeType?: string,
): FileSignatureResult {
  if (!buffer || buffer.length < 4) {
    return {
      isValid: false,
      detectedMime: 'unknown',
      error: 'File buffer is corrupt or empty.',
    };
  }

  // Check PDF signature: %PDF (0x25 0x50 0x44 0x46)
  if (
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    if (declaredMimeType && declaredMimeType.toLowerCase() !== 'application/pdf') {
      return {
        isValid: false,
        detectedMime: 'application/pdf',
        error: `File header is a PDF, but declared MIME type is ${declaredMimeType}.`,
      };
    }
    return { isValid: true, detectedMime: 'application/pdf' };
  }

  // Check PNG signature: 0x89 0x50 0x4E 0x47 0x0D 0x0A 0x1A 0x0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4E &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0D &&
    buffer[5] === 0x0A &&
    buffer[6] === 0x1A &&
    buffer[7] === 0x0A
  ) {
    if (declaredMimeType && declaredMimeType.toLowerCase() !== 'image/png') {
      return {
        isValid: false,
        detectedMime: 'image/png',
        error: `File header is a PNG image, but declared MIME type is ${declaredMimeType}.`,
      };
    }
    return { isValid: true, detectedMime: 'image/png' };
  }

  // Check JPEG / JPG signature: 0xFF 0xD8 0xFF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    if (
      declaredMimeType &&
      !['image/jpeg', 'image/jpg', 'image/pjpeg'].includes(declaredMimeType.toLowerCase())
    ) {
      return {
        isValid: false,
        detectedMime: 'image/jpeg',
        error: `File header is a JPEG image, but declared MIME type is ${declaredMimeType}.`,
      };
    }
    return { isValid: true, detectedMime: 'image/jpeg' };
  }

  return {
    isValid: false,
    detectedMime: 'unknown',
    error:
      'Unsupported file format: File header does not match any authorized PDF, PNG, or JPEG signature.',
  };
}
