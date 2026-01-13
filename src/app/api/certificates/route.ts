import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all certificates
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const activeOnly = searchParams.get('active') === 'true';

        let query = 'SELECT * FROM certificates';
        if (activeOnly) {
            query += ' WHERE is_active = TRUE';
        }
        query += ' ORDER BY display_order ASC, created_at DESC';

        const [rows]: any = await pool.query(query);
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching certificates:', error);
        return NextResponse.json(
            { message: 'Failed to fetch certificates', error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new certificate
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { title, issuer, year, image_url, description, display_order, is_active } = body;

        // Validation
        if (!title || !issuer || !year) {
            return NextResponse.json(
                { message: 'Title, issuer, and year are required' },
                { status: 400 }
            );
        }

        const [result]: any = await pool.query(
            'INSERT INTO certificates (title, issuer, year, image_url, description, display_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [title, issuer, year, image_url || null, description || null, display_order || 0, is_active !== undefined ? is_active : true]
        );

        const [newCertificate]: any = await pool.query(
            'SELECT * FROM certificates WHERE id = ?',
            [result.insertId]
        );

        return NextResponse.json(newCertificate[0], { status: 201 });
    } catch (error: any) {
        console.error('Error creating certificate:', error);
        return NextResponse.json(
            { message: 'Failed to create certificate', error: error.message },
            { status: 500 }
        );
    }
}
