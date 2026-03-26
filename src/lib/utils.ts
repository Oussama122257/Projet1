import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, currency = 'DZD'): string {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'Africa/Algiers',
  }).format(new Date(date));
}

export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('213')) {
    return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
  }
  if (cleaned.startsWith('0')) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 6)} ${cleaned.slice(6)}`;
  }
  return phone;
}

export function generateTrackingUrl(trackingId: string): string {
  return `${process.env.NEXT_PUBLIC_APP_URL}/track/${trackingId}`;
}

export function validateAlgerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/\D/g, '');
  return /^(0|213|\+213)(5|6|7)\d{8}$/.test(cleaned);
}

export function getWilayaCode(wilayaId: number): string {
  return wilayaId.toString().padStart(2, '0');
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export const ORDER_STATUS_LABELS: Record<string, { fr: string; ar: string; color: string }> = {
  NEW: { fr: 'Nouveau', ar: 'جديد', color: 'bg-blue-100 text-blue-800' },
  CONFIRMED: { fr: 'Confirmé', ar: 'مؤكد', color: 'bg-green-100 text-green-800' },
  DISPATCHED: { fr: 'Expédié', ar: 'تم الإرسال', color: 'bg-purple-100 text-purple-800' },
  IN_TRANSIT: { fr: 'En transit', ar: 'في الطريق', color: 'bg-indigo-100 text-indigo-800' },
  AT_WILAYA: { fr: 'Au centre', ar: 'في المركز', color: 'bg-cyan-100 text-cyan-800' },
  OUT_FOR_DELIVERY: { fr: 'En livraison', ar: 'جاري التوصيل', color: 'bg-amber-100 text-amber-800' },
  DELIVERED: { fr: 'Livré', ar: 'تم التوصيل', color: 'bg-emerald-100 text-emerald-800' },
  RETURNED: { fr: 'Retourné', ar: 'مرتجع', color: 'bg-red-100 text-red-800' },
  CANCELLED: { fr: 'Annulé', ar: 'ملغى', color: 'bg-gray-100 text-gray-800' },
  FAILED_DELIVERY: { fr: 'Échec livraison', ar: 'فشل التوصيل', color: 'bg-orange-100 text-orange-800' },
  SCHEDULED_RETURN: { fr: 'Retour programmé', ar: 'مرتجع مبرمج', color: 'bg-rose-100 text-rose-800' },
};

export const CONFIRMATION_STATUS_LABELS: Record<string, { fr: string; color: string }> = {
  PENDING: { fr: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
  CONFIRMED: { fr: 'Confirmé', color: 'bg-green-100 text-green-800' },
  NO_ANSWER: { fr: 'Pas de réponse', color: 'bg-gray-100 text-gray-800' },
  POSTPONED: { fr: 'Reporté', color: 'bg-blue-100 text-blue-800' },
  CANCELLED: { fr: 'Annulé', color: 'bg-red-100 text-red-800' },
  DUPLICATE: { fr: 'Doublon', color: 'bg-purple-100 text-purple-800' },
};
