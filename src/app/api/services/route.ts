import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching services:', error);
        return NextResponse.json(
            { message: 'Failed to fetch services', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { title, status, description } = await request.json();

        if (!title) {
            return NextResponse.json(
                { message: 'Title is required' },
                { status: 400 }
            );
        }

        const [result]: any = await pool.query(
            'INSERT INTO services (title, status, description) VALUES (?, ?, ?)',
            [title, status || 'Active', description || '']
        );

        return NextResponse.json(
            { message: 'Service created successfully', id: result.insertId },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating service:', error);
        return NextResponse.json(
            { message: 'Failed to create service', error: error.message },
            { status: 500 }
        );
    }
}
