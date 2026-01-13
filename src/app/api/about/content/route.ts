import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
    try {
        const [rows]: any = await pool.query('SELECT * FROM about_page_content ORDER BY updated_at DESC LIMIT 1');
        return NextResponse.json(rows[0] || {});
    } catch (error: any) {
        console.error('Error fetching about content:', error);
        return NextResponse.json(
            { message: 'Failed to fetch about content', error: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const {
            title, subtitle, description, mission, vision, video_url,
            cta_title, cta_subtitle, cta_primary_text, cta_secondary_text,
            homepage_badge, homepage_title, homepage_description,
            homepage_image_url, homepage_card_title, homepage_card_subtitle
        } = body;

        // Since there's only one record, we'll upscale/update the first one or create it
        const [rows]: any = await pool.query('SELECT id FROM about_page_content LIMIT 1');

        if (rows.length === 0) {
            await pool.query(
                'INSERT INTO about_page_content (title, subtitle, description, mission, vision, video_url, cta_title, cta_subtitle, cta_primary_text, cta_secondary_text, homepage_badge, homepage_title, homepage_description, homepage_image_url, homepage_card_title, homepage_card_subtitle) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [title, subtitle, description, mission, vision, video_url, cta_title, cta_subtitle, cta_primary_text, cta_secondary_text, homepage_badge, homepage_title, homepage_description, homepage_image_url, homepage_card_title, homepage_card_subtitle]
            );
        } else {
            const id = rows[0].id;
            const updates: string[] = [];
            const values: any[] = [];

            if (title !== undefined) { updates.push('title = ?'); values.push(title); }
            if (subtitle !== undefined) { updates.push('subtitle = ?'); values.push(subtitle); }
            if (description !== undefined) { updates.push('description = ?'); values.push(description); }
            if (mission !== undefined) { updates.push('mission = ?'); values.push(mission); }
            if (vision !== undefined) { updates.push('vision = ?'); values.push(vision); }
            if (video_url !== undefined) { updates.push('video_url = ?'); values.push(video_url); }
            if (cta_title !== undefined) { updates.push('cta_title = ?'); values.push(cta_title); }
            if (cta_subtitle !== undefined) { updates.push('cta_subtitle = ?'); values.push(cta_subtitle); }
            if (cta_primary_text !== undefined) { updates.push('cta_primary_text = ?'); values.push(cta_primary_text); }
            if (cta_secondary_text !== undefined) { updates.push('cta_secondary_text = ?'); values.push(cta_secondary_text); }
            if (homepage_badge !== undefined) { updates.push('homepage_badge = ?'); values.push(homepage_badge); }
            if (homepage_title !== undefined) { updates.push('homepage_title = ?'); values.push(homepage_title); }
            if (homepage_description !== undefined) { updates.push('homepage_description = ?'); values.push(homepage_description); }
            if (homepage_image_url !== undefined) { updates.push('homepage_image_url = ?'); values.push(homepage_image_url); }
            if (homepage_card_title !== undefined) { updates.push('homepage_card_title = ?'); values.push(homepage_card_title); }
            if (homepage_card_subtitle !== undefined) { updates.push('homepage_card_subtitle = ?'); values.push(homepage_card_subtitle); }

            if (updates.length > 0) {
                values.push(id);
                await pool.query(`UPDATE about_page_content SET ${updates.join(', ')} WHERE id = ?`, values);
            }
        }

        return NextResponse.json({ message: 'About content updated successfully' });
    } catch (error: any) {
        console.error('Error updating about content:', error);
        return NextResponse.json(
            { message: 'Failed to update about content', error: error.message },
            { status: 500 }
        );
    }
}
