import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM about_milestones ORDER BY display_order ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching about milestones:', error);
        return NextResponse.json(
            { message: 'Failed to fetch about milestones', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { year, title, description, icon, display_order } = body;

        const [result]: any = await pool.query(
            'INSERT INTO about_milestones (year, title, description, icon, display_order) VALUES (?, ?, ?, ?, ?)',
            [year, title, description, icon, display_order || 0]
        );

        return NextResponse.json({ message: 'Milestone created successfully', id: result.insertId }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating about milestone:', error);
        return NextResponse.json(
            { message: 'Failed to create about milestone', error: error.message },
            { status: 500 }
        );
    }
}
