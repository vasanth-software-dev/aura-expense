const SENSITIVE_KEYS = [
  'password',
  'token',
  'accesstoken',
  'refreshtoken',
  'secret',
  'pin',
  'otp',
  'cvv',
  'cardnumber',
  'authorization',
  'cookie',
];

/**
 * Recursively masks sensitive fields from objects before logging
 */
export function sanitizeLogData(data: any): any {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') {
    if (typeof data === 'string') {
      // Mask 16-digit credit card patterns
      const maskedCard = data.replace(/\b(?:\d[ -]*?){13,16}\b/g, '••••-••••-••••-••••');
      // Mask 6-digit OTP patterns
      return maskedCard.replace(/\b\d{6}\b/g, '******');
    }
    return data;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item));
  }

  const sanitized: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_KEYS.some((sk) => lowerKey.includes(sk));

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else {
      sanitized[key] = sanitizeLogData(value);
    }
  }

  return sanitized;
}

export const logger = {
  info(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = meta ? sanitizeLogData(meta) : '';
    console.log(`[${timestamp}] [INFO] ${message}`, sanitizedMeta ? JSON.stringify(sanitizedMeta) : '');
  },

  warn(message: string, meta?: any) {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = meta ? sanitizeLogData(meta) : '';
    console.warn(`[${timestamp}] [WARN] ${message}`, sanitizedMeta ? JSON.stringify(sanitizedMeta) : '');
  },

  error(message: string, error?: any) {
    const timestamp = new Date().toISOString();
    const errObj = error instanceof Error
      ? { message: error.message, name: error.name }
      : sanitizeLogData(error);
    console.error(`[${timestamp}] [ERROR] ${message}`, JSON.stringify(errObj));
  },
};
