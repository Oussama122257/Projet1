/**
 * Algerian phone number helpers.
 * Mobile numbers: 05/06/07 + 8 digits → normalized to +2135/6/7XXXXXXXX.
 */

/** Normalize any common input format to +213XXXXXXXXX, or null if invalid. */
export function normalizeAlgerianPhone(raw: string): string | null {
  const digits = raw.replace(/[\s.\-()]/g, "");
  let national: string;
  if (/^\+213[567]\d{8}$/.test(digits)) return digits;
  if (/^00213[567]\d{8}$/.test(digits)) national = digits.slice(5);
  else if (/^213[567]\d{8}$/.test(digits)) national = digits.slice(3);
  else if (/^0[567]\d{8}$/.test(digits)) national = digits.slice(1);
  else if (/^[567]\d{8}$/.test(digits)) national = digits;
  else return null;
  return `+213${national}`;
}

/** Display format: +213550123456 → "0550 12 34 56" */
export function formatAlgerianPhone(phone: string): string {
  const n = normalizeAlgerianPhone(phone);
  if (!n) return phone;
  const local = `0${n.slice(4)}`;
  return `${local.slice(0, 4)} ${local.slice(4, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
}

export function isValidAlgerianPhone(raw: string): boolean {
  return normalizeAlgerianPhone(raw) !== null;
}
