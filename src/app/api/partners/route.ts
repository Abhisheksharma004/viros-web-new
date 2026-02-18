import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows] = await pool.query('SELECT * FROM partners ORDER BY display_order ASC, created_at DESC');
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, logo_url, category, display_order, is_active } = body;

        const [result]: any = await pool.query(
            'INSERT INTO partners (name, logo_url, category, display_order, is_active) VALUES (?, ?, ?, ?, ?)',
            [name, logo_url, category, display_order || 0, is_active !== undefined ? is_active : true]
        );

        revalidatePath('/');
        return NextResponse.json({ id: result.insertId, message: 'Partner created successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
