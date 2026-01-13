import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// POST - Check warranty status by serial number (for public warranty checker)
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { serial_number } = body;

        if (!serial_number) {
            return NextResponse.json(
                { message: 'Serial number is required' },
                { status: 400 }
            );
        }

        const [rows]: any = await pool.query(
            'SELECT * FROM warranties WHERE serial_number = ? AND is_active = TRUE LIMIT 1',
            [serial_number.trim()]
        );

        if (rows.length === 0) {
            return NextResponse.json(
                { message: 'Warranty not found' },
                { status: 404 }
            );
        }

        const warranty = rows[0];

        // Format the response to match the expected structure
        const response = {
            status: warranty.status,
            product: warranty.product_name,
            expiry: new Date(warranty.expiry_date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            type: warranty.warranty_type
        };

        return NextResponse.json(response);
    } catch (error: any) {
        console.error('Error checking warranty:', error);
        return NextResponse.json(
            { message: 'Failed to check warranty', error: error.message },
            { status: 500 }
        );
    }
}
