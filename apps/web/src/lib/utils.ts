import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getLocale(): string {
  if (typeof document === "undefined") return "en-US";
  const cookie = document.cookie.split("; ").find((c) => c.startsWith("locale="));
  const loc = cookie?.split("=")[1];
  return loc === "es" ? "es-ES" : "en-US";
}

export function fmt(amount: number, currency = "USD") {
  return new Intl.NumberFormat(getLocale(), {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function fmtDate(date: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString(getLocale(), {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...opts,
  });
}

export function today() {
  return new Date().toISOString().split("T")[0];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
