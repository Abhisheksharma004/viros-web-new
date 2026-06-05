export const ADVANCE_ID_PREFIX = "VEAD";
export const ADVANCE_SERIAL_LENGTH = 3;
/** VEAD + mmyy (4) + serial (3) — e.g. VEAD0526001 */
export const ADVANCE_ID_PATTERN = /^VEAD\d{7}$/;
export const ADVANCE_ID_MYSQL_PATTERN = "^VEAD[0-9]{7}$";

/** mmyy from advance date, e.g. 0526 for May 2026 */
export function getAdvanceIdPeriod(advanceDate: string): string {
    const [y, m] = advanceDate.slice(0, 10).split("-").map(Number);
    if (!y || !m) {
        const now = new Date();
        const mm = String(now.getMonth() + 1).padStart(2, "0");
        const yy = String(now.getFullYear()).slice(-2);
        return `${mm}${yy}`;
    }
    const mm = String(m).padStart(2, "0");
    const yy = String(y).slice(-2);
    return `${mm}${yy}`;
}
