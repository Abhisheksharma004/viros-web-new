import { NextResponse } from 'next/server';
import pool from '@/lib/db';

let isTableChecked = false;

async function ensureTableExists() {
  if (isTableChecked) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS cookie_consents (
        id INT AUTO_INCREMENT PRIMARY KEY,
        email VARCHAR(255) NULL,
        essential TINYINT(1) DEFAULT 1,
        analytics TINYINT(1) DEFAULT 0,
        functional TINYINT(1) DEFAULT 0,
        marketing TINYINT(1) DEFAULT 0,
        ip_address VARCHAR(100) NULL,
        user_agent VARCHAR(500) NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    isTableChecked = true;
  } catch (error) {
    console.error('Failed to ensure cookie_consents table:', error);
  }
}

export async function POST(request: Request) {
  try {
    await ensureTableExists();

    const body = await request.json();
    const { email, essential = true, analytics = false, functional = false, marketing = false } = body;

    const ip =
      request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';

    let cleanEmail: string | null = null;
    if (email && typeof email === 'string' && email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (emailRegex.test(email.trim())) {
        cleanEmail = email.trim().toLowerCase();
      }
    }

    // Insert into cookie_consents table
    await pool.query(
      `INSERT INTO cookie_consents (email, essential, analytics, functional, marketing, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        cleanEmail,
        essential ? 1 : 0,
        analytics ? 1 : 0,
        functional ? 1 : 0,
        marketing ? 1 : 0,
        ip,
        userAgent.substring(0, 500),
      ]
    );

    // If email provided, also store/update in newsletter_subscriptions table if exists
    if (cleanEmail) {
      try {
        const [existing]: any = await pool.query(
          'SELECT id FROM newsletter_subscriptions WHERE email = ?',
          [cleanEmail]
        );
        if (existing.length === 0) {
          await pool.query(
            'INSERT INTO newsletter_subscriptions (email, ip_address, user_agent) VALUES (?, ?, ?)',
            [cleanEmail, ip, userAgent.substring(0, 500)]
          );
        }
      } catch (err) {
        // Suppress newsletter insert error if table structured differently
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Cookie preferences and consent saved to database successfully.',
    });
  } catch (error: any) {
    console.error('Cookie consent POST error:', error);
    return NextResponse.json(
      { error: 'Failed to record cookie consent.' },
      { status: 500 }
    );
  }
}
