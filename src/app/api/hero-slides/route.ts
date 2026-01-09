import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM hero_slides ORDER BY display_order ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching hero slides:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const { title, subtitle, description, image, cta, cta_secondary, display_order, is_active } = await request.json();

        if (!title || !subtitle || !description || !image) {
            return NextResponse.json(
                { message: 'Required fields are missing' },
                { status: 400 }
            );
        }

        const [result]: any = await pool.query(
            'INSERT INTO hero_slides (title, subtitle, description, image, cta, cta_secondary, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [title, subtitle, description, image, cta, cta_secondary, display_order || 0, is_active ?? true]
        );

        return NextResponse.json(
            { message: 'Slide created successfully', id: result.insertId },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating hero slide:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}
