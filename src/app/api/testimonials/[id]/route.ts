import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import pool from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, role, company, content, rating, status, display_order } = body;

        await pool.query(
            'UPDATE testimonials SET name = ?, role = ?, company = ?, content = ?, rating = ?, status = ?, display_order = ? WHERE id = ?',
            [name, role, company, content, rating, status, display_order, id]
        );

        revalidatePath('/');
        return NextResponse.json({ message: 'Testimonial updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await pool.query('DELETE FROM testimonials WHERE id = ?', [id]);
        revalidatePath('/');
        return NextResponse.json({ message: 'Testimonial deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
