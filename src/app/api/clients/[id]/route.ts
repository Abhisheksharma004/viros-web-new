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
        const { name, logo_url, display_order, is_active } = body;

        await pool.query(
            'UPDATE clients SET name = ?, logo_url = ?, display_order = ?, is_active = ? WHERE id = ?',
            [name, logo_url, display_order, is_active, id]
        );

        revalidatePath('/');
        return NextResponse.json({ message: 'Client updated successfully' });
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
        await pool.query('DELETE FROM clients WHERE id = ?', [id]);
        revalidatePath('/');
        return NextResponse.json({ message: 'Client deleted successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
