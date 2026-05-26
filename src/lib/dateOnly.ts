/** India Standard Time — used for attendance and business-day defaults. */
export const IST_TIMEZONE = "Asia/Kolkata";

/** Format a Date as YYYY-MM-DD using the local calendar (avoids UTC day shift from toISOString). */
export function formatDateOnly(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
}

/** Format a Date as YYYY-MM-DD in a specific IANA timezone. */
export function formatDateOnlyInTimeZone(date: Date, timeZone: string): string {
    const formatter = new Intl.DateTimeFormat("en-GB", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const parts = formatter.formatToParts(date);
    const get = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((p) => p.type === type)?.value ?? "00";
    return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Today's calendar date (defaults to IST for this app). */
export function todayDateOnly(timeZone: string = IST_TIMEZONE): string {
    return formatDateOnlyInTimeZone(new Date(), timeZone);
}

/** Normalize DB/API date values to YYYY-MM-DD without shifting the calendar day. */
export function toDateOnlyString(value: unknown): string {
    if (value === undefined || value === null) return "";
    if (value instanceof Date) return formatDateOnly(value);
    const s = String(value).trim();
    const match = /^(\d{4}-\d{2}-\d{2})/.exec(s);
    if (match) return match[1];
    return s;
}
