
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT - Update a department
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { title, description, email_1, email_2, phone_1, phone_2 } = body;

        await pool.query(
            'UPDATE contact_departments SET title = ?, description = ?, email_1 = ?, email_2 = ?, phone_1 = ?, phone_2 = ? WHERE id = ?',
            [title, description, email_1, email_2, phone_1, phone_2, id]
        );

        return NextResponse.json({ message: 'Department updated successfully' });
    } catch (error: any) {
        console.error('Error updating department:', error);
        return NextResponse.json(
            { message: 'Failed to update department', error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Remove a department
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        await pool.query('DELETE FROM contact_departments WHERE id = ?', [id]);

        return NextResponse.json({ message: 'Department deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting department:', error);
        return NextResponse.json(
            { message: 'Failed to delete department', error: error.message },
            { status: 500 }
        );
    }
}
