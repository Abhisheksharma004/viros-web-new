import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM about_core_values ORDER BY display_order ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching about values:', error);
        return NextResponse.json(
            { message: 'Failed to fetch about values', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, icon, gradient, display_order } = body;

        const [result]: any = await pool.query(
            'INSERT INTO about_core_values (title, description, icon, gradient, display_order) VALUES (?, ?, ?, ?, ?)',
            [title, description, icon, gradient, display_order || 0]
        );

        return NextResponse.json({ message: 'Core value created successfully', id: result.insertId }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating about value:', error);
        return NextResponse.json(
            { message: 'Failed to create about value', error: error.message },
            { status: 500 }
        );
    }
}
