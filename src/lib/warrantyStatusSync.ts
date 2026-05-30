import pool from "@/lib/db";
import { todayDateOnly } from "@/lib/dateOnly";
import { computeWarrantyStatus, type WarrantyStatus } from "@/lib/warrantyStatus";

/** Server-only: sync every row in DB so list/check endpoints return up-to-date status. */
export async function syncAllWarrantyStatuses() {
    const today = todayDateOnly();
    await pool.query(`UPDATE warranties SET status = IF(expiry_date >= ?, 'active', 'expired')`, [today]);
}

/** Server-only: sync a single warranty row if stored status is stale. */
export async function syncWarrantyStatusById(id: number, expiryDate: unknown): Promise<WarrantyStatus> {
    const status = computeWarrantyStatus(expiryDate);
    await pool.query(`UPDATE warranties SET status = ? WHERE id = ?`, [status, id]);
    return status;
}
