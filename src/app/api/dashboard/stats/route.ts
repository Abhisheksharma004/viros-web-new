
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

        // Perform parallel queries for efficiency
        const [
            [products],
            [services],
            [testimonials],
            [clients],
            [partners]
        ] = await Promise.all([
            connection.execute('SELECT COUNT(*) as count FROM products'),
            connection.execute('SELECT COUNT(*) as count FROM services'),
            connection.execute('SELECT COUNT(*) as count FROM testimonials'),
            connection.execute('SELECT COUNT(*) as count FROM clients'),
            connection.execute('SELECT COUNT(*) as count FROM partners')
        ]);

        await connection.end();

        const stats = {
            products: (products as any[])[0].count,
            services: (services as any[])[0].count,
            testimonials: (testimonials as any[])[0].count,
            clientsAndPartners: ((clients as any[])[0].count) + ((partners as any[])[0].count)
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }
}
