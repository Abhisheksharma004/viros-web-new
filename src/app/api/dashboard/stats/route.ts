import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        // Perform parallel queries for efficiency using connection pool
        const [
            [products],
            [services],
            [testimonials],
            [clients],
            [partners]
        ] = await Promise.all([
            pool.execute('SELECT COUNT(*) as count FROM products'),
            pool.execute('SELECT COUNT(*) as count FROM services'),
            pool.execute('SELECT COUNT(*) as count FROM testimonials'),
            pool.execute('SELECT COUNT(*) as count FROM clients'),
            pool.execute('SELECT COUNT(*) as count FROM partners')
        ]);

        const stats = {
            products: (products as any[])[0].count,
            services: (services as any[])[0].count,
            testimonials: (testimonials as any[])[0].count,
            clientsAndPartners: ((clients as any[])[0].count) + ((partners as any[])[0].count)
        };

        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        return NextResponse.json({ 
            error: 'Failed to fetch stats',
            products: 0,
            services: 0,
            testimonials: 0,
            clientsAndPartners: 0
        }, { status: 500 });
    }
}
