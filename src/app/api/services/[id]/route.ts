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
        const body = await request.json();
        const { title, slug, status, description, long_description, image_url, icon_name, gradient, features, benefits, specifications, process, faqs, brands, products, useCases } = body;

        if (!title || !slug) {
            return NextResponse.json(
                { message: 'Title and Slug are required' },
                { status: 400 }
            );
        }

        const [result]: any = await pool.query(
            `UPDATE services SET 
                title = ?, 
                slug = ?,
                status = ?, 
                description = ?,
                long_description = ?,
                image_url = ?,
                icon_name = ?,
                gradient = ?,
                features = ?,
                benefits = ?,
                specifications = ?,
                process = ?,
                faqs = ?,
                brands = ?,
                products = ?,
                useCases = ?
            WHERE id = ?`,
            [
                title,
                slug,
                status,
                description,
                long_description,
                image_url,
                icon_name,
                gradient,
                JSON.stringify(features),
                JSON.stringify(benefits),
                JSON.stringify(specifications),
                JSON.stringify(process),
                JSON.stringify(faqs),
                JSON.stringify(brands || []),
                JSON.stringify(products || []),
                JSON.stringify(useCases || []),
                id
            ]
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
