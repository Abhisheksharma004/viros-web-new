import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS whats_new_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                tag VARCHAR(50) NOT NULL,
                tag_color VARCHAR(20) NOT NULL DEFAULT '#0a2a5e',
                title VARCHAR(255) NOT NULL,
                description TEXT NOT NULL,
                link VARCHAR(255) NOT NULL DEFAULT '/contact',
                link_text VARCHAR(100) NOT NULL DEFAULT 'Learn More',
                is_new TINYINT(1) NOT NULL DEFAULT 1,
                is_active TINYINT(1) NOT NULL DEFAULT 1,
                display_order INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        `);

        return NextResponse.json({ success: true, message: 'whats_new_items table created (or already exists).' });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
