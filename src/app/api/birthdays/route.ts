import { NextResponse } from 'next/server';
import pool from '@/lib/db';

// GET all birthdays
export async function GET() {
    try {
        const [rows] = await pool.query(
            'SELECT * FROM birthdays ORDER BY MONTH(date), DAY(date)'
        );
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching birthdays:', error);
        
        // Check if table doesn't exist
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return NextResponse.json({ 
                error: 'Birthdays table not found. Please run the migration script: node run_birthday_migration.js',
                code: 'TABLE_NOT_FOUND'
            }, { status: 503 });
        }
        
        return NextResponse.json({ error: 'Failed to fetch birthdays' }, { status: 500 });
    }
}

// POST new birthday
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, date, phone, email, notes, is_active } = body;

        const [result] = await pool.query(
            `INSERT INTO birthdays (name, date, phone, email, notes, is_active) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [name, date, phone || null, email || null, notes || null, is_active ?? true]
        );

        // Fetch the newly created record
        const [rows]: any = await pool.query(
            'SELECT * FROM birthdays WHERE id = ?',
            [(result as any).insertId]
        );

        return NextResponse.json(rows[0], { status: 201 });
    } catch (error: any) {
        console.error('Error creating birthday:', error);
        
        // Check if table doesn't exist
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return NextResponse.json({ 
                error: 'Birthdays table not found. Please run the migration script: node run_birthday_migration.js',
                code: 'TABLE_NOT_FOUND'
            }, { status: 503 });
        }
        
        return NextResponse.json({ error: 'Failed to create birthday' }, { status: 500 });
    }
}
