import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { label, value, icon, display_order } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (label !== undefined) { updates.push('label = ?'); values.push(label); }
        if (value !== undefined) { updates.push('value = ?'); values.push(value); }
        if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

        if (updates.length === 0) {
            return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
        }

        values.push(id);
        const query = `UPDATE about_stats SET ${updates.join(', ')} WHERE id = ?`;

        const [result]: any = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Stat not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Stat updated successfully' });
    } catch (error: any) {
        console.error('Error updating about stat:', error);
        return NextResponse.json(
            { message: 'Failed to update about stat', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const [result]: any = await pool.query('DELETE FROM about_stats WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Stat not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Stat deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting about stat:', error);
        return NextResponse.json(
            { message: 'Failed to delete about stat', error: error.message },
            { status: 500 }
        );
    }
}
