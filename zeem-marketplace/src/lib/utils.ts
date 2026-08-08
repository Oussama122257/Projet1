import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a price in Algerian Dinars: 12500 → "12 500 DA" */
export function formatDZD(amount: number): string {
  return `${new Intl.NumberFormat("fr-DZ", { maximumFractionDigits: 0 })
    .format(amount)
    .replace(/ | /g, " ")} DA`;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/** Human-friendly order reference: ZM-8F3K2A */
export function orderReference(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let ref = "";
  for (let i = 0; i < 6; i++) ref += chars[Math.floor(Math.random() * chars.length)];
  return `ZM-${ref}`;
}
