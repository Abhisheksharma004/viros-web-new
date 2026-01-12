import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM about_stats ORDER BY display_order ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching about stats:', error);
        return NextResponse.json(
            { message: 'Failed to fetch about stats', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { label, value, icon, display_order } = body;

        const [result]: any = await pool.query(
            'INSERT INTO about_stats (label, value, icon, display_order) VALUES (?, ?, ?, ?)',
            [label, value, icon, display_order || 0]
        );

        return NextResponse.json({ message: 'Stat created successfully', id: result.insertId }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating about stat:', error);
        return NextResponse.json(
            { message: 'Failed to create about stat', error: error.message },
            { status: 500 }
        );
    }
}
