import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const [rows]: any = await pool.query('SELECT * FROM products WHERE id = ?', [id]);

        if (rows.length === 0) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(rows[0]);
    } catch (error: any) {
        console.error('Error fetching product:', error);
        return NextResponse.json(
            { message: 'Failed to fetch product', error: error.message },
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
        const { name, slug, category, description, tagline, image_url, media_type, video_url, theme_color, specs, is_featured, price_display, stock_status } = body;

        if (!name || !slug || !category) {
            return NextResponse.json(
                { message: 'Name, Slug, and Category are required' },
                { status: 400 }
            );
        }

        const [result]: any = await pool.query(
            `UPDATE products SET 
                name = ?, 
                slug = ?,
                category = ?, 
                description = ?,
                tagline = ?,
                image_url = ?,
                media_type = ?,
                video_url = ?,
                theme_color = ?,
                specs = ?,
                is_featured = ?,
                price_display = ?,
                stock_status = ?
            WHERE id = ?`,
            [
                name,
                slug,
                category,
                description,
                tagline,
                image_url,
                media_type || 'image',
                video_url || null,
                theme_color,
                JSON.stringify(specs),
                is_featured ? 1 : 0,
                price_display,
                stock_status,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product updated successfully' });
    } catch (error: any) {
        console.error('Error updating product:', error);
        return NextResponse.json(
            { message: 'Failed to update product', error: error.message },
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
        const [result]: any = await pool.query('DELETE FROM products WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Product deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting product:', error);
        return NextResponse.json(
            { message: 'Failed to delete product', error: error.message },
            { status: 500 }
        );
    }
}
