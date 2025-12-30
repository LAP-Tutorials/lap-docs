import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeTimestampToDate(value: any): Date {
  if (!value) return new Date();
  if (value instanceof Date) return value;

  // Handle Firestore Timestamp
  if (value && typeof value.toDate === "function") {
    try {
      return value.toDate();
    } catch (e) {
      console.error("Error converting timestamp to date:", e);
      return new Date();
    }
  }

  // Handle Strings and Numbers
  if (typeof value === "string" || typeof value === "number") {
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
  }

  return new Date();
}
