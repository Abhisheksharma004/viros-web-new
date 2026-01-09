import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM services ORDER BY created_at DESC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching services:', error);
        return NextResponse.json(
            { message: 'Failed to fetch services', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, slug, status, description, long_description, image_url, icon_name, gradient, features, benefits, specifications, process, faqs, brands, products, useCases } = body;

        if (!title || !slug) {
            return NextResponse.json(
                { message: 'Title and Slug are required' },
                { status: 400 }
            );
        }

        const [result]: any = await pool.query(
            `INSERT INTO services 
            (title, slug, status, description, long_description, image_url, icon_name, gradient, features, benefits, specifications, process, faqs, brands, products, useCases) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                title,
                slug,
                status || 'Active',
                description || '',
                long_description || '',
                image_url || '',
                icon_name || 'Printer',
                gradient || 'from-[#06b6d4] to-[#06124f]',
                JSON.stringify(features || []),
                JSON.stringify(benefits || []),
                JSON.stringify(specifications || []),
                JSON.stringify(process || []),
                JSON.stringify(faqs || []),
                JSON.stringify(brands || []),
                JSON.stringify(products || []),
                JSON.stringify(useCases || [])
            ]
        );

        return NextResponse.json(
            { message: 'Service created successfully', id: result.insertId },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error creating service:', error);
        return NextResponse.json(
            { message: 'Failed to create service', error: error.message },
            { status: 500 }
        );
    }
}
