import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const [rows]: any = await pool.query('SELECT * FROM hero_slides WHERE id = ?', [id]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Slide not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        console.error('Error fetching hero slide:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, subtitle, description, image, media_type, video_url, cta, cta_link, cta_secondary, cta_secondary_link, display_order, is_active } = body;

        // Perform partial update based on provided fields
        const updates: string[] = [];
        const values: any[] = [];

        if (title !== undefined) { updates.push('title = ?'); values.push(title); }
        if (subtitle !== undefined) { updates.push('subtitle = ?'); values.push(subtitle); }
        if (description !== undefined) { updates.push('description = ?'); values.push(description); }
        if (image !== undefined) { updates.push('image = ?'); values.push(image); }
        if (media_type !== undefined) { updates.push('media_type = ?'); values.push(media_type); }
        if (video_url !== undefined) { updates.push('video_url = ?'); values.push(video_url); }
        if (cta !== undefined) { updates.push('cta = ?'); values.push(cta); }
        if (cta_link !== undefined) { updates.push('cta_link = ?'); values.push(cta_link); }
        if (cta_secondary !== undefined) { updates.push('cta_secondary = ?'); values.push(cta_secondary); }
        if (cta_secondary_link !== undefined) { updates.push('cta_secondary_link = ?'); values.push(cta_secondary_link); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }
        if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }

        if (updates.length === 0) {
            return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
        }

        values.push(id);
        const query = `UPDATE hero_slides SET ${updates.join(', ')} WHERE id = ?`;

        const [result]: any = await pool.query(query, values);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Slide not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Slide updated successfully' });
    } catch (error: any) {
        console.error('Error updating hero slide:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id } = await params;
        const [result]: any = await pool.query('DELETE FROM hero_slides WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Slide not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Slide deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting hero slide:', error);
        return NextResponse.json(
            { message: 'Internal server error', error: error.message },
            { status: 500 }
        );
    }
}
