import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET - Fetch all warranties
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const serial = searchParams.get('serial');

        let query = 'SELECT * FROM warranties WHERE 1=1';
        const params: any[] = [];

        if (status) {
            query += ' AND status = ?';
            params.push(status);
        }

        if (serial) {
            query += ' AND serial_number LIKE ?';
            params.push(`%${serial}%`);
        }

        query += ' ORDER BY created_at DESC';

        const [rows]: any = await pool.query(query, params);
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching warranties:', error);
        return NextResponse.json(
            { message: 'Failed to fetch warranties', error: error.message },
            { status: 500 }
        );
    }
}

// POST - Create new warranty
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const {
            serial_number,
            product_name,
            warranty_type,
            expiry_date,
            purchase_date,
            customer_name,
            customer_email,
            customer_phone
        } = body;

        // Validation
        if (!serial_number || !product_name || !warranty_type || !expiry_date) {
            return NextResponse.json(
                { message: 'Serial number, product name, warranty type, and expiry date are required' },
                { status: 400 }
            );
        }

        // Auto-calculate status based on expiry date
        const expiryDate = new Date(expiry_date);
        const today = new Date();
        const status = expiryDate >= today ? 'active' : 'expired';

        const [result]: any = await pool.query(
            'INSERT INTO warranties (serial_number, product_name, status, warranty_type, expiry_date, purchase_date, customer_name, customer_email, customer_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [serial_number, product_name, status, warranty_type, expiry_date, purchase_date || null, customer_name || null, customer_email || null, customer_phone || null]
        );

        const [newWarranty]: any = await pool.query(
            'SELECT * FROM warranties WHERE id = ?',
            [result.insertId]
        );

        return NextResponse.json(newWarranty[0], { status: 201 });
    } catch (error: any) {
        console.error('Error creating warranty:', error);

        // Check for duplicate serial number
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                { message: 'Serial number already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: 'Failed to create warranty', error: error.message },
            { status: 500 }
        );
    }
}
