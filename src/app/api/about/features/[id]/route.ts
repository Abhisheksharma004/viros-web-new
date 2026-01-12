import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        const body = await request.json();
        const { title, description, icon, display_order } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

        if (updates.length > 0) {
            values.push(id);
            await pool.query(`UPDATE about_features SET ${updates.join(', ')} WHERE id = ?`, values);
        }

        return NextResponse.json({ message: 'Feature updated successfully' });
    } catch (error: any) {
        console.error('Error updating about feature:', error);
        return NextResponse.json(
            { message: 'Failed to update about feature', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const id = params.id;
        await pool.query('DELETE FROM about_features WHERE id = ?', [id]);
        return NextResponse.json({ message: 'Feature deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting about feature:', error);
        return NextResponse.json(
            { message: 'Failed to delete about feature', error: error.message },
            { status: 500 }
        );
    }
}
