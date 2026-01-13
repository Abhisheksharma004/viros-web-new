
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM footer_content WHERE id = 1');
        if (rows.length === 0) {
            return NextResponse.json({});
        }
        return NextResponse.json(rows[0]);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { description, copyright_text, developer_text } = body;

        await pool.query(
            'UPDATE footer_content SET description = ?, copyright_text = ?, developer_text = ? WHERE id = 1',
            [description, copyright_text, developer_text]
        );

        return NextResponse.json({ message: 'Footer content updated successfully' });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
