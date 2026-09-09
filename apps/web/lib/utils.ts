import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatCurrency(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "—";
  return Number(value).toLocaleString(undefined, { style: "currency", currency: "PHP" });
}
