import type { RowDataPacket } from "mysql2";
import pool from "@/lib/db";

export type NewsletterStatus = "active" | "unsubscribed";

export type NewsletterSubscriptionRow = {
    id: number;
    email: string;
    status: NewsletterStatus;
    subscribed_at: string;
    unsubscribed_at: string | null;
    ip_address: string | null;
    user_agent: string | null;
};

type DbRow = RowDataPacket & {
    id: number;
    email: string;
    status: NewsletterStatus;
    subscribed_at: Date | string;
    unsubscribed_at: Date | string | null;
    ip_address: string | null;
    user_agent: string | null;
};

export type NewsletterSubscriptionFilters = {
    status?: NewsletterStatus | "all";
    query?: string;
    limit?: number;
};

function toIsoDateTime(value: Date | string | null | undefined): string | null {
    if (value == null) return null;
    if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? null : value.toISOString();
    }
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
}

function mapRow(row: DbRow): NewsletterSubscriptionRow {
    return {
        id: row.id,
        email: row.email,
        status: row.status,
        subscribed_at: toIsoDateTime(row.subscribed_at) ?? "",
        unsubscribed_at: toIsoDateTime(row.unsubscribed_at),
        ip_address: row.ip_address,
        user_agent: row.user_agent,
    };
}

export async function listNewsletterSubscriptions(
    filters?: NewsletterSubscriptionFilters,
): Promise<NewsletterSubscriptionRow[]> {
    const params: unknown[] = [];
    const where: string[] = [];

    const status = filters?.status ?? "all";
    if (status !== "all") {
        where.push("status = ?");
        params.push(status);
    }

    const query = filters?.query?.trim();
    if (query) {
        where.push("email LIKE ?");
        params.push(`%${query}%`);
    }

    const limit = Math.min(Math.max(filters?.limit ?? 500, 1), 1000);
    params.push(limit);

    const whereSql = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

    const [rows] = await pool.query<DbRow[]>(
        `SELECT id, email, status, subscribed_at, unsubscribed_at, ip_address, user_agent
         FROM newsletter_subscriptions
         ${whereSql}
         ORDER BY subscribed_at DESC, id DESC
         LIMIT ?`,
        params,
    );

    return rows.map(mapRow);
}

export async function getNewsletterSubscriptionStats(): Promise<{
    total: number;
    active: number;
    unsubscribed: number;
}> {
    const [rows] = await pool.query<RowDataPacket[]>(
        `SELECT
            COUNT(*) AS total,
            SUM(status = 'active') AS active_count,
            SUM(status = 'unsubscribed') AS unsubscribed_count
         FROM newsletter_subscriptions`,
    );

    const row = rows[0] as RowDataPacket & {
        total: number;
        active_count: number;
        unsubscribed_count: number;
    };

    return {
        total: Number(row?.total) || 0,
        active: Number(row?.active_count) || 0,
        unsubscribed: Number(row?.unsubscribed_count) || 0,
    };
}
