export function optText(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    const s = typeof value === "string" ? value.trim() : String(value).trim();
    return s === "" ? null : s;
}

export function optDate(value: unknown): string | null {
    if (value === undefined || value === null) return null;
    const s = typeof value === "string" ? value.trim() : String(value).trim();
    if (!s) return null;
    const iso = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (!iso) return null;
    const d = new Date(`${iso[1]}T12:00:00`);
    if (Number.isNaN(d.getTime())) return null;
    return iso[1];
}
