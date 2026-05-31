import pool from "@/lib/db";
import type { RowDataPacket } from "mysql2";

const USERS_TABLE = "users";

export type AdminUserRow = RowDataPacket & {
    id: number;
    email: string;
    password?: string;
    name?: string | null;
};

let ensureNameColumnPromise: Promise<void> | null = null;

async function getUsersTableColumns(): Promise<Set<string>> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ?`,
        [USERS_TABLE],
    );
    return new Set(rows.map((r) => String(r.COLUMN_NAME)));
}

export async function ensureUsersNameColumn(): Promise<void> {
    if (!ensureNameColumnPromise) {
        ensureNameColumnPromise = (async () => {
            const columns = await getUsersTableColumns();
            if (!columns.has("name")) {
                await pool.query(
                    `ALTER TABLE ${USERS_TABLE} ADD COLUMN name VARCHAR(255) NULL AFTER email`,
                );
            }
        })().catch((error) => {
            ensureNameColumnPromise = null;
            throw error;
        });
    }
    await ensureNameColumnPromise;
}

/** Fallback when users.name is empty — derive from email local part. */
export function displayNameFromAdminEmail(email: string): string {
    const trimmed = email.trim();
    if (!trimmed) return "Admin";
    const local = trimmed.split("@")[0] ?? trimmed;
    const words = local.replace(/[._-]+/g, " ").trim();
    if (!words) return trimmed;
    return words.replace(/\b\w/g, (c) => c.toUpperCase());
}

export function resolveAdminDisplayName(user: {
    name?: string | null;
    email: string;
}): string {
    const trimmed = typeof user.name === "string" ? user.name.trim() : "";
    if (trimmed) return trimmed;
    return displayNameFromAdminEmail(user.email);
}

export async function getAdminUserById(id: number): Promise<AdminUserRow | null> {
    await ensureUsersNameColumn();
    const [rows] = await pool.query<AdminUserRow[]>(
        `SELECT id, email, name FROM ${USERS_TABLE} WHERE id = ? LIMIT 1`,
        [id],
    );
    return rows[0] ?? null;
}

export async function getAdminUserByEmail(email: string): Promise<AdminUserRow | null> {
    await ensureUsersNameColumn();
    const [rows] = await pool.query<AdminUserRow[]>(
        `SELECT id, email, name FROM ${USERS_TABLE} WHERE email = ? LIMIT 1`,
        [email.trim()],
    );
    return rows[0] ?? null;
}

export async function updateAdminUserName(id: number, name: string): Promise<boolean> {
    await ensureUsersNameColumn();
    const trimmed = name.trim();
    if (!trimmed) return false;
    const [result] = await pool.query(
        `UPDATE ${USERS_TABLE} SET name = ? WHERE id = ?`,
        [trimmed, id],
    );
    return (result as { affectedRows?: number }).affectedRows !== 0;
}
