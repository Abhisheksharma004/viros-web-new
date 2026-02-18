import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const isAdmin = searchParams.get('admin') === 'true';

        let query = 'SELECT * FROM testimonials ';
        if (!isAdmin) {
            query += "WHERE status = 'Approved' ";
        }
        query += 'ORDER BY display_order ASC, created_at DESC';

        const [rows] = await pool.query(query);
        return NextResponse.json(rows);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, role, company, content, rating, display_order, status } = body;

        const [result]: any = await pool.query(
            'INSERT INTO testimonials (name, role, company, content, rating, display_order, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, role, company, content, rating || 5, display_order || 0, status || 'Pending']
        );

        revalidatePath('/');
        return NextResponse.json({ id: result.insertId, message: 'Testimonial created successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
