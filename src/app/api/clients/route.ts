import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows] = await pool.query('SELECT * FROM clients ORDER BY display_order ASC, created_at DESC');
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, logo_url, display_order, is_active } = body;

        const [result]: any = await pool.query(
            'INSERT INTO clients (name, logo_url, display_order, is_active) VALUES (?, ?, ?, ?)',
            [name, logo_url, display_order || 0, is_active !== undefined ? is_active : true]
        );

        return NextResponse.json({ id: result.insertId, message: 'Client created successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
