import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { year, title, description, icon, display_order } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (year !== undefined) { updates.push('year = ?'); values.push(year); }
        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

        if (updates.length === 0) {
            return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
        }

        values.push(id);
        const query = `UPDATE about_milestones SET ${updates.join(', ')} WHERE id = ?`;

        const [result]: any = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Milestone not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Milestone updated successfully' });
    } catch (error: any) {
        console.error('Error updating about milestone:', error);
        return NextResponse.json(
            { message: 'Failed to update about milestone', error: error.message },
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
        const [result]: any = await pool.query('DELETE FROM about_milestones WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Milestone not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Milestone deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting about milestone:', error);
        return NextResponse.json(
            { message: 'Failed to delete about milestone', error: error.message },
            { status: 500 }
        );
    }
}
