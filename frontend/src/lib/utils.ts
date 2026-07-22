import { differenceInMonths, format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(iso: string): string {
  return format(new Date(iso), "h:mm a");
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(iso: string): string {
  return format(new Date(iso), "h:mm a, MMM d");
}

export function timeAgo(iso: string): string {
  return formatDistanceToNow(new Date(iso), { addSuffix: true });
}

export function formatMl(ml: number): string {
  return `${ml % 1 === 0 ? ml : ml.toFixed(1)} ml`;
}

export function wastePercent(prepared: number, fed: number): string {
  if (prepared === 0) return "0%";
  return `${(((prepared - fed) / prepared) * 100).toFixed(0)}%`;
}

export function formatShortDate(iso: string): string {
  return format(new Date(iso), "MMM d, yyyy");
}

export function formatBabyAge(dateOfBirth: string): string {
  const months = Math.max(0, differenceInMonths(new Date(), new Date(dateOfBirth)));
  if (months < 1) return "Newborn";
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years < 1) return `${months} month${months === 1 ? "" : "s"} old`;
  return remMonths === 0 ? `${years} yr` : `${years} yr ${remMonths} mo`;
}

export function isMonthiversary(dateOfBirth: string): boolean {
  const birth = new Date(dateOfBirth);
  const now = new Date();
  const months = differenceInMonths(now, birth);
  return months >= 1 && birth.getDate() === now.getDate();
}

export function monthiversaryLabel(dateOfBirth: string): string {
  const months = differenceInMonths(new Date(), new Date(dateOfBirth));
  const years = Math.floor(months / 12);
  const remMonths = months % 12;
  if (years < 1) return `${months}-month day!`;
  return remMonths === 0 ? `${years}-year day!` : `${months}-month day!`;
}
