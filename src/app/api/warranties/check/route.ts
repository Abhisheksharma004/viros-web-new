import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { computeWarrantyStatus } from '@/lib/warrantyStatus';
import { syncWarrantyStatusById } from '@/lib/warrantyStatusSync';
import { toDateOnlyString } from '@/lib/dateOnly';

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
        const status = computeWarrantyStatus(warranty.expiry_date);
        if (status !== warranty.status) {
            await syncWarrantyStatusById(Number(warranty.id), warranty.expiry_date);
        }

        const expiryIso = toDateOnlyString(warranty.expiry_date);
        const expiryDisplay = expiryIso
            ? new Date(`${expiryIso}T12:00:00`).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
              })
            : '';

        const response = {
            status,
            product: warranty.product_name,
            expiry: expiryDisplay,
            type: warranty.warranty_type,
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
