import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// PUT - Update warranty
export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
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

        // Check if warranty exists
        const [existing]: any = await pool.query(
            'SELECT id FROM warranties WHERE id = ?',
            [id]
        );

        if (existing.length === 0) {
            return NextResponse.json(
                { message: 'Warranty not found' },
                { status: 404 }
            );
        }

        // Build update query dynamically
        const updates: string[] = [];
        const values: any[] = [];

        if (serial_number !== undefined) { updates.push('serial_number = ?'); values.push(serial_number); }
        if (product_name !== undefined) { updates.push('product_name = ?'); values.push(product_name); }
        if (warranty_type !== undefined) { updates.push('warranty_type = ?'); values.push(warranty_type); }
        if (expiry_date !== undefined) {
            updates.push('expiry_date = ?');
            values.push(expiry_date);

            // Auto-calculate status based on expiry date
            const expiryDate = new Date(expiry_date);
            const today = new Date();
            const status = expiryDate >= today ? 'active' : 'expired';
            updates.push('status = ?');
            values.push(status);
        }
        if (purchase_date !== undefined) { updates.push('purchase_date = ?'); values.push(purchase_date); }
        if (customer_name !== undefined) { updates.push('customer_name = ?'); values.push(customer_name); }
        if (customer_email !== undefined) { updates.push('customer_email = ?'); values.push(customer_email); }
        if (customer_phone !== undefined) { updates.push('customer_phone = ?'); values.push(customer_phone); }

        if (updates.length > 0) {
            values.push(id);
            await pool.query(
                `UPDATE warranties SET ${updates.join(', ')} WHERE id = ?`,
                values
            );
        }

        const [updated]: any = await pool.query(
            'SELECT * FROM warranties WHERE id = ?',
            [id]
        );

        return NextResponse.json(updated[0]);
    } catch (error: any) {
        console.error('Error updating warranty:', error);

        // Check for duplicate serial number
        if (error.code === 'ER_DUP_ENTRY') {
            return NextResponse.json(
                { message: 'Serial number already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: 'Failed to update warranty', error: error.message },
            { status: 500 }
        );
    }
}

// DELETE - Delete warranty (soft delete)
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // Hard delete - permanently remove the record
        const [result]: any = await pool.query(
            'DELETE FROM warranties WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return NextResponse.json(
                { message: 'Warranty not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ message: 'Warranty deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting warranty:', error);
        return NextResponse.json(
            { message: 'Failed to delete warranty', error: error.message },
            { status: 500 }
        );
    }
}
