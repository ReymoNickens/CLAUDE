/**
 * Normalise a Ghanaian phone number to E.164 format (+233XXXXXXXXX).
 * Accepts: 0244123456, 244123456, +233244123456, 233244123456
 */
export function normaliseGhanaPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  if (digits.startsWith('233') && digits.length === 12) {
    return `+${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 10) {
    return `+233${digits.slice(1)}`;
  }
  if (digits.length === 9) {
    return `+233${digits}`;
  }
  throw new Error(`Cannot parse Ghana phone number: "${raw}"`);
}

/**
 * Validate a +233 E.164 phone number.
 * Ghana mobile numbers: +233 2X, 5X (9 digits after country code)
 */
export function isValidGhanaPhone(phone: string): boolean {
  return /^\+233[235]\d{8}$/.test(phone);
}

/**
 * Display format: +233 24 412 3456
 */
export function formatPhone(phone: string): string {
  const normalised = phone.startsWith('+') ? phone : `+${phone}`;
  const match = normalised.match(/^\+233(\d{2})(\d{3})(\d{4})$/);
  if (!match) return normalised;
  return `+233 ${match[1]} ${match[2]} ${match[3]}`;
}

/**
 * Build a wa.me WhatsApp deep-link URL from a +233 number.
 */
export function whatsappLink(phone: string, message?: string): string {
  const digits = phone.replace(/\D/g, '');
  const base = `https://wa.me/${digits}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}
