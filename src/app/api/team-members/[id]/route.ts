import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { name, role, image, bio, linkedin, instagram, display_order } = body;

        const updates: string[] = [];
        const values: any[] = [];

        if (name !== undefined) { updates.push('name = ?'); values.push(name); }
        if (role !== undefined) { updates.push('role = ?'); values.push(role); }
        if (image !== undefined) { updates.push('image = ?'); values.push(image); }
        if (bio !== undefined) { updates.push('bio = ?'); values.push(bio); }
        if (linkedin !== undefined) { updates.push('linkedin = ?'); values.push(linkedin); }
        if (instagram !== undefined) { updates.push('instagram = ?'); values.push(instagram); }
        if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }

        if (updates.length === 0) {
            return NextResponse.json({ message: 'No fields to update' }, { status: 400 });
        }

        values.push(id);
        const [result]: any = await pool.query(`UPDATE team_members SET ${updates.join(', ')} WHERE id = ?`, values);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Team member not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Team member updated successfully' });
    } catch (error: any) {
        console.error('Error updating team member:', error);
        return NextResponse.json(
            { message: 'Failed to update team member', error: error.message },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const [result]: any = await pool.query('DELETE FROM team_members WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return NextResponse.json({ message: 'Team member not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Team member deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting team member:', error);
        return NextResponse.json(
            { message: 'Failed to delete team member', error: error.message },
            { status: 500 }
        );
    }
}
