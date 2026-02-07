import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRemainingTime(days: number): string {
  if (days <= 0) return "0 يوم";
  
  const months = Math.floor(days / 30);
  const remainingDays = days % 30;

  const parts = [];
  if (months > 0) {
    parts.push(`${months} ${months === 1 ? "شهر" : months === 2 ? "شهرين" : months >= 3 && months <= 10 ? "شهور" : "شهر"}`);
  }
  if (remainingDays > 0) {
    parts.push(`${remainingDays} ${remainingDays === 1 ? "يوم" : remainingDays === 2 ? "يومين" : remainingDays >= 3 && remainingDays <= 10 ? "أيام" : "يوم"}`);
  }

  return parts.join(" و ");
}
