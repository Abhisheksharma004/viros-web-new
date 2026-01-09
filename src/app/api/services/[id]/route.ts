import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const [rows]: any = await pool.query('SELECT * FROM services WHERE id = ?', [id]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        console.error('Error fetching service:', error);
        return NextResponse.json(
            { message: 'Failed to fetch service', error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { title, status, description } = await request.json();

        if (!title) {
            return NextResponse.json(
                { message: 'Title is required' },
                { status: 400 }
            );
        }

        const [result]: any = await pool.query(
            'UPDATE services SET title = ?, status = ?, description = ? WHERE id = ?',
            [title, status, description, id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Service updated successfully' });
    } catch (error: any) {
        console.error('Error updating service:', error);
        return NextResponse.json(
            { message: 'Failed to update service', error: error.message },
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
        const [result]: any = await pool.query('DELETE FROM services WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Service not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Service deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting service:', error);
        return NextResponse.json(
            { message: 'Failed to delete service', error: error.message },
            { status: 500 }
        );
    }
}
