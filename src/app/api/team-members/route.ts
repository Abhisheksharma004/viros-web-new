import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM team_members ORDER BY display_order ASC');
        return NextResponse.json(rows);
    } catch (error: any) {
        console.error('Error fetching team members:', error);
        return NextResponse.json(
            { message: 'Failed to fetch team members', error: error.message },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { name, role, image, bio, linkedin, instagram, display_order } = body;

        const [result]: any = await pool.query(
            'INSERT INTO team_members (name, role, image, bio, linkedin, instagram, display_order) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, role, image, bio, linkedin, instagram, display_order || 0]
        );

        return NextResponse.json({ message: 'Team member created successfully', id: result.insertId }, { status: 201 });
    } catch (error: any) {
        console.error('Error creating team member:', error);
        return NextResponse.json(
            { message: 'Failed to create team member', error: error.message },
            { status: 500 }
        );
    }
}
