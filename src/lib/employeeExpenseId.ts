export const EXPENSE_ID_PREFIX = "VEX";
export const EXPENSE_SERIAL_LENGTH = 3;

/** ddmm from expense date, e.g. 2205 for 22 May */
export function getExpenseIdPeriod(expenseDate: string): string {
    const [y, m, d] = expenseDate.slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) {
        const now = new Date();
        return `${String(now.getDate()).padStart(2, "0")}${String(now.getMonth() + 1).padStart(2, "0")}`;
    }
    return `${String(d).padStart(2, "0")}${String(m).padStart(2, "0")}`;
}
