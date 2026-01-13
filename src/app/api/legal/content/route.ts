
import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

async function getConnection() {
    return await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });
}

export async function GET() {
    try {
        const connection = await getConnection();
        const [rows] = await connection.execute('SELECT * FROM legal_content LIMIT 1');
        await connection.end();

        if ((rows as any[]).length > 0) {
            return NextResponse.json((rows as any[])[0]);
        } else {
            return NextResponse.json({});
        }
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch content' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const connection = await getConnection();

        // check if exists
        const [rows] = await connection.execute('SELECT id FROM legal_content LIMIT 1');

        if ((rows as any[]).length > 0) {
            await connection.execute(
                'UPDATE legal_content SET privacy_policy = ?, terms_of_service = ? WHERE id = ?',
                [body.privacy_policy, body.terms_of_service, (rows as any[])[0].id]
            );
        } else {
            await connection.execute(
                'INSERT INTO legal_content (privacy_policy, terms_of_service) VALUES (?, ?)',
                [body.privacy_policy, body.terms_of_service]
            );
        }

        await connection.end();
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update content' }, { status: 500 });
    }
}
