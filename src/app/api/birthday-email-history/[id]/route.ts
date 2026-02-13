import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';

// Database configuration
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'viros_web_new',
    port: parseInt(process.env.DB_PORT || '3306')
};

/**
 * Get email history for a specific birthday
 * GET /api/birthday-email-history/[id]
 */
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    let connection;
    
    try {
        const { id } = await params;
        const birthdayId = parseInt(id);
        
        if (isNaN(birthdayId)) {
            return NextResponse.json(
                { error: 'Invalid birthday ID' },
                { status: 400 }
            );
        }

        connection = await mysql.createConnection(dbConfig);

        const [rows] = await connection.execute(
            `SELECT 
                id,
                recipient_email,
                recipient_name,
                sent_at,
                status,
                message_id,
                error_message,
                celebration_time,
                department
            FROM birthday_email_history 
            WHERE birthday_id = ? 
            ORDER BY sent_at DESC`,
            [birthdayId]
        );

        return NextResponse.json(rows);

    } catch (error: any) {
        console.error('Error fetching email history:', error);
        
        // Check if table doesn't exist
        if (error.code === 'ER_NO_SUCH_TABLE') {
            return NextResponse.json(
                { 
                    error: 'Email history table not found',
                    code: 'TABLE_NOT_FOUND',
                    message: 'Please run: node run_birthday_email_history_migration.js'
                },
                { status: 404 }
            );
        }
        
        return NextResponse.json(
            { error: 'Failed to fetch email history', details: error.message },
            { status: 500 }
        );
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}
