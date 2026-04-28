import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { tag, tag_color, title, description, link, link_text, is_new, is_active, display_order } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (tag !== undefined) { updates.push('tag = ?'); values.push(tag); }
        if (tag_color !== undefined) { updates.push('tag_color = ?'); values.push(tag_color); }
        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (link !== undefined) { updates.push('link = ?'); values.push(link); }
        if (link_text !== undefined) { updates.push('link_text = ?'); values.push(link_text); }
        if (is_new !== undefined) { updates.push('is_new = ?'); values.push(is_new); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

        if (updates.length === 0) {
            return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
        }

        values.push(id);
        const [result]: any = await pool.query(
            `UPDATE whats_new_items SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Item updated successfully' });
    } catch (error: any) {
        console.error('Error updating whats new item:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const [result]: any = await pool.query('DELETE FROM whats_new_items WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Item not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Item deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting whats new item:', error);
        return NextResponse.json({ message: 'Internal server error', error: error.message }, { status: 500 });
    }
}
