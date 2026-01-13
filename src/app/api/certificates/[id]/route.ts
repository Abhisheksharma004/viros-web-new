import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT - Update certificate
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, issuer, year, image_url, description, display_order, is_active } = body;

        // Check if certificate exists
        const [existing]: any = await pool.query(
            'SELECT id FROM certificates WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return NextResponse.json(
                { message: 'Certificate not found' },
                { status: 404 }
            );
        }

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (issuer !== undefined) { updates.push('issuer = ?'); values.push(issuer); }
        if (year !== undefined) { updates.push('year = ?'); values.push(year); }
        if (image_url !== undefined) { updates.push('image_url = ?'); values.push(image_url); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

        if (updates.length > 0) {
            values.push(id);
            await pool.query(
                `UPDATE certificates SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        const [updated]: any = await pool.query(
            'SELECT * FROM certificates WHERE id = ?',
            [id]
        );

        return NextResponse.json(updated[0]);
    } catch (error: any) {
        console.error('Error updating certificate:', error);
        return NextResponse.json(
            { message: 'Failed to update certificate', error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete certificate
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        const [result]: any = await pool.query(
            'DELETE FROM certificates WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { message: 'Certificate not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Certificate deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting certificate:', error);
        return NextResponse.json(
            { message: 'Failed to delete certificate', error: error.message },
            { status: 500 }
        );
    }
}
