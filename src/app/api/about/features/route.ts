import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM about_features ORDER BY display_order ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching about features:', error);
        return NextResponse.json(
            { message: 'Failed to fetch about features', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, icon, display_order } = body;

        const [result]: any = await pool.query(
            'INSERT INTO about_features (title, description, icon, display_order) VALUES (?, ?, ?, ?)',
            [title, description, icon, display_order || 0]
        );

        return NextResponse.json({ message: 'Feature created successfully', id: result.insertId }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating about feature:', error);
        return NextResponse.json(
            { message: 'Failed to create about feature', error: error.message },
            { status: 500 }
        );
    }
}
