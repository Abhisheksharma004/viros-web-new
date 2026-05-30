import { toDateOnlyString, todayDateOnly } from "@/lib/dateOnly";

export type WarrantyStatus = "active" | "expired";

/** Compare calendar dates only (YYYY-MM-DD) — avoids timezone day-shift bugs. Safe for client components. */
export function computeWarrantyStatus(
    expiryDate: unknown,
    today: string = todayDateOnly(),
): WarrantyStatus {
    const expiry = toDateOnlyString(expiryDate);
    if (!expiry) return "expired";
    return expiry >= today ? "active" : "expired";
}

/** Days until expiry; negative means expired (by calendar day). */
export function daysUntilWarrantyExpiry(expiryDate: unknown, today: string = todayDateOnly()): number | null {
    const expiry = toDateOnlyString(expiryDate);
    if (!expiry) return null;
    const exp = new Date(`${expiry}T12:00:00`);
    const now = new Date(`${today}T12:00:00`);
    if (Number.isNaN(exp.getTime()) || Number.isNaN(now.getTime())) return null;
    const msPerDay = 24 * 60 * 60 * 1000;
    return Math.round((exp.getTime() - now.getTime()) / msPerDay);
}

export function warrantyExpiryLabel(expiryDate: unknown, today: string = todayDateOnly()): string {
    const days = daysUntilWarrantyExpiry(expiryDate, today);
    if (days === null) return "";
    if (days < 0) return `Expired ${Math.abs(days)} day(s) ago`;
    if (days === 0) return "Expires today";
    if (days === 1) return "Expires tomorrow";
    if (days <= 30) return `${days} day(s) left`;
    return "";
}
