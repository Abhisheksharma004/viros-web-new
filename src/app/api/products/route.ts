import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching products:', error);
        return NextResponse.json(
            { message: 'Failed to fetch products', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, slug, category, description, tagline, image_url, theme_color, specs, is_featured, price_display, stock_status } = body;

        if (!name || !slug || !category) {
            return NextResponse.json(
                { message: 'Name, Slug, and Category are required' },
                { status: 400 }
            );
        }

        const [result]: any = await pool.query(
            `INSERT INTO products 
            (name, slug, category, description, tagline, image_url, theme_color, specs, is_featured, price_display, stock_status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                slug,
                category,
                description || '',
                tagline || '',
                image_url || '',
                theme_color || 'from-[#06124f] to-[#06b6d4]',
                JSON.stringify(specs || []),
                is_featured ? 1 : 0,
                price_display || '',
                stock_status || 'In Stock'
            ]
        );

        return NextResponse.json(
            { message: 'Product created successfully', id: result.insertId },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating product:', error);
        return NextResponse.json(
            { message: 'Failed to create product', error: error.message },
            { status: 500 }
        );
    }
}
