import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query(
            'SELECT * FROM whats_new_items ORDER BY display_order ASC, created_at DESC'
        );
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching whats new items:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { tag, tag_color, title, description, link, link_text, is_new, is_active, display_order } = await request.json();

        if (!tag || !title || !description) {
            return NextResponse.json({ message: 'tag, title and description are required' }, { status: 400 });
        }

        const [result]: any = await pool.query(
            'INSERT INTO whats_new_items (tag, tag_color, title, description, link, link_text, is_new, is_active, display_order) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [tag, tag_color || '#0a2a5e', title, description, link || '/contact', link_text || 'Learn More', is_new ?? 1, is_active ?? 1, display_order || 0]
        );

        return NextResponse.json({ message: 'Item created successfully', id: result.insertId }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating whats new item:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
