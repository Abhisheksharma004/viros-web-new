
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch contact content
export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM contact_page_content WHERE id = 1');

        if (rows.length === 0) {
            return NextResponse.json({});
        }

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        console.error('Error fetching contact content:', error);
        return NextResponse.json(
            { message: 'Failed to fetch contact content', error: error.message },
            { status: 500 }
        );
    }
}

// PUT - Update contact content
export async function PUT(request: Request) {
    try {
        const body = await request.json();

        // Remove id and updated_at from body if present
        const { id, updated_at, ...updateData } = body;

        const keys = Object.keys(updateData);
        if (keys.length === 0) {
            return NextResponse.json({ message: 'No data to update' }, { status: 400 });
        }

        const setClause = keys.map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData), 1]; // 1 is the ID

        await pool.query(
            `UPDATE contact_page_content SET ${setClause} WHERE id = ?`,
            values
        );

        const [updated]: any = await pool.query('SELECT * FROM contact_page_content WHERE id = 1');

        return NextResponse.json(updated[0]);
    } catch (error: any) {
        console.error('Error updating contact content:', error);
        return NextResponse.json(
            { message: 'Failed to update contact content', error: error.message },
            { status: 500 }
        );
    }
}
