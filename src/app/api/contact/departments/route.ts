
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all departments
export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM contact_departments ORDER BY created_at ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching departments:', error);
        return NextResponse.json(
            { message: 'Failed to fetch departments', error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create a new department
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, description, email_1, email_2, phone_1, phone_2 } = body;

        if (!title) {
            return NextResponse.json({ message: 'Title is required' }, { status: 400 });
        }

        const [result]: any = await pool.query(
            'INSERT INTO contact_departments (title, description, email_1, email_2, phone_1, phone_2) VALUES (?, ?, ?, ?, ?, ?)',
            [title, description || '', email_1 || null, email_2 || null, phone_1 || null, phone_2 || null]
        );

        return NextResponse.json({
            id: result.insertId,
            title, description, email_1, email_2, phone_1, phone_2
        }, { status: 201 });

    } catch (error: any) {
        console.error('Error creating department:', error);
        return NextResponse.json(
            { message: 'Failed to create department', error: error.message },
            { status: 500 }
        );
    }
}
