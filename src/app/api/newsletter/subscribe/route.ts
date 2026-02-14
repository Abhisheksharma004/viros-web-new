import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email } = body;

        // Validate email
        if (!email || !email.trim()) {
            return NextResponse.json(
                { error: 'Email is required' },
                { status: 400 }
            );
        }

        // Simple email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: 'Please enter a valid email address' },
                { status: 400 }
            );
        }

        // Get IP address and user agent
        const ip = request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip') || 
                   'unknown';
        const userAgent = request.headers.get('user-agent') || 'unknown';

        // Check if email already exists
        const [existingRows]: any = await pool.query(
            'SELECT id, status FROM newsletter_subscriptions WHERE email = ?',
            [email.toLowerCase().trim()]
        );

        if (existingRows.length > 0) {
            const existing = existingRows[0];
            
            if (existing.status === 'active') {
                return NextResponse.json(
                    { error: 'This email is already subscribed to our newsletter' },
                    { status: 409 }
                );
            }

            // Reactivate if previously unsubscribed
            await pool.query(
                'UPDATE newsletter_subscriptions SET status = ?, unsubscribed_at = NULL, subscribed_at = NOW() WHERE id = ?',
                ['active', existing.id]
            );

            return NextResponse.json({
                success: true,
                message: 'Welcome back! Your subscription has been reactivated.'
            });
        }

        // Insert new subscription
        await pool.query(
            'INSERT INTO newsletter_subscriptions (email, ip_address, user_agent) VALUES (?, ?, ?)',
            [email.toLowerCase().trim(), ip, userAgent]
        );

        return NextResponse.json({
            success: true,
            message: 'Thank you for subscribing to our newsletter!'
        });

    } catch (error: any) {
        console.error('Newsletter subscription error:', error);
        return NextResponse.json(
            { error: 'Failed to process subscription. Please try again.' },
            { status: 500 }
        );
    }
}
