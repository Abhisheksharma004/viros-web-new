import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET single birthday
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const [rows]: any = await pool.query(
            'SELECT * FROM birthdays WHERE id = ?',
            [resolvedParams.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Birthday not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Error fetching birthday:', error);
        return NextResponse.json({ error: 'Failed to fetch birthday' }, { status: 500 });
    }
}

// PUT update birthday
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const body = await request.json();
        const { name, date, phone, email, notes, is_active } = body;

        await pool.query(
            `UPDATE birthdays 
             SET name = ?, date = ?, phone = ?, email = ?, notes = ?, 
                 is_active = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE id = ?`,
            [name, date, phone || null, email || null, notes || null, is_active ?? true, resolvedParams.id]
        );

        // Fetch the updated record
        const [rows]: any = await pool.query(
            'SELECT * FROM birthdays WHERE id = ?',
            [resolvedParams.id]
        );

        if (rows.length === 0) {
            return NextResponse.json({ error: 'Birthday not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error) {
        console.error('Error updating birthday:', error);
        return NextResponse.json({ error: 'Failed to update birthday' }, { status: 500 });
    }
}

// DELETE birthday
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> | { id: string } }
) {
    try {
        const resolvedParams = await Promise.resolve(params);
        const [result]: any = await pool.query(
            'DELETE FROM birthdays WHERE id = ?',
            [resolvedParams.id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ error: 'Birthday not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Birthday deleted successfully' });
    } catch (error) {
        console.error('Error deleting birthday:', error);
        return NextResponse.json({ error: 'Failed to delete birthday' }, { status: 500 });
    }
}
